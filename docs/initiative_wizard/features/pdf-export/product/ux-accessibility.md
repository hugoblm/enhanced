# UX & Accessibility — PDF Export

> UX flows, interaction patterns, and WCAG 2.1 AA requirements for the PDF Export feature.
> This document ensures the export experience is smooth for the Builder PM and the output
> PDF is accessible to stakeholders.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## User flows

### Primary flow -- Export a completed PRD

```
PRD panel (blocks visible, wizard complete or in progress)
  |
  v
[PM locates "Export PDF" button in PRD panel header]
  |
  v
[PM clicks "Export PDF"]
  |
  v
Button enters loading state (spinner, disabled)
  |
  v
Server generates PDF (1-3 seconds)
  |-- @react-pdf/renderer builds the document
  |-- Fonts embedded, blocks rendered, evidence tags styled
  |
  v
Response: Content-Disposition: attachment
  |
  v
Browser download dialog appears
  |
  v
Button returns to default state
  |
  v
PM has the PDF file locally
  |
  v
PM shares via email, Slack, Drive, or presents in meeting
```

### Error flow -- Generation failure

```
[PM clicks "Export PDF"]
  |
  v
Button enters loading state
  |
  v
Server encounters an error (DB timeout, font issue, renderer crash)
  |
  v
Error response returned
  |
  v
Loading state clears, button returns to default
  |
  v
Toast notification: "Impossible de générer le PDF. Réessayez."
  |
  v
PM can click "Export PDF" again to retry
```

### Edge flow -- Empty or partial PRD

```
[PM is in wizard, PRD has 0 blocks]
  |
  v
"Export PDF" button is visible but disabled
  |-- Tooltip on hover: "Complétez au moins une section pour exporter"
  |
  (PM continues wizard, blocks are generated)
  |
  v
[First block generated]
  |
  v
"Export PDF" button becomes enabled
  |
  v
PM can export at any time (partial or complete PRD)
```

---

## UX requirements

### Export button

- **Position:** PRD panel header, right side, alongside other actions (version history, share)
- **Appearance:** Icon (download arrow or document icon) + label "Export PDF"
- **States:**
  - **Disabled:** Grayed out, cursor: not-allowed. Tooltip: "Completez au moins une section pour exporter." Visible when PRD has 0 blocks
  - **Default:** Full color, cursor: pointer. Ready to click
  - **Loading:** Spinner replaces the icon (or appears alongside it). Button disabled. Label may change to "Generation..." or remain "Export PDF"
  - **Success:** Brief flash (optional) then back to default. The download starting IS the success feedback
  - **Error:** Button returns to default. Error communicated via separate toast/notification

### Loading experience

- **Duration expectation:** 1-3 seconds for a typical PRD. Acceptable up to 5 seconds for very long PRDs. Beyond 5 seconds: consider a progress indicator `[To verify]`
- **What remains interactive:** The entire wizard (conversation panel, PRD panel scrolling, navigation) stays interactive during PDF generation. Only the export button itself is disabled
- **No modal or overlay:** The loading state is localized to the button. No blocking overlay on the page

### Download behavior

- **File name:** `enhanced-prd-[slug].pdf` where `[slug]` is derived from the PRD/session identifier (e.g., `enhanced-prd-ab3k7x.pdf`)
- **Download method:** Browser's native download dialog. The response uses `Content-Disposition: attachment` to force download rather than opening in a new tab
- **No "open in new tab":** The PDF is a file to keep, not a page to view. Force download behavior

### PDF layout specification

- **Page size:** A4 (210mm x 297mm) -- standard for European business documents
- **Margins:** 25mm top, 20mm bottom, 20mm left, 20mm right
- **Header (every page):**
  - Left: Enhanced logo (small, grayscale-compatible)
  - Right: Document title (PRD name)
- **Footer (every page):**
  - Left: "Generated with Enhanced"
  - Center: Generation date (e.g., "27 mai 2026")
  - Right: Page number ("Page 3 / 8")
- **First page:**
  - Title section: PRD name (large, Kedebideri), generation date
  - Confidence score (if available): large number with label, e.g., "Score de confiance: 72%"
  - Recommendation: "Recommandation: Go with caution"
  - Summary section: one-paragraph overview if available
- **Content pages:**
  - Each PRD block starts with a section heading (Kedebideri, larger size)
  - Body text in Cantarell
  - Evidence tags inline, color-coded:
    - `[Evidence]` -- green (#16a34a or Obra green) background pill or text color
    - `[Assumption]` -- amber (#d97706 or Obra amber) background pill or text color
    - `[To verify]` -- blue (#2563eb or Obra blue) background pill or text color
  - Markdown formatting: bold, italic, bullet lists, numbered lists rendered natively
  - Page breaks avoid orphaned headings (a heading must have at least 2 lines of content on the same page)

### Visual design

- Clean, minimal aesthetic aligned with Obra tokens
- No decorative elements beyond the logo and section dividers
- Sufficient white space between sections
- Color is used sparingly: primarily for evidence tags and the confidence score
- The PDF should feel "designed" but not "decorated" -- professionalism over flair

---

## WCAG 2.1 AA requirements

The export feature has two accessibility surfaces: (1) the export button and interaction within the wizard UI, and (2) the output PDF itself.

### Surface 1: Export button and interaction (wizard UI)

#### Perceivable

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 1.1.1 Non-text content | Export button icon must have a text alternative | `aria-label="Export PDF"` or visible label text alongside the icon |
| 1.3.1 Info and relationships | Disabled state must be programmatically determinable | `aria-disabled="true"` on the button when PRD has no blocks |
| 1.4.3 Contrast (minimum) | Button text and icon meet 4.5:1 contrast ratio in all states (default, hover, disabled) | Test with Obra tokens against the PRD panel header background |
| 1.4.11 Non-text contrast | Button border/shape meets 3:1 contrast against background | Verify for both enabled and disabled states |

#### Operable

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 2.1.1 Keyboard | Export button must be keyboard-accessible | Focusable via Tab, activatable via Enter or Space |
| 2.4.7 Focus visible | Button has a visible focus indicator | shadcn/ui default focus ring |

#### Understandable

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 3.2.2 On input | Clicking export does not cause unexpected navigation | Download dialog appears, but the page does not navigate away |
| 3.3.1 Error identification | Error message identifies the problem | Toast: "Impossible de generer le PDF" clearly states what failed |

#### Robust

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 4.1.2 Name, role, value | Button has correct role and states | `<button>` element with `aria-disabled` when disabled, `aria-busy="true"` during loading |
| 4.1.3 Status messages | Loading and error states are announced | Loading: `aria-live="polite"` on a visually hidden status text ("Generation du PDF en cours..."). Error toast: `role="alert"` |

### Surface 2: Output PDF

PDF accessibility is harder to guarantee with `@react-pdf/renderer`, but these baseline requirements should be met where the library allows.

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| PDF/UA tagged structure | Document should be tagged for screen reader navigation | Use @react-pdf/renderer's built-in structure tags if available. `[To verify]` -- library support for PDF/UA needs investigation |
| Language | PDF metadata should declare the language (French) | Set the `lang` property in the PDF document metadata |
| Reading order | Content should be in logical reading order | Structure the react-pdf components in DOM order matching visual order |
| Text is selectable | All text in the PDF must be real text, not rasterized | @react-pdf/renderer produces vector text by default. Verify fonts are embedded as outlines, not images |
| Color independence | Evidence tags should not rely on color alone | Tags include text labels (`[Evidence]`, `[Assumption]`, `[To verify]`) in addition to color coding |
| Contrast in PDF | Text on colored backgrounds (evidence tag pills) meets 4.5:1 | Verify tag label text color against the green/amber/blue backgrounds |

---

## A11y checklist

Pre-release accessibility checks (manual + automated):

- [ ] **Export button keyboard:** Tab to the export button, press Enter. Verify PDF downloads. Tab away and back -- focus ring is visible
- [ ] **Disabled state announced:** With VoiceOver active, focus the disabled export button. Verify it announces "Export PDF, dimmed" or equivalent disabled state
- [ ] **Loading state announced:** Click export with VoiceOver active. Verify the loading state is announced ("Generation du PDF en cours" or similar)
- [ ] **Error state announced:** Trigger an export error with VoiceOver active. Verify the error toast is announced immediately
- [ ] **Tooltip accessible:** Hover the disabled button -- tooltip appears. Focus the disabled button with keyboard -- tooltip appears (or equivalent accessible description)
- [ ] **PDF text selectable:** Open the exported PDF, select text with cursor. Verify it selects real text, not image regions
- [ ] **PDF evidence tags:** In the PDF, verify evidence tags are understandable without color: the text labels `[Evidence]`, `[Assumption]`, `[To verify]` are present alongside any color coding
- [ ] **PDF contrast:** Spot-check the PDF: body text on white background, tag labels on colored backgrounds. All should pass 4.5:1 minimum contrast
- [ ] **PDF language:** Check PDF metadata (File > Properties in Acrobat) -- language should be set to French
- [ ] **Zoom test:** Export button and download flow work at 200% browser zoom
