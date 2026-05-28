# PDF Export

> 🚧 **V1 demo deviation** — lit les données depuis Dexie au lieu de Supabase. Contrat de données
> stable. Voir [`decisions.md`](../../decisions.md).

> One-screen overview.

**Status:** `Planned`
**Owner:** Hugo · **Last updated:** 2026-05-27
**Part of initiative:** [`../../README.md`](../../README.md) · **PRD:** [`../../prd.md`](../../prd.md)

## In one paragraph

PDF Export transforms the finalized PRD into a branded, downloadable PDF designed for stakeholder sharing. The PDF is generated server-side via `@react-pdf/renderer` with Obra design tokens embedded: Kedebideri headings, Cantarell body text, Enhanced logo/header, and clean section layout. All PRD blocks are rendered in order with evidence tags (`[Evidence]`, `[Assumption]`, `[To verify]`) visually distinguished. The confidence score and final recommendation are prominently displayed. The export button lives in the PRD panel header and triggers a server call to `GET /api/export/[prdId]/pdf`, which returns the file as a download (Content-Disposition: attachment). This is a communication artifact -- it is not editable, not a living document. Its purpose is to let the Builder PM hand a credible, branded output to their CPO or team lead without requiring anyone to create an Enhanced account. `[Evidence]` -- PDF export traces directly to Discovery Problem 1 (no structured validation = nothing to share) and is essential for the webinar demo use case.

## Documents in this folder

| Doc | What's inside |
|-----|---------------|
| [`product/user-stories-and-jtbd.md`](product/user-stories-and-jtbd.md) | JTBD + 3 user stories with acceptance criteria |
| [`product/gherkin-tests.md`](product/gherkin-tests.md) | 8 acceptance scenarios in Given/When/Then |
| [`product/manual-tests.md`](product/manual-tests.md) | 7 human-run test cases + smoke checklist |
| [`product/ux-accessibility.md`](product/ux-accessibility.md) | UX flows + WCAG 2.1 AA requirements |
| [`tech/technical-spec.md`](tech/technical-spec.md) | Technical overview + architecture |
| [`tech/api.md`](tech/api.md) | Route handler, PDF components, fonts, download flow |
| [`tech/release-plan.md`](tech/release-plan.md) | Branch, commit sequence, checklist |
| [`tech/test-plan.md`](tech/test-plan.md) | Unit / integration / E2E test mapping |

## Current state / next step

No implementation. `@react-pdf/renderer` is installed as a dependency. Obra font files (Kedebideri, Cantarell) need to be available for embedding as base64. The PRD data model (`prds`, `prd_blocks`) must exist before this feature can be built. Next step: implement the `/api/export/[prdId]/pdf` Route Handler with font embedding and branded layout.
