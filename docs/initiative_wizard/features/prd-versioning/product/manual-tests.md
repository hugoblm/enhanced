# Manual Tests — PRD Versioning

> Human-run test cases for the PRD Versioning feature. Each test case is designed to be
> executed by a QA tester or developer before release. These complement the automated
> Gherkin scenarios and focus on aspects that require human judgment (UI clarity, timing,
> performance perception).

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Test cases

### MT-PV-1 -- Version auto-created on block generation

- **Traces to:** US-PV-1, SC-PV-01
- **Priority:** `MUST` (blocking for this COULD feature)
- **Pre-conditions:**
  - Authenticated user in an active wizard session
  - PRD panel visible, no blocks generated yet
- **Steps:**
  1. Progress through the step 1 conversation until the AI generates the first PRD block
  2. Open Supabase dashboard or query the DB directly
  3. Check the `prd_versions` table for rows matching this PRD's ID
  4. Verify a version entry exists with `version_number = 1`, `trigger = 'generation'`, and `content_snapshot` matching the block content
  5. Continue the conversation until a second block is generated
  6. Verify a second version entry exists with `version_number = 2` and the correct content
- **Expected result:**
  - Each block generation creates exactly one version entry
  - Version numbers increment sequentially
  - Content snapshots match the actual block content
  - No manual action was required from the PM
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-PV-2 -- Version auto-created on block refinement

- **Traces to:** US-PV-1, SC-PV-02
- **Priority:** `MUST` (blocking for this COULD feature)
- **Pre-conditions:**
  - Authenticated user with at least 2 PRD blocks generated
  - Note the current highest version number
- **Steps:**
  1. Hover over a PRD block and click "Refine"
  2. Enter a refinement instruction (e.g., "Rendre cette section plus concise")
  3. Wait for the AI to regenerate the block
  4. Check `prd_versions` for a new entry
  5. Verify the new entry has `trigger = 'refinement'`, the correct `block_id`, and `content_snapshot` matching the new refined content
  6. Verify the `version_number` is one higher than the previous version
- **Expected result:**
  - Refinement creates a version entry with the refined content, not the old content
  - Trigger type is correctly set to "refinement"
  - Version number continues the sequence
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-PV-3 -- Version history panel UI

- **Traces to:** US-PV-2, SC-PV-03, SC-PV-04
- **Priority:** `MUST` (blocking for this COULD feature)
- **Pre-conditions:**
  - Authenticated user with a PRD that has at least 5 versions (mix of generations and refinements)
- **Steps:**
  1. Locate the "Version history" button in the PRD panel header
  2. Click it and verify a version history panel opens (side panel or modal)
  3. Count the version entries -- should match the total in the DB
  4. Verify entries are ordered newest first
  5. For each entry, check that it shows: version number, trigger type ("Generation" or "Refinement"), block name (if applicable), relative timestamp
  6. Verify the most recent version is labeled "Version actuelle" or visually highlighted
  7. Assess the overall UI clarity: can a PM quickly understand the iteration history at a glance?
- **Expected result:**
  - Panel opens quickly (< 500ms)
  - All versions displayed in correct order
  - Labels and timestamps are clear and localized in French
  - The UI does not feel cluttered even with 5+ entries
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-PV-4 -- Viewing a past version

- **Traces to:** US-PV-3, SC-PV-05, SC-PV-06
- **Priority:** `MUST` (blocking for this COULD feature)
- **Pre-conditions:**
  - Version history panel open with at least 3 versions
  - Know the content of version 1 (from initial generation)
- **Steps:**
  1. Click on version 1 in the history list
  2. Verify the content snapshot is displayed in a read-only view
  3. Verify a banner or label indicates this is a historical version (e.g., "Version 1 -- lecture seule")
  4. Verify no "Refine" button appears on the historical content
  5. Verify evidence tags are rendered correctly in the historical view
  6. Verify markdown formatting is preserved
  7. Click "Retour a la version actuelle" (or close button)
  8. Verify the PRD panel returns to showing the current version
- **Expected result:**
  - Historical content displays correctly, read-only
  - Clear visual distinction between historical and current view
  - Easy to return to current version
  - No accidental edits possible on historical content
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-PV-5 -- Empty state in version history

- **Traces to:** US-PV-2, SC-PV-04b
- **Priority:** `COULD`
- **Pre-conditions:**
  - Authenticated user with a newly created PRD and no blocks generated yet
- **Steps:**
  1. Open the version history panel
  2. Verify an empty state message is displayed (e.g., "Aucune version pour le moment")
  3. Generate a first block via the conversation
  4. Reopen (or refresh) the version history panel
  5. Verify version 1 now appears in the list
- **Expected result:**
  - Empty state is clear and not confusing (not a blank panel)
  - First version appears after block generation
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-PV-6 -- Performance with many versions

- **Traces to:** US-PV-2, SC-PV-03
- **Priority:** `COULD`
- **Pre-conditions:**
  - Seed a PRD with 30+ version entries (via DB or by doing many refinements)
- **Steps:**
  1. Open the version history panel
  2. Measure the time to display the full list (should be < 1 second)
  3. Scroll through the list -- verify scrolling is smooth
  4. Click on version 1 (oldest) and verify it loads without noticeable delay
  5. Click on version 30 (newest) and verify same
- **Expected result:**
  - Version history loads and scrolls smoothly with 30+ entries
  - Individual version content loads quickly
  - No pagination is needed for 30 entries (but if the list is very long, pagination or virtual scrolling may be needed in a future version)
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

---

## Pre-release smoke checklist

Run these before every deploy that touches versioning:

- [ ] **SM-PV-1:** Block generation creates a version entry in `prd_versions` (MT-PV-1, abbreviated)
- [ ] **SM-PV-2:** Block refinement creates a version entry with trigger "refinement" (MT-PV-2, abbreviated)
- [ ] **SM-PV-3:** Version history panel opens and shows entries in correct order (MT-PV-3, abbreviated)
- [ ] **SM-PV-4:** Clicking a past version shows its content read-only (MT-PV-4, abbreviated)
- [ ] **SM-PV-5:** Returning to current version from historical view works (MT-PV-4, step 7-8)
