# UX & Accessibility -- PRD Live Builder

> UX flows, interaction patterns, and WCAG 2.1 AA accessibility requirements for the
> PRD live builder panel.

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

## Primary flow: PRD construction during conversation

```
Session starts
  |
  v
PRD panel shows 12 empty placeholders
(muted, compact, each with section title + "will be filled during step N")
  |
  v
[Step 1 conversation]
  AI calls update_prd(first_use_case, content, tags)
    → Placeholder replaced by filled block (animated)
    → Evidence tags render as colored badges
    → PRD panel auto-scrolls to new block
  AI calls update_prd(problem_context, content, tags)
    → Same behavior, block appears in sort position 2
  |
  v
[Step 2 conversation]
  AI calls update_prd(data_signals, content, tags)
    → Block appears in sort position 3
  |
  v
[Step 3 conversation]
  AI calls update_prd(risk_value, ...) → position 4
  AI calls update_prd(risk_usability, ...) → position 5
  AI calls update_prd(risk_feasibility, ...) → position 6
  AI calls update_prd(risk_viability, ...) → position 7
  AI calls update_prd(confidence_score, ...) → position 8 + header badge
  |
  v
[Step 4 conversation]
  AI calls update_prd(success_criteria, ...) → position 9
  AI calls update_prd(kill_criteria, ...) → position 10
  AI calls update_prd(next_steps, ...) → position 11
  AI calls update_prd(executive_summary, ...) → position 12
  |
  v
[PRD Complete]
  All 12 blocks filled → no placeholders remain
  Header: title + confidence score badge + recommendation
  Export (PDF) + Share (public link) buttons active
```

---

## Sub-flow: Block appearance animation

```
update_prd tool result received by client
  |
  v
Zustand store updates prd_blocks array
  |
  v
Is this a new block or an update?
  |
  +--> [New block]
  |      Placeholder for this block_type fades out (200ms)
  |      Filled block content fades in (300ms)
  |      Block briefly highlights (yellow/gold pulse, 1s)
  |      PRD panel auto-scrolls to this block (smooth, 500ms)
  |
  +--> [Updated block]
         Old content fades out (200ms)
         New content fades in (300ms)
         Block briefly highlights (blue pulse, 1s)
         PRD panel auto-scrolls to this block if not currently in view
```

---

## Sub-flow: Confidence score update

```
AI calls update_prd(confidence_score, score_data)
  |
  v
Score computed (average of 4 risk ratings)
  |
  v
Is score >= 4.0?
  +--> [Yes] → Green badge + "Build" recommendation
  |
  +--> Score >= 3.0 and < 4.0?
  |      +--> [Yes] → Amber badge + "Test first" recommendation
  |
  +--> Score < 3.0?
         +--> [Yes] → Red badge + "Abandon" recommendation
  |
  v
Badge animates into the PRD header (scale-in + fade)
Recommendation text appears beside the badge
```

---

## Error flow: update_prd failure

```
AI calls update_prd(block_type, content)
  |
  v
Server-side execute function runs
  |
  +--> [Success] → Block upserted in DB → tool result sent → client updates
  |
  +--> [DB error / server error]
        |
        v
       Tool result returns error to AI
       AI acknowledges the error in conversation
       "I had trouble saving the [block_type] section. Let me try again."
       AI retries the update_prd call
        |
        +--> [Success on retry] → normal flow
        +--> [Persistent failure] → AI informs PM: "The section could not be saved.
              Your answers are preserved in the conversation. Please contact support
              if this continues."
```

---

## UX requirements

### PRD panel layout

- **Position:** Right side of the split view, approximately 55% of viewport width on desktop. `[Evidence]` -- PRD spec and wizard-shell feature spec.
- **Header:** Fixed at the top of the panel (does not scroll with content). Contains:
  - PRD title (editable inline -- click to edit, Enter to confirm)
  - Confidence score badge (appears after step 3; empty state before)
  - Recommendation text (appears with confidence score)
  - Export PDF button (icon + text)
  - Share button (icon + text)
- **Content area:** Scrollable independently from the conversation panel. Contains the 12 blocks in fixed sort order.
- **Footer:** None in V1. `[Assumption]` -- a footer with metadata (session date, word count) could be useful but is not in the PRD spec.

### Block rendering

- **Block card:** Each block renders as a card with:
  - **Section title** as the heading (e.g., "First Use Case", "Risk: Value")
  - **Content** rendered as markdown via react-markdown
  - **Evidence tags** as inline colored badges
  - Subtle card border and padding to separate blocks visually
- **Empty placeholder:** Muted card with:
  - Section title in the same position as a filled block
  - Italic text: "This section will be filled during step N"
  - Reduced opacity (0.5) or dimmed background
  - Collapsed height (approximately 48-60px, much shorter than a filled block)
- **Block transitions:** CSS transitions for all state changes (placeholder-to-filled, content update). Duration: 200-300ms ease-out. Highlight pulse: 1s.

### Evidence tag badges

- **Shape:** Rounded pill badges (border-radius matching Obra design tokens).
- **Size:** Approximately the same height as the surrounding text line. Not a large chip.
- **Colors (meeting WCAG contrast on white and dark backgrounds):**
  - Green: Obra success/green token, with white or dark text for contrast
  - Amber: Obra warning/yellow token, with dark text for contrast
  - Red: Obra error/red token, with white text for contrast
- **Text:** Always shows the full label: "[Evidence]", "[Assumption]", "[To verify]". Never abbreviated.
- **Position:** Inline after the claim they annotate, within the markdown flow. Not in a sidebar or footer.

### Auto-scroll behavior

- **When:** Auto-scroll triggers when a new block appears or an existing block is updated.
- **How:** Smooth scroll (CSS `scroll-behavior: smooth` or JS `scrollIntoView({ behavior: 'smooth' })`).
- **Pause:** If the PM has manually scrolled up (not at the bottom of the panel), auto-scroll pauses. It resumes only when the PM scrolls back to the bottom (within ~50px of the bottom edge).
- **Why:** This matches the conversation panel's auto-scroll behavior, creating a consistent UX. `[Evidence]` -- standard pattern in chat and document builders.

---

## WCAG 2.1 AA requirements

### Perceivable

| Requirement | Implementation | Guideline |
|-------------|----------------|-----------|
| Text contrast | All block text meets 4.5:1 contrast ratio. Section titles, body text, placeholder text, badge text included. | 1.4.3 Contrast (Minimum) |
| Non-text contrast | Card borders, badge backgrounds, and button borders meet 3:1 contrast ratio. | 1.4.11 Non-text Contrast |
| Evidence tag colors | Tags are not color-only -- each includes its text label. A colorblind user can read "[Evidence]", "[Assumption]", "[To verify]" without relying on green/amber/red. | 1.4.1 Use of Color |
| Confidence score colors | The score badge uses color (green/amber/red) but also includes the numeric value and recommendation text. Color is supplementary, not the only signal. | 1.4.1 Use of Color |
| Text resize | PRD content is readable at 200% zoom without horizontal scrolling. Blocks reflow vertically. | 1.4.4 Resize Text |
| Images of text | No images of text. All block content is real text rendered via react-markdown. | 1.4.5 Images of Text |

### Operable

| Requirement | Implementation | Guideline |
|-------------|----------------|-----------|
| Keyboard navigation | The PRD panel is keyboard-scrollable. Tab navigates between interactive elements (title edit, buttons). | 2.1.1 Keyboard |
| Focus management | When a new block appears and auto-scroll triggers, keyboard focus does NOT move (focus stays in the conversation panel where the PM is working). | 2.4.3 Focus Order |
| Focus visible | The inline title editor, Export button, and Share button show a visible focus ring. | 2.4.7 Focus Visible |
| Heading structure | Each block section title uses an appropriate heading level (h3 or h4 within the panel). Screen reader heading navigation works to jump between blocks. | 2.4.6 Headings and Labels |

### Understandable

| Requirement | Implementation | Guideline |
|-------------|----------------|-----------|
| Placeholder text | Empty state text ("This section will be filled during step N") uses clear, non-jargon language. | 3.1.1 Language of Page |
| Consistent structure | All blocks use the same card layout: title, then content, then tags. The PM learns the pattern once. | 3.2.4 Consistent Identification |
| Predictable behavior | Auto-scroll is predictable: new block = scroll. PM scrolls manually = pause. No surprising jumps. | 3.2.1 On Focus |

### Robust

| Requirement | Implementation | Guideline |
|-------------|----------------|-----------|
| ARIA roles | The PRD panel uses `role="region"` with `aria-label="PRD document"`. Each block uses `role="article"` with `aria-labelledby` pointing to its section title. | 4.1.2 Name, Role, Value |
| Live regions | When a new block appears, an `aria-live="polite"` region announces: "Section [title] has been added to the PRD." Content is NOT read in full (too verbose). | 4.1.3 Status Messages |
| Score announcement | When the confidence score updates, it is announced via `aria-live="polite"`: "Confidence score: [N]/5. Recommendation: [text]." | 4.1.3 Status Messages |
| Semantic markup | Block content rendered by react-markdown preserves semantic HTML: `<h2>`, `<ul>`, `<blockquote>`, `<strong>`, `<em>`. No `<div>` soup. | 4.1.1 Parsing |

---

## A11y checklist (pre-release)

- [ ] All block text meets 4.5:1 contrast ratio (run Lighthouse or axe scan)
- [ ] Evidence tag badges have text labels visible (not color-only)
- [ ] Confidence score badge has numeric value + recommendation text (not color-only)
- [ ] PRD panel is scrollable via keyboard (Tab, Space, Page Down)
- [ ] Each block section title uses a heading element (h3 or h4)
- [ ] Screen reader can navigate blocks via heading navigation (VoiceOver rotor)
- [ ] New block announcement via aria-live is audible but not disruptive
- [ ] Inline title editor is keyboard-accessible (Tab to reach, Enter to edit, Enter to confirm, Escape to cancel)
- [ ] Export and Share buttons have accessible names (aria-label if icon-only)
- [ ] Text is readable at 200% zoom without horizontal scroll
- [ ] No animation causes content to shift unpredictably (block transitions are smooth, not jarring)
- [ ] Placeholder text is distinguishable from filled content via screen reader (not just visual dimming)
