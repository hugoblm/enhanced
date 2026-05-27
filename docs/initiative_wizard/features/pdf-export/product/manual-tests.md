# Manual Tests — PDF Export

> Human-run test cases for the PDF Export feature. Each test case is designed to be
> executed by a QA tester or developer before release. These complement the automated
> Gherkin scenarios and focus on aspects that require human judgment (visual quality,
> typography, branding, cross-viewer compatibility).

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Test cases

### MT-PE-1 -- Export button visibility and interaction

- **Traces to:** US-PE-1, SC-PE-01, SC-PE-E2
- **Priority:** `MUST` (blocking)
- **Pre-conditions:**
  - Authenticated user in the wizard
  - Two sessions: one with generated PRD blocks, one with no blocks
- **Steps:**
  1. Open the session with no PRD blocks
  2. Locate the "Export PDF" button in the PRD panel header
  3. Verify the button is visible but disabled (grayed out or not clickable)
  4. Hover over the button -- verify a tooltip appears explaining why it's disabled
  5. Switch to the session with generated PRD blocks
  6. Verify the "Export PDF" button is now enabled (full color, clickable)
  7. Verify the button has both an icon and the label "Export PDF"
- **Expected result:**
  - Button is always visible but contextually enabled/disabled
  - Disabled state communicates clearly why export is not available
  - Enabled state is visually inviting
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-PE-2 -- PDF download flow (happy path)

- **Traces to:** US-PE-1, SC-PE-02, SC-PE-06
- **Priority:** `MUST` (blocking)
- **Pre-conditions:**
  - Authenticated user with a completed PRD (all or most blocks generated)
- **Steps:**
  1. Click the "Export PDF" button
  2. Observe the loading state -- verify a spinner appears on/near the button
  3. Verify the button becomes disabled during generation (cannot double-click)
  4. Wait for the PDF to be generated (expected: 1-3 seconds)
  5. Verify the browser opens a download dialog or the file starts downloading
  6. Verify the filename is `enhanced-prd-[slug].pdf` (not a random or generic name)
  7. Verify the button returns to its default state after download starts
  8. Open the downloaded PDF
- **Expected result:**
  - Smooth loading -> download -> reset flow
  - No full-page reload or navigation
  - File downloads with a meaningful name
  - PDF opens successfully in a viewer
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-PE-3 -- PDF content completeness

- **Traces to:** US-PE-2, SC-PE-03, SC-PE-04, SC-PE-05
- **Priority:** `MUST` (blocking)
- **Pre-conditions:**
  - A completed PRD with at least 8 blocks, including evidence tags
  - Knowledge of the exact block content for comparison
- **Steps:**
  1. Export the PRD as PDF
  2. Open the PDF and compare each section with the on-screen PRD panel:
     a. Verify all blocks are present in the correct order
     b. Verify section headings match block type names
     c. Verify body content matches (no truncation, no missing paragraphs)
  3. Locate evidence tags in the PDF:
     a. Verify `[Evidence]` tags are rendered with a green visual indicator
     b. Verify `[Assumption]` tags are rendered with an amber/yellow indicator
     c. Verify `[To verify]` tags are rendered with a blue indicator
  4. Check for the confidence score and recommendation:
     a. Verify they are prominently displayed (header or summary section)
     b. Verify the values match the on-screen display
  5. Check markdown rendering: bold, italic, lists, inline code should render correctly
- **Expected result:**
  - 1:1 content parity between the on-screen PRD and the PDF
  - Evidence tags are visually distinct and correctly colored
  - Confidence score and recommendation are easy to find
  - Markdown formatting is preserved
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-PE-4 -- PDF branding and typography

- **Traces to:** US-PE-3, SC-PE-07
- **Priority:** `MUST` (blocking)
- **Pre-conditions:**
  - Downloaded PDF from MT-PE-2 or MT-PE-3
- **Steps:**
  1. Open the PDF and verify the header:
     a. Enhanced logo is present (top of first page or each page)
     b. Document title is displayed
  2. Verify typography:
     a. Section headings use Kedebideri font -- compare with the web version
     b. Body text uses Cantarell font -- compare with the web version
     c. If fonts are not embedding correctly, note which fallback is used
  3. Verify the footer:
     a. Page numbers are present on each page
     b. Generation date is shown
     c. "Generated with Enhanced" text is present
  4. Assess overall visual quality:
     a. Are margins consistent across pages?
     b. Is section spacing uniform?
     c. Do page breaks avoid orphaned headings (heading at bottom of page with content on next)?
     d. Does it look like a document you'd feel comfortable sharing with a CPO?
  5. Check PDF file size (should be < 2MB for a text-only PRD)
- **Expected result:**
  - Branding is consistent and professional
  - Fonts render correctly (or fallback gracefully if embedding fails)
  - Footer information is accurate
  - Layout is clean with no awkward page breaks
  - File size is reasonable
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-PE-5 -- Cross-viewer compatibility

- **Traces to:** US-PE-3
- **Priority:** `MUST`
- **Pre-conditions:**
  - Downloaded PDF from a previous test
  - Access to multiple PDF viewers
- **Steps:**
  1. Open the PDF in macOS Preview -- verify it renders correctly
  2. Open the PDF in Chrome's built-in PDF viewer -- verify same
  3. Open the PDF in Firefox's built-in PDF viewer -- verify same
  4. If available, open in Adobe Acrobat Reader -- verify same
  5. For each viewer, check:
     a. Fonts render correctly (not replaced by system fonts)
     b. Evidence tag colors display correctly
     c. Layout is not broken (no overlapping text, no missing elements)
     d. Page numbers and footer are present
- **Expected result:**
  - PDF renders consistently across all tested viewers
  - No viewer-specific rendering bugs
  - Fonts are embedded and display correctly everywhere
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-PE-6 -- Error handling

- **Traces to:** US-PE-1, SC-PE-08
- **Priority:** `MUST`
- **Pre-conditions:**
  - Authenticated user with a PRD
  - Ability to simulate a server error (e.g., temporarily break the API route, or disconnect from the database)
- **Steps:**
  1. Simulate a server-side failure (e.g., kill the DB connection or add a forced error)
  2. Click the "Export PDF" button
  3. Observe the loading state
  4. When the error response returns:
     a. Verify the spinner disappears
     b. Verify an error message is displayed: "Impossible de generer le PDF. Reessayez."
     c. Verify the error message is a toast or inline element (not an alert() dialog)
  5. Restore normal conditions
  6. Click "Export PDF" again
  7. Verify the export succeeds normally
- **Expected result:**
  - Error is handled gracefully -- no crash, no blank screen, no infinite spinner
  - Error message is clear and actionable
  - Retry works after error condition is resolved
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-PE-7 -- Partial PRD export

- **Traces to:** US-PE-2, SC-PE-E1
- **Priority:** `COULD`
- **Pre-conditions:**
  - A PRD with only 3-4 blocks generated (not a completed wizard run)
- **Steps:**
  1. Click "Export PDF" on the partially completed PRD
  2. Open the downloaded PDF
  3. Verify the generated blocks are present with correct content
  4. Verify the missing blocks are either omitted or shown as "Section non completee"
  5. Verify the PDF is still a valid, well-formatted document (no broken layout)
  6. Verify the confidence score reflects the partial state (if applicable)
- **Expected result:**
  - Partial PRDs can be exported without errors
  - The PDF is honest about what's missing
  - Layout remains professional even with fewer sections
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

---

## Pre-release smoke checklist

Run these before every deploy that touches PDF export:

- [ ] **SM-PE-1:** Export button is visible and enabled for a PRD with blocks (MT-PE-1, abbreviated)
- [ ] **SM-PE-2:** Clicking export downloads a valid PDF file (MT-PE-2, abbreviated)
- [ ] **SM-PE-3:** PDF contains all expected sections with evidence tags visually distinguished (MT-PE-3, abbreviated)
- [ ] **SM-PE-4:** PDF uses Obra fonts and has Enhanced branding (MT-PE-4, abbreviated)
- [ ] **SM-PE-5:** PDF renders correctly in macOS Preview and Chrome (MT-PE-5, abbreviated)
- [ ] **SM-PE-6:** Export error shows a user-friendly message, not a crash (MT-PE-6, abbreviated)
