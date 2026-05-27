# Initiatives & Features — The Rules

This is the **contract** for how product work is documented. An agent must follow it.

A PRD almost never describes a single small feature — it scopes a coherent body of work that
addresses a validated need, then **breaks it down into features**. So our documentation has three
levels, matching reality:

```
INITIATIVE            FEATURE                       STORY
(the PRD lives here)  (a shippable capability)      (an increment)
need → features       its own delivery docs         a list inside user-stories-and-jtbd.md
docs/initiative/<x>/  docs/initiative/<x>/features/<y>/   (not a folder)
```

| Level | Answers | Where |
|-------|---------|-------|
| **Discovery** | Should we solve this need? | `docs/discovery/<need>.md` (separate stage) |
| **Initiative** | What's the scope, and how does the need break into features? | `docs/initiative/<name>/` |
| **Feature** | What exactly do we build & ship for this capability? | `…/features/<feature-name>/` |
| **Story** | The next increment of a feature | an item in `product/user-stories-and-jtbd.md` |

> **Why stories are not folders.** A folder per story would add a deep level of nesting for almost
> no gain — stories churn fast and are cheap as list items. We stop the hierarchy at *feature*. One
> useful level (initiative), no useless level (story-folders).

---

## When does an initiative get created?

Only **after** a Discovery reaches a **Go** (see `docs/discovery/README.md`). No Go, no initiative.

```
discovery (Go)  ──►  create docs/initiative/<name>/  ──►  PRD decomposes need into features  ──►  create features/<y>/
```

## How to create one

1. Copy the skeleton: `docs/template/_initiative/` → `docs/initiative/<initiative-name>/`
   (kebab-case, e.g. `self-serve-data-access`).
2. Link the validated discovery in the initiative `README.md` and at the top of `prd.md` (the PRD
   gate requires it).
3. Write the PRD. Its **Feature breakdown** section translates the need into named, prioritized
   features — this is the bridge from "the need" to "what we build".
4. For each feature in that breakdown, create a folder: copy `_initiative/features/_feature/` to
   `features/<feature-name>/` and fill its delivery docs.
5. Keep the feature index in the initiative `README.md` up to date.

---

## Mandatory structure

```
docs/initiative/<initiative-name>/
├── README.md                          # Initiative overview + status + discovery link + FEATURE INDEX
├── executive-summary.md               # Stakeholder TL;DR of the whole initiative
├── prd.md                             # PRD: need + DECOMPOSITION into features (the bridge)
└── features/
    └── <feature-name>/
        ├── README.md                  # 1-screen feature overview + status + doc index
        ├── product/
        │   ├── user-stories-and-jtbd.md   # Stories (the "story" level) + Jobs To Be Done
        │   ├── gherkin-tests.md           # Acceptance criteria as Given/When/Then scenarios
        │   ├── manual-tests.md            # Manual/QA test cases (non-dev runnable), from the Gherkin
        │   └── ux-accessibility.md        # UX flows + accessibility (a11y) requirements
        └── tech/
            ├── technical-spec.md          # Technical OVERVIEW + index to the split sub-specs
            ├── <data-model|api|security|…>.md  # Detailed specs, one concern per file (as needed)
            ├── release-plan.md            # Atomic commits, branching, release sequencing, rollback
            └── test-plan.md               # Automated tests (unit + non-regression) mapped to Gherkin
```

Folders and files are the **minimum** — add more (diagrams, research notes, an `assets/` folder),
never fewer. The `tech/` sub-specs (`data-model.md`, `api.md`, …) are created on demand.

---

## What each file is for

### Initiative level
| File | Answers | Source template |
|------|---------|-----------------|
| `README.md` | What is this initiative, where does it stand, what features does it contain? | `_initiative/README.md` |
| `executive-summary.md` | The non-technical TL;DR a stakeholder reads in 2 minutes. | `_initiative/executive-summary.md` |
| `prd.md` | The product spec: need, audience, **feature breakdown**, success metrics, MVP. | `docs/template/prd.md` |

### Feature level
| File | Answers | Source template |
|------|---------|-----------------|
| `README.md` | What is this feature, in one screen? Where do I find each doc? | `features/_feature/README.md` |
| `product/user-stories-and-jtbd.md` | Who needs what and why, as stories + jobs (the story level). | `docs/template/user-stories.md` |
| `product/gherkin-tests.md` | How we'll know it works — acceptance scenarios in Given/When/Then. | `features/_feature/product/gherkin-tests.md` |
| `product/manual-tests.md` | Human-run test cases for non-dev/QA, derived from the Gherkin + stories. | `features/_feature/product/manual-tests.md` |
| `product/ux-accessibility.md` | The user flows and the accessibility bar to clear. | `features/_feature/product/ux-accessibility.md` |
| `tech/technical-spec.md` | Technical overview + index; points to the split sub-specs. | `features/_feature/tech/technical-spec.md` |
| `tech/<concern>.md` | A detailed spec for one concern (data model, API, security…). | created on demand |
| `tech/release-plan.md` | How it ships: atomic commits, branching, release sequence, rollback. | `features/_feature/tech/release-plan.md` |
| `tech/test-plan.md` | Automated test strategy (unit + non-regression), traced to the Gherkin. | `features/_feature/tech/test-plan.md` |

> The PRD lives **once**, at the initiative level — never per feature. This removes the redundancy
> of a PRD per feature and keeps the need → features translation in one place.

---

## Specs, delivery & testing rules

Mandatory for every feature — they keep the build clean and safe:

- **Split specs into logical files.** `tech/technical-spec.md` is an *overview + index*. Detailed
  specs go in separate files, one concern per file (`data-model.md`, `api.md`, `security.md`, …).
  Never one monolithic spec document.
- **Document the delivery as clean, atomic work.** `tech/release-plan.md` lays out the work as
  **atomic commits** (one logical change per commit, each building green), a branching/PR strategy,
  a **release plan**, and a rollback path. Clean separation is a requirement, not a preference.
- **Unit + non-regression tests are mandatory.** Documented in `tech/test-plan.md`. Acceptance/e2e
  tests must **cover the Gherkin scenarios** from `product/gherkin-tests.md` — every `MUST`
  scenario maps to at least one automated test (traceability matrix).
- **Manual tests are documented too.** `product/manual-tests.md` holds human-runnable cases derived
  from the Gherkin and user stories, plus a pre-release smoke checklist.

---

## Status conventions

- **Initiative `README.md`:** `Discovery` → `Specced` → `In progress` → `Shipped` (or `On hold`).
- **Feature `README.md`:** `Planned` → `In progress` → `Shipped`.
- Keep them honest — a stale status leads to duplicated or wrong work.

---

## Rules for AI agents

- **Read before you write.** Read the initiative `README.md`, then the PRD, then the specific
  feature doc you need.
- **Respect the levels.** Need-level reasoning goes in the discovery/PRD; build detail goes in the
  feature. Don't put feature minutiae in the PRD or strategy in a tech spec.
- **Don't invent the need.** If the PRD/discovery doesn't justify a requirement with evidence, flag
  it — don't fabricate a rationale.
- **Keep docs and code honest.** If you change behavior, update the matching feature doc *and* the
  relevant `.ai-context/` file in the same change.
- **One feature, one folder.** Don't scatter a feature's docs across multiple places.
