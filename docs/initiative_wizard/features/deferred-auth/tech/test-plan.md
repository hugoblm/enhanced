# Test Plan — Deferred Auth

> Test strategy and scenario mapping for the Deferred Auth feature. Maps to Gherkin scenarios
> in `../product/gherkin-tests.md`.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Test Strategy

| Level | Tool | Scope |
|-------|------|-------|
| Unit | Vitest | Server Action logic, Zod validation, cookie helpers |
| Integration | Vitest + Supabase local | DB operations, RLS policies, session claiming |
| E2E | Playwright | Full magic link flow, UI interactions, data preservation |

---

## Unit Tests

### UT-DA-01: createSession validates input
**Maps to:** SC-DA-01
**File:** `src/app/actions/__tests__/session.test.ts`

```
- GIVEN a raw idea string of valid length
  WHEN createSession is called
  THEN it passes Zod validation

- GIVEN an empty string
  WHEN createSession is called
  THEN it returns { error: 'Invalid input' }

- GIVEN a string exceeding 5000 characters
  WHEN createSession is called
  THEN it returns { error: 'Invalid input' }
```

### UT-DA-02: createSession creates DB rows
**Maps to:** SC-DA-01
**File:** `src/app/actions/__tests__/session.test.ts`

```
- GIVEN valid input
  WHEN createSession executes
  THEN a sessions row is created with:
    - anonymous_id: a valid UUID v4
    - user_id: null
    - status: 'active'
    - current_step: 1
    - raw_idea: the input string
  AND a prds row is created with:
    - session_id: the new session's id
    - title: 'Draft PRD'
    - user_id: null
```

### UT-DA-03: createSession sets correct cookie
**Maps to:** SC-DA-01
**File:** `src/app/actions/__tests__/session.test.ts`

```
- GIVEN createSession succeeds
  WHEN the cookie store is inspected
  THEN 'enhanced_anon_id' cookie is set with:
    - value: the generated anonymous_id UUID
    - httpOnly: true
    - sameSite: 'lax'
    - path: '/'
    - maxAge: 2592000 (30 days)
```

### UT-DA-04: claimSession atomic transition
**Maps to:** SC-DA-09
**File:** `src/app/actions/__tests__/session.test.ts`

```
- GIVEN an anonymous session with anonymous_id "abc-123"
  AND an authenticated user with id "user-xyz"
  WHEN claimSession executes
  THEN sessions.user_id is set to "user-xyz"
  AND sessions.anonymous_id is set to null
  AND prds.user_id is set to "user-xyz"
```

### UT-DA-05: claimSession rejects already-claimed sessions
**Maps to:** SC-DA-11
**File:** `src/app/actions/__tests__/session.test.ts`

```
- GIVEN a session where user_id is already set
  WHEN claimSession is called with the session's former anonymous_id
  THEN it returns { error: 'Session already claimed or not found' }
  AND no database rows are modified
```

### UT-DA-06: claimSession handles missing cookie
**Maps to:** SC-DA-09
**File:** `src/app/actions/__tests__/session.test.ts`

```
- GIVEN no 'enhanced_anon_id' cookie in the request
  WHEN claimSession is called
  THEN it returns { error: 'No anonymous session' }
  AND no database operations are performed
```

---

## Integration Tests

### IT-DA-01: RLS policies block cross-user access
**Maps to:** SC-DA-10
**File:** `src/lib/supabase/__tests__/rls.test.ts`

```
- GIVEN user A owns session S1
  AND user B is authenticated
  WHEN user B queries sessions WHERE id = S1.id
  THEN the query returns 0 rows

- GIVEN user A owns session S1
  WHEN user A queries sessions WHERE id = S1.id
  THEN the query returns 1 row with correct data
```

### IT-DA-02: Profile auto-creation trigger
**Maps to:** (infrastructure, supports SC-DA-06)
**File:** `src/lib/supabase/__tests__/triggers.test.ts`

```
- GIVEN no user exists for email "test@example.com"
  WHEN a new auth.users row is created (via signUp)
  THEN a profiles row is created with:
    - id: the auth user's UUID
    - email: "test@example.com"
    - display_name: null
```

### IT-DA-03: Session claiming preserves FK relationships
**Maps to:** SC-DA-09
**File:** `src/lib/supabase/__tests__/claiming.test.ts`

```
- GIVEN an anonymous session with:
    - 6 messages in the messages table
    - 2 prd_blocks in the prd_blocks table
  WHEN claimSession executes successfully
  THEN all 6 messages still have session_id pointing to the claimed session
  AND all 2 prd_blocks still have prd_id pointing to the claimed session's PRD
  AND messages and prd_blocks are accessible via the new user's RLS context
```

### IT-DA-04: Identity constraint enforcement
**Maps to:** (data model invariant)
**File:** `src/lib/supabase/__tests__/constraints.test.ts`

```
- GIVEN a sessions INSERT with user_id = null AND anonymous_id = null
  WHEN the INSERT executes
  THEN it fails with a constraint violation (sessions_identity_check)

- GIVEN a sessions INSERT with user_id = null AND anonymous_id = 'valid-uuid'
  WHEN the INSERT executes
  THEN it succeeds
```

---

## E2E Tests

### E2E-DA-01: Anonymous wizard entry
**Maps to:** SC-DA-01
**File:** `e2e/deferred-auth.spec.ts`

```
- Navigate to the landing page
- Enter "Ajouter un module de facturation pour les PME" in the textarea
- Click the CTA button
- ASSERT: redirected to /session/[uuid]
- ASSERT: no login/signup UI visible
- ASSERT: 'enhanced_anon_id' cookie present (via page.context().cookies())
- ASSERT: DB has a sessions row with anonymous_id set and user_id null
```

### E2E-DA-02: Returning anonymous visitor
**Maps to:** SC-DA-02
**File:** `e2e/deferred-auth.spec.ts`

```
- Create an anonymous session (via E2E-DA-01 steps)
- Close the page
- Navigate to the wizard page with the same session ID
- ASSERT: previous session data is loaded
- ASSERT: no new session is created
```

### E2E-DA-03: Auth modal trigger timing
**Maps to:** SC-DA-03, SC-DA-04b
**File:** `e2e/deferred-auth.spec.ts`

```
- Start an anonymous wizard session
- Send messages until the AI generates the first PRD block (First Use Case)
- ASSERT: AuthGate modal appears with "Sauvegardez votre travail" headline
- ASSERT: email input field is visible
- ASSERT: modal did NOT appear before the first PRD block was generated
```

### E2E-DA-04: Auth modal suppressed for authenticated users
**Maps to:** SC-DA-04
**File:** `e2e/deferred-auth.spec.ts`

```
- Authenticate via Supabase test user
- Start a wizard session (as authenticated)
- Progress through step 1 until first PRD block is generated
- ASSERT: no AuthGate modal appears
```

### E2E-DA-05: Full magic link flow
**Maps to:** SC-DA-05, SC-DA-06
**File:** `e2e/deferred-auth.spec.ts`

```
Note: Full magic link E2E requires either:
  (a) Supabase Inbucket (local dev email capture), or
  (b) A test helper that bypasses email and directly calls verifyOtp with a known token.

- Start anonymous session
- Trigger AuthGate modal
- Enter "pm@startup.com" in the email field
- Submit the form
- ASSERT: "Vérifiez votre boîte mail" message displayed
- Extract OTP token from Inbucket (or mock)
- Navigate to /auth/confirm?token_hash=TOKEN&type=magiclink
- ASSERT: redirected to /session/[id]
- ASSERT: session in DB has user_id set and anonymous_id null
- ASSERT: 'enhanced_anon_id' cookie is cleared
```

### E2E-DA-06: Data preservation through auth transition
**Maps to:** SC-DA-09
**File:** `e2e/deferred-auth.spec.ts`

```
- Start anonymous session
- Send 3+ messages in the wizard
- Generate at least 1 PRD block
- Complete the magic link auth flow
- ASSERT: all previous messages are visible in the conversation panel
- ASSERT: all PRD blocks are visible in the PRD panel
- ASSERT: no visual change except auth status indicators
```

### E2E-DA-07: Non-blocking auth (minimize modal)
**Maps to:** SC-DA-08
**File:** `e2e/deferred-auth.spec.ts`

```
- Trigger AuthGate modal
- Submit email (reach "Vérifiez votre boîte mail" state)
- Click minimize button
- ASSERT: modal disappears
- ASSERT: conversation panel is interactive (can type and send a message)
- ASSERT: subtle auth-pending indicator is visible
```

### E2E-DA-08: Expired magic link handling
**Maps to:** SC-DA-12
**File:** `e2e/deferred-auth.spec.ts`

```
- Navigate to /auth/confirm?token_hash=EXPIRED_TOKEN&type=magiclink
- ASSERT: redirected to /auth/login?error=expired_link
- ASSERT: error message "Ce lien a expiré" is visible
- ASSERT: "Renvoyer le lien" button is visible
```

### E2E-DA-09: Invalid email rejection
**Maps to:** SC-DA-E1
**File:** `e2e/deferred-auth.spec.ts`

```
- Open AuthGate modal (or /auth/login page)
- Enter "not-an-email" in the email field
- Submit the form
- ASSERT: validation error "Veuillez entrer une adresse email valide" is displayed
- ASSERT: no request sent to Supabase
```

---

## Security Tests

### SEC-DA-01: Cookie attributes
**Maps to:** SC-DA-01 (security aspect)
**File:** `e2e/deferred-auth-security.spec.ts`

```
- Create an anonymous session
- Inspect the 'enhanced_anon_id' cookie via page.context().cookies()
- ASSERT: httpOnly is true
- ASSERT: sameSite is 'Lax'
- ASSERT: secure is true (in production config)
- ASSERT: path is '/'
```

### SEC-DA-02: Cross-user session access blocked
**Maps to:** SC-DA-10
**File:** `e2e/deferred-auth-security.spec.ts`

```
- User A creates and claims a session
- User B authenticates with a different account
- User B attempts to access /session/[user-A-session-id]
- ASSERT: User B sees a 404 or access denied (not User A's data)
```

---

## Non-regression Tests

### NR-DA-01: Middleware still refreshes sessions
**Maps to:** (existing invariant)
**File:** `e2e/deferred-auth.spec.ts`

```
- Authenticate a user
- Navigate between pages
- ASSERT: Supabase session cookies are refreshed (check cookie expiry timestamps)
- ASSERT: auth.getUser() still returns the user after navigation
```

---

## Smoke Checklist (Manual)

Before merging `feat/deferred-auth`:

- [ ] Fresh browser: landing page → submit idea → redirected to wizard → no auth UI visible
- [ ] Cookie visible in browser dev tools (Application > Cookies) with correct attributes
- [ ] AuthGate modal does NOT appear before first PRD block
- [ ] Email submission in AuthGate → "Vérifiez votre boîte mail" message
- [ ] Magic link email arrives within 30 seconds
- [ ] Click magic link → redirected back to wizard → session claimed
- [ ] DB inspection: `user_id` set, `anonymous_id` null, messages/blocks intact
- [ ] Second user cannot access first user's session
- [ ] Expired magic link → error page → resend option works
