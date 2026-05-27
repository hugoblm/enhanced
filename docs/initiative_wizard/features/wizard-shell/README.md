# Wizard Shell

> One-screen overview.

**Status:** `Planned`
**Owner:** Hugo · **Last updated:** 2026-05-27
**Part of initiative:** [`../../README.md`](../../README.md) · **PRD:** [`../../prd.md`](../../prd.md)

## In one paragraph

The wizard shell is the structural container for the entire Enhanced experience. It renders a split-view desktop layout: conversation panel on the left (~45% width), PRD panel on the right (~55% width), with a 4-step progress indicator at the top. Steps are labeled "Cadrage", "Donnees", "Risques", "PRD". Completed steps are clickable (backward navigation allowed); future steps are locked. Each panel scrolls independently. On narrow viewports (tablet), panels stack vertically or switch via tabs. The shell is a Client Component (`wizard-shell.tsx`) backed by a Zustand store (`wizard-store.ts`) that tracks `currentStep`, panel state, and responsive breakpoints. `[Evidence]` -- the split-view layout is the core UX differentiator identified in the PRD; without it, the product is just a chatbot.

## Documents in this folder

| Doc | What's inside |
|-----|---------------|
| [`product/user-stories-and-jtbd.md`](product/user-stories-and-jtbd.md) | JTBD + 5 user stories with acceptance criteria |
| [`product/gherkin-tests.md`](product/gherkin-tests.md) | 10 acceptance scenarios in Given/When/Then |
| [`product/manual-tests.md`](product/manual-tests.md) | 8 human-run test cases + smoke checklist |
| [`product/ux-accessibility.md`](product/ux-accessibility.md) | UX flows + WCAG 2.1 AA requirements |
| [`tech/technical-spec.md`](tech/technical-spec.md) | Architecture, components, Zustand store, responsive layout |
| [`tech/release-plan.md`](tech/release-plan.md) | Branching, atomic commits, rollback, DoD |
| [`tech/test-plan.md`](tech/test-plan.md) | Vitest + Playwright test plan, Gherkin traceability |

## Current state / next step

No implementation yet. The route `/session/[id]` does not exist. Next step: create the wizard shell layout component, the Zustand store, and the `/session/[id]` route.
