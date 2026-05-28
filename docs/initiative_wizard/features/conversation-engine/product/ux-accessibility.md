# UX & Accessibility -- Conversation Engine

> UX flows, interaction patterns, and WCAG 2.1 AA accessibility requirements for the
> conversation engine.

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

## Primary flow: Full wizard conversation

```
PM arrives at wizard (from landing page redirect)
  |
  v
[Step 1 - Problem Framing]
  AI reads initial idea → challenges problem vs. solution
  → free text + single choice cards → PM answers
  → AI synthesizes First Use Case → confirmation card
  → PM confirms / reformulates / clarifies
  → update_prd: first_use_case, problem_context
  → Server validates minimum blocks → advance to step 2
  |
  v
[Step 2 - Data Validation]
  AI asks about data sources → multi choice card
  → For each claim: asks for evidence → tags [Evidence] / [Assumption] / [To verify]
  → AI guides what data to collect for unknowns
  → update_prd: data_signals
  → Server validates → advance to step 3
  |
  v
[Step 3 - Risk Challenge]
  AI evaluates 4 risks in sequence:
    Value → analysis + scale card (1-5) → PM rates → AI responds
    Usability → analysis + scale card → PM rates → AI responds
    Feasibility → analysis + scale card → PM rates → AI responds
    Viability → analysis + scale card → PM rates → AI responds
  → update_prd: risk_value, risk_usability, risk_feasibility, risk_viability
  → AI computes confidence score → update_prd: confidence_score
  → Explicit recommendation: build / test first / abandon
  → Server validates → advance to step 4
  |
  v
[Step 4 - Final PRD]
  AI finalizes: success_criteria → kill_criteria → next_steps → executive_summary
  → Reviews and tightens existing blocks
  → update_prd for each block
  → Server validates all 12 blocks present
  → "PRD complete" state → export/share UI appears
```

---

## Sub-flow: Answering an ask_user card

```
AI sends explanatory message (WHY)
  |
  v
ask_user tool call renders card
  |
  v
PM interacts with card:
  [free_text]     → type in textarea → submit
  [single_choice] → click option (radio) → submit
  [multi_choice]  → check options (checkboxes) → submit
  [scale]         → click rating point → submit
  [confirmation]  → click Yes / Reformulate / Clarify
                    → if Reformulate or Clarify: textarea → submit
  |
  v
Validation:
  - Free text: non-empty
  - Single choice: one option selected; if "Other", text required
  - Multi choice: at least one selected; if "Other" checked, text required
  - Scale: one point selected
  - Confirmation: one of three options; if Reformulate/Clarify, text required
  |
  v
[Valid] → response sent as tool result → card enters read-only state → AI continues
[Invalid] → inline error shown → focus returns to input → card stays editable
```

---

## Error flow: AI failure during conversation

```
PM sends a message
  |
  v
API call to POST /api/chat
  |
  +--> [Success] → AI response streams → conversation continues
  |
  +--> [API error / timeout]
        |
        v
       Error message shown inline in conversation panel
       "The AI service is temporarily unavailable. Please try again."
        |
        v
       "Retry" button shown below error message
        |
        v
       PM clicks Retry → re-sends the original request
        |
        +--> [Success] → conversation resumes normally
        +--> [Failure] → error message updated, Retry remains available
```

---

## UX requirements

### Conversation panel

- **Chat input:** Text area at the bottom of the conversation panel with a send button. Expands vertically for multi-line input (max 6 lines before scrolling internally). `[Evidence]` -- standard chat UX pattern.
- **Chat input disabled during card:** When an `ask_user` card is awaiting a response, the chat input is disabled with a hint: "Please answer the question above before continuing." `[Assumption]` -- this prevents ambiguity about whether the PM is answering the card or sending a free message.
- **Streaming indicator:** A subtle typing indicator (animated dots or pulsing avatar) appears when the AI is generating a response. Disappears when streaming begins.
- **Message bubbles:** User messages right-aligned, AI messages left-aligned. AI messages use a slightly different background to distinguish. Timestamps visible on hover. `[Evidence]` -- standard chat UX convention.
- **Auto-scroll:** Conversation auto-scrolls to the bottom when new messages arrive. If the PM has scrolled up (reading history), auto-scroll pauses until the PM scrolls back to the bottom. `[Assumption]` -- standard chat behavior.

### Card rendering

- **Card placement:** Cards render inline in the conversation flow, at the position where the AI invoked the tool. They are part of the conversation, not a separate overlay.
- **Card visual distinction:** Cards have a distinct background color (card surface from Obra tokens), a subtle border, and padding to visually distinguish them from regular messages.
- **Card states:**
  - **Active:** Interactive, PM can select/type. Highlighted border.
  - **Submitted:** Read-only, shows the PM's answer. Muted border. A checkmark or "Submitted" label.
  - **Error:** Red border + inline error text below the interactive element.
- **"Other -- specify" placement:** Always the last option in single/multi choice cards. Selecting it reveals a textarea below. `[Evidence]` -- PRD MUST: every card includes "Other -- specify" where applicable.

### Step transitions

- **Transition message:** When a step completes, the AI sends a visually distinct transition message (different background or a separator line) summarizing what was accomplished.
- **Step indicator update:** The step indicator in the wizard shell header updates immediately. The completed step gets a checkmark. The new step pulses briefly to draw attention.
- **No hard page transition:** Step transitions happen within the same conversation view. No page reload, no route change. The conversation is continuous.

---

## WCAG 2.1 AA requirements

### Perceivable

| Requirement | Implementation | Guideline |
|-------------|----------------|-----------|
| Text contrast | All text meets 4.5:1 contrast ratio against its background (7:1 for small text). Card backgrounds, message bubbles, and error text included. | 1.4.3 Contrast (Minimum) |
| Non-text contrast | Card borders, scale points, radio buttons, checkboxes meet 3:1 contrast ratio against adjacent colors. | 1.4.11 Non-text Contrast |
| Evidence tag colors | Green ([Evidence]), amber ([Assumption]), red ([To verify]) badges are not color-only -- each includes the text label. | 1.4.1 Use of Color |
| Streaming text | Streaming text does not cause content to shift or jump. New text appends at the bottom of the streaming message, not at the top. | 1.4.13 Content on Hover or Focus |
| Error identification | Error messages are text-based ("Please select at least one option"), not color-only (red border alone is insufficient). | 1.3.1 Info and Relationships |

### Operable

| Requirement | Implementation | Guideline |
|-------------|----------------|-----------|
| Keyboard navigation | All card types are fully operable via keyboard. Tab navigates between options, Space/Enter selects, Tab reaches the submit button. | 2.1.1 Keyboard |
| Focus management | When a card renders, focus moves to the first interactive element. After submission, focus moves to the next conversational element. | 2.4.3 Focus Order |
| Focus visible | All interactive elements (options, buttons, text areas, scale points) show a visible focus ring. | 2.4.7 Focus Visible |
| Touch targets | All interactive elements are at least 44x44px on touch devices (options, submit button, scale points). | 2.5.5 Target Size |
| No keyboard traps | The PM can tab through all card elements and past the card (to the chat input) without getting trapped. | 2.1.2 No Keyboard Trap |
| Skip to content | A skip link allows keyboard users to jump past the step indicator and header directly to the conversation content. | 2.4.1 Bypass Blocks |

### Understandable

| Requirement | Implementation | Guideline |
|-------------|----------------|-----------|
| Error suggestion | Inline errors describe the problem and how to fix it: "Please select at least one option" (not "Error"). | 3.3.3 Error Suggestion |
| Labels | All form inputs (text areas, scale points) have visible labels or aria-label. Scale endpoints have min_label and max_label as visible text. | 3.3.2 Labels or Instructions |
| Consistent navigation | Card submit buttons are always in the same relative position (bottom-right of the card). The chat input is always at the bottom of the panel. | 3.2.3 Consistent Navigation |
| Language | The AI's conversational text and all UI labels are in the same language (French for the primary audience). | 3.1.1 Language of Page |

### Robust

| Requirement | Implementation | Guideline |
|-------------|----------------|-----------|
| ARIA roles | Cards use appropriate ARIA roles: `role="radiogroup"` for single choice, `role="group"` for multi choice, `role="slider"` for scale. | 4.1.2 Name, Role, Value |
| Live regions | Streaming AI messages use `aria-live="polite"` so screen readers announce new content without interrupting. | 4.1.3 Status Messages |
| Error announcements | Error messages on card submission use `role="alert"` for immediate announcement. | 4.1.3 Status Messages |
| Card state | Submitted cards use `aria-disabled="true"` to communicate the read-only state. | 4.1.2 Name, Role, Value |

---

## A11y checklist (pre-release)

- [ ] All 5 card types can be completed using only keyboard (no mouse)
- [ ] Tab order is logical: card options -> submit button -> chat input
- [ ] Focus ring is visible on all interactive elements against all backgrounds
- [ ] All text meets 4.5:1 contrast (run Lighthouse or axe scan)
- [ ] Evidence tag colors have text labels (not color-only)
- [ ] Screen reader (VoiceOver) can navigate through a conversation, hear card options, and submit
- [ ] Streaming messages are announced via aria-live="polite"
- [ ] Error messages on cards are announced via role="alert"
- [ ] All touch targets are >= 44x44px
- [ ] Scale points are keyboard-accessible (arrow keys to navigate, Enter to select)
- [ ] Skip link works to jump to conversation content
- [ ] No horizontal scroll at any viewport width >= 768px
