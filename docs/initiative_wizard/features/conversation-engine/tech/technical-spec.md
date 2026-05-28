# Technical Specification — Conversation Engine

> Overview and index of the technical documentation for the Conversation Engine feature.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27
**Feature:** [`../README.md`](../README.md) · **PRD:** [`../../../prd.md`](../../../prd.md)

---

## Spec files (index)

| File | Concern | Required when |
|------|---------|---------------|
| `technical-spec.md` (this file) | Overview, approach, architecture at a glance | Always |
| [`data-model.md`](data-model.md) | `messages` table, conversation persistence strategy | There's persisted data |
| [`api.md`](api.md) | `POST /api/chat` streaming endpoint, request/response contracts | There's an API/interface |
| [`ai-integration.md`](ai-integration.md) | OpenRouter setup, tool definitions, system prompts, step logic, step validation | AI tooling concern |
| [`release-plan.md`](release-plan.md) | Atomic commits, branching, dependencies, rollback | Always |
| [`test-plan.md`](test-plan.md) | Unit / integration / E2E tests mapped to Gherkin scenarios | Always |

---

## 1. Summary & approach

The conversation engine is the brain of Enhanced: an AI-guided conversation that drives the PM
through 4 wizard steps, from raw idea to challenged draft PRD. It uses the Vercel AI SDK with
OpenRouter to stream responses through a single `POST /api/chat` endpoint. The engine exposes
two tools to the AI: `ask_user` (client-resolved, no `execute` function) for structured
interaction cards, and `update_prd` (server-resolved, has `execute`) for real-time PRD
construction.

Two decisions shape everything else:

1. **Single `/api/chat` endpoint for all 4 steps.** The current step travels in the request body
   (via the session loaded from DB), not the URL. This is because `useChat` from `@ai-sdk/react`
   expects a single endpoint. Step-specific behavior is controlled entirely by the system prompt
   assembled server-side.

2. **Client-resolved vs. server-resolved tools.** `ask_user` has no `execute` function: the LLM
   pauses, the client renders the interaction card, the user responds, and the response is sent
   back as a tool result via `addToolResult()`. `update_prd` has an `execute` function that
   writes to the database during the stream. This split is dictated by the nature of each tool:
   one needs user input, the other needs database access.

---

## 2. Architecture at a glance

### Components touched / added

```
src/
├── app/
│   └── api/
│       └── chat/
│           └── route.ts              # POST /api/chat — streaming endpoint
├── lib/
│   └── ai/
│       ├── openrouter.ts             # OpenRouter provider + model setup
│       ├── tools.ts                  # ask_user + update_prd tool definitions
│       ├── step-validation.ts        # Minimum block requirements per step
│       └── prompts/
│           ├── system.ts             # Base system prompt (persona, rules)
│           ├── step-1.ts             # Problem Framing prompt
│           ├── step-2.ts             # Data Validation prompt
│           ├── step-3.ts             # Risk Challenge prompt
│           └── step-4.ts            # Final PRD prompt
├── components/
│   ├── chat/
│   │   ├── message-list.tsx          # Scrollable conversation container
│   │   ├── message-bubble.tsx        # Single message (user or assistant)
│   │   └── chat-input.tsx            # Text input + send button
│   └── cards/
│       ├── card-renderer.tsx         # Dispatcher: tool call → card component
│       ├── single-choice-card.tsx    # Radio-style option picker
│       ├── multi-choice-card.tsx     # Checkbox-style multi picker
│       ├── scale-card.tsx            # 1-N numeric scale
│       ├── confirmation-card.tsx     # Confirm / Reformulate / Clarify
│       └── free-text-card.tsx        # Open-ended textarea
└── app/
    └── actions/
        └── session.ts                # advanceStep Server Action
```

### Data flow

```
User types message or answers card
  │
  ▼
useChat (client) sends messages to POST /api/chat
  │
  ▼
Route handler:
  ├── Validate request (Zod)
  ├── Authenticate (Supabase user or anonymous_id cookie)
  ├── Load session (current_step) + existing PRD blocks
  ├── Assemble system prompt (base + step-specific + PRD context)
  └── streamText() with tools { ask_user, update_prd }
        │
        ├── ask_user tool call (no execute)
        │     → Client receives tool call, renders card
        │     → User interacts → addToolResult() sends response back
        │     → AI continues with the tool result
        │
        ├── update_prd tool call (has execute)
        │     → Server upserts prd_block in DB
        │     → Creates version in prd_versions
        │     → Returns confirmation to AI
        │     → Client intercepts result, updates Zustand store
        │
        └── onStepFinish → persist messages to DB
              onFinish → log completion, PostHog events
  │
  ▼
createUIMessageStreamResponse(result) → streamed to client
```

### Key decisions & trade-offs

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Message state ownership | AI SDK (`useChat`) | Zustand | Avoids double state; AI SDK already manages message list, streaming state, tool call lifecycle |
| Endpoint pattern | Single `/api/chat` | Per-step routes (`/api/chat/step-1`, etc.) | `useChat` expects one endpoint; step context comes from DB session, not URL |
| Tool execution model | Client-resolved `ask_user` + server-resolved `update_prd` | All server-resolved | `ask_user` requires user input that only the client has; `update_prd` requires DB access that only the server has |
| Message persistence | `onStepFinish` callback (per tool-call step) | `onFinish` only | `onStepFinish` captures intermediate tool calls; `onFinish` alone would miss multi-step interactions |
| System prompt assembly | Server-side, per-request | Client-side or cached | Security (prompts never sent to client), freshness (PRD context always up-to-date) |

---

## 3. Detailed specs

- **Data model:** `messages` table with individual rows per message, step-indexed, tool call/result
  JSONB columns. See [`data-model.md`](data-model.md).
- **API / interfaces:** `POST /api/chat` with Zod-validated request body, dual auth (Supabase user
  or anonymous cookie), streaming response via `createUIMessageStreamResponse`. See
  [`api.md`](api.md).
- **AI integration:** OpenRouter provider, `ask_user` + `update_prd` tool schemas, base + 4
  step-specific system prompts, step validation logic, `advanceStep` Server Action. See
  [`ai-integration.md`](ai-integration.md).

---

## 4. Non-functional requirements

### Performance

- **Streaming latency:** First token must appear within 2s of request (network + model startup).
  Subsequent tokens stream with no perceptible gaps.
- **PRD update latency:** `update_prd` execute function must complete (DB upsert + version insert)
  within 500ms. The PRD panel must reflect the update within 500ms of the tool result arriving on
  the client.
- **Card rendering:** `ask_user` card must render within 100ms of the tool call being received by
  the client.

### Observability

PostHog events (tracked in `onFinish` and `onStepFinish`):

| Event | Properties | Success criteria link |
|-------|-----------|----------------------|
| `wizard_step_started` | `session_id`, `step` | Step-by-step drop-off rates |
| `wizard_step_completed` | `session_id`, `step`, `duration_seconds` | Step-by-step drop-off rates |
| `wizard_completed` | `session_id`, `total_duration_seconds`, `message_count` | KR2 (10+ PRDs), KR4 (>60% completion) |
| `chat_message_sent` | `session_id`, `step`, `role` | Time-to-PRD |
| `ask_user_card_shown` | `session_id`, `step`, `card_type` | Card interaction analytics |
| `ask_user_card_answered` | `session_id`, `step`, `card_type`, `duration_ms` | Card interaction analytics |
| `update_prd_block_written` | `session_id`, `block_type`, `trigger` | PRD construction analytics |
| `ai_error` | `session_id`, `error_type`, `status_code` | Error rate monitoring |

### Scalability / cost

- **Token usage logging:** Every `onFinish` callback logs `usage.promptTokens` and
  `usage.completionTokens` to the `messages.metadata` JSONB. A scheduled query can aggregate
  per-session cost.
- **Cost target:** <$0.50 per full wizard session (4 steps). Based on Claude Sonnet 4 pricing
  via OpenRouter.
- **Rate limiting:** Max 20 messages per minute per session to prevent abuse (checked in the
  route handler).

---

## 5. Delivery & testing

- **How it ships:** see [`release-plan.md`](release-plan.md) (11 atomic commits, sequenced by
  dependency).
- **How it's tested:** see [`test-plan.md`](test-plan.md) (unit + integration + E2E, mapped to
  28 Gherkin scenarios) and [`../product/manual-tests.md`](../product/manual-tests.md).

---

## 6. Open questions

- **Model selection:** Currently targeting `anthropic/claude-sonnet-4-20250514` via OpenRouter.
  Cost-quality tradeoff to be validated during integration testing. May need to test cheaper
  models for non-critical steps (e.g., step 4 finalization). `[To verify]`
- **System prompt tuning:** Initial prompts will need iteration based on test conversations.
  The adversarial tone must be calibrated: too aggressive = PMs disengage, too soft = no
  differentiation from ChatGPT. `[To verify]`
- **maxSteps value:** Set to 5 to allow multiple tool calls per turn. If the AI makes too many
  consecutive tool calls (e.g., 5 `update_prd` calls in one turn), this may need adjustment.
  `[To verify]`
- **Message history truncation:** For long conversations (40+ messages), should we truncate
  older messages from the context window to stay within model limits? If yes, what strategy?
  (sliding window, summarization, step-boundary truncation.) `[To verify]`
