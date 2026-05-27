# Gherkin Tests -- Conversation Engine

> Acceptance scenarios in Given/When/Then. Each scenario traces to a user story and is
> designed to be automatable. Scenarios cover all 5 card types, step completion, step
> transitions, AI pushback, evidence tagging, guard rails, and error states.

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

## Feature: Free text interaction

### SC-CE-1 -- PM answers a free text question

> Traces to: US-CE-1

```gherkin
Feature: Free text interaction

  Background:
    Given a Builder PM has an active wizard session at step 1
    And the AI has sent a message followed by an ask_user tool call with card_type "free_text"

  Scenario: PM submits a free text response
    Given the free text card is displayed with placeholder "Describe your target users..."
    When the PM types "B2B SaaS product managers at startups with 10-50 employees who manage feature backlogs"
    And the PM clicks the submit button
    Then the response is sent to the AI as a tool result
    And the PM's answer appears in the conversation history as a user message
    And the AI sends a follow-up message within 10 seconds
    And the free text card is no longer editable (submitted state)

  Scenario: PM submits an empty free text response
    Given the free text card is displayed
    When the PM clicks the submit button without typing anything
    Then an inline error message is shown: "Please provide a response"
    And the response is not sent to the AI
    And focus remains on the text area
```

---

## Feature: Single choice interaction

### SC-CE-2 -- PM selects an option from single choice card

> Traces to: US-CE-2

```gherkin
Feature: Single choice interaction

  Background:
    Given a Builder PM has an active wizard session
    And the AI has sent an ask_user tool call with card_type "single_choice"
    And options are:
      | id          | label              | description                    |
      | b2b_saas    | B2B SaaS           | Software for other businesses  |
      | b2c_app     | B2C Consumer App   | Direct-to-consumer application |
      | marketplace | Marketplace        | Two-sided platform             |
      | internal    | Internal Tool      | For your own team              |

  Scenario: PM selects a predefined option
    Given the single choice card is displayed with 4 options plus "Other -- specify"
    When the PM clicks "B2B SaaS"
    Then only "B2B SaaS" is visually selected (radio behavior)
    When the PM clicks the submit button
    Then the response "b2b_saas" is sent to the AI as a tool result
    And the selected answer "B2B SaaS" appears in the conversation history
    And the card enters submitted state (not editable)
```

### SC-CE-3 -- PM uses "Other -- specify" on single choice

> Traces to: US-CE-2

```gherkin
  Scenario: PM selects "Other -- specify" and provides custom answer
    Given the single choice card is displayed
    When the PM clicks "Other -- specify"
    Then a textarea appears below the "Other" option
    When the PM types "Developer tools / API platform"
    And the PM clicks the submit button
    Then the response includes the custom text "Developer tools / API platform"
    And the answer appears in the conversation history

  Scenario: PM selects "Other -- specify" without providing text
    Given the single choice card is displayed
    When the PM clicks "Other -- specify"
    And the PM clicks the submit button without typing in the textarea
    Then an inline error is shown: "Please specify your answer"
    And the response is not sent to the AI
```

---

## Feature: Multi choice interaction

### SC-CE-4 -- PM selects multiple options

> Traces to: US-CE-3

```gherkin
Feature: Multi choice interaction

  Background:
    Given a Builder PM has an active wizard session at step 2
    And the AI has sent an ask_user tool call with card_type "multi_choice"
    And options are:
      | id              | label                  | description                          |
      | user_interviews | User interviews        | Direct conversations with users      |
      | analytics       | Product analytics      | PostHog / Mixpanel / Amplitude data  |
      | support_tickets | Support tickets        | Zendesk / Intercom complaint data    |
      | sales_feedback  | Sales team feedback    | Anecdotal evidence from sales calls  |
      | surveys         | User surveys           | NPS, CSAT, or custom surveys         |

  Scenario: PM selects multiple options
    Given the multi choice card is displayed with 5 options plus "Other -- specify"
    When the PM checks "User interviews"
    And the PM checks "Product analytics"
    And the PM checks "Support tickets"
    And the PM clicks the submit button
    Then the response includes ["user_interviews", "analytics", "support_tickets"]
    And all three selected answers appear in the conversation history
    And the card enters submitted state

  Scenario: PM tries to submit with no options selected
    Given the multi choice card is displayed
    When the PM clicks the submit button without selecting any option
    Then an inline error is shown: "Please select at least one option"
    And the response is not sent to the AI
```

### SC-CE-5 -- PM uses "Other -- specify" on multi choice

> Traces to: US-CE-3

```gherkin
  Scenario: PM selects options including "Other -- specify"
    Given the multi choice card is displayed
    When the PM checks "User interviews"
    And the PM checks "Other -- specify"
    And a textarea appears for the "Other" option
    And the PM types "Competitor analysis from G2 reviews"
    And the PM clicks the submit button
    Then the response includes ["user_interviews"] plus custom text "Competitor analysis from G2 reviews"
    And the answer appears in the conversation history
```

---

## Feature: Scale interaction

### SC-CE-6 -- PM rates on a 1-5 scale

> Traces to: US-CE-4

```gherkin
Feature: Scale interaction

  Background:
    Given a Builder PM has an active wizard session at step 3
    And the AI has sent an ask_user tool call with card_type "scale"
    And scale_config is:
      | min | max | min_label         | max_label      |
      | 1   | 5   | Not confident     | Very confident |

  Scenario: PM selects a scale value
    Given the scale card is displayed with 5 points labeled "Not confident" (1) to "Very confident" (5)
    When the PM clicks on point 3
    Then point 3 is visually highlighted
    And points 1-2 and 4-5 are not highlighted
    When the PM clicks the submit button
    Then the response "3" is sent to the AI as a tool result
    And the rating "3/5" appears in the conversation history with labels
    And the card enters submitted state

  Scenario: PM changes scale selection before submitting
    Given the PM has clicked point 2
    When the PM clicks point 4
    Then only point 4 is highlighted (previous selection cleared)
    When the PM clicks the submit button
    Then the response "4" is sent to the AI

  Scenario: PM tries to submit scale without selecting
    Given the scale card is displayed
    When the PM clicks the submit button without selecting any point
    Then an inline error is shown: "Please select a rating"
    And the response is not sent to the AI
```

---

## Feature: Confirmation interaction

### SC-CE-7 -- PM confirms a reformulation

> Traces to: US-CE-5

```gherkin
Feature: Confirmation interaction

  Background:
    Given a Builder PM has an active wizard session at step 1
    And the AI has sent an ask_user tool call with card_type "confirmation"
    And confirmation_text is "Your first use case: 'I am a PM at a B2B SaaS startup, and when I receive a feature request from sales, what matters most is knowing whether the underlying problem is real, but it turns out I have no structured way to challenge my own assumptions, and I end up either building on gut feeling or spending hours on a discovery doc nobody reads.'"

  Scenario: PM confirms the reformulation
    Given the confirmation card is displayed with the reformulation text
    And three buttons are shown: "Yes, this is accurate", "Reformulate", "Clarify"
    When the PM clicks "Yes, this is accurate"
    Then the confirmation is sent to the AI as a tool result with value "confirmed"
    And the conversation proceeds to the next question
    And the confirmed reformulation appears in the conversation history

  Scenario: PM reformulates
    Given the confirmation card is displayed
    When the PM clicks "Reformulate"
    Then a textarea appears with the label "Provide your corrected version"
    When the PM types "The real problem is not about time -- it's that I don't know what questions to ask myself. I need a framework, not just a faster way to write."
    And the PM clicks the submit button
    Then the response is sent to the AI with value "reformulate" and the new text
    And the AI processes the correction and may offer a new reformulation
```

### SC-CE-8 -- PM asks for clarification on a reformulation

> Traces to: US-CE-5

```gherkin
  Scenario: PM clarifies
    Given the confirmation card is displayed
    When the PM clicks "Clarify"
    Then a textarea appears with the label "What additional context should we add?"
    When the PM types "I forgot to mention: we also have a data team that could run queries if I knew what to ask for."
    And the PM clicks the submit button
    Then the response is sent to the AI with value "clarify" and the additional context
    And the AI integrates the clarification and may offer an updated reformulation
```

---

## Feature: Guard rails

### SC-CE-9 -- Every card has a "why" message

> Traces to: US-CE-6

```gherkin
Feature: Guard rails

  Scenario: AI explains why before showing a card
    Given a Builder PM has an active wizard session
    When the AI decides to ask a structured question via ask_user
    Then the AI first sends a text message explaining why this question matters
    And then the ask_user tool call renders the card
    And the explanatory message is visible above the card in the conversation
    And the message uses conversational tone (not "Question 3 of 10" style)

  Scenario Outline: WHY messages are contextual, not generic
    Given the AI is at step <step> asking about <topic>
    When the AI sends a card
    Then the preceding message references <context>

    Examples:
      | step | topic                     | context                                                    |
      | 1    | target user type          | understanding who has the problem to frame the use case    |
      | 2    | available data sources    | identifying what evidence exists vs. what is assumed       |
      | 3    | value risk confidence     | scoring how confident the PM is that users want this       |
      | 3    | feasibility risk          | assessing whether the team can realistically build this    |
```

### SC-CE-10 -- Maximum consecutive cards before free text

> Traces to: US-CE-6

```gherkin
  Scenario: AI respects the 3-card limit
    Given a Builder PM has an active wizard session
    And the AI has sent 3 consecutive ask_user cards without a free text break
    When the AI generates its next response
    Then the response is a free text message (not another card)
    And the message invites the PM to elaborate in their own words

  Scenario: Card count resets after free text exchange
    Given the AI has sent 2 consecutive cards
    And then sent a free text message
    And the PM responded with free text
    When the AI generates its next response
    Then the AI may send another card (counter reset to 0)
```

---

## Feature: Step progression

### SC-CE-11 -- Step 1 completion and transition to step 2

> Traces to: US-CE-7

```gherkin
Feature: Step progression

  Scenario: PM completes step 1 (Problem Framing)
    Given a Builder PM has an active wizard session at step 1
    And the AI has collected: the raw idea, target user, problem context, and first use case
    And the PM has confirmed the AI's reformulation via a confirmation card
    When the AI determines step 1 requirements are met
    Then the server validates that first_use_case and problem_context PRD blocks exist
    And sessions.current_step is updated from 1 to 2
    And the step indicator updates: step 1 shows completed, step 2 shows active
    And the AI sends a transitional message: "Step 1 complete. Here's what we established: [summary]. Now let's look at the evidence behind these claims."
    And the AI begins step 2 with the data validation system prompt
```

### SC-CE-12 -- Step 3 completion with risk scores

> Traces to: US-CE-7

```gherkin
  Scenario: PM completes step 3 (Risk Challenge)
    Given a Builder PM has an active wizard session at step 3
    And the AI has evaluated all 4 risks:
      | risk         | score |
      | Value        | 3     |
      | Usability    | 4     |
      | Feasibility  | 5     |
      | Viability    | 3     |
    And all 4 risk blocks have been written to the PRD via update_prd
    And a confidence_score block has been written
    When the AI determines step 3 requirements are met
    Then the server validates that risk_value, risk_usability, risk_feasibility, risk_viability, and confidence_score blocks exist
    And sessions.current_step is updated from 3 to 4
    And the AI sends a transitional message including the global confidence score and an explicit recommendation: "build" or "test first" or "abandon"
    And the AI begins step 4 with the final PRD system prompt
```

### SC-CE-13 -- Step 4 completion (PRD finalized)

> Traces to: US-CE-7

```gherkin
  Scenario: PM completes step 4 (Final PRD)
    Given a Builder PM has an active wizard session at step 4
    And the AI has finalized: success_criteria, kill_criteria, next_steps, and executive_summary blocks
    When the AI determines step 4 requirements are met
    Then the server validates that all 12 PRD block types are present
    And sessions.current_step is updated to "completed"
    And the AI sends a final message: "Your PRD is complete. Here's a summary of what we built together: [executive summary]. You can now export it as PDF or share it via a public link."
    And the PRD panel shows export and share buttons prominently
    And the wizard step indicator shows all 4 steps completed
```

---

## Feature: Minimum completion enforcement

### SC-CE-14 -- Step cannot advance without minimum requirements

> Traces to: US-CE-7, US-CE-8

```gherkin
Feature: Minimum completion enforcement

  Scenario: AI tries to advance step 1 without required blocks
    Given a Builder PM has an active wizard session at step 1
    And the AI has collected the raw idea but NOT the first use case
    When the AI attempts to advance to step 2
    Then the server rejects the step advancement
    And the AI receives feedback that first_use_case block is missing
    And the AI continues the step 1 conversation to collect the missing information
    And sessions.current_step remains 1
```

---

## Feature: AI pushback

### SC-CE-15 -- AI challenges an unsubstantiated claim

> Traces to: US-CE-8

```gherkin
Feature: AI pushback

  Scenario: PM makes an unsubstantiated claim
    Given a Builder PM has an active wizard session at step 2
    When the PM writes "80% of our users want this feature"
    Then the AI responds by questioning the claim:
      And the AI asks where the 80% figure comes from
      And the AI tags the claim as [Assumption] if no evidence is provided
      And the AI suggests how to verify: "Could you check your analytics for actual feature usage data?"
    And the evidence tag appears in the conversation and in the corresponding PRD block

  Scenario: PM provides evidence after being challenged
    Given the AI has challenged a claim as [Assumption]
    When the PM responds "I checked PostHog -- 847 out of 1,200 active users clicked 'Request feature X' in the last 30 days"
    Then the AI re-tags the claim as [Evidence] with the source cited
    And the corresponding PRD block is updated via update_prd with the evidence tag
```

### SC-CE-16 -- AI challenges a solution disguised as a problem

> Traces to: US-CE-8

```gherkin
  Scenario: PM pitches a solution instead of a problem
    Given a Builder PM has an active wizard session at step 1
    When the PM writes "We need to build a Slack integration so users can get notifications"
    Then the AI responds by challenging: "That sounds like a solution. What's the underlying problem? Why do users need notifications in Slack specifically?"
    And the AI does NOT accept the statement as the first use case
    And the AI guides the PM to describe the user's pain point and current workaround
```

---

## Feature: Evidence tagging

### SC-CE-17 -- Evidence tags applied throughout conversation

> Traces to: US-CE-8

```gherkin
Feature: Evidence tagging

  Scenario Outline: AI applies correct evidence tag based on claim type
    Given a Builder PM has an active wizard session
    When the PM makes a claim of type <claim_type>
    Then the AI tags it as <tag>

    Examples:
      | claim_type                                                        | tag           |
      | "We ran 15 user interviews and 12 mentioned this pain point"     | [Evidence]    |
      | "I think most users would prefer a dashboard over email reports" | [Assumption]  |
      | "We haven't measured churn for this segment yet"                 | [To verify]   |
      | "Our NPS score dropped from 45 to 32 last quarter"              | [Evidence]    |
      | "Competitors probably have this feature"                        | [Assumption]  |

  Scenario: Evidence tags carry into PRD blocks
    Given the AI has tagged a claim as [Evidence] during conversation
    When the AI writes the corresponding PRD block via update_prd
    Then the block's evidence_tags JSONB includes the [Evidence] tag
    And the tag is visible as a green badge in the PRD panel
```

---

## Feature: Streaming and real-time behavior

### SC-CE-18 -- Responses stream in real time

```gherkin
Feature: Streaming

  Scenario: AI response streams token by token
    Given a Builder PM has an active wizard session
    When the AI generates a response
    Then the response text appears incrementally in the conversation panel (streaming)
    And the PM can read the beginning of the response while it is still being generated
    And a typing indicator is shown before the first token arrives
    And the typing indicator disappears once streaming begins
```

### SC-CE-19 -- Tool calls execute during streaming

```gherkin
  Scenario: ask_user tool call renders during stream
    Given the AI is generating a response that includes a text message followed by an ask_user call
    When the text portion has finished streaming
    Then the ask_user card renders immediately
    And the card is interactive (the PM can start selecting options)
    And no additional loading state is shown for the card

  Scenario: update_prd tool call executes during stream
    Given the AI is generating a response that includes an update_prd call
    When the tool call is detected in the stream
    Then the update_prd execute function runs server-side
    And the PRD block is upserted in the database
    And the client receives the tool result confirming the update
    And the PRD panel updates to show the new or modified block
```

---

## Feature: System prompts per step

### SC-CE-20 -- Step-specific AI behavior

```gherkin
Feature: System prompts

  Scenario Outline: AI behavior matches step system prompt
    Given a Builder PM has an active wizard session at step <step>
    When the AI generates responses
    Then the AI's behavior matches <behavior>
    And the AI focuses on <focus_area>
    And the AI produces <output_blocks>

    Examples:
      | step | behavior                                        | focus_area                                      | output_blocks                      |
      | 1    | Extract and challenge the problem definition    | Problem vs. solution, target user, first use case | first_use_case, problem_context   |
      | 2    | Guide data collection and tag evidence          | What data exists, what is assumed, what to verify | data_signals                      |
      | 3    | Play devil's advocate on 4 risks                | Value, Usability, Feasibility, Viability risks    | risk_value, risk_usability, risk_feasibility, risk_viability, confidence_score |
      | 4    | Finalize and tighten the PRD                    | Success criteria, kill criteria, next steps       | success_criteria, kill_criteria, next_steps, executive_summary |
```

---

## Feature: Error handling

### SC-CE-21 -- AI API failure

```gherkin
Feature: Error handling

  Scenario: OpenRouter API returns an error
    Given a Builder PM has an active wizard session
    When the PM sends a message
    And the OpenRouter API returns a 500 error
    Then an error message is shown in the conversation panel: "The AI service is temporarily unavailable. Please try again."
    And a "Retry" button is shown
    And no data is lost (the PM's message is preserved)
    And clicking "Retry" resends the request

  Scenario: OpenRouter API times out
    Given a Builder PM has an active wizard session
    When the PM sends a message
    And the API does not respond within 30 seconds
    Then a timeout message is shown: "The response is taking longer than expected. Please try again."
    And a "Retry" button is shown
    And the PM's message is preserved
```

### SC-CE-22 -- Network disconnection during streaming

```gherkin
  Scenario: Network drops during AI response streaming
    Given the AI is streaming a response
    When the network connection drops
    Then the partial response is preserved in the conversation panel
    And an error message is appended: "Connection lost. The response may be incomplete."
    And a "Retry" button is shown to request the AI to continue
```

---

## Feature: Session persistence

### SC-CE-23 -- Conversation persists across page reloads

```gherkin
Feature: Session persistence

  Scenario: PM reloads the page mid-conversation
    Given a Builder PM has an active wizard session at step 2
    And the conversation has 15 messages
    When the PM reloads the browser page
    Then the page loads showing step 2 active
    And all 15 messages are restored from the database
    And the PRD panel shows all blocks generated so far
    And the PM can continue the conversation from where they left off

  Scenario: PM returns to a session after closing the browser
    Given a Builder PM has a session with completed steps 1 and 2
    And the PM closes the browser
    When the PM returns to the session URL within 7 days
    Then the session is restored at step 3 (where they left off)
    And all conversation history and PRD blocks are intact
```

---

## Feature: Conversation input

### SC-CE-24 -- PM sends a message in the conversation

```gherkin
Feature: Conversation input

  Scenario: PM types and sends a message
    Given a Builder PM has an active wizard session
    And no ask_user card is currently awaiting a response
    When the PM types "Our biggest competitor launched a similar feature last month and saw 40% adoption"
    And the PM presses Enter or clicks the send button
    Then the message appears in the conversation history as a user message
    And the AI receives the message and begins generating a response (streaming starts)
    And the input field is cleared and ready for the next message

  Scenario: PM sends a message while a card is displayed
    Given an ask_user card is currently displayed and awaiting a response
    When the PM types a message in the chat input field
    Then the message is NOT sent (the card must be answered first)
    And a hint is shown: "Please answer the question above before continuing"
```

---

## Feature: Step-specific conversation flow

### SC-CE-25 -- Step 1: Problem Framing flow

```gherkin
Feature: Step 1 - Problem Framing

  Scenario: Full step 1 flow
    Given a Builder PM starts a new wizard session
    And the PM's initial idea was "We should add a Kanban board to our project management tool"
    When step 1 begins
    Then the AI introduces itself and explains the process
    And the AI reads the PM's initial idea
    And the AI challenges whether this is a problem or a solution: "A Kanban board is a solution. What problem are your users experiencing with how they currently track their work?"
    And the PM responds with the underlying problem
    And the AI asks follow-up questions (mix of free text and cards) to clarify:
      | topic           | card_type     |
      | target user     | single_choice |
      | current process | free_text     |
      | pain frequency  | scale         |
    And the AI synthesizes a First Use Case reformulation
    And the AI presents a confirmation card for the reformulation
    And the PM confirms (or reformulates, or clarifies)
    And the AI writes first_use_case and problem_context blocks via update_prd
```

### SC-CE-26 -- Step 2: Data Validation flow

```gherkin
Feature: Step 2 - Data Validation

  Scenario: Full step 2 flow
    Given a Builder PM has completed step 1
    When step 2 begins
    Then the AI explains: "Now let's look at the evidence behind your claims. I'll help you separate what you know from what you assume."
    And the AI asks about available data sources via multi_choice card
    And for each claim from step 1, the AI asks: "What evidence do you have for this?"
    And the AI tags each claim:
      | claim                                | tag           |
      | "Users complain about task tracking" | [Evidence] if backed by tickets; [Assumption] if anecdotal |
      | "Kanban would solve the problem"     | [Assumption] -- solution hypothesis not validated           |
      | "We don't know competitor adoption"  | [To verify]                                                |
    And the AI guides what data to collect for [To verify] items
    And the AI writes the data_signals block via update_prd
```

### SC-CE-27 -- Step 3: Risk Challenge flow

```gherkin
Feature: Step 3 - Risk Challenge

  Scenario: Full step 3 flow with all 4 risks
    Given a Builder PM has completed step 2
    When step 3 begins
    Then the AI explains: "Time to stress-test this idea. I'll evaluate 4 fundamental risks."
    And the AI evaluates each risk in sequence:

    # Value risk
    And the AI analyzes the value proposition and asks a scale card:
      | question                                          | min_label        | max_label      |
      | How confident are you that users actually want this? | Not confident | Very confident |
    And the PM rates and the AI provides analysis

    # Usability risk
    And the AI analyzes usability concerns and asks a scale card:
      | question                                              | min_label  | max_label        |
      | How confident are you users can figure out how to use this? | Not at all | Very confident |
    And the PM rates and the AI provides analysis

    # Feasibility risk
    And the AI analyzes technical feasibility and asks a scale card:
      | question                                            | min_label    | max_label        |
      | How confident are you the team can build this well? | Not at all   | Very confident   |
    And the PM rates and the AI provides analysis

    # Viability risk
    And the AI analyzes business viability and asks a scale card:
      | question                                                  | min_label    | max_label        |
      | How confident are you this is viable for the business?    | Not at all   | Very confident   |
    And the PM rates and the AI provides analysis

    And the AI writes risk_value, risk_usability, risk_feasibility, risk_viability blocks via update_prd
    And the AI computes a global confidence score
    And the AI writes the confidence_score block via update_prd
    And the AI makes an explicit recommendation: "build", "test first", or "abandon"
```

### SC-CE-28 -- Step 4: Final PRD flow

```gherkin
Feature: Step 4 - Final PRD

  Scenario: Full step 4 flow
    Given a Builder PM has completed step 3
    When step 4 begins
    Then the AI explains: "Let's finalize your PRD. I'll help you define success criteria, kill criteria, and next steps."
    And the AI reviews existing blocks for consistency
    And the AI asks about success criteria (free text + confirmation)
    And the AI writes the success_criteria block via update_prd
    And the AI asks about kill criteria: "Under what conditions should you abandon this feature after launch?"
    And the AI writes the kill_criteria block via update_prd
    And the AI asks about next steps (what needs to happen before building)
    And the AI writes the next_steps block via update_prd
    And the AI synthesizes an executive summary from all blocks
    And the AI writes the executive_summary block via update_prd
    And the AI presents the complete PRD for final review
    And the step completes and the wizard shows the finished state
```
