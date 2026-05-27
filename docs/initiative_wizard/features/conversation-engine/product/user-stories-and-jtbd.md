# User Stories & JTBD -- Conversation Engine

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

## JTBD

> When I have a feature idea and I am about to commit engineering resources, I want an AI
> to rigorously challenge whether the idea is worth building -- asking me hard questions,
> forcing me to distinguish evidence from assumptions, and scoring my risks -- so I can
> produce a transparent draft PRD that tells my team exactly what we know, what we assume,
> and what we need to prove before writing code.

---

## Personas

- **Builder PM** -- PM at a startup/scale-up, ships fast, tech-savvy, time-constrained. PRODUCER. Drives the conversation, answers questions, pushes back on the AI.
- **Stakeholder** -- CPO/CEO/lead who reviews PRDs. CONSUMER. Does not interact with the conversation engine directly; consumes the output PRD.
- **Team Lead** -- Engineering lead who scopes work from PRDs. CONSUMER. Reads the risk assessments and feasibility scores produced by the engine.

---

## User stories

### US-CE-1 -- Answer a free text question

- **Story:** As a **Builder PM**, I want to type a free-form response to the AI's question in a text area, so that I can provide context-specific answers that don't fit predefined options.
- **Priority:** MUST
- **Why:** The conversation starts with the PM pitching their idea in their own words. Free text is the default interaction mode -- structured cards are the exception, used when the AI needs a specific data type. Forcing structured input for everything would feel rigid and survey-like. `[Evidence]` -- PRD risk R2: "ask_user card interaction feels rigid or survey-like" is mitigated by defaulting to free text and limiting consecutive cards.
- **Acceptance criteria:**
  - [ ] The AI can invoke `ask_user` with `card_type: 'free_text'`
  - [ ] The card renders as a text area with a placeholder from the tool call parameters
  - [ ] The PM can type multi-line, multi-paragraph responses
  - [ ] Submitting the response sends it back to the AI as a tool result
  - [ ] The AI processes the response and continues the conversation
  - [ ] The submitted answer is visible in the conversation history as a user message
- **Maps to Gherkin:** SC-CE-1

---

### US-CE-2 -- Select from a single choice card

- **Story:** As a **Builder PM**, I want to pick one option from a list of 4-5 choices the AI presents, so that I can answer structured questions quickly without typing when the AI needs a categorical answer.
- **Priority:** MUST
- **Why:** Some questions have a finite set of meaningful answers (e.g., "What type of users are you targeting?" with options like B2B, B2C, internal, marketplace). Single choice speeds up the conversation and gives the AI structured data to work with. `[Assumption]` -- the 4-5 option count is a design heuristic; real conversations may need fewer or more options. The "Other -- specify" escape hatch mitigates this.
- **Acceptance criteria:**
  - [ ] The AI can invoke `ask_user` with `card_type: 'single_choice'` and an `options` array
  - [ ] Each option renders with a label and optional description
  - [ ] An "Other -- specify" option with a textarea is always appended to the options list
  - [ ] Clicking an option selects it (radio-button behavior -- only one selected at a time)
  - [ ] Submitting the selected option sends the choice back to the AI as a tool result
  - [ ] If "Other -- specify" is selected, the PM must enter text before submitting
  - [ ] The selected answer is visible in the conversation history
- **Maps to Gherkin:** SC-CE-2, SC-CE-3

---

### US-CE-3 -- Select from a multi-choice card

- **Story:** As a **Builder PM**, I want to check multiple options from a list the AI presents, so that I can indicate all relevant items when the question allows more than one answer (e.g., "Which data sources do you currently have access to?").
- **Priority:** MUST
- **Why:** Some questions are inherently multi-select (data sources, user segments, risk factors). Forcing single selection would lose information. `[Evidence]` -- the PRD specifies 5 card types including multi choice as a MUST requirement.
- **Acceptance criteria:**
  - [ ] The AI can invoke `ask_user` with `card_type: 'multi_choice'` and an `options` array
  - [ ] Each option renders with a checkbox, label, and optional description
  - [ ] An "Other -- specify" option with a textarea is always appended
  - [ ] The PM can select zero or more options (at least one required to submit)
  - [ ] Submitting sends all selected options back to the AI as a tool result
  - [ ] If "Other -- specify" is checked, the PM must enter text before submitting
  - [ ] The selected answers are visible in the conversation history
- **Maps to Gherkin:** SC-CE-4, SC-CE-5

---

### US-CE-4 -- Rate on a scale

- **Story:** As a **Builder PM**, I want to rate something on a 1-5 scale with labeled endpoints (e.g., "How confident are you in the technical feasibility? 1 = Not at all, 5 = Very confident"), so that the AI can collect quantitative risk signals and I can see my own confidence levels objectively.
- **Priority:** MUST
- **Why:** Step 3 (Risk Challenge) systematically evaluates 4 risks. Scale cards turn subjective risk assessments into comparable, recordable scores. This is how the global confidence score is computed. `[Evidence]` -- PRD feature spec: "For each risk: analysis + score via scale cards."
- **Acceptance criteria:**
  - [ ] The AI can invoke `ask_user` with `card_type: 'scale'` and a `scale_config` object
  - [ ] The scale renders as 5 selectable points (1 through 5)
  - [ ] `min_label` is displayed at 1 and `max_label` is displayed at 5
  - [ ] Clicking a point selects it (only one selected at a time)
  - [ ] The selected value is visually highlighted
  - [ ] Submitting sends the numeric value back to the AI as a tool result
  - [ ] The rating is visible in the conversation history with its label context
- **Maps to Gherkin:** SC-CE-6

---

### US-CE-5 -- Confirm or reject an AI reformulation

- **Story:** As a **Builder PM**, I want to confirm that the AI's reformulation of my idea is accurate, or choose to reformulate or clarify, so that the AI does not proceed with a misunderstanding of my problem.
- **Priority:** MUST
- **Why:** Step 1 ends with the AI reformulating the PM's raw idea as a structured "First Use Case." If the reformulation is wrong and the PM cannot correct it, every subsequent step builds on a false foundation. The confirmation card is the quality gate between step 1 and step 2. `[Evidence]` -- PRD step 1 spec: "AI reformulates as First Use Case. Challenge: is this a problem or a solution in disguise?"
- **Acceptance criteria:**
  - [ ] The AI can invoke `ask_user` with `card_type: 'confirmation'` and a `confirmation_text`
  - [ ] The confirmation text is rendered prominently (the AI's reformulation)
  - [ ] Three options are presented: "Yes, this is accurate" / "Reformulate" / "Clarify"
  - [ ] Selecting "Yes" sends confirmation back to the AI and the conversation proceeds
  - [ ] Selecting "Reformulate" opens a text area where the PM provides a corrected version
  - [ ] Selecting "Clarify" opens a text area where the PM adds missing context
  - [ ] The AI processes the response and either accepts or iterates further
- **Maps to Gherkin:** SC-CE-7, SC-CE-8

---

### US-CE-6 -- Understand WHY a question is asked

- **Story:** As a **Builder PM**, I want every structured card to be preceded by a brief message explaining why the AI is asking this question, so that I understand the reasoning and don't feel like I'm filling out a survey.
- **Priority:** MUST
- **Why:** A card without context feels like a compliance form. The "why" message is the difference between a tool that guides and a tool that interrogates. It builds trust and keeps the PM engaged. `[Evidence]` -- PRD MUST requirement: "every card preceded by message explaining WHY the question is asked." Also mitigates risk R2: "ask_user card interaction feels rigid or survey-like."
- **Acceptance criteria:**
  - [ ] Every `ask_user` tool call is preceded by a text message from the AI explaining the purpose of the question
  - [ ] The explanatory message is conversational, not formulaic (varies per question)
  - [ ] The message appears in the conversation flow before the card renders
  - [ ] The message is visible even after the card is answered (it persists in the conversation history)
  - [ ] The maximum number of consecutive cards without a free text break is 2-3
- **Maps to Gherkin:** SC-CE-9, SC-CE-10

---

### US-CE-7 -- Complete a wizard step and advance

- **Story:** As a **Builder PM**, I want to know when I have completed a wizard step and be advanced to the next one, so that I can track my progress and understand that the process is structured into phases.
- **Priority:** MUST
- **Why:** The 4-step structure is what makes Enhanced a wizard, not a chatbot. Without step boundaries, the PM has no sense of progress and no assurance that all necessary topics have been covered. `[Evidence]` -- PRD: step progression is server-authoritative (`sessions.current_step`), with minimum completion per step validated server-side.
- **Acceptance criteria:**
  - [ ] When the AI determines a step is complete, the server validates minimum completion requirements
  - [ ] If requirements are met, `sessions.current_step` is incremented
  - [ ] The step indicator in the wizard shell updates to reflect the new step
  - [ ] The AI sends a transitional message summarizing what was accomplished in the completed step
  - [ ] The AI begins the next step with its dedicated system prompt
  - [ ] The PM cannot manually skip steps (progression is AI-driven and server-validated)
  - [ ] Step 4 completion triggers a "PRD complete" state with export/share options
- **Maps to Gherkin:** SC-CE-11, SC-CE-12, SC-CE-13

---

### US-CE-8 -- Receive pushback from the AI

- **Story:** As a **Builder PM**, I want the AI to challenge my assumptions and push back when my reasoning has gaps, so that the output PRD genuinely reflects honest assessment rather than my confirmation bias.
- **Priority:** MUST
- **Why:** This is the entire product thesis. If the AI agrees with everything the PM says, Enhanced is just another PRD generator -- and general-purpose ChatGPT does that for free. The pushback mechanism is the reason Enhanced exists. `[Evidence]` -- PRD Problem 4: "PRD generators produce agreeable documents, not challenged ones." Discovery validated this as the core differentiation.
- **Acceptance criteria:**
  - [ ] When the PM makes an unsubstantiated claim, the AI tags it `[Assumption]` and asks for evidence
  - [ ] When the PM describes a solution instead of a problem, the AI challenges: "Is this a problem or a solution in disguise?"
  - [ ] When risk scores are high, the AI explicitly recommends "test first" or "abandon" rather than rubber-stamping
  - [ ] The AI's pushback is constructive, not hostile -- it explains its reasoning
  - [ ] The PM can push back against the AI's pushback, providing additional context or evidence
  - [ ] If the PM provides convincing evidence, the AI updates its assessment
  - [ ] The pushback-and-response exchange is visible in the conversation history
  - [ ] Evidence tags (`[Evidence]`, `[Assumption]`, `[To verify]`) are consistently applied throughout
- **Maps to Gherkin:** SC-CE-14, SC-CE-15, SC-CE-16

---

## Out of scope (non-stories)

- **Conversation branching / undo** -- The PM cannot branch the conversation into alternate paths or undo specific messages. `[To verify]` -- may be needed post-V1 if user tests show PMs frequently want to retract a statement.
- **Model selection UI** -- The PM cannot choose which AI model is used. The model is configured server-side via OpenRouter.
- **Conversation export** -- No way to export the raw conversation as a transcript in V1. The PRD is the export artifact.
- **Voice input** -- No speech-to-text integration. PMs type their responses.
- **MCP analytics connections** -- Step 2 (Data Validation) is manual in V1. The AI guides the PM on what data to look for but does not pull data from analytics tools directly. `[Evidence]` -- PRD out of scope: "MCP analytics connections deferred because the wizard UX must prove itself before adding data integrations."

> Challenge: Does every MUST story trace to a verified problem in the PRD/Discovery? Does
> every story have at least one acceptance criterion that a test could check? If not, fix it
> before it reaches engineering.
>
> Traceability:
> - US-CE-1 (free text) -> PRD card type spec + risk R2 mitigation
> - US-CE-2 (single choice) -> PRD card type spec (MUST)
> - US-CE-3 (multi choice) -> PRD card type spec (MUST)
> - US-CE-4 (scale) -> PRD step 3 risk scoring spec
> - US-CE-5 (confirmation) -> PRD step 1 reformulation + quality gate
> - US-CE-6 (why message) -> PRD guard rails spec + risk R2 mitigation
> - US-CE-7 (step completion) -> PRD step progression spec
> - US-CE-8 (pushback) -> PRD Problem 4 (core differentiation)
>
> Every story traces. Every story has testable acceptance criteria.
