# Release Plan — \<Feature name\>

> How this feature gets built and shipped **cleanly**: broken into atomic commits, sequenced into
> reviewable changes, released, and rolled back if needed. Clean separation here is what makes the
> work reviewable, bisectable, and safe to ship.

**Status:** `Draft` · `In review` · `Approved` · **Author:** \<name\> · **Date:** \<date\>
**PRD:** \<link\>  ·  **Technical spec:** [`technical-spec.md`](technical-spec.md)  ·  **Test plan:** [`test-plan.md`](test-plan.md)

---

## Branching
- Branch from `staging` (e.g. `feat/<feature-name>`). Never commit a new feature directly to
  `staging` or `main` (see `CLAUDE.md` → Git Workflow).
- Open a PR into `staging`; merge to `main` is a separate, deliberate release step.

## Atomic commits — the rule
**One logical change = one commit.** Each commit should build and pass tests on its own, so the
history is reviewable and bisectable.
- A commit does *one* thing (don't mix a refactor with a feature change).
- Message explains the **why**, not the what.
- Keep refactors/renames in their own commits, separate from behavior changes.

## Commit / PR breakdown
Plan the work as a sequence of atomic, separately-reviewable steps. Each should be shippable or at
least green on its own.

| # | Commit / PR | Scope (one logical change) | Tests added | Depends on |
|---|-------------|----------------------------|-------------|------------|
| 1 | \<title\> | \<…\> | \<unit / e2e\> | — |
| 2 | \<title\> | \<…\> | \<…\> | 1 |
| 3 | \<…\> | \<…\> | \<…\> | \<…\> |

## Release sequencing
Order matters when changes are interdependent (migrations, flags, contracts).
- **Feature flag:** \<flag name, default state, who flips it\>  ·  or "none"
- **Migrations:** \<order vs. code deploy; backwards-compatible? expand/contract?\>
- **Order of deploy:** \<which service/app first, why\>
- **Staging → production:** \<what's verified on staging before promoting\>

## Rollback
- **Trigger:** \<what signals we must roll back — error rate, the damage-control KPI from the PRD\>
- **How:** \<revert PR / flip flag off / down-migration — be specific and safe\>
- **Data safety:** \<can rollback lose data? how is that prevented?\>

## Definition of Done (merge checklist)
- [ ] All `MUST` features from the PRD implemented
- [ ] Unit + non-regression tests pass (see [`test-plan.md`](test-plan.md))
- [ ] Gherkin acceptance scenarios covered
- [ ] Manual smoke pass done (see [`../product/manual-tests.md`](../product/manual-tests.md))
- [ ] Feature docs updated (folder `README.md` status)
- [ ] Relevant `.ai-context/*.md` updated if behavior/invariants changed

> 🔍 **Challenge:** Could a reviewer understand each commit in isolation? If a single commit mixes
> a refactor, a migration, and a feature, split it. And: is there a real rollback path, or are we
> hoping nothing breaks?
