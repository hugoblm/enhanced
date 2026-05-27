# UX & Accessibility -- Wizard Shell

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27
**Design link:** TBD (Figma)

---

## User flows

### Primary flow -- Navigate the 4-step wizard

1. **PM is redirected from landing page** -- arrives at `/session/[id]`. Wizard shell loads.
2. **Shell renders** -- step indicator at top (step 1 "Cadrage" active), conversation panel left, PRD panel right (empty or with skeleton PRD).
3. **PM interacts with conversation panel** -- reads AI messages, responds to structured cards and free text prompts. PRD blocks appear in the right panel as the conversation progresses.
4. **Step 1 completes** -- the conversation engine signals completion. Step indicator updates: step 1 shows completed, step 2 "Donnees" becomes active.
5. **PM continues through steps 2-4** -- same pattern. PRD panel accumulates blocks. Both panels scroll independently.
6. **PM reaches step 4 "PRD"** -- full PRD is visible in the right panel. The wizard is complete.

### Alternative flow -- Go back to a previous step

1. **PM is at step 3 "Risques"** -- realizes step 1 framing was wrong.
2. **PM clicks step 1** in the step indicator -- conversation panel switches to step 1 messages. PRD panel continues showing all blocks.
3. **PM reviews or modifies** -- can re-read their earlier answers and the AI's responses.
4. **PM clicks step 3** (or the current step) to return -- conversation panel switches back to step 3 messages.

### Alternative flow -- Tablet/narrow viewport

1. **PM opens wizard on a < 1024px viewport** -- split-view collapses.
2. **If tabbed:** PM sees the conversation panel by default. A tab bar or toggle allows switching to the PRD panel. The step indicator remains at the top.
3. **If stacked:** Both panels are visible by scrolling. The conversation panel is on top, PRD below, with a clear separator.
4. **PM can complete the full wizard** in the responsive layout without loss of functionality.

### Error flow -- Invalid session

1. **PM navigates to `/session/[invalid-id]`** -- the session does not exist in the database.
2. **Shell shows "Session not found"** message with a link back to the landing page.
3. **No broken layout, no blank page, no unhandled error.**

---

## UX requirements

### Split-view layout

- **Desktop (>= 1024px):** Two panels side by side. Conversation left (~45%), PRD right (~55%). `[Evidence]` -- proportions from PRD. Exact percentages may be adjusted after visual testing.
- **Separator:** A subtle vertical divider between panels (1px border or thin line). No drag handle in V1. `[Assumption]` -- fixed proportions in V1; resizable in V2 if demanded.
- **Full height:** Both panels fill the viewport height minus the header (step indicator + any persistent header). No wasted space.
- **No horizontal scroll:** The layout must not produce horizontal overflow at any supported viewport width.

### Step indicator

- **Position:** Top of the page, above both panels. Spans the full width.
- **Content:** 4 steps, each showing number + label:
  - 1: "Cadrage"
  - 2: "Donnees"
  - 3: "Risques"
  - 4: "PRD"
- **States:**
  - **Active/current:** Highlighted (Obra primary color, bold weight or distinct background).
  - **Completed:** Subtle completed indicator (checkmark icon, filled circle, or similar). Clickable -- cursor becomes pointer.
  - **Locked/future:** Dimmed (lower opacity or gray). Not clickable -- cursor becomes `not-allowed` or default.
- **Size:** Compact -- max 60px total height including padding. Must not crowd the panels.
- **Connectors:** Optional horizontal line or dots connecting the steps (standard wizard pattern). `[Assumption]` -- connector style TBD in design.

### Conversation panel (left)

- **Width:** ~45% of viewport on desktop.
- **Content:** Message list (AI messages + user messages) with a message input at the bottom (text input + send button or structured card responses).
- **Scroll:** Independent vertical scroll. Auto-scrolls to latest message when new content arrives. `[Assumption]` -- auto-scroll behavior; should be pausable if the user has scrolled up manually.
- **Empty state:** On session start, shows the PM's original idea and the AI's first message.

### PRD panel (right)

- **Width:** ~55% of viewport on desktop.
- **Content:** Ordered list of PRD blocks as they are generated. Each block has a heading (block type), content (markdown rendered), and evidence tags.
- **Scroll:** Independent vertical scroll. Does NOT auto-scroll when new blocks are added (the user may be reading an earlier block). `[Assumption]` -- no auto-scroll for PRD panel; reconsider if user testing shows PMs want to follow new blocks.
- **Empty state:** Before any blocks are generated, shows a placeholder: "Le PRD apparaitra ici au fur et a mesure de votre cadrage." `[To verify]` -- copy.
- **Block rendering:** Clean, readable markdown with Obra typography. Evidence tags rendered inline with subtle styling (colored badges or labels).

### Responsive behavior (< 1024px)

- **Breakpoint:** 1024px. Below this, split-view collapses. `[Assumption]` -- breakpoint value; may need adjustment after testing on real tablets.
- **Strategy:** Tabbed layout (preferred) or vertical stack. `[To verify]` -- tabs vs. stack decision.
  - **Tabbed:** A tab bar at the bottom or top of the content area. Two tabs: "Conversation" and "PRD". Active tab content fills the available space. Step indicator remains at the top above the tabs.
  - **Stacked:** Conversation on top, PRD below. Clear visual separator between them. Both visible by scrolling.
- **Touch targets:** All interactive elements >= 44x44px.
- **Step indicator:** Remains visible and functional. May need horizontal scroll if labels don't fit at narrow widths. `[To verify]` -- step label truncation on narrow viewports.

### Loading states

- **Initial load:** Both panels show skeleton loaders or subtle spinners while session data is being fetched.
- **Step transition:** Brief transition animation (fade or slide) when moving between steps. `[Assumption]` -- animation; skip if it adds complexity without clear benefit.
- **Panel content loading:** PRD blocks appear with a brief entrance animation as they are generated. `[Assumption]` -- entrance animation; TBD.

---

## Accessibility requirements (WCAG 2.1 AA)

### Perceivable

- **Color contrast:** All text in both panels meets WCAG AA ratio (>= 4.5:1 normal, >= 3:1 large). Step indicator labels and states included.
- **Step indicator states:** Completed, active, and locked steps are distinguishable by more than color alone (use icons, borders, or text weight).
- **Content structure:** PRD blocks use proper heading hierarchy (`<h2>`, `<h3>`) for screen reader navigation.
- **Text resizing:** Layout remains functional at 200% browser zoom. Panels may stack at high zoom levels -- this is acceptable.

### Operable

- **Keyboard navigation:**
  - Tab order: step indicator steps (left to right) -> conversation panel -> PRD panel.
  - Step indicator steps are focusable buttons. Enter/Space activates a completed step. Locked steps are `aria-disabled="true"`.
  - Within the conversation panel: message input is focusable, structured cards are navigable via Tab/Arrow keys.
  - Within the PRD panel: blocks are focusable for screen reader reading order.
- **Focus management:**
  - On step transition: focus moves to the conversation panel's first new message or the message input.
  - On backward navigation: focus moves to the selected step's conversation content.
- **No keyboard traps:** Tab cycles through the step indicator, conversation panel, and PRD panel in order. Escape does not trap focus anywhere.
- **Touch targets:** All interactive elements >= 44x44px on tablet. Step indicator buttons, tab switches, scroll areas.

### Understandable

- **Step labels:** Each step has a clear, descriptive label ("Cadrage", "Donnees", "Risques", "PRD"). Screen readers announce "Etape 1 sur 4: Cadrage, en cours" (or equivalent).
- **Panel identification:** Each panel has an `aria-label` or `aria-labelledby` identifying it ("Panneau de conversation", "Panneau PRD").
- **Error states:** Invalid session shows a clear text message, not just an empty page.
- **Language:** `lang="fr"` on the page.

### Robust

- **Semantic HTML:**
  - Step indicator: `<nav>` with `<ol>` list of `<button>` elements (or `<a>` with `role="tab"`).
  - Panels: `<section>` or `<aside>` with appropriate `aria-label`.
  - PRD blocks: `<article>` or `<section>` with headings.
  - Conversation: `<div role="log">` for the message list.
- **ARIA:**
  - Step indicator: `aria-current="step"` on the active step. `aria-disabled="true"` on locked steps.
  - Tab bar (if responsive tabs): `role="tablist"`, `role="tab"`, `role="tabpanel"` pattern.
  - Live regions: new conversation messages announced via `aria-live="polite"`.
- **Landmark roles:** The shell should have `<main>` containing the wizard. Step indicator can be `<nav aria-label="Etapes du cadrage">`.

### A11y acceptance checklist

- [ ] Step indicator steps are keyboard-focusable buttons
- [ ] Active step announced with `aria-current="step"`
- [ ] Locked steps have `aria-disabled="true"` and visual non-color indicator
- [ ] Conversation panel has `aria-label="Panneau de conversation"`
- [ ] PRD panel has `aria-label="Panneau PRD"`
- [ ] New conversation messages announced via `aria-live="polite"`
- [ ] PRD blocks use proper heading hierarchy
- [ ] Tab bar (responsive) follows WAI-ARIA tab pattern
- [ ] Color contrast >= 4.5:1 on all panel text and step labels
- [ ] Full wizard flow completable via keyboard only
- [ ] Layout usable at 200% browser zoom
- [ ] Touch targets >= 44x44px on tablet
- [ ] `lang="fr"` set on the page
- [ ] Focus managed correctly on step transitions
