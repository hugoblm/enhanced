# User Stories & JTBD -- Block Refinement

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

## JTBD

> When I see a PRD section that doesn't capture my intent accurately or needs more detail,
> I want to refine just that section with a natural language instruction, so I can iterate
> on specific parts without regenerating the entire document or restarting the conversation.

---

## Personas

- **Builder PM** -- PM at a startup/scale-up, ships fast, tech-savvy, time-constrained. PRODUCER. Directly interacts with the refine popover to improve PRD blocks.
- **Stakeholder** -- CPO/CEO/lead who reviews PRDs. CONSUMER. Does not refine blocks directly in V1. Benefits indirectly because the PM can address their feedback by refining specific sections.
- **Team Lead** -- Engineering lead who scopes work from PRDs. CONSUMER. Same as Stakeholder -- benefits from a more precise PRD but does not use block refinement directly.

---

## User stories

### US-BR-1 -- Refine a PRD block with a natural language instruction

- **Story:** As a **Builder PM**, I want to hover over a PRD block, click a "Refine" button, and type a natural language instruction describing what to change, so that the AI regenerates only that block according to my instruction while leaving the rest of the PRD intact.
- **Priority:** MUST
- **Why:** A one-shot PRD that cannot be iterated is a demo, not a tool. PMs need to adjust tone, add context, shorten sections, or correct inaccuracies without losing the work already done in other blocks. `[Evidence]` -- PRD section 5: "Iteration is what separates a tool from a one-shot generator."
- **Acceptance criteria:**
  - [ ] Hovering over any PRD block reveals a "Refine" button (icon or text) `[To verify]` -- exact visual treatment TBD
  - [ ] Clicking the button opens a popover anchored to that block
  - [ ] The popover contains a textarea for the refinement instruction and a submit button
  - [ ] Submitting sends a request with `{ prd_id, block_id, instruction }` to the AI
  - [ ] Only the targeted block is regenerated -- all other blocks remain unchanged
  - [ ] The block content updates in-place when the AI response is complete
  - [ ] The popover closes automatically after successful refinement
  - [ ] The refinement exchange (instruction + AI response) appears in the conversation panel
- **Maps to Gherkin:** SC-BR-1, SC-BR-2

---

### US-BR-2 -- See the block update in real time during refinement

- **Story:** As a **Builder PM**, I want to see the block content update progressively as the AI generates its response (streaming), so that I get immediate feedback and can assess whether the refinement is heading in the right direction.
- **Priority:** MUST
- **Why:** A spinner followed by a sudden content swap feels like a black box. Streaming builds confidence that the AI understood the instruction and lets the PM mentally prepare for the result. `[Assumption]` -- streaming preference is inferred from modern AI UX patterns (ChatGPT, Claude); not validated specifically for block refinement.
- **Acceptance criteria:**
  - [ ] While the AI is generating, the block content updates progressively (token by token or chunk by chunk)
  - [ ] A loading indicator is visible on the block during generation (e.g., pulsing border, shimmer, or spinner)
  - [ ] The loading indicator disappears when generation is complete
  - [ ] The user can scroll the PRD panel while a block is being refined
  - [ ] If the AI response is longer than the original block, the block expands smoothly without layout jumps
- **Maps to Gherkin:** SC-BR-3

---

### US-BR-3 -- Refine with specific instruction types

- **Story:** As a **Builder PM**, I want the refinement to handle diverse instruction types -- shortening ("raccourcis"), adding context ("ajoute le contexte B2C"), changing tone ("plus formel"), adding specifics ("ajoute des metriques") -- so that I have flexible control over the PRD output without needing to learn specific commands.
- **Priority:** MUST
- **Why:** Natural language refinement only works if the AI can interpret varied instructions correctly. If the PM has to guess the "right" phrasing, the feature becomes a source of friction rather than empowerment. `[Assumption]` -- the AI's ability to handle diverse instructions depends on prompt engineering quality; needs testing with real instructions.
- **Acceptance criteria:**
  - [ ] The instruction "raccourcis" produces a shorter version of the block
  - [ ] The instruction "ajoute le contexte B2C" incorporates B2C context into the block
  - [ ] The instruction "plus formel" shifts the tone to more formal language
  - [ ] The instruction "ajoute des metriques" adds quantitative metrics or KPIs to the block
  - [ ] Evidence tags (`[Evidence]`, `[Assumption]`, `[To verify]`) are preserved or updated appropriately after refinement
  - [ ] The block structure (heading, paragraphs, lists) is maintained unless the instruction explicitly requests a structural change
- **Maps to Gherkin:** SC-BR-4, SC-BR-5

---

### US-BR-4 -- Handle refinement errors gracefully

- **Story:** As a **Builder PM**, I want to see a clear error message if the refinement fails (network error, AI error), with the original block content preserved, so that I never lose work and can retry or move on.
- **Priority:** MUST
- **Why:** AI calls fail. Networks drop. If a failed refinement silently corrupts or blanks a block, the PM loses trust in the tool permanently. Error resilience is a baseline requirement for any tool that modifies user-facing content. `[Evidence]` -- standard reliability principle for write operations.
- **Acceptance criteria:**
  - [ ] If the AI request fails (network error, timeout, API error), the block reverts to its pre-refinement content
  - [ ] An error message is displayed near the block or in the popover (not a generic page-level alert)
  - [ ] The error message suggests a next action ("Reessayer" button or instruction to try again)
  - [ ] The popover remains open with the instruction preserved so the user can retry without retyping
  - [ ] The conversation panel shows an error entry for the failed refinement (not silently swallowed)
  - [ ] Multiple rapid refinement attempts on the same block do not cause race conditions or content corruption
- **Maps to Gherkin:** SC-BR-6, SC-BR-7
