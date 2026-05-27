# UX & Accessibility -- Block Refinement

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27
**Design link:** TBD (Figma)

---

## User flows

### Primary flow -- Refine a PRD block

1. **PM reads the PRD panel** -- notices a block that needs adjustment (too verbose, missing context, wrong tone).
2. **PM hovers over the block** -- a "Refine" button fades in at the top-right corner of the block (or similar anchor position). `[To verify]` -- exact button placement TBD in design.
3. **PM clicks "Refine"** -- a popover opens anchored to the block. The popover contains:
   - A short instruction text: "Que souhaitez-vous modifier ?" `[To verify]` -- final copy.
   - A textarea for the natural language instruction.
   - A submit button ("Affiner" or similar). `[To verify]` -- final CTA copy.
   - A close/cancel button (X icon).
4. **PM types their instruction** -- e.g., "raccourcis et concentre-toi sur les risques business".
5. **PM clicks submit** -- popover closes (or stays open with loading indicator). The block enters a loading state (pulsing border, shimmer overlay, or subtle spinner).
6. **Block content updates via streaming** -- text appears progressively as the AI generates. The PM can see the new content taking shape.
7. **Generation completes** -- loading indicator disappears. The block displays its new content in-place. The conversation panel shows the refinement exchange (PM's instruction + AI response).
8. **PM evaluates the result** -- if satisfied, moves on. If not, can refine again.

### Alternative flow -- Cancel refinement before submitting

1. **PM opens the refine popover** but changes their mind.
2. **PM clicks the close button (X)** or presses Escape -- popover closes.
3. **No request is sent.** Block content is unchanged. No entry in the conversation panel.

### Alternative flow -- Refinement fails

1. **PM submits a refinement instruction.**
2. **The AI request fails** (network error, API timeout, server error).
3. **Block reverts** to its pre-refinement content. No partial or corrupted text.
4. **Error message appears** near the block or in the popover: "La modification a echoue. Votre contenu original a ete restaure." `[To verify]` -- final error copy.
5. **Retry affordance:** A "Reessayer" button is available. The instruction text is preserved in the popover (or the popover reopens with the instruction).
6. **Conversation panel** shows an error entry for the failed refinement.

### Alternative flow -- Touch devices (tablet)

1. **PM taps a PRD block** (since hover doesn't exist on touch) -- the "Refine" button appears.
2. **PM taps "Refine"** -- popover opens.
3. **PM types instruction and submits** -- same flow as desktop.
4. **Popover is positioned to avoid keyboard obstruction** -- when the on-screen keyboard appears, the popover remains visible and accessible. `[To verify]` -- popover positioning with virtual keyboard needs testing.

---

## UX requirements

### Refine button

- **Trigger:** Appears on hover (desktop) or tap (touch). `[Evidence]` -- hover interaction specified in PRD.
- **Position:** Top-right corner of the block, overlaying the block content. Does not shift the block layout when it appears.
- **Appearance:** Small, subtle button with a recognizable icon (sparkle, pencil, or wand). May include text "Affiner" alongside the icon. `[To verify]` -- icon choice and label presence.
- **Animation:** Fade in on hover entry, fade out on hover exit. Duration: 150-200ms. Respects `prefers-reduced-motion`.
- **Z-index:** Above block content but below the popover.

### Refine popover

- **Anchor:** Positioned relative to the block -- either adjacent to the refine button or centered below the block header. Must not overflow the viewport. `[To verify]` -- exact positioning; use `@floating-ui/react` or Radix Popover for smart positioning.
- **Content:**
  - Instruction label: "Que souhaitez-vous modifier ?" (or similar).
  - Textarea: 2-3 visible rows, auto-expanding. Placeholder: "Ex: raccourcis, ajoute des metriques, change le ton..." `[To verify]` -- placeholder copy.
  - Submit button: Primary action, labeled "Affiner". Disabled when textarea is empty.
  - Close button: X icon in the top-right corner of the popover.
- **Width:** ~320px on desktop. Responsive on narrower viewports. `[Assumption]` -- width based on typical popover patterns.
- **Backdrop:** Subtle dimming of the rest of the PRD panel to draw focus to the popover and its target block. `[Assumption]` -- backdrop dimming; may be skipped if it feels heavy.

### Loading state during refinement

- **Block indicator:** Pulsing border, shimmer overlay, or spinner on the block. The existing content remains visible (not replaced with a skeleton) to provide a point of reference during streaming.
- **Streaming content:** New text appears progressively, replacing or overlaying the previous content. The PM can see the AI "writing" the new block. `[Assumption]` -- streaming vs. replace-on-complete; streaming is preferred for feedback but adds implementation complexity.
- **Smooth expansion:** If the new content is longer, the block height animates smoothly (CSS transition on height or `auto` height with animation). No sudden layout jumps that push other blocks off-screen.
- **Scroll preservation:** The PRD panel's scroll position is maintained during the update. The refined block stays visible (scroll to keep it in view if needed).

### Post-refinement state

- **Block content:** Updated in-place. The new content replaces the old content entirely (no version indicator on the block itself in V1). `[Assumption]` -- no inline version indicator; `prd-versioning` feature handles history if implemented.
- **Conversation panel:** The refinement exchange appears as a pair of messages:
  - User message: "Affiner [block name]: [instruction]"
  - AI message: the new block content or a confirmation.
- **Popover:** Closes automatically after successful refinement. `[Assumption]` -- auto-close vs. stay-open for sequential refinements. Auto-close is simpler; stay-open adds complexity.

### Error handling

- **Revert:** On failure, the block content reverts to the pre-refinement version. This must be atomic -- no partial content, no blank block.
- **Error message:** Inline near the block or in the popover. Clear, specific, actionable ("La modification a echoue. Reessayer ?").
- **Retry:** The instruction text is preserved so the PM can retry without retyping.
- **Multiple failures:** If retries keep failing, suggest the PM continue the conversation or try again later. No infinite retry loop. `[Assumption]` -- no retry limit enforced in V1; monitor via PostHog.

### Interaction nuances

- **Multiple blocks:** Only one refine popover can be open at a time. Opening a popover on block B while block A's popover is open should close A's popover first. `[Assumption]` -- single popover constraint; simplifies state management.
- **During step transition:** Refine button is available at any step (not only step 4). Blocks generated at step 1 can be refined during step 3. `[Assumption]` -- cross-step refinement allowed; the alternative (lock blocks after step completion) would be frustrating.
- **Empty instruction:** Submitting with an empty textarea is prevented (submit button disabled when empty). `[Evidence]` -- standard form validation.

---

## Accessibility requirements (WCAG 2.1 AA)

### Perceivable

- **Color contrast:** Refine button icon/text meets WCAG AA contrast on both light and dark backgrounds. Error messages meet contrast requirements.
- **Non-color cues:** Loading state is communicated via animation AND text (screen reader announces "Bloc en cours de modification"). Error state has text + icon, not just color.
- **Content updates:** Screen readers are notified when block content changes (via `aria-live` region on the block or a status message).

### Operable

- **Keyboard navigation:**
  - Refine button is focusable via Tab when navigating through PRD blocks. Focus order: block heading -> block content -> refine button -> next block.
  - Enter/Space on the refine button opens the popover.
  - Inside the popover: Tab order is textarea -> submit button -> close button.
  - Escape closes the popover and returns focus to the refine button.
- **Focus management:**
  - Opening the popover: focus moves to the textarea.
  - Closing the popover (submit or cancel): focus returns to the refine button on the block.
  - After successful refinement (popover auto-closes): focus returns to the block or the refine button.
- **Touch equivalence:** On touch devices, the refine button appears on tap (first tap reveals button, second tap opens popover -- or single tap if always visible). `[To verify]` -- touch interaction pattern needs testing.
- **Touch targets:** Refine button >= 44x44px touch target (visual size can be smaller if padding extends the target). Submit button and close button in the popover >= 44x44px.

### Understandable

- **Popover purpose:** The textarea has a visible label: "Que souhaitez-vous modifier ?" This label doubles as the instruction for the PM.
- **Error messages:** Specific and actionable. "La modification a echoue" is followed by a suggested action ("Reessayer").
- **Block identification:** When the popover opens, the PM should know which block they are refining. The popover title or the block heading provides context. Screen readers announce: "Affiner le bloc [block name]."

### Robust

- **Semantic HTML:**
  - Refine button: `<button>` with `aria-label="Affiner le bloc [block name]"`.
  - Popover: rendered as a `<dialog>` or with `role="dialog"` and `aria-modal="true"`.
  - Textarea: `<textarea>` with `<label>` association.
  - Submit button: `<button type="submit">` within a `<form>`.
- **ARIA:**
  - Popover: `aria-labelledby` pointing to the popover title.
  - Block during refinement: `aria-busy="true"` while the AI is generating.
  - Updated block: `aria-live="polite"` or a status message announced after content changes.
  - Error messages: `role="alert"` for immediate screen reader announcement.
- **Focus trap:** While the popover is open, Tab cycles within the popover (textarea -> submit -> close -> textarea). Focus does not leak to the background. Escape exits the trap and closes the popover.

### A11y acceptance checklist

- [ ] Refine button is keyboard-focusable and activatable via Enter/Space
- [ ] Refine button has `aria-label="Affiner le bloc [block name]"`
- [ ] Popover has `role="dialog"` and `aria-modal="true"`
- [ ] Popover traps focus while open (Tab cycles within popover)
- [ ] Escape closes the popover and returns focus to the refine button
- [ ] Textarea has a visible `<label>` element
- [ ] Submit button is disabled when textarea is empty (with `aria-disabled="true"`)
- [ ] Block sets `aria-busy="true"` during AI generation
- [ ] Screen reader is notified when block content updates (via `aria-live` or status message)
- [ ] Error messages use `role="alert"`
- [ ] Color contrast >= 4.5:1 on refine button, popover text, and error messages
- [ ] Touch targets >= 44x44px for refine button, submit, and close
- [ ] Loading animation respects `prefers-reduced-motion`
- [ ] Touch device: refine button is accessible without hover
- [ ] `lang="fr"` set on the page
