# Manual Tests -- PRD Live Builder

> Human-run test cases for QA and pre-release verification. Each case traces to a Gherkin
> scenario and user story. Designed to be run by a non-developer with access to the
> staging environment.

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

## Test environment

- **URL:** staging.enhanced.pm (or localhost:3000 for local testing)
- **Browser:** Chrome latest (primary), Firefox latest (secondary)
- **Pre-condition for all tests:** An active wizard session exists with at least step 1 in progress (to trigger update_prd calls)

---

## Test cases

### MT-PLB-1 -- First block appears in real time

- **Traces to:** SC-PLB-1, US-PLB-1
- **Priority:** MUST
- **Pre-conditions:** New wizard session, step 1 in progress, no filled blocks yet
- **Steps:**
  1. Observe the PRD panel: verify 12 placeholder cards are visible
  2. Converse with the AI through step 1 until the AI reformulates the first use case
  3. After the PM confirms the reformulation, observe the PRD panel
  4. Verify the first_use_case block appears (replacing the placeholder)
  5. Verify the appearance is animated (fade-in, brief highlight)
  6. Verify the content is formatted markdown (not raw text)
  7. Verify the block appears within a noticeable instant (< 1 second) of the AI's update_prd call
- **Expected result:** Block appears in real time, animated, formatted, replacing the placeholder.
- **Result:** ________

---

### MT-PLB-2 -- Block update animation

- **Traces to:** SC-PLB-2, US-PLB-1
- **Priority:** MUST
- **Pre-conditions:** A block (e.g., first_use_case) already exists in the PRD. The block refinement feature is available, OR the AI updates the block during later conversation.
- **Steps:**
  1. Note the current content of the first_use_case block
  2. Trigger a block update (either via refinement or by the AI updating it during step 4)
  3. Observe the transition: verify the old content fades out and new content fades in
  4. Verify the block briefly highlights to indicate it changed
  5. Verify no duplicate block appears (the update is in place)
  6. Verify the block maintains its position in the sort order
- **Expected result:** Smooth content transition. Highlight draws attention. No duplicates. Position preserved.
- **Result:** ________

---

### MT-PLB-3 -- Evidence tags display

- **Traces to:** SC-PLB-4, SC-PLB-5, US-PLB-2
- **Priority:** MUST
- **Pre-conditions:** Session at step 2 or later where evidence tagging is active
- **Steps:**
  1. During the conversation, provide a mix of claims:
     - Evidence: "We surveyed 50 users, 38 said this is their top pain point"
     - Assumption: "I think enterprise users would also want this"
     - To verify: "We haven't checked if competitors offer something similar"
  2. After the AI writes the data_signals block, observe the PRD panel
  3. Verify [Evidence] appears as a green badge
  4. Verify [Assumption] appears as an amber/yellow badge
  5. Verify [To verify] appears as a red badge
  6. Verify each badge shows the text label (not just a colored dot)
  7. Verify the badges are inline with the text (not in a separate area)
  8. Verify the badges are readable (not tiny or truncated)
- **Expected result:** Three badge colors correctly applied. Text labels visible. Inline placement. Readable size.
- **Result:** ________

---

### MT-PLB-4 -- Empty states at session start

- **Traces to:** SC-PLB-7, US-PLB-3
- **Priority:** MUST
- **Pre-conditions:** Brand new wizard session (no blocks filled yet)
- **Steps:**
  1. Immediately after entering the wizard, observe the PRD panel
  2. Count the placeholder blocks -- verify there are 12
  3. Verify each placeholder shows a section title (e.g., "First Use Case", "Problem Context")
  4. Verify each placeholder shows text indicating when it will be filled (e.g., "This section will be filled during step 1")
  5. Verify placeholders are visually muted (lower opacity, dimmed text)
  6. Verify placeholders are compact (collapsed, not taking up full block height)
  7. Scroll through the entire PRD panel -- verify all 12 are present
- **Expected result:** 12 compact, muted placeholders with section titles and step indicators. All visible by scrolling.
- **Result:** ________

---

### MT-PLB-5 -- Sort order is maintained

- **Traces to:** SC-PLB-6, US-PLB-3
- **Priority:** MUST
- **Pre-conditions:** Session with at least 3-4 filled blocks
- **Steps:**
  1. Complete enough conversation to generate several blocks (e.g., first_use_case, problem_context, data_signals)
  2. Verify the blocks appear in the PRD panel in the correct order:
     first_use_case -> problem_context -> data_signals
  3. Verify empty placeholders are visible between and around the filled blocks
  4. Verify no block is out of order
  5. Continue the conversation through step 3 -- verify risk blocks appear in order:
     risk_value -> risk_usability -> risk_feasibility -> risk_viability -> confidence_score
- **Expected result:** Blocks always appear in the fixed PRD structure order, regardless of creation timing.
- **Result:** ________

---

### MT-PLB-6 -- Complete PRD after step 4

- **Traces to:** SC-PLB-8, SC-PLB-9, US-PLB-4
- **Priority:** MUST
- **Pre-conditions:** Complete all 4 wizard steps
- **Steps:**
  1. After step 4 completion, observe the PRD panel
  2. Count filled blocks -- verify all 12 are present (no placeholders remain)
  3. Verify the sort order is correct (all 12 in sequence)
  4. Verify the PRD header shows:
     - A title (derived from the idea or conversation)
     - A confidence score (e.g., 3.5/5) with a colored badge
     - A recommendation: "Build", "Test first", or "Abandon"
     - An "Export PDF" button
     - A "Share" button
  5. Verify the PRD is self-contained and readable by scrolling only the PRD panel
  6. Verify evidence tags are visible on blocks where applicable
  7. Verify the overall visual quality: formatting, spacing, typography look professional
- **Expected result:** Complete, polished PRD with all 12 blocks, metadata in the header, and export/share buttons.
- **Result:** ________

---

### MT-PLB-7 -- Confidence score display

- **Traces to:** SC-PLB-10, SC-PLB-11, US-PLB-5
- **Priority:** MUST
- **Pre-conditions:** Session at step 2 (before risk assessment) then step 3 (during/after)
- **Steps:**
  1. At step 2, observe the PRD header -- verify confidence score area shows: "Confidence score will appear after risk assessment"
  2. Progress to step 3 and complete the risk assessment (all 4 risk scale cards)
  3. Observe the PRD header after the AI writes the confidence_score block
  4. Verify a numeric score appears (e.g., 3.8/5)
  5. Verify the badge color matches the score:
     - Green: score >= 4.0
     - Amber: score >= 3.0 and < 4.0
     - Red: score < 3.0
  6. Verify the recommendation text is displayed next to the score
  7. If the score is red (< 3.0), verify the recommendation is "Abandon" or "Test first"
- **Expected result:** Empty state before step 3. Score appears after risk assessment with correct color and recommendation.
- **Result:** ________

---

### MT-PLB-8 -- Markdown rendering quality

- **Traces to:** SC-PLB-12
- **Priority:** MUST
- **Pre-conditions:** Session with at least 3 filled blocks
- **Steps:**
  1. Examine each filled block in the PRD panel
  2. Verify headings render with appropriate sizing and weight
  3. Verify bold and italic text render correctly
  4. Verify bullet lists render with proper indentation
  5. Verify blockquotes render with visual distinction (border or background)
  6. Verify evidence tags within markdown render as badges (not raw text)
  7. Verify no raw markdown syntax is visible (no `**` or `##` in the output)
  8. Verify the layout does not overflow or break with long content
- **Expected result:** Clean markdown rendering. No raw syntax visible. Evidence tags render as badges within markdown content.
- **Result:** ________

---

### MT-PLB-9 -- PRD panel state persistence

- **Traces to:** SC-PLB-14
- **Priority:** MUST
- **Pre-conditions:** Session with 5+ filled blocks and a confidence score
- **Steps:**
  1. Note the current state: number of filled blocks, their content, evidence tags, confidence score
  2. Reload the page (F5 or Cmd+R)
  3. Verify all filled blocks are restored
  4. Verify block content is intact (compare with pre-reload state)
  5. Verify evidence tags are preserved
  6. Verify the sort order is maintained
  7. Verify empty placeholders are restored for unfilled blocks
  8. Verify the confidence score is restored in the header
  9. Close the browser and re-open the session URL -- verify full restoration
- **Expected result:** Complete state restoration. All blocks, tags, sort order, and confidence score preserved.
- **Result:** ________

---

## Pre-release smoke checklist

Before any release that touches the PRD live builder:

- [ ] **MT-PLB-1:** A new block appears in real time when the AI calls update_prd
- [ ] **MT-PLB-3:** Evidence tags render with correct colors and text labels
- [ ] **MT-PLB-4:** Empty states show 12 placeholders at session start
- [ ] **MT-PLB-5:** Blocks maintain the correct sort order
- [ ] **MT-PLB-6:** All 12 blocks are filled after completing all 4 steps
- [ ] **MT-PLB-7:** Confidence score appears correctly after step 3
- [ ] **MT-PLB-8:** Markdown renders without raw syntax or broken layout
- [ ] **MT-PLB-9:** Page reload preserves all PRD state
