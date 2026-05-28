# PRD Versioning

> 🚧 **V1 demo : feature reportée post-démo.** Voir [`decisions.md`](../../decisions.md).

> One-screen overview.

**Status:** `Planned`
**Owner:** Hugo · **Last updated:** 2026-05-27
**Part of initiative:** [`../../README.md`](../../README.md) · **PRD:** [`../../prd.md`](../../prd.md)

## In one paragraph

PRD Versioning provides a basic version history for PRDs generated in Enhanced. Each time the conversation engine calls `update_prd` (generation) or the PM triggers a block refinement, a new version entry is automatically created in the `prd_versions` table. The PM can open a version history panel from the PRD panel header and browse a chronological list of versions (newest first). Clicking a version displays its content as a read-only snapshot. V1 does not include diff view, restore/rollback, or version naming -- it is a simple audit trail. This is a `COULD` feature: it adds confidence for PMs iterating on their PRD (they can always see what changed), but the core product value does not depend on it. `[Assumption]` -- PMs want to see their iteration history. This traces weakly to Discovery Problem 5 (evidence tagging needs audit trail) but is primarily a quality-of-life feature.

## Documents in this folder

| Doc | What's inside |
|-----|---------------|
| [`product/user-stories-and-jtbd.md`](product/user-stories-and-jtbd.md) | JTBD + 3 user stories with acceptance criteria |
| [`product/gherkin-tests.md`](product/gherkin-tests.md) | 7 acceptance scenarios in Given/When/Then |
| [`product/manual-tests.md`](product/manual-tests.md) | 6 human-run test cases + smoke checklist |
| [`product/ux-accessibility.md`](product/ux-accessibility.md) | UX flows + WCAG 2.1 AA requirements |
| [`tech/technical-spec.md`](tech/technical-spec.md) | Technical overview + architecture |
| [`tech/data-model.md`](tech/data-model.md) | prd_versions table, indexes, RLS |
| [`tech/api.md`](tech/api.md) | createVersion helper, GET versions endpoint, UI components |
| [`tech/release-plan.md`](tech/release-plan.md) | Branch, commit sequence, checklist |
| [`tech/test-plan.md`](tech/test-plan.md) | Unit / integration / E2E test mapping |

## Current state / next step

No implementation. The `prd_versions` table does not exist yet. This feature depends on `prd-live-builder` (which creates the PRDs and blocks being versioned) and `block-refinement` (which triggers version creation on refine). Next step: design the `prd_versions` migration and the version snapshot strategy (full content snapshot per version).
