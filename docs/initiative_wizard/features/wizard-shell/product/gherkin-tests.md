# Acceptance Tests (Gherkin) -- Wizard Shell

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

```gherkin
Feature: Wizard Shell -- Split-View Layout & Step Navigation
  As a Builder PM
  I want a split-view layout with conversation and PRD side by side
  So that I can see my answers translate into a structured PRD in real time

  # ──────────────────────────────────────────────
  # Split-view layout
  # ──────────────────────────────────────────────

  # Maps to: US-WS-1
  Scenario: SC-WS-1 -- Split-view renders on desktop
    Given I have started a wizard session
    And my viewport width is >= 1024px
    When the wizard shell loads at "/session/{session_id}"
    Then a conversation panel is visible on the left side of the screen
    And a PRD panel is visible on the right side of the screen
    And the conversation panel occupies approximately 45% of the viewport width
    And the PRD panel occupies approximately 55% of the viewport width
    And both panels are visible simultaneously without horizontal scrolling
    And the layout fills the full viewport height minus the header

  # ──────────────────────────────────────────────
  # Step indicator
  # ──────────────────────────────────────────────

  # Maps to: US-WS-2
  Scenario: SC-WS-2 -- Step indicator displays on session start
    Given I have just entered a new wizard session
    When the wizard shell loads
    Then a step indicator is visible at the top of the page
    And the indicator shows 4 steps: "Cadrage", "Donnees", "Risques", "PRD"
    And each step displays its number (1, 2, 3, 4) alongside its label
    And step 1 "Cadrage" is highlighted as the current step
    And steps 2, 3, 4 are visually dimmed as locked/future steps
    And the step indicator height does not exceed 60px

  # Maps to: US-WS-2
  Scenario: SC-WS-3 -- Step indicator updates on step completion
    Given I am in the wizard at step 1 "Cadrage"
    And the conversation engine signals that step 1 is complete
    When I transition to step 2
    Then step 1 shows a completed state (checkmark or filled indicator)
    And step 2 is highlighted as the current step
    And steps 3 and 4 remain visually dimmed as locked

  # ──────────────────────────────────────────────
  # Step navigation
  # ──────────────────────────────────────────────

  # Maps to: US-WS-3
  Scenario: SC-WS-4 -- Navigate back to a completed step
    Given I am in the wizard at step 3 "Risques"
    And steps 1 and 2 are marked as completed
    When I click on step 1 "Cadrage" in the step indicator
    Then the conversation panel shows the messages from step 1
    And the step indicator highlights step 1 as the currently viewed step
    And the PRD panel continues to show the full accumulated PRD (all blocks from all steps)
    And no conversation data is lost from any step

  # Maps to: US-WS-3
  Scenario: SC-WS-5 -- Cannot navigate forward to an incomplete step
    Given I am in the wizard at step 2 "Donnees"
    And steps 3 and 4 have not been started
    When I click on step 3 "Risques" in the step indicator
    Then nothing happens
    And the step indicator continues to highlight step 2 as the current step
    And the conversation panel content does not change
    And the cursor shows a "not-allowed" indicator on hover over locked steps

  # ──────────────────────────────────────────────
  # Independent panel scrolling
  # ──────────────────────────────────────────────

  # Maps to: US-WS-4
  Scenario: SC-WS-6 -- Panels scroll independently
    Given I am in the wizard with enough content in both panels to require scrolling
    When I scroll down in the conversation panel
    Then the PRD panel scroll position does not change
    When I scroll down in the PRD panel
    Then the conversation panel scroll position does not change
    And each panel displays its own scroll indicator when content overflows

  # ──────────────────────────────────────────────
  # Responsive behavior
  # ──────────────────────────────────────────────

  # Maps to: US-WS-5
  Scenario: SC-WS-7 -- Panels collapse on tablet viewport
    Given I have started a wizard session
    And my viewport width is < 1024px
    When the wizard shell loads
    Then the two panels are not displayed side by side
    And the PM can view either the conversation or the PRD (via tabs or stacking)
    And the step indicator remains visible and functional
    And all content from both panels is accessible

  # Maps to: US-WS-5
  Scenario: SC-WS-8 -- Switch between panels on tablet
    Given I am viewing the wizard on a tablet viewport (< 1024px)
    And the responsive layout uses tabs for panel switching
    When I tap the PRD tab
    Then the PRD panel content becomes visible
    And the conversation panel content is hidden
    When I tap the Conversation tab
    Then the conversation panel content becomes visible
    And the PRD panel content is hidden
    And the switch is instant (no page reload or visible delay)

  # ──────────────────────────────────────────────
  # Loading states
  # ──────────────────────────────────────────────

  # Maps to: US-WS-1
  Scenario: SC-WS-9 -- Loading state while session data loads
    Given I navigate to "/session/{session_id}"
    And the session data is still being fetched
    When the wizard shell mounts
    Then the conversation panel shows a loading skeleton or spinner
    And the PRD panel shows a loading skeleton or empty state
    And the step indicator shows step 1 as default
    And the loading state resolves within 2 seconds under normal conditions

  # Maps to: US-WS-1
  Scenario: SC-WS-10 -- Invalid session ID
    Given I navigate to "/session/{invalid_id}" where the session does not exist
    When the wizard shell attempts to load
    Then a "Session not found" message is displayed
    And a link or button to return to the landing page is provided
    And no blank or broken layout is shown
```
