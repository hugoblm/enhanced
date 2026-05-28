# Manual Test Cases -- Wizard Shell

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27
**Environment:** localhost:3000 / staging.enhanced.pm

---

## Test cases

### MT-WS-1 -- Split-view renders on desktop

- **Traces to:** Gherkin SC-WS-1 · US-WS-1
- **Priority:** MUST
- **Pre-conditions:** A valid wizard session exists. Viewport >= 1024px.
- **Steps:**
  1. Navigate to `/session/{session_id}` on a desktop viewport (>= 1024px).
  2. Observe the layout.
  3. Use DevTools to inspect panel widths (select each panel, check computed width).
- **Expected result:**
  - Two panels are visible side by side.
  - The left panel (conversation) occupies roughly 45% of viewport width (tolerance: 40-50%).
  - The right panel (PRD) occupies roughly 55% of viewport width (tolerance: 50-60%).
  - Both panels fill the viewport height minus the header/step indicator.
  - No horizontal scrollbar appears.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-WS-2 -- Step indicator displays and highlights correctly

- **Traces to:** Gherkin SC-WS-2 · US-WS-2
- **Priority:** MUST
- **Pre-conditions:** A new wizard session (step 1 active).
- **Steps:**
  1. Navigate to `/session/{session_id}`.
  2. Observe the step indicator at the top of the page.
  3. Check that 4 steps are visible with labels.
  4. Verify step 1 is highlighted and steps 2-4 are dimmed.
- **Expected result:**
  - Four steps visible: "1 Cadrage", "2 Donnees", "3 Risques", "4 PRD".
  - Step 1 has a distinct visual state (highlighted color, bold, active indicator).
  - Steps 2-4 are visually dimmed or grayed out.
  - The step indicator is compact (< 60px total height).
  - The labels are readable and not truncated.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-WS-3 -- Step progression updates indicator

- **Traces to:** Gherkin SC-WS-3 · US-WS-2
- **Priority:** MUST
- **Pre-conditions:** A wizard session at step 1, with the conversation engine active.
- **Steps:**
  1. Complete step 1 by answering all the AI's questions until the engine transitions to step 2.
  2. Observe the step indicator update.
- **Expected result:**
  - Step 1 transitions to a "completed" visual state (checkmark, filled indicator, or similar).
  - Step 2 becomes highlighted as the current step.
  - Steps 3-4 remain dimmed.
  - The transition is smooth (no flicker or layout shift).
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-WS-4 -- Backward navigation to a completed step

- **Traces to:** Gherkin SC-WS-4, SC-WS-5 · US-WS-3
- **Priority:** MUST
- **Pre-conditions:** A wizard session at step 3 with steps 1 and 2 completed.
- **Steps:**
  1. Observe the step indicator -- steps 1 and 2 should show completed state, step 3 highlighted.
  2. Click on step 1 in the indicator.
  3. Observe the conversation panel and PRD panel.
  4. Click on step 4 in the indicator.
- **Expected result:**
  - Clicking step 1: conversation panel switches to show step 1 messages. PRD panel still shows ALL accumulated blocks (not just step 1 blocks). Step indicator highlights step 1.
  - Clicking step 4: nothing happens. The cursor shows a "not-allowed" indicator when hovering step 4. The view remains on step 1.
  - No data is lost during navigation.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-WS-5 -- Independent panel scrolling

- **Traces to:** Gherkin SC-WS-6 · US-WS-4
- **Priority:** MUST
- **Pre-conditions:** A wizard session with enough content in both panels to overflow (many messages + several PRD blocks).
- **Steps:**
  1. Scroll the conversation panel down by several hundred pixels.
  2. Note the PRD panel's scroll position.
  3. Scroll the PRD panel down by several hundred pixels.
  4. Note the conversation panel's scroll position.
- **Expected result:**
  - Scrolling the conversation panel does NOT move the PRD panel.
  - Scrolling the PRD panel does NOT move the conversation panel.
  - Each panel has its own scrollbar or scroll indicator.
  - Scrolling is smooth in both panels.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-WS-6 -- Tablet responsive layout

- **Traces to:** Gherkin SC-WS-7, SC-WS-8 · US-WS-5
- **Priority:** MUST
- **Pre-conditions:** A wizard session with content. Browser DevTools device emulation or real tablet.
- **Steps:**
  1. Set viewport to 768px width.
  2. Navigate to `/session/{session_id}`.
  3. Observe the layout -- panels should NOT be side by side.
  4. If tabs are shown: tap each tab and observe the switch.
  5. If stacked: scroll to see both panels.
  6. Verify the step indicator is still visible and functional.
- **Expected result:**
  - Panels are not side by side (stacked or tabbed).
  - If tabbed: switching between tabs is instant (no page reload), active tab is clearly indicated.
  - If stacked: both panels are fully accessible by scrolling, with a visual separator.
  - Step indicator remains visible at the top and functions correctly.
  - All touch targets >= 44x44px.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-WS-7 -- Loading state on session entry

- **Traces to:** Gherkin SC-WS-9 · US-WS-1
- **Priority:** MUST
- **Pre-conditions:** None. Use browser throttling to simulate slow network.
- **Steps:**
  1. Enable "Slow 3G" throttling in DevTools > Network.
  2. Navigate to `/session/{session_id}`.
  3. Observe the loading state.
- **Expected result:**
  - The conversation panel shows a loading skeleton or spinner.
  - The PRD panel shows a loading skeleton or an empty state message.
  - The step indicator shows step 1 as default.
  - No blank white panels or layout shifts during loading.
  - Content appears once data arrives.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-WS-8 -- Invalid session ID

- **Traces to:** Gherkin SC-WS-10 · US-WS-1
- **Priority:** MUST
- **Pre-conditions:** None.
- **Steps:**
  1. Navigate to `/session/nonexistent-id-12345`.
  2. Observe the page.
- **Expected result:**
  - A "Session not found" message (or equivalent) is displayed.
  - A link or button to return to the landing page is visible.
  - No blank page, no broken layout, no unhandled error in the console.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

## Pre-release smoke checklist

- [ ] MT-WS-1 (split-view) renders correctly on desktop
- [ ] MT-WS-2 (step indicator) shows 4 labeled steps with correct initial state
- [ ] MT-WS-3 (step progression) updates indicator on step completion
- [ ] MT-WS-4 (backward navigation) works for completed steps, blocks future steps
- [ ] MT-WS-5 (independent scroll) both panels scroll independently
- [ ] MT-WS-6 (tablet) responsive layout works at 768px
- [ ] MT-WS-8 (invalid session) shows friendly error, not blank page
- [ ] No console errors on page load
- [ ] Wizard shell loads within 2 seconds on normal connection
- [ ] Accessibility: step indicator buttons are keyboard-navigable, panels have appropriate ARIA roles
