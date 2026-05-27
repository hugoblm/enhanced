# Gherkin Tests — Deferred Auth

> Acceptance scenarios in Given/When/Then format. Each scenario traces to a user story in
> `user-stories-and-jtbd.md` and represents a testable behavior that must pass before the
> feature is considered complete.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Feature: Anonymous session creation

### SC-DA-01 -- Anonymous session created on wizard entry
**Traces to:** US-DA-1

```gherkin
Feature: Anonymous session creation

  Scenario: New visitor starts the wizard without signup
    Given I am a new visitor with no existing session cookie
    And I am on the landing page
    When I enter "Ajouter un module de facturation pour les PME" in the textarea
    And I click the CTA button
    Then an anonymous_id (UUID v4) is generated
    And the anonymous_id is stored in an httpOnly, secure, SameSite=Lax cookie
    And a new row is created in the sessions table with anonymous_id set and user_id null
    And I am redirected to the wizard page
    And no login or signup UI is visible
```

### SC-DA-02 -- Returning anonymous visitor resumes existing session
**Traces to:** US-DA-1

```gherkin
  Scenario: Returning anonymous visitor resumes session
    Given I have an existing anonymous session with anonymous_id "abc-123"
    And the anonymous_id cookie is present in my browser
    When I navigate to the wizard page
    Then the existing session is loaded
    And my previous conversation messages are displayed
    And my previously generated PRD blocks are visible
    And no new session is created
```

---

## Feature: Auth trigger timing

### SC-DA-03 -- Auth modal appears after first AI reformulation
**Traces to:** US-DA-2

```gherkin
Feature: Auth trigger timing

  Scenario: Auth prompt appears after first PRD block generation
    Given I am an anonymous user in the wizard at step 1
    And I have been conversing with the AI for 2-3 exchanges
    When the conversation engine calls update_prd to generate the first PRD block (First Use Case)
    And the PRD block is rendered in the right panel
    Then the AuthGate modal slides up from the bottom of the screen
    And the modal headline reads "Sauvegardez votre travail"
    And the modal contains a brief explanation of why signup matters
    And the modal contains an email input field and a submit button
```

### SC-DA-04 -- Auth modal does not appear for authenticated users
**Traces to:** US-DA-2

```gherkin
  Scenario: Auth modal is suppressed for already-authenticated users
    Given I am an authenticated user with a valid Supabase session
    And I am in the wizard at step 1
    When the conversation engine generates the first PRD block
    Then no AuthGate modal appears
    And the wizard continues normally
```

### SC-DA-04b -- Auth modal does not appear before first reformulation
**Traces to:** US-DA-2

```gherkin
  Scenario: Auth modal does not appear prematurely
    Given I am an anonymous user in the wizard at step 1
    And the conversation has had 2 exchanges but no PRD block has been generated yet
    When I continue the conversation
    Then no AuthGate modal appears
    And the wizard continues normally
```

---

## Feature: Magic link authentication flow

### SC-DA-05 -- Magic link sent successfully
**Traces to:** US-DA-3

```gherkin
Feature: Magic link authentication

  Scenario: PM submits email and receives magic link
    Given the AuthGate modal is visible
    When I enter "pm@startup.com" in the email input
    And I click the submit button
    Then Supabase signInWithOtp is called with email "pm@startup.com"
    And the modal displays "Vérifiez votre boîte mail"
    And a minimize button becomes visible
    And the submit button is replaced by the confirmation message
```

### SC-DA-06 -- Magic link verification and redirect
**Traces to:** US-DA-3

```gherkin
  Scenario: PM clicks magic link and is redirected back to wizard
    Given I have received a magic link email for "pm@startup.com"
    And my anonymous session has anonymous_id "abc-123"
    When I click the magic link in the email
    Then I am redirected to /auth/confirm with the verification token
    And the token is verified successfully via Supabase Auth
    And claimSession("abc-123") is called
    And I am redirected back to the wizard page with my session loaded
    And my auth status is now "authenticated"
```

### SC-DA-07 -- Existing account logs in via magic link
**Traces to:** US-DA-3

```gherkin
  Scenario: Existing user enters their email in the auth modal
    Given the AuthGate modal is visible
    And a Supabase Auth account already exists for "pm@startup.com"
    When I enter "pm@startup.com" in the email input
    And I click the submit button
    Then the magic link is sent to the existing account
    And the flow proceeds identically to a new signup
    And after clicking the link, the existing user's profile is used
    And the anonymous session is claimed by the existing user
```

---

## Feature: Non-blocking auth

### SC-DA-08 -- Wizard remains accessible while waiting for magic link
**Traces to:** US-DA-4

```gherkin
Feature: Non-blocking auth

  Scenario: PM minimizes auth modal and continues working
    Given the AuthGate modal is showing "Vérifiez votre boîte mail"
    When I click the minimize button on the modal
    Then the modal slides down and disappears
    And the wizard conversation panel is fully interactive
    And I can send new messages to the AI
    And I can view PRD blocks being generated
    And a subtle auth-pending indicator is visible (banner or badge)
    And the auth modal does not reappear automatically
```

---

## Feature: Session claiming and data preservation

### SC-DA-09 -- Atomic session claiming preserves all data
**Traces to:** US-DA-5

```gherkin
Feature: Session claiming

  Scenario: All session data survives the anonymous-to-authenticated transition
    Given I am an anonymous user with anonymous_id "abc-123"
    And my session contains 6 conversation messages
    And my session's PRD has 2 generated blocks (First Use Case, JTBD)
    When I complete the magic link flow and claimSession("abc-123") executes
    Then sessions.user_id is set to my authenticated user ID
    And sessions.anonymous_id is set to null
    And all 6 conversation messages are still linked to the session
    And both PRD blocks are still linked to the session's PRD
    And the wizard UI displays the same conversation history as before auth
    And the wizard UI displays the same PRD blocks as before auth
    And the anonymous_id cookie is cleared from the browser
```

### SC-DA-10 -- RLS protection after claiming
**Traces to:** US-DA-5

```gherkin
  Scenario: RLS policies protect claimed session
    Given my session has been claimed and user_id is set to "user-xyz"
    When another authenticated user "user-other" attempts to query my session
    Then the query returns no rows
    And my session data is not accessible to "user-other"
```

### SC-DA-11 -- Failed claim shows error gracefully
**Traces to:** US-DA-5

```gherkin
  Scenario: Session claim failure is handled gracefully
    Given I am completing the magic link flow
    And the session with anonymous_id "abc-123" has already been claimed by another user
    When claimSession("abc-123") executes
    Then the operation fails with an appropriate error
    And the error is logged server-side with the anonymous_id and attempted user_id
    And I see an error message: "Cette session a déjà été associée à un autre compte"
    And I am not left on a blank screen
    And I am offered the option to start a new session
```

### SC-DA-12 -- Expired magic link handled gracefully
**Traces to:** US-DA-3, US-DA-5

```gherkin
  Scenario: PM clicks an expired magic link
    Given I received a magic link email 2 hours ago
    And the magic link token has expired (Supabase default: 1 hour)
    When I click the expired magic link
    Then I am redirected to /auth/confirm
    And the token verification fails
    And I see an error message: "Ce lien a expiré. Veuillez en demander un nouveau."
    And a "Renvoyer le lien" button is visible
    And clicking the button re-triggers the magic link flow with the same email
    And my anonymous session is still intact (no data loss from the failed attempt)
```

---

## Edge cases

### SC-DA-E1 -- Invalid email format rejected
**Traces to:** US-DA-3

```gherkin
  Scenario: PM enters an invalid email
    Given the AuthGate modal is visible
    When I enter "not-an-email" in the email input
    And I click the submit button
    Then the form shows a validation error: "Veuillez entrer une adresse email valide"
    And no request is sent to Supabase
```

### SC-DA-E2 -- Browser closed and reopened before auth completion
**Traces to:** US-DA-1, US-DA-5

```gherkin
  Scenario: PM closes browser before completing magic link flow
    Given I am an anonymous user with a session cookie
    And I requested a magic link but have not clicked it yet
    When I close the browser
    And I reopen the browser and navigate to Enhanced
    Then my anonymous session cookie is still present
    And I can resume the wizard with my existing conversation
    And I can still click the magic link from the email to complete auth
```
