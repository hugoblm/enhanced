# UX & Accessibility — PRD Versioning

> UX flows, interaction patterns, and WCAG 2.1 AA requirements for the PRD Versioning feature.
> This document ensures the version history experience is usable and accessible.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## User flows

### Primary flow -- Browse version history and view a past version

```
PRD panel (current version visible)
  |
  v
[PM clicks "Version history" button in PRD panel header]
  |
  v
Version history panel opens (side panel or modal)
  |-- List of versions, newest first
  |-- Each entry: version number, trigger, block name, timestamp
  |-- Current version highlighted
  |
  v
[PM clicks on a past version (e.g., v2)]
  |
  v
Historical view replaces or overlays current PRD content
  |-- Read-only snapshot of the block content at v2
  |-- Banner: "Version 2 — il y a 35 min (lecture seule)"
  |-- No "Refine" button visible
  |
  v
[PM clicks "Retour à la version actuelle" or close button]
  |
  v
Current PRD version restored in the panel
```

### Background flow -- Auto-versioning (invisible to PM)

```
Conversation engine calls update_prd (generation)
  |
  v
Block saved to prd_blocks
  |
  v
prd_versions entry created automatically
  |-- version_number incremented
  |-- content_snapshot = block content
  |-- trigger = "generation"
  |
  (PM sees nothing -- versioning is silent)

---

PM triggers block refinement
  |
  v
Refined block saved to prd_blocks
  |
  v
prd_versions entry created automatically
  |-- version_number incremented
  |-- content_snapshot = refined content
  |-- trigger = "refinement"
  |
  (PM sees nothing -- versioning is silent)
```

### Edge flow -- Empty version history

```
[PM clicks "Version history" on a PRD with no blocks yet]
  |
  v
Panel opens with empty state: "Aucune version pour le moment"
  |-- Subtext: "Les versions seront créées automatiquement au fil de la conversation"
```

---

## UX requirements

### Version history button

- **Position:** PRD panel header, right side, near the export/share buttons
- **Appearance:** Icon (clock or history icon) with tooltip "Historique des versions"
- **State when no versions exist:** Button is still visible but shows a badge/count of "0" or no badge at all. Clicking opens the empty state
- **State with versions:** Optional badge showing the version count (e.g., "7")

### Version history panel

- **Type:** Side panel sliding in from the right, or a modal. Side panel preferred because it lets the PM keep the PRD visible for mental comparison
- **Width:** ~300px if side panel (does not replace the PRD panel, overlays it partially)
- **Content:**
  - Header: "Historique des versions" with a close button
  - Version list: scrollable, newest first
  - Each entry is a card or row:
    - Version number (bold): "v3"
    - Trigger: "Generation" or "Refinement" (with distinct visual indicators -- e.g., different icons or subtle color)
    - Block name: "First Use Case" (if block-specific), or "PRD complet" (if full PRD)
    - Timestamp: relative ("il y a 5 min") or absolute if older than 24h ("27 mai 10:02")
  - Current version: highlighted with a label "Actuelle"

### Historical content view

- **Replaces** the current PRD panel content temporarily (not a new page)
- **Banner at top:** "Version N -- [date] (lecture seule)" with a yellow/amber background to distinguish from the current editable view
- **Content rendering:** Same markdown renderer as the current PRD view, including evidence tag styling
- **No interactive elements:** No "Refine" hover buttons, no edit affordances
- **Return button:** "Retour a la version actuelle" button pinned at the top or bottom of the view

### Visual design

- Uses Obra design tokens: Cantarell for body text, appropriate sizing
- Version list entries have subtle borders or spacing to separate them
- "Generation" trigger: neutral icon (e.g., sparkle or plus)
- "Refinement" trigger: edit icon (e.g., pencil)
- Current version entry has a distinct background or border (e.g., primary accent color, subtle)
- Historical view banner uses a warning/info color to signal "you are not looking at the latest"

---

## WCAG 2.1 AA requirements

### Perceivable

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 1.1.1 Non-text content | Icons (history button, trigger icons, close) must have text alternatives | `aria-label` on icon buttons. Trigger type icons supplemented by text labels |
| 1.3.1 Info and relationships | Version list structure must be programmatically determinable | Use `<ul>` or `<ol>` for the version list. Each entry is an `<li>`. Current version uses `aria-current="true"` |
| 1.3.2 Meaningful sequence | Version list reading order matches visual order (newest first) | DOM order matches display order |
| 1.4.3 Contrast (minimum) | All text meets 4.5:1 contrast ratio | Verify version numbers, timestamps, trigger labels against panel background |
| 1.4.11 Non-text contrast | Interactive elements (clickable versions, close button) meet 3:1 ratio | Test with Obra tokens |

### Operable

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 2.1.1 Keyboard | All interactions must be keyboard-accessible | Tab through version list entries. Enter or Space selects a version. Escape closes the panel |
| 2.1.2 No keyboard trap | Focus must not get trapped in the version history panel | Escape or close button returns focus to the PRD panel header (version history button) |
| 2.4.3 Focus order | Focus order within the panel is logical | Close button > version list (top to bottom) > close button (wraps) |
| 2.4.7 Focus visible | Focused version entries and buttons have visible focus rings | Use shadcn/ui focus ring styling |

### Understandable

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 3.1.1 Language | Panel content language is determinable | Inherits `lang="fr"` from page |
| 3.2.1 On focus | No unexpected context change on focus | Focusing a version entry does not load it -- only Enter/click does |
| 3.3.1 Error identification | If version content fails to load, error is identified | Show an inline error message in the content area: "Impossible de charger cette version" |

### Robust

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 4.1.2 Name, role, value | Panel has correct ARIA roles | Panel: `role="complementary"` or `role="dialog"` if modal. Version list: `role="list"`. Clickable entries: `role="button"` or `<button>` elements |
| 4.1.3 Status messages | Status changes announced to screen readers | Empty state message: `role="status"`. Loading indicator: `aria-live="polite"` |

---

## A11y checklist

Pre-release accessibility checks (manual + automated):

- [ ] **Focus management:** Opening version history panel moves focus to the panel header or close button. Closing returns focus to the version history trigger button
- [ ] **Keyboard navigation:** Navigate the full flow using only keyboard: open panel > browse list > select version > view content > return to current > close panel
- [ ] **Screen reader test:** VoiceOver (macOS) reads version entries with version number, trigger type, block name, and timestamp. Current version is announced as "actuelle"
- [ ] **Contrast check:** Run axe or Lighthouse on the version history panel and historical view. All text meets 4.5:1
- [ ] **Zoom test:** Panel is usable at 200% browser zoom. Content does not overflow
- [ ] **Reduced motion:** Panel open/close animation respects `prefers-reduced-motion: reduce`
- [ ] **Touch targets:** Version entries have at least 44px height for tablet users
- [ ] **Empty state:** Screen reader announces the empty state message when no versions exist
