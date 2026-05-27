# Release Plan — Conversation Engine

> How the conversation engine gets built and shipped: atomic commits, sequenced by dependency,
> reviewable in isolation.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27
**PRD:** [`../../../prd.md`](../../../prd.md) · **Technical spec:** [`technical-spec.md`](technical-spec.md) · **Test plan:** [`test-plan.md`](test-plan.md)

---

## Branching

- Branch from `staging`: `feat/conversation-engine`
- Open a PR into `staging`; merge to `main` is a separate release step.
- This is the **largest feature** in the V1 initiative. Plan for 11 atomic commits.

## Dependencies

| Dependency | Feature | What's needed | Status |
|-----------|---------|--------------|--------|
| `sessions` table | deferred-auth | Table must exist for session ownership checks | Planned |
| `prds` + `prd_blocks` tables | deferred-auth / prd-live-builder | Tables must exist for `update_prd` tool | Planned |
| `prd_versions` table | prd-versioning (COULD) | Table must exist for version snapshots; if not built, skip versioning in `update_prd` | Planned |
| Wizard shell | wizard-shell | The split-view layout must exist to host the conversation panel | Planned |
| `@ai-sdk/react` | (new dependency) | Must be installed for `useChat` hook | Not installed |

**Strategy:** The conversation engine can be built in parallel with the wizard shell on a
separate branch. The final integration commit wires the conversation panel into the shell.

---

## Commit / PR breakdown

| # | Commit title | Scope (one logical change) | Tests added | Depends on |
|---|-------------|----------------------------|-------------|------------|
| 1 | Add OpenRouter provider setup | `src/lib/ai/openrouter.ts` — provider + model export. Add `OPENROUTER_API_KEY` to `.env.local.example`. | Unit: provider creates model instance | -- |
| 2 | Add ask_user + update_prd tool definitions | `src/lib/ai/tools.ts` — both tool schemas, `BLOCK_TYPES` const, `BLOCK_SORT_ORDER` map. Factory function `createUpdatePrdTool`. | Unit: Zod schema validation for all 5 card types. Unit: update_prd execute upserts mock DB. | 1 |
| 3 | Add base system prompt | `src/lib/ai/prompts/base.ts` — persona, evidence tagging rules, ask_user rules, update_prd rules. | Unit: prompt is non-empty string, contains key phrases. | -- |
| 4 | Add step-specific prompts + dispatcher | `src/lib/ai/prompts/step-{1,2,3,4}.ts` + `steps.ts` dispatcher. `system.ts` assembly with PRD context. | Unit: each step prompt exists. Unit: buildSystemPrompt assembles correctly. Unit: PRD context section includes block summaries. | 3 |
| 5 | Add step-validation logic | `src/lib/ai/step-validation.ts` — validateStepCompletion function. | Unit: each step's minimum blocks validated. Unit: empty blocks rejected. Unit: extra blocks ignored. | -- |
| 6 | Add messages table migration | `supabase/migrations/YYYYMMDDHHMMSS_create_messages.sql` — table, index, RLS. | Integration: migration runs clean on `supabase db reset`. | sessions table (deferred-auth) |
| 7 | Add POST /api/chat route with streaming | `src/app/api/chat/route.ts` — full route handler with Zod validation, dual auth, session loading, prompt assembly, streamText, message persistence. `src/lib/ai/schemas.ts`, `src/lib/ai/message-persistence.ts`, `src/lib/rate-limit.ts`. | Integration: route returns streaming response. Integration: 400 on invalid body. Integration: 401 on no auth. | 1, 2, 4, 6 |
| 8 | Add advanceStep Server Action | `src/app/actions/session.ts` — advanceStep with step validation. | Unit: validates step requirements. Integration: updates session.current_step. | 5, 7 |
| 9 | Install @ai-sdk/react, add useChat integration | Install `@ai-sdk/react`. Add `ConversationPanel` client component with `useChat` hook. Add `message-list.tsx`, `message-bubble.tsx`, `chat-input.tsx`. | Unit: components render. Integration: useChat connects to /api/chat. | 7 |
| 10 | Add card-renderer + 5 card components | `src/components/cards/` — card-renderer.tsx (dispatcher), single-choice-card.tsx, multi-choice-card.tsx, scale-card.tsx, confirmation-card.tsx, free-text-card.tsx. | Unit: each card renders for its type. Unit: submitted state is read-only. Unit: validation errors shown. | 9 |
| 11 | Wire message persistence + PostHog events | Complete `onStepFinish` and `onFinish` callbacks. Add `src/lib/ai/message-mapper.ts`. Add PostHog event tracking. Wire step completion → advanceStep call. | Integration: messages persisted after stream. E2E: full step 1 conversation flow. | 7, 8, 9, 10 |

---

## Release sequencing

- **Feature flag:** None — this is a core feature. The `/api/chat` route simply does not exist
  until it is deployed. No flag needed.
- **Migrations:** The `messages` table migration (#6) must be applied before the route handler
  (#7) is deployed. Use `supabase db push` on staging before code deploy.
- **Order of deploy:**
  1. Apply `messages` migration to staging Supabase
  2. Deploy feat/conversation-engine branch to staging (Vercel preview)
  3. Verify on staging: full step 1 conversation, card interactions, PRD block writes
  4. Merge to `staging` branch
  5. Promote to `main` after full E2E verification
- **Staging -> production:** All 28 Gherkin scenarios must pass on staging. Manual smoke test
  of a full 4-step wizard run.

---

## Rollback

- **Trigger:** AI responses are consistently broken (wrong model, malformed tool calls, DB
  write failures), or OpenRouter API is unavailable for >1 hour.
- **How:** Revert the `feat/conversation-engine` merge commit on `staging`. The `/api/chat`
  route disappears, the wizard conversation panel shows an error state. The `messages` table
  migration does NOT need to be rolled back (the table can remain empty and unused).
- **Data safety:** Messages are append-only. No rollback scenario loses user data. PRD blocks
  written by `update_prd` persist independently (prd-live-builder feature). Reverting the
  conversation engine does not delete PRD blocks.

---

## Definition of Done (merge checklist)

- [ ] All `MUST` requirements from PRD section 5 (conversation-engine) implemented
- [ ] OpenRouter streaming works end-to-end (type idea -> AI responds -> cards render)
- [ ] All 5 card types render and submit correctly
- [ ] Evidence tagging appears in AI responses and PRD blocks
- [ ] Step validation blocks premature advancement
- [ ] Messages persist to DB and restore on page reload
- [ ] Rate limiting works (>20 msg/min returns 429)
- [ ] PostHog events fire for all tracked actions
- [ ] Unit + integration tests pass (see [`test-plan.md`](test-plan.md))
- [ ] 28 Gherkin acceptance scenarios covered
- [ ] Manual smoke pass done (see [`../product/manual-tests.md`](../product/manual-tests.md))
- [ ] `.ai-context/` updated with conversation engine domain documentation
- [ ] Feature README status updated from `Planned` to `Implemented`
