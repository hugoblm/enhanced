# User Stories & JTBD -- Landing Page

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

## JTBD

> When I have a product idea I want to validate, I want to start the process immediately
> without creating an account or reading instructions, so I can go from "I have an idea" to
> "structured validation is running" in under 30 seconds.

---

## Personas

- **Builder PM** -- PM at a startup/scale-up, ships fast, tech-savvy, time-constrained. PRODUCER. Uses the landing page to start the wizard.
- **Stakeholder** -- CPO/CEO/lead who reviews PRDs. CONSUMER. May land on the homepage after hearing about Enhanced, but their primary entry is via shared PRD links, not the landing page.
- **Team Lead** -- Engineering lead who scopes work from PRDs. CONSUMER. Same as Stakeholder for landing page context.

---

## User stories

### US-LP-1 -- Pitch an idea and launch the wizard

- **Story:** As a **Builder PM**, I want to type my raw product idea into a textarea and click a single button, so that I am immediately taken into the validation wizard without any signup or configuration.
- **Priority:** MUST
- **Why:** The #1 adoption barrier for discovery tools is friction. Every extra step (signup, onboarding, configuration) is a point where a time-constrained PM abandons the tool and goes back to writing a quick Slack message instead. `[Evidence]` -- validated in Discovery: "discovery frameworks are too heavyweight for fast-moving teams."
- **Acceptance criteria:**
  - [ ] The landing page displays a textarea with placeholder text guiding the PM on what to write
  - [ ] A CTA button labeled "Lancer le cadrage" is visible below the textarea
  - [ ] Clicking the CTA with valid input (>= 20 characters) creates an anonymous session, generates a PRD skeleton, and redirects to `/session/[id]`
  - [ ] The redirect happens within 3 seconds of clicking (including server processing) `[To verify]`
  - [ ] No signup, login, or account creation is required at any point during this flow
  - [ ] The raw idea text is preserved and visible in the wizard after redirect
- **Maps to Gherkin:** SC-LP-1, SC-LP-2

---

### US-LP-2 -- Get clear feedback on invalid input

- **Story:** As a **Builder PM**, I want to see a clear error message if I try to submit an empty or too-short idea, so that I understand what is expected without feeling confused or blocked.
- **Priority:** MUST
- **Why:** An empty submit with no feedback creates confusion and erodes trust in the tool's quality. A short idea (< 20 chars) likely lacks enough context for the AI to work with. `[Assumption]` -- 20-char minimum is a heuristic; the right threshold needs user testing.
- **Acceptance criteria:**
  - [ ] Submitting with an empty textarea shows an inline error message (not an alert/popup)
  - [ ] Submitting with fewer than 20 characters shows a specific message indicating the minimum length
  - [ ] The error message disappears when the user starts typing valid content
  - [ ] The CTA button is visually disabled (opacity 50%) below the 20-char threshold but remains clickable via `aria-disabled` — clicking surfaces the inline error rather than silently failing
  - [ ] Once the typed value reaches ≥ 20 chars (after trim), the CTA returns to its normal active state
  - [ ] Focus returns to the textarea after an error so the user can immediately correct
- **Maps to Gherkin:** SC-LP-3, SC-LP-4

---

### US-LP-3 -- Access Enhanced from a tablet

- **Story:** As a **Builder PM** using a tablet (e.g., during a meeting or commute), I want the landing page to be usable and readable, so that I can start a validation session from any device I have at hand.
- **Priority:** MUST
- **Why:** PMs at startups often work across devices. A landing page that breaks on tablet kills the "instant start" promise. `[Assumption]` -- tablet usage frequency for PMs is assumed, not measured. Mobile is explicitly out of scope per PRD.
- **Acceptance criteria:**
  - [ ] The textarea and CTA button are fully visible without horizontal scrolling on viewports >= 768px wide
  - [ ] Touch targets (CTA button) meet minimum 44x44px size
  - [ ] Text is readable without zooming (base font size >= 16px)
  - [ ] The layout adapts gracefully between 768px and 1440px viewport widths
- **Maps to Gherkin:** SC-LP-7

---

### US-LP-4 -- Understand what Enhanced does before typing

- **Story:** As a **Builder PM** visiting Enhanced for the first time, I want to understand in one sentence what this tool does and why I should use it, so that I feel confident investing the next 30 seconds to type my idea.
- **Priority:** MUST
- **Why:** A textarea without context is meaningless. The value proposition must be instantly clear for a first-time visitor who has never heard of Enhanced. `[Evidence]` -- standard UX principle; also, the webinar will drive traffic from PMs who heard a pitch but need a reminder on the page itself.
- **Acceptance criteria:**
  - [ ] A value proposition sentence is visible above the textarea without scrolling on desktop (above the fold)
  - [ ] The sentence communicates: (a) what you do (pitch an idea), (b) what you get (a challenged draft PRD), (c) why it matters (know what you know vs. what you assume)
  - [ ] The copy is concise -- no more than 2 sentences for the primary value prop `[To verify]` -- final copy to be determined
  - [ ] No jargon that a non-technical PM wouldn't understand
- **Maps to Gherkin:** SC-LP-8
