# Gherkin Tests — PRD Versioning

> Acceptance scenarios in Given/When/Then format. Each scenario traces to a user story in
> `user-stories-and-jtbd.md` and represents a testable behavior that must pass before the
> feature is considered complete.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Feature: Auto-versioning on generation

### SC-PV-01 -- Version created when AI generates a PRD block
**Traces to:** US-PV-1

```gherkin
Feature: Auto-versioning on generation

  Scenario: A version entry is created when update_prd generates a block
    Given I am an authenticated user in the wizard
    And my PRD currently has 0 versions in prd_versions
    When the conversation engine calls update_prd to generate the "First Use Case" block
    And the block is saved to prd_blocks
    Then a new row is created in prd_versions
    And the version entry has prd_id matching my PRD
    And the version entry has block_id matching the "First Use Case" block
    And the version entry has version_number 1
    And the version entry has content_snapshot matching the block's content
    And the version entry has trigger "generation"
    And the version entry has created_at set to the current timestamp
```

### SC-PV-01b -- Sequential versioning across multiple block generations
**Traces to:** US-PV-1

```gherkin
  Scenario: Version numbers increment sequentially across multiple generations
    Given I am an authenticated user in the wizard
    And my PRD has version 1 (First Use Case generation)
    When the conversation engine calls update_prd to generate the "JTBD" block
    Then a new row is created in prd_versions with version_number 2
    And the trigger is "generation"
    When the conversation engine calls update_prd to generate the "Objectives" block
    Then a new row is created in prd_versions with version_number 3
    And the trigger is "generation"
```

---

## Feature: Auto-versioning on refinement

### SC-PV-02 -- Version created when PM refines a block
**Traces to:** US-PV-1

```gherkin
Feature: Auto-versioning on refinement

  Scenario: A version entry is created when a block is refined
    Given I am an authenticated user with a PRD containing 3 blocks
    And the PRD has 3 existing versions (from generation)
    When I click "Refine" on the "First Use Case" block
    And I enter the instruction "Ajouter le contexte startup early-stage"
    And the AI regenerates the block with the updated content
    And the refined block is saved to prd_blocks
    Then a new row is created in prd_versions with version_number 4
    And the version entry has block_id matching the "First Use Case" block
    And the version entry has content_snapshot matching the NEW refined content
    And the version entry has trigger "refinement"
```

---

## Feature: Version history list

### SC-PV-03 -- Version history panel displays all versions
**Traces to:** US-PV-2

```gherkin
Feature: Version history list

  Scenario: PM opens version history and sees all versions
    Given I am an authenticated user with a PRD
    And the PRD has 5 versions:
      | version_number | trigger     | block         | created_at           |
      | 1              | generation  | First Use Case | 2026-05-27 10:00:00 |
      | 2              | generation  | JTBD           | 2026-05-27 10:02:00 |
      | 3              | generation  | Objectives     | 2026-05-27 10:05:00 |
      | 4              | refinement  | First Use Case | 2026-05-27 10:10:00 |
      | 5              | refinement  | JTBD           | 2026-05-27 10:15:00 |
    When I click the "Version history" button in the PRD panel header
    Then a version history panel opens
    And the panel displays 5 version entries
    And the entries are ordered newest first (version 5 at top)
    And each entry shows: version number, trigger type, block name, relative timestamp
    And version 5 is labeled "Version actuelle"
```

### SC-PV-04 -- Version history button is visible in PRD panel header
**Traces to:** US-PV-2

```gherkin
  Scenario: Version history button is accessible
    Given I am an authenticated user with a PRD that has at least 1 version
    When I look at the PRD panel header
    Then a "Version history" button (or icon with tooltip) is visible
    And the button is clickable
```

### SC-PV-04b -- Version history shows empty state when no versions exist
**Traces to:** US-PV-2

```gherkin
  Scenario: Version history with no versions shows empty state
    Given I am an authenticated user with a PRD that has 0 versions
    When I click the "Version history" button
    Then the panel opens with a message: "Aucune version pour le moment"
    And no version entries are displayed
```

---

## Feature: View past version content

### SC-PV-05 -- PM views a past version's content
**Traces to:** US-PV-3

```gherkin
Feature: View past version content

  Scenario: PM clicks a past version and sees its content
    Given I am viewing the version history panel
    And version 1 has content_snapshot "Le probleme: les PM skipent la validation..."
    When I click on version 1 in the list
    Then the version content is displayed in a read-only view
    And the view shows the content_snapshot text with markdown rendering
    And evidence tags ([Evidence], [Assumption], [To verify]) are rendered visually
    And a banner indicates "Version 1 — 27 mai 2026 10:00 (lecture seule)"
    And no "Refine" button is visible on the historical content
```

### SC-PV-06 -- PM returns to current version after viewing history
**Traces to:** US-PV-3

```gherkin
  Scenario: PM closes historical view and returns to current PRD
    Given I am viewing version 1 content in read-only mode
    When I click the close button (or "Retour a la version actuelle")
    Then the historical view closes
    And the PRD panel shows the current (latest) version of all blocks
    And the version history panel remains open (or can be reopened)
```

---

## Edge cases

### SC-PV-E1 -- Rapid successive refinements create distinct versions
**Traces to:** US-PV-1

```gherkin
  Scenario: Multiple quick refinements each create a version
    Given I am an authenticated user with a PRD at version 3
    When I refine the "Objectives" block with "Rendre l'objectif 2 plus mesurable"
    And the refinement completes creating version 4
    And I immediately refine the same block again with "Ajouter un KPI concret"
    And the refinement completes creating version 5
    Then prd_versions contains 5 entries
    And versions 4 and 5 both reference the "Objectives" block
    And versions 4 and 5 have different content_snapshot values
    And versions 4 and 5 have different timestamps
```
