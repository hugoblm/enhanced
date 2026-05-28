# Acceptance Tests (Gherkin) -- Block Refinement

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

```gherkin
Feature: Block Refinement -- Inline PRD Block Editing via Natural Language
  As a Builder PM
  I want to refine individual PRD blocks with natural language instructions
  So that I can iterate on specific sections without regenerating the entire document

  # ──────────────────────────────────────────────
  # Happy path
  # ──────────────────────────────────────────────

  # Maps to: US-BR-1
  Scenario: SC-BR-1 -- Refine button appears on hover
    Given I am in the wizard with a PRD containing at least one generated block
    When I hover over a PRD block in the right panel
    Then a "Refine" button becomes visible on or near that block
    When I move my cursor away from the block
    Then the "Refine" button disappears

  # Maps to: US-BR-1
  Scenario: SC-BR-2 -- Complete refinement flow (happy path)
    Given I am in the wizard with a PRD containing a "Target Audience" block
    And the block currently reads "PMs at startups who ship fast"
    When I hover over the "Target Audience" block
    And I click the "Refine" button
    Then a popover opens anchored to the block
    And the popover contains a textarea and a submit button
    When I type "ajoute le contexte B2C et les equipes de 10-50 personnes" in the textarea
    And I click the submit button
    Then the AI receives a request with the block ID, content, and my instruction
    And the "Target Audience" block content is regenerated to include B2C context and team size
    And the popover closes automatically
    And all other PRD blocks remain unchanged
    And the conversation panel shows the refinement instruction and AI response

  # ──────────────────────────────────────────────
  # Streaming and real-time update
  # ──────────────────────────────────────────────

  # Maps to: US-BR-2
  Scenario: SC-BR-3 -- Block updates progressively during refinement
    Given I have submitted a refinement instruction for a PRD block
    When the AI begins generating the response
    Then the block content updates progressively (streaming) as tokens arrive
    And a loading indicator is visible on the block during generation
    And the loading indicator disappears when generation is complete
    And the PRD panel remains scrollable during the streaming update
    And the block expands smoothly if the new content is longer than the original

  # ──────────────────────────────────────────────
  # Instruction diversity
  # ──────────────────────────────────────────────

  # Maps to: US-BR-3
  Scenario: SC-BR-4 -- Refinement shortens a block
    Given I am in the wizard with a PRD containing a verbose "Solution" block (> 200 words)
    When I refine the block with the instruction "raccourcis, garde uniquement les points essentiels"
    Then the regenerated block is significantly shorter than the original
    And the key information is preserved
    And evidence tags on the block are preserved or updated appropriately

  # Maps to: US-BR-3
  Scenario: SC-BR-5 -- Refinement adds specific content
    Given I am in the wizard with a PRD containing an "Objectives" block
    And the block does not mention any metrics
    When I refine the block with the instruction "ajoute des metriques de succes mesurables"
    Then the regenerated block includes quantitative metrics or KPIs
    And the block structure (heading, list items) is maintained
    And any new claims are tagged with appropriate evidence markers

  # ──────────────────────────────────────────────
  # Error handling
  # ──────────────────────────────────────────────

  # Maps to: US-BR-4
  Scenario: SC-BR-6 -- Refinement fails due to network error
    Given I have submitted a refinement instruction for a PRD block
    And the network connection drops during the AI request
    When the request fails
    Then the block reverts to its pre-refinement content
    And an error message is displayed near the block (not a generic page alert)
    And the error message includes a "Reessayer" button or equivalent
    And the popover remains open with the instruction text preserved
    And the conversation panel shows an error entry for the failed refinement

  # Maps to: US-BR-4
  Scenario: SC-BR-7 -- Rapid successive refinements do not corrupt content
    Given I have a PRD block that I just refined successfully
    When I immediately hover over the same block and start a second refinement
    And I submit a new instruction before the UI has fully settled
    Then the second refinement processes correctly
    And the block content reflects the result of the second refinement
    And no content corruption, duplication, or race condition occurs
    And the conversation panel shows both refinement exchanges in order

  # ──────────────────────────────────────────────
  # Scope isolation
  # ──────────────────────────────────────────────

  # Maps to: US-BR-1
  Scenario: SC-BR-8 -- Only the targeted block is modified
    Given I am in the wizard with a PRD containing 5 blocks:
      | Block            | Content hash |
      | JTBD             | hash_1       |
      | Target Audience  | hash_2       |
      | Problems         | hash_3       |
      | Solution         | hash_4       |
      | Risks            | hash_5       |
    When I refine the "Problems" block with the instruction "ajoute un 3eme probleme lie au cout"
    Then the "Problems" block content changes (new hash differs from hash_3)
    And the "JTBD" block content is identical to hash_1
    And the "Target Audience" block content is identical to hash_2
    And the "Solution" block content is identical to hash_4
    And the "Risks" block content is identical to hash_5
```
