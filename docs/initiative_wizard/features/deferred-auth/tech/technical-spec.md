# Technical Spec — Deferred Auth

> Overview and index of the technical documentation for the Deferred Auth feature.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27
**Feature:** [`../README.md`](../README.md) · **PRD:** [`../../../prd.md`](../../../prd.md)

---

## Summary

Deferred Auth enables anonymous wizard usage via an httpOnly cookie carrying an `anonymous_id`
(UUID v4). The PM starts the wizard without any signup. When the conversation engine delivers
the first AI reformulation (after the first PRD block is rendered, typically the `first_use_case` block mid-step 1), an `AuthGate` modal prompts the PM to enter their
email. Supabase sends a magic link. On verification, an atomic **session claiming** transition
sets `sessions.user_id`, nullifies `anonymous_id`, and preserves all session data (messages,
PRD, blocks) without loss.

The wizard remains interactive while the PM waits for the magic link email — the modal can be
minimized.

---

## Architecture Overview

```
Landing page (textarea submit)
  │
  ▼
createSession() Server Action
  ├── Generate anonymous_id (crypto.randomUUID)
  ├── INSERT sessions (anonymous_id, raw_idea, status='active', current_step=1)
  ├── INSERT prds (session_id FK, title='Draft PRD')
  ├── Set httpOnly cookie: enhanced_anon_id (30d TTL)
  └── Return { sessionId } → redirect to /session/[id]
  │
  ▼
Wizard (anonymous phase)
  ├── Conversation + PRD blocks generated (step 1)
  ├── First PRD block triggers AuthGate modal
  └── PM enters email → Supabase signInWithOtp
  │
  ▼
Magic link clicked → /auth/confirm
  ├── verifyOtp({ token_hash, type: 'magiclink' })
  ├── claimSession() Server Action
  │     ├── BEGIN transaction
  │     ├── UPDATE sessions SET user_id = auth.uid, anonymous_id = NULL
  │     ├── UPDATE prds SET user_id = auth.uid
  │     ├── COMMIT
  │     └── Clear anonymous_id cookie
  └── Redirect to /session/[id]
```

---

## Sub-specifications

| Document | Scope |
|----------|-------|
| [`data-model.md`](data-model.md) | Tables, RLS policies, triggers, constraints |
| [`api.md`](api.md) | Routes, Server Actions, request/response contracts |
| [`security.md`](security.md) | Cookie security, RLS, CSRF, rate limiting |
| [`release-plan.md`](release-plan.md) | Branch strategy, commit sequence, dependencies |
| [`test-plan.md`](test-plan.md) | Unit / integration / E2E test mapping to Gherkin scenarios |

---

## Key Design Decisions

1. **httpOnly cookie over localStorage.** The `anonymous_id` is stored in an httpOnly cookie
   (not localStorage) because it must be readable by Server Actions and Route Handlers. An
   httpOnly cookie also prevents XSS-based session theft.

2. **Atomic claiming via transaction.** The anonymous-to-authenticated transition uses a
   Postgres transaction to ensure `user_id` and `anonymous_id` are never both set or both null
   on a session. Partial states would break RLS and session lookup logic.

3. **Cookie as sole anonymous identifier.** No server-side session store beyond the `sessions`
   table. The cookie value matches `sessions.anonymous_id` directly — lookup is a simple
   indexed query.

4. **Auth trigger = first PRD block.** The `AuthGate` modal appears when the first `update_prd`
   tool call renders a PRD block in the right panel. This is a deterministic trigger (not a
   timer or message count) tied to the "wow moment" — the PM has seen tangible output.

5. **Non-blocking modal.** The auth modal can be minimized. The wizard remains fully interactive
   during the anonymous phase. This avoids punishing the PM for email delivery latency.

---

## Dependencies

- **Supabase Auth** configured for magic link (already done in scaffold).
- **No existing tables** — this feature creates the first migrations (`profiles`, `sessions`,
  `prds`). Other features (`conversation-engine`, `prd-live-builder`) depend on these tables.
- **Middleware** (`src/middleware.ts`) already refreshes Supabase sessions — no changes needed
  for authenticated session management.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Magic link email delivery latency >30s | Medium | Medium | Non-blocking modal; PM continues working |
| Anonymous session expires before auth (30d cookie) | Low | Low | Cookie TTL is generous; sessions table has no auto-cleanup in V1 |
| Race condition on claiming (two tabs) | Low | Medium | Transaction + unique constraint on anonymous_id lookup |
| PM clears cookies before completing auth | Low | Medium | Session data persists in DB; PM can re-enter idea and get a new session |
