# Block Refinement

> 🚧 **V1 demo deviation** — opère sur Dexie (pas Supabase). Voir [`decisions.md`](../../decisions.md).

> One-screen overview.

**Status:** `Implemented (V1 Dexie scope)`
**Owner:** Hugo · **Last updated:** 2026-05-28
**Part of initiative:** [`../../README.md`](../../README.md) · **PRD:** [`../../prd.md`](../../prd.md)
**Code reference:** [`.ai-context/refine.md`](../../../../.ai-context/refine.md)

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

Shipped on `feat/block-refinement` with the V1 Dexie scope. The "Affiner" button on every filled PRD block opens a `RefinePopover`; submitting an instruction calls `POST /api/refine` (which uses `generateText` with an `Output.object` schema mirroring the `update_prd` tool contract) and applies the new `content` + `evidence_tags` to both the Zustand mirror and Dexie via the shared `upsertPrdBlock` helper. Implementation details: [`.ai-context/refine.md`](../../../../.ai-context/refine.md).

### Deviations from the tech spec, deferred post-démo

- No `prd_versions` insert (table absent in Dexie; `prd-versioning` feature is post-démo).
- No auth check or `enhanced_anon_id` cookie validation (V1 is anonymous).
- No rate limiting (single-user demo; the OpenRouter credit cap is the only throttle).
- No progressive streaming (the route returns the object once it's complete; ~2-4 s wait).
- No conversation panel log of the refinement exchange.
- No Vitest / Playwright suite (manual smoke is enough for the demo).

When Supabase is reintroduced, the route gets auth + ownership check + `prd_versions` insert, and the body contract can drop `allBlocks` in favour of a server-side SELECT.
