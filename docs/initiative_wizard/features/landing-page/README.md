# Landing Page

> 🚧 **V1 demo deviation** — la server action `createSession` est remplacée par un write Dexie
> client-side dans `pitch-form.tsx`. Voir [`decisions.md`](../../decisions.md).

> One-screen overview.

**Status:** `Planned`
**Owner:** Hugo · **Last updated:** 2026-05-27
**Part of initiative:** [`../../README.md`](../../README.md) · **PRD:** [`../../prd.md`](../../prd.md)

## In one paragraph

The landing page is Enhanced's sole entry point and its first impression. It is a minimal, server-rendered page with a large textarea ("Pitch your product idea"), a single CTA button ("Lancer le cadrage"), and one sentence of value proposition. No signup, no feature tour, no friction. The page IS the product: typing an idea and clicking the button creates an anonymous session, generates a PRD skeleton, and redirects to the wizard. The design uses Obra tokens, loads fast (SSR, no heavy JS), and is responsive down to tablet. `[Evidence]` -- zero-friction entry is the #1 lever against the validated problem that discovery frameworks are too heavyweight for adoption.

## Documents in this folder

| Doc | What's inside |
|-----|---------------|
| [`product/user-stories-and-jtbd.md`](product/user-stories-and-jtbd.md) | JTBD + 4 user stories with acceptance criteria |
| [`product/gherkin-tests.md`](product/gherkin-tests.md) | 8 acceptance scenarios in Given/When/Then |
| [`product/manual-tests.md`](product/manual-tests.md) | 7 human-run test cases + smoke checklist |
| [`product/ux-accessibility.md`](product/ux-accessibility.md) | UX flows + WCAG 2.1 AA requirements |
| [`tech/technical-spec.md`](tech/technical-spec.md) | Architecture, components, server action, Zod schema |
| [`tech/release-plan.md`](tech/release-plan.md) | Branching, atomic commits, rollback, DoD |
| [`tech/test-plan.md`](tech/test-plan.md) | Vitest + Playwright test plan, Gherkin traceability |

## Current state / next step

No implementation yet. The scaffold has a placeholder `/` page. Next step: implement the Server Component page with a Client Component island (textarea + CTA button) and the `createSession` Server Action.
