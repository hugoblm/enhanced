# User Stories & JTBD — PRD Versioning

> Captures **who** needs **what** and **why**. Pairs with the PRD. Stories drive the Gherkin
> acceptance tests (`gherkin-tests.md`) -- each story maps to at least one scenario.

**Evidence discipline:** tag the rationale of a story `[Evidence]` / `[Assumption]` / `[To verify]`.
A story with no evidence and no link to a verified problem is a candidate for cutting.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Jobs To Be Done (JTBD)

The underlying jobs users are "hiring" this feature to do. Job statements are solution-agnostic.

- **Main job:** When I'm iterating on a PRD through multiple refinements, I want to see what my PRD looked like at earlier points, so I can track how my thinking evolved and feel confident that refinements are improving the document rather than degrading it.

- **Related jobs:**
  - When I've refined a block and the new version feels worse, I want to see the previous version's content, so I can judge whether to refine again or accept the current state.
  - When my team asks "what changed since last time?", I want to point to a version history, so I can show the progression without relying on memory.

---

## Personas (quick reference)

- **Builder PM** -- PM at startup/scale-up, ships fast, tech-savvy, time-constrained. Creates and iterates on PRDs. PRODUCER.
- **Stakeholder** -- CPO/CEO/lead who reviews PRDs. May browse version history to understand iteration. CONSUMER.

---

## User stories

### US-PV-1 -- Auto-versioning on generation and refinement

- **Story:** As a **Builder PM**, I want each PRD generation and block refinement to automatically create a version entry, so that I have a complete iteration history without any manual save action.
- **Priority:** `COULD`
- **Why (rationale):** Manual versioning adds friction and is easily forgotten. Auto-versioning ensures every change is captured, creating a reliable audit trail. `[Assumption]` -- PMs value having a version history. This is inferred from general software expectations (Google Docs, Notion, and Figma all offer version history) but not validated for Enhanced specifically. The weak trace to Discovery Problem 5 (evidence tagging audit trail) makes this a COULD, not a MUST.
- **Acceptance criteria:**
  - [ ] When the conversation engine calls `update_prd` to generate a new PRD block, a version entry is created in `prd_versions`
  - [ ] When the PM triggers a block refinement and the refined block is saved, a version entry is created in `prd_versions`
  - [ ] Each version entry stores: `prd_id`, `block_id` (nullable -- null for full-PRD snapshots), `version_number` (auto-incremented per PRD), `content_snapshot` (full block content at that point), `trigger` ("generation" or "refinement"), `created_at` timestamp
  - [ ] Version numbers increment sequentially per PRD (v1, v2, v3...), regardless of trigger type
  - [ ] No manual action is required from the PM to create a version
- **Maps to Gherkin:** `gherkin-tests.md` --> SC-PV-01, SC-PV-02

### US-PV-2 -- Consult version history

- **Story:** As a **Builder PM**, I want to open a version history list for my PRD showing all versions with timestamps and trigger types, so I can see at a glance how many iterations I've made and when.
- **Priority:** `COULD`
- **Why (rationale):** A version list provides context for the PM's iteration journey. Seeing "v1 (generation), v2 (refinement), v3 (refinement)" tells them how much the document evolved. `[Assumption]` -- PMs will actually consult this. In fast-paced environments, many users never look at version history. This assumption should be validated by tracking usage of the version history panel via PostHog.
- **Acceptance criteria:**
  - [ ] A "Version history" button or icon is visible in the PRD panel header
  - [ ] Clicking the button opens a version history panel (side panel or modal)
  - [ ] The panel displays a list of all versions for the current PRD, newest first
  - [ ] Each list item shows: version number, trigger type ("Generation" or "Refinement"), timestamp (relative: "il y a 5 min", or absolute if older than 24h), and block name if the version is block-specific
  - [ ] The list loads without noticeable delay for PRDs with up to 50 versions `[To verify]`
  - [ ] The current version is highlighted or labeled "Version actuelle"
- **Maps to Gherkin:** `gherkin-tests.md` --> SC-PV-03, SC-PV-04

### US-PV-3 -- View past version content

- **Story:** As a **Builder PM**, I want to click on a past version in the history list and see the block content at that point in time, so I can compare it mentally with the current version and assess whether refinements improved the PRD.
- **Priority:** `COULD`
- **Why (rationale):** Without the ability to view past content, the version list is just a log of timestamps -- it tells you *that* something changed but not *what*. Viewing past content is the minimum useful interaction with version history. `[Assumption]` -- viewing without restore is sufficient for V1. If PMs frequently want to revert, a restore feature will be needed (V2).
- **Acceptance criteria:**
  - [ ] Clicking a version in the history list displays the content snapshot for that version
  - [ ] The content is displayed read-only -- no editing, no "Refine" button on the historical view
  - [ ] The view clearly indicates it is a historical snapshot (e.g., banner: "Version 3 -- il y a 2 heures (lecture seule)")
  - [ ] The PM can close the historical view and return to the current PRD version
  - [ ] Evidence tags (`[Evidence]`, `[Assumption]`, `[To verify]`) are rendered in the historical view just as they are in the current version
  - [ ] Markdown formatting is preserved in the historical view
- **Maps to Gherkin:** `gherkin-tests.md` --> SC-PV-05, SC-PV-06

---

## Out of scope (non-stories)

Things users might expect that we are deliberately **not** doing in this feature, and why.

- **Diff view (side-by-side or inline):** Adds significant UI complexity. In V1, the PM can visually compare by switching between current and historical views. A proper diff view is a V2 candidate if version history usage is validated. `[Assumption]`
- **Restore / rollback:** Rolling back a block to a previous version requires re-integrating old content into the current PRD state, which may conflict with other blocks that were refined in the meantime. Too complex for V1. `[Assumption]`
- **Manual version naming:** "Save as v2.1" or naming versions ("after stakeholder feedback"). Nice to have but adds UI and DB complexity with unclear value. `[Assumption]`
- **Version branching:** Creating alternative PRD branches from a past version. Enterprise-grade feature, not V1. `[Assumption]`
- **Full-PRD snapshots on every change:** V1 versions are per-block (or per-generation event), not full-document snapshots. This keeps storage manageable. If full-PRD snapshots are needed, they can be assembled from the block-level versions. `[Assumption]`

> **Challenge:** Does every `COULD` story trace to a verified problem in the PRD/Discovery? Does
> every story have at least one acceptance criterion that a test could check? If not, fix it
> before it reaches engineering.
>
> Traceability check:
> - US-PV-1 (auto-versioning) --> PRD section 5 prd-versioning requirements. Traces weakly to Discovery Problem 5 (evidence tagging audit trail). The trace is honest but weak -- hence COULD.
> - US-PV-2 (consult history) --> PRD requirement "version history list accessible from PRD panel." Same weak trace.
> - US-PV-3 (view past content) --> PRD requirement "read-only consultation of any previous version." Same weak trace.
>
> All stories have testable acceptance criteria. The honest assessment: this feature is a quality-of-life addition, not a problem-solver. Its value is real but secondary. If timeline pressure forces a cut, this entire feature can be dropped without impacting the core product value.
