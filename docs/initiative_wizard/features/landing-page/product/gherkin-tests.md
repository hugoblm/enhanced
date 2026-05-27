# Acceptance Tests (Gherkin) -- Landing Page

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

```gherkin
Feature: Landing Page -- Idea Submission
  As a Builder PM
  I want to pitch my product idea on a minimal homepage
  So that I can start the validation wizard immediately without signup

  # ──────────────────────────────────────────────
  # Happy path
  # ──────────────────────────────────────────────

  # Maps to: US-LP-1
  Scenario: SC-LP-1 -- Submit a valid idea and enter the wizard
    Given I am on the Enhanced landing page
    And I am not logged in
    When I type "A Slack bot that nudges PMs to review their feature assumptions weekly" into the textarea
    And I click the "Lancer le cadrage" button
    Then an anonymous session is created in the database
    And a PRD skeleton is generated for the session
    And an anonymous cookie is set in my browser
    And I am redirected to "/session/{session_id}"
    And the redirect completes within 3 seconds
    And my original idea text is visible in the wizard conversation panel

  # Maps to: US-LP-1
  Scenario: SC-LP-2 -- Submit a long, detailed idea
    Given I am on the Enhanced landing page
    When I type a 2000-character product idea into the textarea
    And I click the "Lancer le cadrage" button
    Then the full idea text is preserved without truncation
    And I am redirected to "/session/{session_id}"
    And the wizard displays the complete idea text

  # ──────────────────────────────────────────────
  # Edge cases -- input validation
  # ──────────────────────────────────────────────

  # Maps to: US-LP-2
  Scenario: SC-LP-3 -- Submit with empty textarea
    Given I am on the Enhanced landing page
    And the textarea is empty
    When I click the "Lancer le cadrage" button
    Then I remain on the landing page
    And an inline error message is displayed near the textarea
    And the error message indicates that an idea is required
    And no session is created in the database
    And focus is set to the textarea

  # Maps to: US-LP-2
  Scenario: SC-LP-4 -- Submit with too-short input
    Given I am on the Enhanced landing page
    When I type "Fix onboarding" into the textarea
    And I click the "Lancer le cadrage" button
    Then I remain on the landing page
    And an inline error message indicates the minimum length requirement (20 characters)
    And no session is created in the database
    And the typed text is preserved in the textarea

  # Maps to: US-LP-2
  Scenario: SC-LP-5 -- Error message clears when typing valid content
    Given I am on the Enhanced landing page
    And I have submitted an empty textarea
    And an inline error message is visible
    When I type "A tool that helps PMs validate their hypotheses" into the textarea
    Then the error message disappears
    And the CTA button remains clickable

  # ──────────────────────────────────────────────
  # Server error handling
  # ──────────────────────────────────────────────

  # Maps to: US-LP-1
  Scenario: SC-LP-6 -- Server error during session creation
    Given I am on the Enhanced landing page
    And the server is unable to create a session (e.g., database unavailable)
    When I type "A dashboard for tracking feature adoption rates" into the textarea
    And I click the "Lancer le cadrage" button
    Then I remain on the landing page
    And a user-friendly error message is displayed (not a technical stack trace)
    And the error message suggests retrying
    And my typed idea text is preserved in the textarea
    And the CTA button becomes clickable again after the error

  # ──────────────────────────────────────────────
  # Responsive behavior
  # ──────────────────────────────────────────────

  # Maps to: US-LP-3
  Scenario: SC-LP-7 -- Landing page on tablet viewport
    Given I am viewing the Enhanced landing page on a 768px-wide viewport
    Then the textarea is fully visible without horizontal scrolling
    And the CTA button is fully visible without horizontal scrolling
    And the CTA button touch target is at least 44x44 pixels
    And text is readable without zooming (base font >= 16px)
    And the value proposition text is visible above the fold

  # ──────────────────────────────────────────────
  # Value proposition clarity
  # ──────────────────────────────────────────────

  # Maps to: US-LP-4
  Scenario: SC-LP-8 -- Value proposition is visible and clear
    Given I am on the Enhanced landing page for the first time
    Then a value proposition is visible above the textarea without scrolling
    And the value proposition communicates what the user does (pitch an idea)
    And the value proposition communicates what the user gets (a challenged draft PRD)
    And the proposition is no longer than 2 sentences
    And no product-specific jargon is used that a non-technical PM would not understand
```
