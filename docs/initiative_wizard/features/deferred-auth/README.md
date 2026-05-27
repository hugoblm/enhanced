# Deferred Auth

> One-screen overview.

**Status:** `Planned`
**Owner:** Hugo · **Last updated:** 2026-05-27
**Part of initiative:** [`../../README.md`](../../README.md) · **PRD:** [`../../prd.md`](../../prd.md)

## In one paragraph

Deferred Auth delays the signup wall until the PM has already invested 2-3 minutes in the wizard and received the first AI reformulation (the "wow moment" after the first PRD block is rendered, typically `first_use_case` mid-step 1). Before that point, the PM works in an anonymous session tracked by an `anonymous_id` (UUID) stored in an httpOnly cookie. When the auth modal appears, the PM enters their email and receives a Supabase magic link. The critical technical challenge is the atomic anonymous-to-authenticated transition: `sessions.user_id` is set, `anonymous_id` is nullified, and all session data (messages, PRD blocks) is preserved without loss. The wizard remains accessible while the PM waits for the magic link -- the modal can be minimized. `[Evidence]` -- deferred signup is a direct response to the validated problem that discovery frameworks fail because of upfront friction (Discovery, Problem 3). Forcing signup before value is demonstrated would replicate the same adoption barrier Enhanced exists to eliminate.

## Documents in this folder

| Doc | What's inside |
|-----|---------------|
| [`product/user-stories-and-jtbd.md`](product/user-stories-and-jtbd.md) | JTBD + 5 user stories with acceptance criteria |
| [`product/gherkin-tests.md`](product/gherkin-tests.md) | 12 acceptance scenarios in Given/When/Then |
| [`product/manual-tests.md`](product/manual-tests.md) | 9 human-run test cases + smoke checklist |
| [`product/ux-accessibility.md`](product/ux-accessibility.md) | UX flows + WCAG 2.1 AA requirements |
| [`tech/technical-spec.md`](tech/technical-spec.md) | Technical overview + architecture |
| [`tech/data-model.md`](tech/data-model.md) | Tables, RLS, triggers, constraints |
| [`tech/api.md`](tech/api.md) | Routes, Server Actions, contracts |
| [`tech/security.md`](tech/security.md) | Threat model, cookie security, CSRF |
| [`tech/release-plan.md`](tech/release-plan.md) | Branch, commit sequence, checklist |
| [`tech/test-plan.md`](tech/test-plan.md) | Unit / integration / E2E test mapping |

## Current state / next step

No implementation yet. Supabase Auth is configured for magic link but no tables, RLS policies, or auth callback routes exist. Next step: implement the `sessions` table migration with nullable `user_id` + `anonymous_id`, the anonymous session cookie logic, and the `claimSession` Server Action.
