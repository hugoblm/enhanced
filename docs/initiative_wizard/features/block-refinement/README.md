# Block Refinement

> One-screen overview.

**Status:** `Planned`
**Owner:** Hugo · **Last updated:** 2026-05-27
**Part of initiative:** [`../../README.md`](../../README.md) · **PRD:** [`../../prd.md`](../../prd.md)

## In one paragraph

Block refinement gives the Builder PM inline control over individual PRD sections without restarting the conversation or regenerating the full document. When hovering a PRD block, a "Refine" button appears. Clicking it opens a popover with a textarea where the PM types a natural language instruction (e.g., "raccourcis", "ajoute le contexte B2C", "rends ca plus precis"). The system sends the instruction + block context to the AI, which regenerates only that block. The block updates in-place with a streaming response. The conversation panel reflects the refinement exchange. No WYSIWYG editing in V1 -- all refinement is AI-mediated via natural language. `[Evidence]` -- without block-level iteration, the product is a one-shot generator; the PRD validates this as the first MUST to cut only under timeline pressure.

## Documents in this folder

| Doc | What's inside |
|-----|---------------|
| [`product/user-stories-and-jtbd.md`](product/user-stories-and-jtbd.md) | JTBD + 4 user stories with acceptance criteria |
| [`product/gherkin-tests.md`](product/gherkin-tests.md) | 8 acceptance scenarios in Given/When/Then |
| [`product/manual-tests.md`](product/manual-tests.md) | 7 human-run test cases + smoke checklist |
| [`product/ux-accessibility.md`](product/ux-accessibility.md) | UX flows + WCAG 2.1 AA requirements |
| [`tech/technical-spec.md`](tech/technical-spec.md) | Architecture, components, state management, data flow |
| [`tech/api.md`](tech/api.md) | POST /api/refine endpoint contract |
| [`tech/ai-integration.md`](tech/ai-integration.md) | Refinement prompt design, model config, token estimates |
| [`tech/release-plan.md`](tech/release-plan.md) | Branching, atomic commits, rollback, DoD |
| [`tech/test-plan.md`](tech/test-plan.md) | Vitest + Playwright test plan, Gherkin traceability |

## Current state / next step

No implementation yet. Depends on `prd-live-builder` (block rendering) and `conversation-engine` (AI integration). Next step: implement `refine-popover.tsx`, the `POST /api/refine` route, and the Zustand store update logic.
