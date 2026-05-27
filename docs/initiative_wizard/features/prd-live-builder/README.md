# PRD Live Builder

> One-screen overview.

**Status:** `Planned`
**Owner:** Hugo · **Last updated:** 2026-05-27
**Part of initiative:** [`../../README.md`](../../README.md) · **PRD:** [`../../prd.md`](../../prd.md)

## In one paragraph

The PRD Live Builder is the right panel of the wizard: the artifact that makes Enhanced a tool, not a chatbot. As the conversation progresses, the AI calls `update_prd` to upsert blocks into the PRD -- and each block appears in the panel in real time, never "generated at the end." The PRD has 12 typed blocks (first_use_case, problem_context, data_signals, risk_value, risk_usability, risk_feasibility, risk_viability, confidence_score, success_criteria, kill_criteria, next_steps, executive_summary) rendered in a fixed sort order matching the PRD structure. Each block displays evidence tags as colored badges: `[Evidence]` green, `[Assumption]` amber, `[To verify]` red. New blocks animate in (fade-in + highlight), updates animate (content transition), and empty states show which sections are not yet filled. The panel header shows the PRD title, a confidence score badge, and export/share buttons. The client-side state is a Zustand store mirroring `prd_blocks` rows, updated on `update_prd` tool call results. Rendering uses `react-markdown` inside `prd-viewer.tsx` -> `prd-block.tsx` -> `evidence-tag.tsx`. `[Evidence]` -- the live PRD artifact is what separates Enhanced from a disposable ChatGPT conversation (PRD Problem 5: evidence vs. assumption is never made explicit).

## Documents in this folder

| Doc | What's inside |
|-----|---------------|
| [`product/user-stories-and-jtbd.md`](product/user-stories-and-jtbd.md) | JTBD + 5 user stories with acceptance criteria |
| [`product/gherkin-tests.md`](product/gherkin-tests.md) | 14 acceptance scenarios in Given/When/Then |
| [`product/manual-tests.md`](product/manual-tests.md) | 9 human-run test cases + smoke checklist |
| [`product/ux-accessibility.md`](product/ux-accessibility.md) | UX flows + WCAG 2.1 AA requirements |
| [`tech/technical-spec.md`](tech/technical-spec.md) | Overview, architecture, Zustand vs AI SDK state, fixed block structure |
| [`tech/data-model.md`](tech/data-model.md) | `prds` + `prd_blocks` + `prd_versions` tables, block sort order, evidence tags |
| [`tech/ai-integration.md`](tech/ai-integration.md) | `update_prd` tool flow, Zustand store design, state sync, component hierarchy |
| [`tech/release-plan.md`](tech/release-plan.md) | 8 atomic commits, dependencies, rollback strategy |
| [`tech/test-plan.md`](tech/test-plan.md) | Unit + integration + E2E tests mapped to 14 Gherkin scenarios |

## Current state / next step

No implementation yet. No `prds` or `prd_blocks` tables, no `update_prd` tool definition, no Zustand store for PRD state, no rendering components. Next step: create the `prds` + `prd_blocks` table migration with RLS, implement the `update_prd` tool execute function, and build the `prd-viewer.tsx` component tree.
