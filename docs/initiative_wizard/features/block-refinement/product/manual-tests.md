# Manual Test Cases -- Block Refinement

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27
**Environment:** localhost:3000 / staging.enhanced.pm

---

## Test cases

### MT-BR-1 -- Refine button appears on hover

- **Traces to:** Gherkin SC-BR-1 · US-BR-1
- **Priority:** MUST
- **Pre-conditions:** A wizard session with at least 2-3 generated PRD blocks visible in the right panel.
- **Steps:**
  1. Navigate to the wizard session.
  2. Move the cursor over a PRD block (e.g., "Target Audience").
  3. Observe whether a "Refine" button appears.
  4. Move the cursor away from the block.
  5. Move the cursor over a different block.
- **Expected result:**
  - A "Refine" button (icon or text) appears when hovering over a block.
  - The button disappears when the cursor leaves the block.
  - Each block shows its own "Refine" button on hover (not a single global button).
  - The button does not cause layout shifts or content jumping when it appears.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-BR-2 -- Complete refinement happy path

- **Traces to:** Gherkin SC-BR-2 · US-BR-1
- **Priority:** MUST
- **Pre-conditions:** A wizard session with a PRD containing at least 3 blocks. Note the current content of one block (e.g., "Problems").
- **Steps:**
  1. Hover over the "Problems" block.
  2. Click the "Refine" button.
  3. In the popover textarea, type: "ajoute un probleme lie au cout des outils existants".
  4. Click the submit button in the popover.
  5. Observe the block content during and after generation.
  6. Check the conversation panel.
  7. Verify other blocks did not change.
- **Expected result:**
  - The popover opens anchored to the block, with a textarea and submit button.
  - After submission, a loading indicator appears on the block.
  - The block content updates (streaming or after completion) to include the new problem about cost.
  - The popover closes automatically after completion.
  - The conversation panel shows the refinement instruction and the AI's response.
  - All other blocks remain exactly as they were before the refinement.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-BR-3 -- Streaming update during refinement

- **Traces to:** Gherkin SC-BR-3 · US-BR-2
- **Priority:** MUST
- **Pre-conditions:** A wizard session with PRD blocks. Optionally throttle network slightly to observe streaming more clearly.
- **Steps:**
  1. Trigger a refinement on any block with the instruction: "developpe cette section avec plus de detail et des exemples concrets".
  2. Observe the block during AI generation.
- **Expected result:**
  - The block content appears progressively (not all at once after a long wait).
  - A loading indicator (pulsing border, shimmer, spinner) is visible during generation.
  - The indicator disappears when generation finishes.
  - If the new content is longer than the original, the block expands smoothly (no sudden layout jump).
  - The PRD panel is scrollable during the update.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-BR-4 -- Shorten instruction

- **Traces to:** Gherkin SC-BR-4 · US-BR-3
- **Priority:** MUST
- **Pre-conditions:** A wizard session with a verbose PRD block (> 150 words). Note the word count.
- **Steps:**
  1. Refine the verbose block with the instruction: "raccourcis, garde uniquement les points essentiels".
  2. Wait for completion.
  3. Estimate the word count of the new version.
- **Expected result:**
  - The new block is noticeably shorter than the original.
  - Key information is preserved (not random content).
  - Evidence tags (`[Evidence]`, `[Assumption]`, `[To verify]`) are preserved where applicable.
  - Block structure (heading, list format) is maintained.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-BR-5 -- Network error during refinement

- **Traces to:** Gherkin SC-BR-6 · US-BR-4
- **Priority:** MUST
- **Pre-conditions:** A wizard session with PRD blocks. Browser DevTools open.
- **Steps:**
  1. Open the refine popover on a block and type an instruction.
  2. In DevTools > Network, enable "Offline" mode.
  3. Click the submit button.
  4. After the error appears, disable "Offline" mode.
  5. Observe the block and the popover.
- **Expected result:**
  - The block reverts to its original content (no partial or corrupted text).
  - An error message appears near the block or in the popover.
  - The error message includes a retry action ("Reessayer" or similar).
  - The popover stays open with the instruction text preserved.
  - The conversation panel shows an error entry.
  - Clicking "Reessayer" (with network restored) successfully completes the refinement.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-BR-6 -- Scope isolation: other blocks unchanged

- **Traces to:** Gherkin SC-BR-8 · US-BR-1
- **Priority:** MUST
- **Pre-conditions:** A wizard session with 4+ PRD blocks. Screenshot or note the exact content of all blocks.
- **Steps:**
  1. Refine one block (e.g., "Solution") with any instruction.
  2. After completion, compare all other blocks to the pre-refinement state.
- **Expected result:**
  - The refined block has new content.
  - Every other block is byte-for-byte identical to its pre-refinement content.
  - No blocks were reordered, duplicated, or removed.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-BR-7 -- Rapid successive refinements

- **Traces to:** Gherkin SC-BR-7 · US-BR-4
- **Priority:** COULD
- **Pre-conditions:** A wizard session with PRD blocks.
- **Steps:**
  1. Refine a block with instruction A ("raccourcis").
  2. As soon as it completes, immediately refine the same block again with instruction B ("ajoute des metriques").
  3. Observe the block content and conversation panel.
- **Expected result:**
  - Both refinements process in sequence without errors.
  - The final block content reflects instruction B applied to the result of instruction A.
  - No content corruption, duplication, or blank state.
  - The conversation panel shows both refinement exchanges in chronological order.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

## Pre-release smoke checklist

- [ ] MT-BR-1 (hover) refine button appears/disappears on hover for each block
- [ ] MT-BR-2 (happy path) complete refinement flow works end to end
- [ ] MT-BR-3 (streaming) block updates progressively during generation
- [ ] MT-BR-5 (network error) graceful error handling, block reverts, retry works
- [ ] MT-BR-6 (scope isolation) only the targeted block changes
- [ ] No console errors during refinement flow
- [ ] Popover positions correctly and does not overflow viewport
- [ ] Accessibility: popover is keyboard-accessible, textarea has a label, submit button is focusable
- [ ] Evidence tags are preserved after refinement
