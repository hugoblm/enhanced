# Test Plan (Automated) — Conversation Engine

> Automated test strategy mapped to the 28 Gherkin scenarios in
> [`../product/gherkin-tests.md`](../product/gherkin-tests.md). The manual portion lives in
> [`../product/manual-tests.md`](../product/manual-tests.md).

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27
**Tooling:** Vitest (unit + integration), Playwright (E2E)

---

## Test types

| Type | Mandatory? | What it covers here |
|------|-----------|---------------------|
| **Unit** | Yes | Zod validation, prompt assembly, step validation, tool schemas, card components |
| **Non-regression** | Yes | Landing page, auth flow, existing routes unaffected |
| **Integration** | Yes | POST /api/chat round-trip, message persistence, DB writes |
| **End-to-end** | Yes | Full conversation flows, card interactions, step progression |

---

## How to run

```bash
# Unit + integration tests
npx vitest run

# E2E tests
npx playwright test

# Coverage
npx vitest run --coverage
```

---

## Non-regression — what must not break

| Existing behavior | Risk from this change | Protection |
|-------------------|----------------------|------------|
| Landing page renders at `/` | New route `/api/chat` could conflict | E2E: landing page loads |
| Auth flow (magic link send + verify) | New Supabase queries in route handler | E2E: auth flow unaffected |
| Middleware session refresh | New API route must be handled by middleware | Integration: middleware passes through API routes |
| Supabase RLS on sessions/prds | New messages table RLS could interfere | Integration: existing RLS policies unchanged |

---

## Unit tests

### Zod validation (`src/lib/ai/schemas.ts`)

| Test | File | Description |
|------|------|-------------|
| `chat-request-schema.test.ts` | `__tests__/lib/ai/schemas.test.ts` | Valid request with UUID sessionId and message array passes |
| | | Invalid UUID rejected |
| | | Empty messages array rejected |
| | | Missing sessionId rejected |
| | | Extra fields stripped (strict mode) |

### System prompt assembly (`src/lib/ai/prompts/system.ts`)

| Test | File | Description |
|------|------|-------------|
| `system-prompt.test.ts` | `__tests__/lib/ai/prompts/system.test.ts` | buildSystemPrompt includes base prompt |
| | | buildSystemPrompt includes correct step prompt for each step (1-4) |
| | | PRD context section empty when no blocks |
| | | PRD context section lists existing blocks with tag counts |
| | | Invalid step throws error |

### Step validation (`src/lib/ai/step-validation.ts`)

| Test | File | Description |
|------|------|-------------|
| `step-validation.test.ts` | `__tests__/lib/ai/step-validation.test.ts` | Step 1: valid when first_use_case AND problem_context present and non-empty |
| | | Step 1: invalid when first_use_case missing |
| | | Step 1: invalid when problem_context empty string |
| | | Step 2: valid when data_signals present |
| | | Step 2: invalid when data_signals missing |
| | | Step 3: valid when all 4 risks + confidence_score present |
| | | Step 3: invalid when any risk block missing |
| | | Step 3: invalid when confidence_score missing |
| | | Step 4: valid when success_criteria + kill_criteria + next_steps + executive_summary present |
| | | Step 4: invalid when any block missing |
| | | Returns list of missing block types |
| | | Extra blocks do not interfere |

### Tool schema validation (`src/lib/ai/tools.ts`)

| Test | File | Description |
|------|------|-------------|
| `tools.test.ts` | `__tests__/lib/ai/tools.test.ts` | ask_user: valid single_choice with options passes |
| | | ask_user: valid multi_choice with options passes |
| | | ask_user: valid scale with scale_config passes |
| | | ask_user: valid confirmation with confirmation_text passes |
| | | ask_user: valid free_text with placeholder passes |
| | | ask_user: invalid card_type rejected |
| | | ask_user: missing question rejected |
| | | update_prd: valid block_type + content passes |
| | | update_prd: invalid block_type rejected |
| | | update_prd: missing content rejected |
| | | update_prd: evidence_tags with valid tags passes |
| | | update_prd: evidence_tags with invalid tag rejected |
| | | BLOCK_SORT_ORDER covers all 12 block types |

### Card components (`src/components/cards/`)

| Test | File | Description |
|------|------|-------------|
| `single-choice-card.test.tsx` | `__tests__/components/cards/single-choice-card.test.tsx` | Renders all options |
| | | Shows "Autre — preciser" option |
| | | Selecting "Autre" reveals textarea |
| | | Submit with selection calls onSubmit with correct payload |
| | | Submit without selection shows error |
| | | Submit with "Autre" but empty text shows error |
| | | Submitted state is read-only |
| `multi-choice-card.test.tsx` | `__tests__/components/cards/multi-choice-card.test.tsx` | Renders all options as checkboxes |
| | | Multiple selections allowed |
| | | Submit without selection shows error |
| | | Submit with selections calls onSubmit with array |
| | | Submitted state shows selected options |
| `scale-card.test.tsx` | `__tests__/components/cards/scale-card.test.tsx` | Renders correct number of points (min to max) |
| | | Shows min_label and max_label |
| | | Clicking point selects it |
| | | Only one point selected at a time |
| | | Submit without selection shows error |
| | | Submit calls onSubmit with numeric value |
| `confirmation-card.test.tsx` | `__tests__/components/cards/confirmation-card.test.tsx` | Renders confirmation text |
| | | Shows 3 action buttons |
| | | "Confirm" submits { action: 'confirmed' } |
| | | "Reformulate" reveals textarea |
| | | "Reformulate" submit without text shows error |
| | | "Clarify" reveals textarea |
| `free-text-card.test.tsx` | `__tests__/components/cards/free-text-card.test.tsx` | Renders textarea with placeholder |
| | | Submit empty shows error |
| | | Submit with text calls onSubmit |
| | | Submitted state shows entered text |

### Message mapper (`src/lib/ai/message-mapper.ts`)

| Test | File | Description |
|------|------|-------------|
| `message-mapper.test.ts` | `__tests__/lib/ai/message-mapper.test.ts` | dbToAiMessages maps user text messages |
| | | dbToAiMessages maps assistant messages with tool_calls |
| | | dbToAiMessages maps tool result messages |
| | | aiToDbMessage extracts tool_calls from parts |
| | | Round-trip: aiToDb -> dbToAi preserves message content |

---

## Integration tests

| Test | File | Gherkin | Description |
|------|------|---------|-------------|
| `chat-route.test.ts` | `__tests__/api/chat/route.test.ts` | SC-CE-18 | POST /api/chat returns streaming response (mock OpenRouter) |
| | | SC-CE-21 | POST /api/chat returns 400 on invalid body |
| | | SC-CE-21 | POST /api/chat returns 401 on no auth |
| | | SC-CE-21 | POST /api/chat returns 404 on wrong session |
| | | SC-CE-21 | POST /api/chat returns 429 when rate limited |
| `message-persistence.test.ts` | `__tests__/lib/ai/message-persistence.test.ts` | SC-CE-23 | Messages are persisted after stream completes |
| | | SC-CE-23 | Messages restore correctly on load |
| `update-prd-tool.test.ts` | `__tests__/lib/ai/tools-integration.test.ts` | SC-CE-19 | update_prd execute upserts block in DB |
| | | SC-CE-19 | update_prd creates version snapshot |
| | | -- | update_prd with confidence_score updates prds table |
| `advance-step.test.ts` | `__tests__/actions/session.test.ts` | SC-CE-14 | advanceStep succeeds when requirements met |
| | | SC-CE-14 | advanceStep fails when blocks missing, returns missingBlocks |
| | | SC-CE-11 | advanceStep updates session.current_step |

---

## End-to-end tests (Playwright)

| Test | File | Gherkin | Description |
|------|------|---------|-------------|
| `step-1-flow.spec.ts` | `e2e/conversation/step-1-flow.spec.ts` | SC-CE-25 | Complete step 1: type idea -> AI responds -> cards -> reformulation -> confirm -> blocks appear |
| `free-text.spec.ts` | `e2e/conversation/free-text.spec.ts` | SC-CE-1 | PM submits free text -> AI responds within 10s |
| | | SC-CE-1 | Empty free text submission shows error |
| `single-choice.spec.ts` | `e2e/conversation/single-choice.spec.ts` | SC-CE-2 | Select option -> submit -> response sent |
| | | SC-CE-3 | Select "Other" -> type custom -> submit |
| | | SC-CE-3 | Select "Other" -> submit empty -> error |
| `multi-choice.spec.ts` | `e2e/conversation/multi-choice.spec.ts` | SC-CE-4 | Select multiple -> submit -> array sent |
| | | SC-CE-4 | Submit with none selected -> error |
| | | SC-CE-5 | Select options + "Other" with custom text |
| `scale.spec.ts` | `e2e/conversation/scale.spec.ts` | SC-CE-6 | Select scale point -> submit -> value sent |
| | | SC-CE-6 | Change selection before submit |
| | | SC-CE-6 | Submit without selection -> error |
| `confirmation.spec.ts` | `e2e/conversation/confirmation.spec.ts` | SC-CE-7 | Confirm reformulation -> result sent |
| | | SC-CE-7 | Reformulate with new text |
| | | SC-CE-8 | Clarify with additional context |
| `guard-rails.spec.ts` | `e2e/conversation/guard-rails.spec.ts` | SC-CE-9 | Every card preceded by WHY message |
| | | SC-CE-10 | Max 3 consecutive cards, then free text |
| `step-progression.spec.ts` | `e2e/conversation/step-progression.spec.ts` | SC-CE-11 | Step 1 complete -> transition to step 2 |
| | | SC-CE-12 | Step 3 complete with risk scores |
| | | SC-CE-13 | Step 4 complete -> wizard finished |
| | | SC-CE-14 | Step blocked when blocks missing |
| `pushback.spec.ts` | `e2e/conversation/pushback.spec.ts` | SC-CE-15 | AI challenges unsubstantiated claim |
| | | SC-CE-16 | AI challenges solution disguised as problem |
| `evidence-tagging.spec.ts` | `e2e/conversation/evidence-tagging.spec.ts` | SC-CE-17 | Correct tags applied per claim type |
| | | SC-CE-17 | Tags carry into PRD blocks |
| `streaming.spec.ts` | `e2e/conversation/streaming.spec.ts` | SC-CE-18 | Response streams token by token |
| | | SC-CE-19 | ask_user card renders during stream |
| | | SC-CE-19 | update_prd executes during stream |
| `system-prompts.spec.ts` | `e2e/conversation/system-prompts.spec.ts` | SC-CE-20 | Step-specific AI behavior matches expectations |
| `error-handling.spec.ts` | `e2e/conversation/error-handling.spec.ts` | SC-CE-21 | API error shows retry button |
| | | SC-CE-22 | Network drop preserves partial response |
| `session-persistence.spec.ts` | `e2e/conversation/session-persistence.spec.ts` | SC-CE-23 | Page reload restores conversation |
| | | SC-CE-23 | Return to session after browser close |
| `chat-input.spec.ts` | `e2e/conversation/chat-input.spec.ts` | SC-CE-24 | Type and send message |
| | | SC-CE-24 | Input blocked while card awaits response |

---

## Traceability — Gherkin scenario -> automated test

| Gherkin | US | Test type | Automated test | Status |
|---------|-----|-----------|---------------|--------|
| SC-CE-1 | US-CE-1 | Unit + E2E | free-text-card.test.tsx, free-text.spec.ts | To write |
| SC-CE-2 | US-CE-2 | Unit + E2E | single-choice-card.test.tsx, single-choice.spec.ts | To write |
| SC-CE-3 | US-CE-2 | Unit + E2E | single-choice-card.test.tsx, single-choice.spec.ts | To write |
| SC-CE-4 | US-CE-3 | Unit + E2E | multi-choice-card.test.tsx, multi-choice.spec.ts | To write |
| SC-CE-5 | US-CE-3 | Unit + E2E | multi-choice-card.test.tsx, multi-choice.spec.ts | To write |
| SC-CE-6 | US-CE-4 | Unit + E2E | scale-card.test.tsx, scale.spec.ts | To write |
| SC-CE-7 | US-CE-5 | Unit + E2E | confirmation-card.test.tsx, confirmation.spec.ts | To write |
| SC-CE-8 | US-CE-5 | Unit + E2E | confirmation-card.test.tsx, confirmation.spec.ts | To write |
| SC-CE-9 | US-CE-6 | E2E | guard-rails.spec.ts | To write |
| SC-CE-10 | US-CE-6 | E2E | guard-rails.spec.ts | To write |
| SC-CE-11 | US-CE-7 | Integration + E2E | advance-step.test.ts, step-progression.spec.ts | To write |
| SC-CE-12 | US-CE-7 | E2E | step-progression.spec.ts | To write |
| SC-CE-13 | US-CE-7 | E2E | step-progression.spec.ts | To write |
| SC-CE-14 | US-CE-7, US-CE-8 | Integration + E2E | advance-step.test.ts, step-progression.spec.ts | To write |
| SC-CE-15 | US-CE-8 | E2E | pushback.spec.ts | To write |
| SC-CE-16 | US-CE-8 | E2E | pushback.spec.ts | To write |
| SC-CE-17 | US-CE-8 | E2E | evidence-tagging.spec.ts | To write |
| SC-CE-18 | -- | Integration + E2E | chat-route.test.ts, streaming.spec.ts | To write |
| SC-CE-19 | -- | Integration + E2E | update-prd-tool.test.ts, streaming.spec.ts | To write |
| SC-CE-20 | -- | Unit + E2E | system-prompt.test.ts, system-prompts.spec.ts | To write |
| SC-CE-21 | -- | Integration + E2E | chat-route.test.ts, error-handling.spec.ts | To write |
| SC-CE-22 | -- | E2E | error-handling.spec.ts | To write |
| SC-CE-23 | -- | Integration + E2E | message-persistence.test.ts, session-persistence.spec.ts | To write |
| SC-CE-24 | -- | E2E | chat-input.spec.ts | To write |
| SC-CE-25 | -- | E2E | step-1-flow.spec.ts | To write |
| SC-CE-26 | -- | E2E | (step-2 flow, covered by step-progression.spec.ts) | To write |
| SC-CE-27 | -- | E2E | (step-3 flow, covered by step-progression.spec.ts) | To write |
| SC-CE-28 | -- | E2E | (step-4 flow, covered by step-progression.spec.ts) | To write |

---

## Coverage expectations

- **Critical paths:** 100% coverage for step-validation, Zod schemas, message mapper, rate
  limiter, tool execute functions.
- **Card components:** All 5 card types covered for happy path, validation errors, and
  submitted state.
- **Route handler:** All error codes covered (400, 401, 404, 429, 500).
- **E2E:** At minimum, a full step 1 flow (idea -> cards -> reformulation -> blocks) must pass
  before merge.
- **AI-dependent tests:** E2E tests that depend on AI responses (pushback, evidence tagging,
  step-specific behavior) are inherently non-deterministic. Use assertion patterns that check
  for structural correctness (e.g., "a card was rendered", "a block was written") rather than
  exact AI output text.
