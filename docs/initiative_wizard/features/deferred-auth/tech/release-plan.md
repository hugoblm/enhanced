# Release Plan — Deferred Auth

> Branch strategy, commit sequence, and deployment checklist for the Deferred Auth feature.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Branch

- **Branch name:** `feat/deferred-auth`
- **Base:** `staging`
- **Merge target:** `staging` (via PR)
- **Dependencies:** None — this is the first feature to implement. It creates the foundational
  tables (`profiles`, `sessions`, `prds`) that other features depend on.

---

## Commit Sequence

Each commit is a self-contained, testable increment. Order matters — later commits depend on
earlier ones.

### Commit 1: Migration — profiles table + auth trigger

**Files:**
- `supabase/migrations/YYYYMMDDHHMMSS_create_profiles.sql`

**Contains:**
- `profiles` table DDL (id, email, display_name, avatar_url, timestamps)
- RLS policies (`profiles_select_own`, `profiles_update_own`)
- `handle_new_user()` trigger function + `on_auth_user_created` trigger
- `update_updated_at()` shared trigger function

**Verify:** `npx supabase db reset` runs cleanly. Signup via Supabase dashboard creates a
profile row.

---

### Commit 2: Migration — sessions + prds tables

**Files:**
- `supabase/migrations/YYYYMMDDHHMMSS_create_sessions_and_prds.sql`

**Contains:**
- `sessions` table DDL with identity check constraint + indexes + RLS policies
- `prds` table DDL with indexes + RLS policies
- `updated_at` triggers for both tables

**Verify:** `npx supabase db reset` runs cleanly. Both tables exist with correct constraints.

---

### Commit 3: createSession Server Action + cookie logic

**Files:**
- `src/app/actions/session.ts` (new)
- `src/lib/schemas/session.ts` (new — Zod schemas)

**Contains:**
- `createSession(rawIdea)` Server Action
- `CreateSessionSchema` Zod validation
- Cookie set logic (`enhanced_anon_id`)

**Verify:** Call `createSession` from a test page. Session row created in DB. Cookie present
in browser dev tools (httpOnly, secure, sameSite=lax).

---

### Commit 4: Auth login page (magic link form)

**Files:**
- `src/app/auth/login/page.tsx` (new)
- `src/app/auth/login/layout.tsx` (new, optional — minimal auth layout)

**Contains:**
- Email input form
- `signInWithOtp` call
- Success/error states
- Error param handling (`?error=expired_link`, `?error=invalid_link`)

**Verify:** Navigate to `/auth/login`. Submit email. Check Supabase logs for OTP send.
Error states display correctly.

---

### Commit 5: Auth confirm route + claimSession

**Files:**
- `src/app/auth/confirm/route.ts` (new)
- `src/app/actions/session.ts` (add `claimSession`)

**Contains:**
- GET handler for `/auth/confirm`
- `verifyOtp` call with `token_hash` and `type` params
- `claimSession()` Server Action
- Error redirects for invalid/expired tokens

**Verify:** Full magic link flow end-to-end. Click link in email → OTP verified → session
claimed → redirected to wizard. Verify in DB: `user_id` set, `anonymous_id` null.

---

### Commit 6: AuthGate component

**Files:**
- `src/components/auth-gate.tsx` (new)

**Contains:**
- Modal overlay component (email input, pending state, minimize)
- `AuthGateProps` interface
- Internal state machine (input → pending → minimized)

**Verify:** Component renders in isolation. Email submission triggers `signInWithOtp`. Modal
dismissible. (Full integration tested when wizard shell is built.)

---

### Commit 7: Middleware — no changes needed (verify only)

The existing middleware (`src/middleware.ts`) already calls `updateSession()` for Supabase
session refresh. No changes needed for deferred auth.

**Verify:** Authenticated sessions persist across navigation. Session cookies are refreshed.

---

### Commit 8: Regenerate Supabase types

**Files:**
- `src/lib/supabase/types.ts` (regenerated)

**Command:**
```bash
npx supabase gen types typescript --local > src/lib/supabase/types.ts
```

**Verify:** TypeScript compilation passes. `Database` type includes `profiles`, `sessions`,
`prds` tables with correct column types.

---

## Pre-merge Checklist

- [ ] All migrations run cleanly on `npx supabase db reset`
- [ ] Full magic link flow works end-to-end (signup + claiming)
- [ ] Existing user login via magic link works (no duplicate profiles)
- [ ] Cookie is httpOnly, secure (in production), sameSite=lax
- [ ] Session data preserved through auth transition (messages, PRD blocks if any)
- [ ] RLS policies block cross-user access after claiming
- [ ] AuthGate component renders and dismisses correctly
- [ ] TypeScript compilation passes with regenerated types
- [ ] No console errors in browser dev tools during the flow
- [ ] `.ai-context/` updated to reflect new tables, routes, and auth flow

---

## Post-merge Tasks

- Update `.ai-context/README.md`: add new routes, update "What exists" section.
- Create `.ai-context/auth.md` domain file documenting the auth flow and session states.
- Update feature README status from `Planned` to `In progress` or `Done`.
