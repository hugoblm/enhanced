# User Stories & JTBD -- Wizard Shell

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

## JTBD

> When I am going through a structured validation of my product idea, I want to see the AI
> conversation and the PRD being built side by side, so I can track how my answers translate
> into a real document and stay oriented in the process.

---

## Personas

- **Builder PM** -- PM at a startup/scale-up, ships fast, tech-savvy, time-constrained. PRODUCER. Interacts with both panels during the wizard session.
- **Stakeholder** -- CPO/CEO/lead who reviews PRDs. CONSUMER. Does not use the wizard shell directly in V1 (consumes output via public link or PDF).
- **Team Lead** -- Engineering lead who scopes work from PRDs. CONSUMER. Same as Stakeholder for wizard shell context.

---

## User stories

### US-WS-1 -- View the split-view layout

- **Story:** As a **Builder PM**, I want to see the conversation with the AI on the left and the PRD being assembled on the right, so that I can follow how my responses translate into structured document sections in real time.
- **Priority:** MUST
- **Why:** The split-view is what differentiates Enhanced from a chatbot. Without the side-by-side view, there is no visible artifact and no sense of progress -- the PM is just "talking to an AI" with no tangible output until the end. `[Evidence]` -- PRD section 5: "without the split-view, the product is just a chatbot."
- **Acceptance criteria:**
  - [ ] On desktop (viewport >= 1024px), the layout shows two panels side by side
  - [ ] The conversation panel occupies approximately 45% of the width (left side)
  - [ ] The PRD panel occupies approximately 55% of the width (right side)
  - [ ] Both panels are visible simultaneously without scrolling horizontally
  - [ ] The layout uses the full viewport height (minus header)
  - [ ] The proportions are visually balanced and feel intentional, not accidental
- **Maps to Gherkin:** SC-WS-1

---

### US-WS-2 -- Navigate the 4-step progression

- **Story:** As a **Builder PM**, I want to see where I am in the 4-step process (Cadrage, Donnees, Risques, PRD) at all times, so that I know how much work remains and what comes next.
- **Priority:** MUST
- **Why:** A 4-step wizard without visible progress feels endless. The step indicator sets expectations and reduces anxiety about time commitment -- critical for time-constrained PMs. `[Evidence]` -- standard UX pattern for multi-step flows; also, PRD risk R4: "30 minutes is too long for time-constrained PMs" -- visible progress mitigates this.
- **Acceptance criteria:**
  - [ ] A step indicator is visible at the top of the wizard, above both panels
  - [ ] The indicator shows 4 steps labeled: "Cadrage", "Donnees", "Risques", "PRD"
  - [ ] Each step displays its number (1-4) and its label
  - [ ] The current step is visually highlighted (distinct color, bold, or active state)
  - [ ] Completed steps are visually marked as complete (checkmark or filled state)
  - [ ] Future (locked) steps are visually dimmed or grayed out
  - [ ] The indicator does not consume excessive vertical space (max ~60px height)
- **Maps to Gherkin:** SC-WS-2, SC-WS-3

---

### US-WS-3 -- Go back to a previous step

- **Story:** As a **Builder PM**, I want to click on a completed step to go back and review or modify my earlier answers, so that I can correct mistakes or add information I forgot without restarting the entire session.
- **Priority:** MUST
- **Why:** A wizard that only moves forward forces the PM to start over if they realize at step 3 that their step 1 framing was wrong. This wastes time and creates frustration -- the opposite of the "fast validation" promise. `[Assumption]` -- backward navigation is expected UX for wizards, but whether PMs actually use it needs measurement via PostHog.
- **Acceptance criteria:**
  - [ ] Clicking on a completed step navigates back to that step's conversation state
  - [ ] The conversation panel shows the messages from the selected step
  - [ ] The PRD panel continues to show the full accumulated PRD (not just that step's blocks)
  - [ ] Clicking on the current step has no effect (already there)
  - [ ] Clicking on a future (uncompleted) step has no effect (locked)
  - [ ] The step indicator updates to reflect the currently viewed step
  - [ ] No data is lost when navigating backward
- **Maps to Gherkin:** SC-WS-4, SC-WS-5

---

### US-WS-4 -- Scroll panels independently

- **Story:** As a **Builder PM**, I want to scroll the conversation panel and the PRD panel independently, so that I can read a long PRD section while keeping my place in the conversation, or vice versa.
- **Priority:** MUST
- **Why:** As the session progresses, both panels accumulate content. If they share a single scroll, the PM loses context constantly -- scrolling to read the PRD means losing their place in the conversation. Independent scroll is what makes the split-view usable for sessions longer than a few minutes. `[Evidence]` -- standard UX for dual-pane interfaces (email clients, IDEs, etc.).
- **Acceptance criteria:**
  - [ ] Scrolling in the conversation panel does not affect the PRD panel's scroll position
  - [ ] Scrolling in the PRD panel does not affect the conversation panel's scroll position
  - [ ] Both panels have their own scroll indicators (scrollbar or scroll shadow)
  - [ ] Each panel scrolls to accommodate content longer than the viewport height
  - [ ] On panels with no overflow, no scrollbar is shown (clean appearance)
- **Maps to Gherkin:** SC-WS-6

---

### US-WS-5 -- Use the wizard on a tablet

- **Story:** As a **Builder PM** on a tablet or narrow viewport, I want the wizard panels to stack vertically or switch via tabs, so that I can still complete the validation session even without a wide desktop screen.
- **Priority:** MUST
- **Why:** The split-view is a desktop-first experience, but PMs do use tablets -- especially during meetings or travel. A completely broken experience on tablet would lose users at the exact moment they are motivated to try the tool. `[Assumption]` -- the frequency of tablet usage is assumed; mobile is out of scope per PRD.
- **Acceptance criteria:**
  - [ ] On viewports < 1024px, the split-view collapses into a stacked or tabbed layout
  - [ ] In the responsive layout, the PM can switch between conversation and PRD views
  - [ ] If tabbed: the active tab is clearly indicated, and switching is instant (no page reload)
  - [ ] If stacked: both panels are fully visible by scrolling, with a clear visual separator
  - [ ] The step indicator remains visible and functional in the responsive layout
  - [ ] Touch targets meet minimum 44x44px size
  - [ ] No content is hidden or inaccessible in the responsive layout
- **Maps to Gherkin:** SC-WS-7, SC-WS-8
