# Security — Deferred Auth

> Security analysis, threat model, and mitigations for the Deferred Auth feature.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Cookie Security

### `enhanced_anon_id` cookie

| Attribute | Value | Rationale |
|-----------|-------|-----------|
| `httpOnly` | `true` | Prevents client-side JS from reading the anonymous_id. Blocks XSS-based session theft. |
| `secure` | `true` (production) | Cookie only sent over HTTPS. Set to `false` in development for localhost. |
| `sameSite` | `lax` | Prevents CSRF — cookie not sent on cross-origin POST requests. `lax` (not `strict`) allows the magic link redirect from the email client to carry the cookie. |
| `path` | `/` | Available on all routes. |
| `maxAge` | `2592000` (30 days) | Generous TTL for the anonymous phase. After claiming, the cookie is explicitly deleted. |

### Supabase session cookies

Managed entirely by `@supabase/ssr`. The middleware (`src/middleware.ts` -> `updateSession()`)
refreshes the session on every request. No custom configuration needed.

---

## Row Level Security (RLS)

### Authenticated access

All tables have RLS enabled. Authenticated users can only access rows where
`auth.uid() = user_id`:

| Table | SELECT | UPDATE | DELETE | INSERT |
|-------|--------|--------|--------|--------|
| `profiles` | own row | own row | -- | trigger only |
| `sessions` | own rows | own rows | own rows | own or anonymous |
| `prds` | own rows + public | own rows | -- | own or anonymous |

### Anonymous access

Anonymous access uses defense in depth: RLS policies on messages/prd_blocks structurally restrict operations to anonymous sessions only, while the app layer verifies the `enhanced_anon_id` cookie for session-specific authorization. The anon key is used (not service role), so RLS always applies.

1. RLS INSERT policies allow operations when `user_id IS NULL` (anonymous sessions), providing structural safety at the database level.
2. Server Actions additionally verify the `enhanced_anon_id` cookie against `sessions.anonymous_id` for identity-level authorization.
3. The `anonymous_id` value is a UUID v4 — 2^122 possible values, making brute-force enumeration infeasible.

**After claiming:** `anonymous_id` is set to NULL. The session is exclusively protected by
the `auth.uid() = user_id` RLS policy from that point forward. The anonymous access path is
permanently closed for that session.

---

## CSRF Protection

- **Server Actions:** Next.js Server Actions include built-in CSRF protection via a
  server-generated token. No additional CSRF middleware needed for `createSession` and
  `claimSession`.
- **Route Handler (`/auth/confirm`):** This is a GET endpoint that only reads URL params and
  verifies a one-time token. No state mutation is triggered by the GET itself — the mutation
  (claiming) happens inside the Server Action called from the handler. The one-time token
  (`token_hash`) serves as the CSRF defense.

---

## Rate Limiting

### Magic link sends

Supabase Auth enforces a **60-second cooldown** between magic link sends to the same email.
This is a built-in rate limit — no application-level rate limiting is needed.

If the PM tries to request a second magic link within 60 seconds:
- Supabase returns an error.
- The UI displays: "Veuillez patienter avant de demander un nouveau lien."

### Session creation

No explicit rate limiting on `createSession` in V1. Mitigations:
- Each session creation requires a non-empty `rawIdea` (min 1 char, max 5000 chars).
- Supabase RLS and the INSERT policy prevent mass-creation by anonymous users beyond what
  the anon key allows.
- If abuse is observed, add rate limiting via middleware (IP-based) or Vercel Edge Config.

---

## Threat Model

### T1: Anonymous session hijacking

**Threat:** An attacker guesses or steals the `anonymous_id` to access another user's session.

**Mitigations:**
- `anonymous_id` is a UUID v4: 2^122 possible values. Brute-force is infeasible.
- Cookie is `httpOnly` — not readable by client-side JS (XSS cannot extract it).
- Cookie is `secure` — not sent over HTTP (MITM cannot intercept it).
- After claiming, `anonymous_id` is nullified — the attack surface is time-limited to the
  anonymous phase (typically <10 minutes).

**Residual risk:** Low. An attacker with physical access to the PM's machine could extract
the cookie from browser storage, but this is outside our threat model (physical access =
full compromise).

### T2: Session claiming by wrong user

**Threat:** User A creates an anonymous session, User B authenticates and claims it.

**Mitigations:**
- `claimSession` reads the `anonymous_id` from the cookie in the **current request**. The
  cookie is tied to the browser that created the session.
- The magic link email is sent to User A's email. User B would need to intercept the email.
- The claiming UPDATE has a `WHERE anonymous_id = $cookie AND user_id IS NULL` guard —
  already-claimed sessions cannot be re-claimed.

**Residual risk:** Low. Requires email interception (separate security domain).

### T3: Double-claiming race condition

**Threat:** Two simultaneous requests (e.g., two tabs) attempt to claim the same session.

**Mitigations:**
- The UPDATE `WHERE user_id IS NULL` is atomic at the database level. Only one UPDATE will
  match rows; the other will update 0 rows and return an empty result.
- The caller checks the result count and returns an error if 0 rows were updated.

**Residual risk:** None. Postgres row-level locking handles this.

### T4: Expired magic link replay

**Threat:** An attacker replays an expired or already-used magic link token.

**Mitigations:**
- Supabase OTP tokens are **one-time** and **time-limited** (default: 1 hour expiry).
- `verifyOtp` fails for expired or already-consumed tokens.
- The `/auth/confirm` route redirects to `/auth/login?error=expired_link` on failure.

**Residual risk:** None. Supabase handles token lifecycle.

### T5: Session enumeration via session IDs

**Threat:** An attacker iterates session UUIDs to access other users' data.

**Mitigations:**
- Session IDs are UUID v4 (unguessable).
- RLS enforces `auth.uid() = user_id` — even if the attacker knows a session ID, they
  cannot SELECT it without being the owner.
- Anonymous sessions have no RLS path — they require the `anonymous_id` cookie match at
  the application layer.

**Residual risk:** None.

---

## Authentication State Machine

```
┌─────────────┐    createSession()    ┌─────────────────┐
│  Visitor     │ ──────────────────►  │  Anonymous       │
│  (no cookie) │                      │  (cookie set)    │
└─────────────┘                      └────────┬────────┘
                                              │
                                     signInWithOtp()
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │  Pending Auth    │
                                     │  (cookie + OTP)  │
                                     └────────┬────────┘
                                              │
                                     verifyOtp() + claimSession()
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │  Authenticated   │
                                     │  (Supabase JWT)  │
                                     │  (cookie cleared)│
                                     └─────────────────┘
```

At no point are both `user_id` and `anonymous_id` simultaneously set on a session row.
The transition is atomic: one is set while the other is nullified.

---

## Data Privacy

- **No password stored.** Magic link authentication means no password hash in the database.
- **Minimal PII.** Only the email address is stored (in `profiles` and `auth.users`).
- **Session data ownership.** After claiming, all session data belongs to the authenticated
  user and is protected by RLS.
- **Cookie cleanup.** The `enhanced_anon_id` cookie is deleted after claiming. No
  tracking cookies persist beyond the anonymous phase.
- **Anonymous session cleanup.** Unclaimed anonymous sessions (no `user_id`, `anonymous_id`
  still set) should be purged after 30 days. Not implemented in V1 — add to backlog.
