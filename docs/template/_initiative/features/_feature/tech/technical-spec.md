# Technical Specification — \<Feature name\>

> **This is the technical overview + index.** It gives the approach and the architecture at a
> glance, then points to the detailed specs. **Detailed specs must be split into separate logical
> files** — one concern per file — never one monolithic document. This file stays short and stable;
> the detail lives in the sub-specs it links to.

**Status:** `Draft` · `In review` · `Approved` · **Author:** \<name\> · **Date:** \<date\>
**PRD:** \<link to the feature PRD\>  ·  **Relevant `.ai-context`:** \<link(s)\>

---

## Spec files (index)

Create a file per concern as the feature needs it. Don't pre-create empty ones; do split rather
than let this overview grow large.

| File | Concern | Required when |
|------|---------|---------------|
| `technical-spec.md` (this file) | Overview, approach, architecture at a glance | Always |
| `data-model.md` | Schema, entities, migrations, invariants | There's persisted data |
| `api.md` | Endpoints/interfaces, contracts, validation, errors | There's an API/interface |
| `security.md` | Authn/authz, data sensitivity, GDPR, secrets | There's sensitive data or access control |
| `<other>.md` | Any other distinct concern (perf, integration, infra) | As needed |
| [`release-plan.md`](release-plan.md) | Atomic commits, branching, release, rollback | Always |
| [`test-plan.md`](test-plan.md) | Automated tests (unit + non-regression) ↔ Gherkin | Always |

> Rule of thumb: if a section grows past a screen or two, or covers a distinct concern, move it
> into its own file and link it from the table above.

---

## 1. Summary & approach
\<A few sentences: what we're building technically and the overall approach. Name the one or two
decisions that shape everything else.\>

## 2. Architecture at a glance
- **Components touched / added:** \<…\>
- **Diagram:** \<sequence or component diagram, or a link\>
- **Where it lives:** \<modules / services / folders\>
- **Key decisions & trade-offs:** \<the choices that matter; what was rejected and why\>

## 3. Detailed specs
Summarize each concern in one line and link to its file. Put the real detail in the linked file.
- **Data model:** \<one-line summary\> → `data-model.md`
- **API / interfaces:** \<one-line summary\> → `api.md`
- **Security & privacy:** \<one-line summary\> → `security.md`
- **\<other concern\>:** \<…\> → `<file>.md`

## 4. Non-functional requirements
Capture the targets here if short; otherwise move to a dedicated file.
- **Performance:** \<latency / throughput / payload\>
- **Observability:** \<logs, metrics, events needed to measure the PRD's success criteria\>
- **Scalability / cost:** \<expected load and cost implications\>

## 5. Delivery & testing
- **How it ships:** see [`release-plan.md`](release-plan.md) (atomic commits, sequencing, rollback).
- **How it's tested:** see [`test-plan.md`](test-plan.md) (unit + non-regression, mapped to the
  Gherkin scenarios) and [`../product/manual-tests.md`](../product/manual-tests.md) (manual pass).

## 6. Open questions
- \<…\> `[To verify]`

> 🔍 **Challenge:** Does this spec cover every `MUST` in the PRD — and nothing that isn't in it?
> Is anything in here big enough that it should be its own file? Unspecced MUSTs become guesswork;
> specced extras are scope creep. Mark unresolved decisions `[To verify]` rather than implying
> certainty.
