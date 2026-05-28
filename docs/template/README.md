# Templates

Reusable, copy-ready templates for product work. Don't edit a template in place when documenting
real work — **copy** it into `docs/discovery_{name}/` or `docs/initiative_{name}/` and fill the copy.

## What's here

| Template | Use it to… | Stage |
|----------|------------|-------|
| `discovery.md` | Qualify and challenge a need (FOCUSED). Ends in Go / No-Go / Pivot. | Discovery |
| `prd.md` | Spec an initiative: need, audience, **feature breakdown**, metrics, MVP. | Initiative (after a Go) |
| `user-stories.md` | Capture who needs what and why, as stories + JTBD. | Feature |
| `_initiative/` | The **whole initiative folder** skeleton (incl. `features/_feature/`) — copy to start one. | On a Go |
| `_initiative/architecture.md` | Cross-cutting technical architecture — source of truth for DB, API, AI, components, deployment. | Initiative |
| `_initiative/security-overview.md` | Consolidated security model — auth, RLS matrix, threats, GDPR, secrets. | Initiative |

## The flow

```
discovery.md  ──►  Go/No-Go  ──►  copy _initiative/ to docs/initiative_{name}/  ──►  PRD breaks need into features  ──►  copy features/_feature/ per feature
```

1. **Discovery first.** Copy `discovery.md` to `docs/discovery_{name}/<need>.md` and work it until you
   reach a decision. A No-Go is a win — it saved build time. (See `docs/template/discovery-rules.md`.)
2. **On a Go, create the initiative.** Copy the entire `_initiative/` directory to
   `docs/initiative_{name}/` (kebab-case). The structure inside is mandatory — see
   `docs/template/initiative-rules.md`.
3. **Write the PRD, then split into features.** The PRD opens with a gate (link the validated
   discovery), and its **Feature breakdown** section names the child features. For each one, copy
   `_initiative/features/_feature/` to `features/<feature-name>/` and fill its delivery docs
   (stories, Gherkin, manual tests, UX/a11y, tech spec, release/test plan).

## Conventions used across templates

- **Evidence tags:** `[Evidence]` (sourced) · `[Assumption]` (believed, testable) ·
  `[To verify]` (open question). Never present an assumption as a fact.
- **`> 🔍 Challenge` blocks:** prompts that force you (or the agent) to verify the need and resist
  scope creep. A section isn't done until its challenge is answered honestly.
- **Status line:** every doc carries a status so readers know how much to trust it.

> Why a top-level `prd.md` / `user-stories.md` *and* copies inside `_initiative/`? The top-level
> files are the **canonical** templates. Inside the skeleton, `_initiative/prd.md` and
> `features/_feature/product/user-stories-and-jtbd.md` are thin pointers back to them — one source
> of truth to maintain.
