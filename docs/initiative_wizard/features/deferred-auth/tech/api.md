# API — Deferred Auth

> Routes, Server Actions, and request/response contracts for the Deferred Auth feature.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Overview

Deferred Auth uses **Server Actions** (not Route Handlers) for session creation and claiming,
and a **Route Handler** for the magic link callback. Server Actions provide built-in CSRF
protection and work naturally with the cookie-based anonymous identity.

---

## File Map

| File | Type | Purpose |
|------|------|---------|
| `src/app/actions/session.ts` | Server Actions | `createSession`, `claimSession` |
| `src/app/auth/login/page.tsx` | Page (Client Component) | Magic link email form |
| `src/app/auth/confirm/route.ts` | Route Handler (GET) | Magic link callback + OTP verification |
| `src/components/auth-gate.tsx` | Client Component | Modal overlay triggered after first PRD block |

---

## Server Actions

### `createSession(formData: FormData)`

**File:** `src/app/actions/session.ts`

Called when the PM submits the landing page textarea. Creates an anonymous session and
sets the identity cookie.

**FormData extraction:**
```typescript
const rawIdea = formData.get('rawIdea') as string
```

**Input validation (Zod):**
```typescript
import { z } from 'zod';

const CreateSessionSchema = z.object({
  rawIdea: z.string().min(1).max(5000),
});
```

**Flow:**

1. Validate `rawIdea` via `CreateSessionSchema.parse()`.
2. Generate `anonymousId` via `crypto.randomUUID()`.
3. Create Supabase server client via `createClient()` from `@/lib/supabase/server`.
4. INSERT into `sessions`:
   ```typescript
   const { data: session, error } = await supabase
     .from('sessions')
     .insert({
       anonymous_id: anonymousId,
       raw_idea: rawIdea,
       status: 'active',
       current_step: 1,
     })
     .select('id')
     .single();
   ```
5. INSERT into `prds`:
   ```typescript
   await supabase
     .from('prds')
     .insert({
       session_id: session.id,
       title: 'Draft PRD',
     });
   ```
6. Set the anonymous identity cookie:
   ```typescript
   import { cookies } from 'next/headers';

   const cookieStore = await cookies();
   cookieStore.set('enhanced_anon_id', anonymousId, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     path: '/',
     maxAge: 60 * 60 * 24 * 7, // 7 days
   });
   ```
7. Return `{ sessionId: session.id }`.
8. Caller redirects to `/session/${session.id}`.

**Error handling:**
- Zod validation error → return `{ error: 'Invalid input' }`.
- Supabase INSERT error → return `{ error: 'Failed to create session' }`, log details server-side.

**Return type:**
```typescript
type CreateSessionResult =
  | { sessionId: string; error?: never }
  | { sessionId?: never; error: string };
```

---

### `claimSession()`

**File:** `src/app/actions/session.ts`

Called from the `/auth/confirm` route after successful OTP verification. Links the anonymous
session to the authenticated user.

**Flow:**

1. Read the anonymous identity cookie:
   ```typescript
   const cookieStore = await cookies();
   const anonymousId = cookieStore.get('enhanced_anon_id')?.value;
   ```
2. If no cookie → return `{ error: 'No anonymous session' }` (not necessarily an error — the
   user may already be authenticated).
3. Get authenticated user:
   ```typescript
   const supabase = await createClient();
   const { data: { user }, error: authError } = await supabase.auth.getUser();
   ```
4. If no user → return `{ error: 'Not authenticated' }`.
5. Execute the claiming transaction:
   ```typescript
   // Claim sessions
   const { data: claimedSessions, error: claimError } = await supabase
     .from('sessions')
     .update({ user_id: user.id, anonymous_id: null })
     .eq('anonymous_id', anonymousId)
     .is('user_id', null)
     .select('id');

   if (!claimedSessions?.length) {
     return { error: 'Session already claimed or not found' };
   }

   // Claim associated PRDs
   const sessionIds = claimedSessions.map(s => s.id);
   await supabase
     .from('prds')
     .update({ user_id: user.id })
     .in('session_id', sessionIds);
   ```
6. Clear the anonymous cookie:
   ```typescript
   cookieStore.delete('enhanced_anon_id');
   ```
7. Return `{ sessionId: claimedSessions[0].id }`.

**Return type:**
```typescript
type ClaimSessionResult =
  | { sessionId: string; error?: never }
  | { sessionId?: never; error: string };
```

**Error cases:**
- No cookie: silent success (user already authenticated, no anonymous session to claim).
- Session already claimed by another user: return error, log the attempt.
- Supabase UPDATE error: return error, log details.

**Note on atomicity:** Supabase JS client does not support explicit `BEGIN/COMMIT`. The two
UPDATE calls are sequential. The `WHERE user_id IS NULL` guard on the sessions update
prevents double-claiming. If the PRD update fails after the session update succeeds, this is a
partial state — mitigated by the fact that PRD ownership is non-critical until the PM tries to
access the PRD via an authenticated route (at which point the PRD can be re-claimed via a
background job or manual fix). In V1, this edge case is accepted as low-risk.

---

## Route Handler

### `GET /auth/confirm`

**File:** `src/app/auth/confirm/route.ts`

Handles the magic link callback. Supabase redirects here after the PM clicks the email link.

**Query parameters:**
- `token_hash` (string) — the OTP token hash from the magic link URL.
- `type` (string) — the OTP type, always `'magiclink'` for this feature.
- `next` (string, optional) — redirect URL after verification. Defaults to `/`.

**Flow:**

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'magiclink' | null;
  const next = searchParams.get('next') ?? '/';

  if (!token_hash || type !== 'magiclink') {
    return NextResponse.redirect(
      new URL('/auth/login?error=invalid_link', request.url)
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: 'magiclink',
  });

  if (error) {
    // Token expired or invalid
    return NextResponse.redirect(
      new URL('/auth/login?error=expired_link', request.url)
    );
  }

  // OTP verified — user is now authenticated.
  // Claim the anonymous session.
  const { claimSession } = await import('@/app/actions/session');
  const result = await claimSession();

  if (result.sessionId) {
    return NextResponse.redirect(
      new URL(`/session/${result.sessionId}`, request.url)
    );
  }

  // No session to claim (or claim failed) — redirect to default
  return NextResponse.redirect(new URL(next, request.url));
}
```

**Error handling:**
- Invalid/missing token → redirect to `/auth/login?error=invalid_link`.
- Expired token → redirect to `/auth/login?error=expired_link`.
- Claim failure → redirect to `next` (no session to resume).

---

## Page

### `/auth/login`

**File:** `src/app/auth/login/page.tsx`

Standalone magic link login page. Also used as fallback when the auth modal flow encounters
errors (expired links, etc.).

**Props via URL params:**
- `error` (optional): `'invalid_link'` | `'expired_link'` — displays error message.
- `email` (optional): pre-fills the email field (for resend flows).

**Component structure:**
```
AuthLoginPage (Client Component)
├── Error banner (conditional, based on ?error param)
├── Email input (type="email", required)
├── Submit button → calls supabase.auth.signInWithOtp({ email })
├── Success state: "Vérifiez votre boîte mail" + resend timer
└── Link to landing page
```

**Email submission:**
```typescript
const supabase = createClient(); // browser client
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/confirm`,
  },
});
```

---

## Client Component

### `AuthGate`

**File:** `src/components/auth-gate.tsx`

Modal overlay that prompts the PM to authenticate. Triggered by the wizard shell when the
first PRD block is rendered.

**Props:**
```typescript
interface AuthGateProps {
  isOpen: boolean;
  onMinimize: () => void;
  onAuthComplete: () => void;
}
```

**States:**
1. **Email input** — initial state. Shows headline, explanation, email field, submit button.
2. **Pending** — after email submission. Shows "Vérifiez votre boîte mail", minimize button.
3. **Minimized** — modal hidden, subtle banner visible in wizard header.

**Trigger logic (in wizard shell):**
```typescript
// In the wizard shell component, watch for the first PRD block
const firstBlock = usePrdStore((s) => s.blocks.length > 0);
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
const [showAuthGate, setShowAuthGate] = useState(false);

useEffect(() => {
  if (firstBlock && !isAuthenticated) {
    setShowAuthGate(true);
  }
}, [firstBlock, isAuthenticated]);
```
