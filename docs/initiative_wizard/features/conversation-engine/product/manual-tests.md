# Manual Tests -- Conversation Engine

> Human-run test cases for QA and pre-release verification. Each case traces to a Gherkin
> scenario and user story. Designed to be run by a non-developer with access to the
> staging environment.

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

## Test environment

- **URL:** staging.enhanced.pm (or localhost:3000 for local testing)
- **Browser:** Chrome latest (primary), Firefox latest (secondary)
- **Pre-condition for all tests:** An active wizard session exists (start from the landing page by submitting a product idea)
- **Test idea to use:** "We want to add AI-powered search to our documentation site so users can find answers faster"

---

## Test cases

### MT-CE-1 -- Free text card interaction

- **Traces to:** SC-CE-1, US-CE-1
- **Priority:** MUST
- **Pre-conditions:** Active session at step 1, AI has asked a free text question
- **Steps:**
  1. Observe the free text card: verify it has a text area and a placeholder
  2. Type a multi-line response (3+ lines) describing target users
  3. Click the submit button
  4. Observe the conversation: verify the response appears as a user message
  5. Wait for the AI response (should stream within 10 seconds)
  6. Try to edit the submitted card -- verify it is read-only
  7. Submit an empty text area -- verify an error appears
- **Expected result:** Card submits successfully, response appears in history, AI replies. Empty submit shows error. Submitted card is read-only.
- **Result:** ________

---

### MT-CE-2 -- Single choice card interaction

- **Traces to:** SC-CE-2, SC-CE-3, US-CE-2
- **Priority:** MUST
- **Pre-conditions:** Active session, AI has displayed a single choice card
- **Steps:**
  1. Observe the card: verify 4-5 options with labels are displayed, plus "Other -- specify"
  2. Click on the first option -- verify it is visually selected (radio behavior)
  3. Click on a different option -- verify the first is deselected, second is selected
  4. Click the submit button -- verify the answer appears in conversation history
  5. Start a new conversation to get another single choice card
  6. Select "Other -- specify" -- verify a textarea appears
  7. Try to submit without typing -- verify an error appears
  8. Type a custom answer -- verify submit works and custom answer appears in history
- **Expected result:** Only one option selectable at a time. "Other" requires text input. Submitted answer appears in conversation. Card becomes read-only after submission.
- **Result:** ________

---

### MT-CE-3 -- Multi choice card interaction

- **Traces to:** SC-CE-4, SC-CE-5, US-CE-3
- **Priority:** MUST
- **Pre-conditions:** Active session at step 2, AI has displayed a multi choice card (typically "What data sources do you have?")
- **Steps:**
  1. Observe the card: verify options have checkboxes, plus "Other -- specify"
  2. Check 2-3 options -- verify multiple can be selected simultaneously
  3. Uncheck one -- verify it deselects cleanly
  4. Click submit -- verify all checked options appear in conversation history
  5. Try submitting with no options checked -- verify error message appears
  6. Check "Other -- specify" plus one predefined option
  7. Try to submit without typing in "Other" textarea -- verify error
  8. Type a custom answer and submit -- verify both predefined and custom answers appear
- **Expected result:** Multiple selections allowed. At least one required. "Other" requires text when checked. All selections visible in history.
- **Result:** ________

---

### MT-CE-4 -- Scale card interaction

- **Traces to:** SC-CE-6, US-CE-4
- **Priority:** MUST
- **Pre-conditions:** Active session at step 3 (Risk Challenge), AI has displayed a scale card
- **Steps:**
  1. Observe the card: verify 5 points (1-5) with min and max labels
  2. Click point 1 -- verify it is highlighted, others are not
  3. Click point 4 -- verify point 4 is highlighted, point 1 is deselected
  4. Click submit -- verify "4/5" (or equivalent) appears in conversation history
  5. Try to submit without selecting any point -- verify error message
  6. Verify the AI processes the rating and provides analysis
- **Expected result:** One point selectable at a time. Labels visible. Rating appears in history. AI responds with analysis.
- **Result:** ________

---

### MT-CE-5 -- Confirmation card interaction

- **Traces to:** SC-CE-7, SC-CE-8, US-CE-5
- **Priority:** MUST
- **Pre-conditions:** Active session at step 1, AI has reformulated the PM's idea and shows a confirmation card
- **Steps:**
  1. Read the reformulation text displayed on the card
  2. Verify three buttons: "Yes, this is accurate" / "Reformulate" / "Clarify"
  3. Click "Yes, this is accurate" -- verify conversation proceeds
  4. (In a new session) Get to the confirmation card again
  5. Click "Reformulate" -- verify a textarea appears
  6. Type a corrected version and submit -- verify the AI processes and may re-reformulate
  7. (In a new session) Click "Clarify"
  8. Type additional context and submit -- verify the AI incorporates the clarification
- **Expected result:** All three options work correctly. "Reformulate" and "Clarify" require text input. AI responds appropriately to each option.
- **Result:** ________

---

### MT-CE-6 -- WHY messages before cards

- **Traces to:** SC-CE-9, SC-CE-10, US-CE-6
- **Priority:** MUST
- **Pre-conditions:** Active session, multiple cards will appear during the conversation
- **Steps:**
  1. As the conversation progresses, observe each time a card appears
  2. Verify that every card is preceded by a text message from the AI
  3. Verify the text message explains WHY this question is being asked (not "Question 3:")
  4. Verify the messages feel conversational, not formulaic
  5. Count consecutive cards: verify no more than 3 appear in a row without a free text break
  6. After 3 consecutive cards, verify the AI returns to free text conversation
- **Expected result:** Every card has a preceding "why" message. Messages are varied and contextual. No more than 3 consecutive cards.
- **Result:** ________

---

### MT-CE-7 -- Step transitions

- **Traces to:** SC-CE-11, SC-CE-12, SC-CE-13, US-CE-7
- **Priority:** MUST
- **Pre-conditions:** Active session at step 1
- **Steps:**
  1. Complete step 1: answer all questions, confirm the reformulation
  2. Observe the transition: verify a summary message appears
  3. Verify the step indicator updates (step 1 completed, step 2 active)
  4. Verify the AI starts asking about data and evidence (step 2 behavior)
  5. Complete step 2 through step 4, observing each transition
  6. At step 4 completion, verify the "PRD complete" state: export/share buttons visible, all 4 steps marked complete
- **Expected result:** Each step transition shows a summary, updates the indicator, and changes AI behavior. Step 4 completion shows the finished state.
- **Result:** ________

---

### MT-CE-8 -- AI pushback on unsubstantiated claims

- **Traces to:** SC-CE-15, SC-CE-16, US-CE-8
- **Priority:** MUST
- **Pre-conditions:** Active session at step 1 or 2
- **Steps:**
  1. At step 1, type: "We need to build a Slack integration" (a solution, not a problem)
  2. Verify the AI challenges: asks what the underlying problem is
  3. At step 2, type: "90% of users want this" without citing a source
  4. Verify the AI tags it as [Assumption] and asks for evidence
  5. Respond with actual data: "We ran a survey, 47 out of 52 respondents chose this as their #1 request"
  6. Verify the AI re-tags as [Evidence] and updates its assessment
  7. Verify pushback is constructive, not hostile or dismissive
- **Expected result:** AI challenges solutions disguised as problems. AI tags unsubstantiated claims as assumptions. AI upgrades tags when evidence is provided. Tone is constructive.
- **Result:** ________

---

### MT-CE-9 -- Evidence tagging throughout conversation

- **Traces to:** SC-CE-17, US-CE-8
- **Priority:** MUST
- **Pre-conditions:** Active session, at least step 2
- **Steps:**
  1. Provide a mix of claims during the conversation:
     - A fact with a source: "Our churn rate is 8% monthly according to our Stripe dashboard"
     - An opinion without data: "I believe users prefer dark mode"
     - An open question: "We haven't measured how long users spend on this page"
  2. Observe the AI's tagging: [Evidence] for the fact, [Assumption] for the opinion, [To verify] for the open question
  3. Verify the tags appear in the conversation messages
  4. Check the PRD panel: verify the corresponding blocks carry the same tags
  5. Verify tags render as colored badges in the PRD (green, amber, red)
- **Expected result:** AI correctly differentiates evidence from assumptions from unknowns. Tags are consistent between conversation and PRD.
- **Result:** ________

---

### MT-CE-10 -- Streaming behavior

- **Traces to:** SC-CE-18, SC-CE-19
- **Priority:** MUST
- **Pre-conditions:** Active session
- **Steps:**
  1. Send a message to the AI
  2. Observe: verify a typing indicator appears briefly
  3. Verify the response streams in token by token (text appears incrementally)
  4. Verify you can start reading the response while it is still being generated
  5. When a tool call follows (card or PRD update), verify it appears immediately after the text finishes
  6. Verify no blank loading screen between the text and the card
- **Expected result:** Responses stream smoothly. Typing indicator shown briefly. Cards render immediately after text. No visible delays between streaming text and tool call rendering.
- **Result:** ________

---

### MT-CE-11 -- Session persistence on page reload

- **Traces to:** SC-CE-23
- **Priority:** MUST
- **Pre-conditions:** Active session with at least 10 messages and at least 2 completed steps
- **Steps:**
  1. Note the current step, number of messages, and PRD blocks visible
  2. Reload the page (F5 or Cmd+R)
  3. Verify the page loads at the correct step
  4. Verify all messages are restored in the conversation panel
  5. Verify all PRD blocks are restored in the PRD panel
  6. Send a new message -- verify the conversation continues normally
  7. Close the browser tab, wait 30 seconds, navigate back to the session URL
  8. Verify full state restoration
- **Expected result:** All state is preserved across reloads and browser restarts. Conversation resumes seamlessly.
- **Result:** ________

---

### MT-CE-12 -- Error recovery (AI failure)

- **Traces to:** SC-CE-21, SC-CE-22
- **Priority:** MUST
- **Pre-conditions:** Active session. (To simulate API failure, use browser DevTools Network tab to block requests to the OpenRouter API, or throttle to offline.)
- **Steps:**
  1. Send a message normally -- verify it works
  2. Use DevTools to block the API endpoint
  3. Send another message
  4. Verify an error message appears (not a blank screen or unhandled error)
  5. Verify a "Retry" button is shown
  6. Re-enable network in DevTools
  7. Click "Retry" -- verify the message is resent and the AI responds
  8. Verify no messages were lost during the error
- **Expected result:** Error message is user-friendly. Retry works. No data loss. No JavaScript errors in console.
- **Result:** ________

---

### MT-CE-13 -- Card blocked during pending response

- **Traces to:** SC-CE-24
- **Priority:** MUST
- **Pre-conditions:** Active session, an ask_user card is displayed awaiting response
- **Steps:**
  1. Observe the ask_user card awaiting input
  2. Try to type a message in the main chat input field
  3. Try to press Enter or click send
  4. Verify a hint is shown: "Please answer the question above before continuing"
  5. Verify the message is NOT sent
  6. Answer the card
  7. Verify the chat input is re-enabled
- **Expected result:** Chat input is blocked while a card awaits a response. Hint explains why. Input re-enables after card is answered.
- **Result:** ________

---

### MT-CE-14 -- Full wizard completion (end-to-end)

- **Traces to:** SC-CE-25, SC-CE-26, SC-CE-27, SC-CE-28, US-CE-7
- **Priority:** MUST
- **Pre-conditions:** Starting from the landing page
- **Steps:**
  1. On the landing page, type: "We want to add AI-powered search to our documentation site so users can find answers faster instead of browsing through dozens of pages"
  2. Click the CTA button
  3. Complete step 1: answer all questions, confirm the first use case reformulation
  4. Complete step 2: provide a mix of evidence and assumptions about data
  5. Complete step 3: rate all 4 risks on the scale cards
  6. Complete step 4: define success criteria, kill criteria, and review the executive summary
  7. After step 4 completion: verify the "PRD complete" state
  8. Verify the PRD panel shows all 12 block types filled
  9. Verify evidence tags are present on relevant blocks
  10. Verify the confidence score is displayed
  11. Verify export/share buttons are visible and functional
  12. Record total time from start to completion
- **Expected result:** Complete wizard flow works end-to-end. All 12 PRD blocks are populated. Evidence tags are applied. Confidence score is displayed. Total time should be under 30 minutes for a straightforward idea.
- **Result:** ________
- **Time recorded:** ________

---

## Pre-release smoke checklist

Before any release that touches the conversation engine:

- [ ] **MT-CE-1:** Free text card submits and response appears
- [ ] **MT-CE-2:** Single choice card selects, submits, "Other" works
- [ ] **MT-CE-4:** Scale card selects and submits rating
- [ ] **MT-CE-5:** Confirmation card -- all 3 options work
- [ ] **MT-CE-7:** At least one step transition works (step 1 -> step 2)
- [ ] **MT-CE-10:** Streaming works (response appears incrementally)
- [ ] **MT-CE-11:** Page reload preserves session state
- [ ] **MT-CE-14:** Full end-to-end completion is possible
