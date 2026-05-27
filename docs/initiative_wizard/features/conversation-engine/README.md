# Conversation Engine

> One-screen overview.

**Status:** `Planned`
**Owner:** Hugo · **Last updated:** 2026-05-27
**Part of initiative:** [`../../README.md`](../../README.md) · **PRD:** [`../../prd.md`](../../prd.md)

## In one paragraph

The conversation engine is the core of Enhanced -- the AI-guided conversation that drives the PM through 4 wizard steps, from raw idea to challenged draft PRD. It uses Vercel AI SDK with OpenRouter (`streamText`) to stream responses through a single `POST /api/chat` endpoint. The engine exposes two tools to the AI: `ask_user` (client-resolved, no `execute` function) renders 5 types of structured interaction cards (single choice, multi choice, scale, confirmation, free text), and `update_prd` (server-resolved) writes PRD blocks to the database. Each step has a dedicated system prompt (`step-{1,2,3,4}.ts`) that shapes the AI's behavior -- from problem framing in step 1 to final PRD assembly in step 4. Step progression is server-authoritative (`sessions.current_step`) with minimum completion requirements validated before advancing. Every claim surfaced during the conversation carries an evidence tag (`[Evidence]`, `[Assumption]`, `[To verify]`), and the AI enforces guard rails: each card is preceded by a message explaining WHY the question is asked, and a maximum of 2-3 consecutive cards before returning to free text. `[Evidence]` -- the structured challenge mechanism is the product's reason to exist; without it, Enhanced is just another PRD generator that agrees with everything the PM says (PRD Problem 4).

## Documents in this folder

| Doc | What's inside |
|-----|---------------|
| [`product/user-stories-and-jtbd.md`](product/user-stories-and-jtbd.md) | JTBD + 8 user stories with acceptance criteria |
| [`product/gherkin-tests.md`](product/gherkin-tests.md) | 28 acceptance scenarios in Given/When/Then |
| [`product/manual-tests.md`](product/manual-tests.md) | 14 human-run test cases + smoke checklist |
| [`product/ux-accessibility.md`](product/ux-accessibility.md) | UX flows + WCAG 2.1 AA requirements |
| [`tech/technical-spec.md`](tech/technical-spec.md) | Overview, architecture, key decisions, non-functional requirements |
| [`tech/data-model.md`](tech/data-model.md) | `messages` table schema, RLS, persistence strategy |
| [`tech/api.md`](tech/api.md) | `POST /api/chat` streaming endpoint, request/response contracts, advanceStep |
| [`tech/ai-integration.md`](tech/ai-integration.md) | OpenRouter setup, tool definitions, system prompts, step validation, card rendering |
| [`tech/release-plan.md`](tech/release-plan.md) | 11 atomic commits, dependencies, rollback strategy |
| [`tech/test-plan.md`](tech/test-plan.md) | Unit + integration + E2E tests mapped to 28 Gherkin scenarios |

## Current state / next step

No implementation yet. The Vercel AI SDK and OpenRouter dependencies are installed but unused. No API route, no system prompts, no tool definitions, no message table exist. Next step: create the `messages` table migration, implement `POST /api/chat` with `streamText`, define the `ask_user` and `update_prd` tool schemas, and write the step 1 system prompt.
