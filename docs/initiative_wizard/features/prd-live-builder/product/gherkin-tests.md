# Gherkin Tests -- PRD Live Builder

> Acceptance scenarios in Given/When/Then. Each scenario traces to a user story. Covers
> real-time block rendering, evidence tags, sort order, animations, empty states,
> confidence score, and the complete PRD state.

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

## Feature: Real-time block rendering

### SC-PLB-1 -- Block appears after AI update_prd call

> Traces to: US-PLB-1

```gherkin
Feature: Real-time block rendering

  Background:
    Given a Builder PM has an active wizard session at step 1
    And the PRD panel is visible in the right side of the split view

  Scenario: First block appears in the PRD panel
    Given no filled blocks exist in the PRD yet
    And the AI has collected enough information for the first_use_case
    When the AI calls update_prd with block_type "first_use_case" and content "I am a PM at a B2B SaaS startup..."
    Then the first_use_case block appears in the PRD panel within 500ms
    And the block replaces the empty placeholder for "First Use Case"
    And the block content renders as formatted markdown
    And the block animates in with a fade-in and brief highlight
```

### SC-PLB-2 -- Block update animates

> Traces to: US-PLB-1

```gherkin
  Scenario: Existing block is updated with new content
    Given the first_use_case block already exists with content "I am a PM..."
    When the AI calls update_prd with block_type "first_use_case" and updated content
    Then the block content transitions smoothly (not a hard replace)
    And the previous content fades out and the new content fades in
    And the block briefly highlights to draw attention to the change
    And no duplicate block appears (the existing one is updated in place)
```

### SC-PLB-3 -- PRD auto-scrolls to new block

> Traces to: US-PLB-1

```gherkin
  Scenario: PRD panel auto-scrolls to the latest block
    Given 4 blocks already exist in the PRD panel
    And the PM has scrolled the PRD panel to the top
    When the AI calls update_prd with block_type "data_signals"
    Then the PRD panel scrolls to show the newly added data_signals block
    And the scroll is smooth (not an instant jump)

  Scenario: Auto-scroll pauses when PM scrolls manually
    Given the PRD panel auto-scrolled to a new block
    When the PM manually scrolls up in the PRD panel
    Then auto-scroll is paused
    And new block additions do NOT force the panel to scroll
    And the PM can freely read any part of the PRD
    When the PM scrolls back to the bottom of the PRD panel
    Then auto-scroll resumes for future block additions
```

---

## Feature: Evidence tags display

### SC-PLB-4 -- Evidence tags render as colored badges

> Traces to: US-PLB-2

```gherkin
Feature: Evidence tags

  Scenario Outline: Evidence tag renders with correct color
    Given a PRD block exists with an evidence tag of type <tag_type>
    When the block renders in the PRD panel
    Then the tag renders as a badge with text <label> and color <color>
    And the badge is inline with the block text (not in a separate section)
    And the text label is always visible (not hidden behind color alone)

    Examples:
      | tag_type   | label          | color  |
      | evidence   | [Evidence]     | green  |
      | assumption | [Assumption]   | amber  |
      | to_verify  | [To verify]    | red    |
```

### SC-PLB-5 -- Multiple evidence tags in a single block

> Traces to: US-PLB-2

```gherkin
  Scenario: Block with mixed evidence tags
    Given the AI has called update_prd with block_type "data_signals"
    And the content includes:
      """
      - User churn rate is 8% monthly [Evidence]
      - Users prefer the new onboarding flow [Assumption]
      - Competitor pricing is unknown [To verify]
      """
    When the block renders in the PRD panel
    Then three badges are displayed:
      | text           | color |
      | [Evidence]     | green |
      | [Assumption]   | amber |
      | [To verify]    | red   |
    And each badge is positioned inline with its corresponding claim
    And the block is readable even with multiple badges
```

---

## Feature: Sort order

### SC-PLB-6 -- Blocks maintain fixed sort order

> Traces to: US-PLB-3

```gherkin
Feature: Sort order

  Scenario: Blocks appear in PRD structure order regardless of creation order
    Given the AI has created blocks in this order:
      | order_created | block_type       |
      | 1             | first_use_case   |
      | 2             | problem_context  |
      | 3             | data_signals     |
      | 4             | risk_value       |
    When the PRD panel renders
    Then the blocks appear in this order (matching PRD structure):
      | position | block_type       |
      | 1        | first_use_case   |
      | 2        | problem_context  |
      | 3        | data_signals     |
      | 4        | risk_value       |
    And empty placeholders for the remaining 8 block types are visible between and after the filled blocks

  Scenario: Block created out of typical order still sorts correctly
    Given the first_use_case and risk_value blocks exist
    When the AI creates the problem_context block (which sorts between them)
    Then the problem_context block appears between first_use_case and risk_value
    And the sort order is:
      | position | block_type       |
      | 1        | first_use_case   |
      | 2        | problem_context  |
      | ...      | (placeholders)   |
      | N        | risk_value       |
```

---

## Feature: Empty states

### SC-PLB-7 -- Empty states for unfilled blocks

> Traces to: US-PLB-3

```gherkin
Feature: Empty states

  Scenario: PRD panel shows all 12 block placeholders at session start
    Given a Builder PM has just started a new wizard session
    When the PRD panel renders
    Then 12 block placeholders are visible:
      | block_type         | placeholder_text                                  |
      | first_use_case     | This section will be filled during step 1         |
      | problem_context    | This section will be filled during step 1         |
      | data_signals       | This section will be filled during step 2         |
      | risk_value         | This section will be filled during step 3         |
      | risk_usability     | This section will be filled during step 3         |
      | risk_feasibility   | This section will be filled during step 3         |
      | risk_viability     | This section will be filled during step 3         |
      | confidence_score   | This section will be filled during step 3         |
      | success_criteria   | This section will be filled during step 4         |
      | kill_criteria      | This section will be filled during step 4         |
      | next_steps         | This section will be filled during step 4         |
      | executive_summary  | This section will be filled during step 4         |
    And each placeholder is visually muted (reduced opacity or dimmed text)
    And each placeholder shows the section title prominently
    And placeholders are compact (collapsed, not full-height)

  Scenario: Placeholder is replaced when block is filled
    Given the first_use_case placeholder is visible
    When the AI calls update_prd with block_type "first_use_case"
    Then the placeholder is replaced by the actual block content
    And the transition is animated (fade out placeholder, fade in content)
    And the block is visually distinct from remaining placeholders (full opacity, richer styling)
```

---

## Feature: Complete PRD state

### SC-PLB-8 -- Complete PRD after step 4

> Traces to: US-PLB-4

```gherkin
Feature: Complete PRD

  Scenario: All 12 blocks are filled after step 4 completion
    Given a Builder PM has completed all 4 wizard steps
    When the PRD panel renders in the completed state
    Then all 12 block types contain generated content (no placeholders remain)
    And the blocks appear in the correct sort order:
      | position | block_type         |
      | 1        | first_use_case     |
      | 2        | problem_context    |
      | 3        | data_signals       |
      | 4        | risk_value         |
      | 5        | risk_usability     |
      | 6        | risk_feasibility   |
      | 7        | risk_viability     |
      | 8        | confidence_score   |
      | 9        | success_criteria   |
      | 10       | kill_criteria      |
      | 11       | next_steps         |
      | 12       | executive_summary  |
    And evidence tags are visible on all blocks where applicable
```

### SC-PLB-9 -- PRD header with title, score, and buttons

> Traces to: US-PLB-4

```gherkin
  Scenario: PRD header displays metadata and actions
    Given a Builder PM has completed all 4 wizard steps
    When the PRD panel renders
    Then the header shows:
      | element           | content                              |
      | PRD title         | The title derived from the idea      |
      | Confidence score  | A number (e.g., 3.8/5) with badge   |
      | Recommendation    | "Build" or "Test first" or "Abandon" |
      | Export button     | "Export PDF" (clickable)             |
      | Share button      | "Share" (clickable)                  |
    And the title is editable by the PM (inline text editing)
    And the confidence score badge uses color: green (>= 4.0), amber (>= 3.0), red (< 3.0)
```

---

## Feature: Confidence score

### SC-PLB-10 -- Confidence score appears after step 3

> Traces to: US-PLB-5

```gherkin
Feature: Confidence score

  Scenario: Confidence score displayed after risk assessment
    Given a Builder PM has completed step 3 (Risk Challenge)
    And the AI has evaluated risks:
      | risk         | score |
      | Value        | 4     |
      | Usability    | 3     |
      | Feasibility  | 5     |
      | Viability    | 3     |
    When the AI writes the confidence_score block via update_prd
    Then the confidence score appears in the PRD header
    And the score value is 3.8/5 (average of 4 risk scores)
    And the badge color is amber (3.8 is >= 3.0 and < 4.0)
    And the recommendation text is "Test first"
```

### SC-PLB-11 -- Confidence score empty state before step 3

> Traces to: US-PLB-5

```gherkin
  Scenario: Confidence score shows empty state before step 3
    Given a Builder PM is at step 1 or step 2
    When the PRD panel renders
    Then the confidence score area in the header shows: "Confidence score will appear after risk assessment"
    And no numeric score is displayed
    And no color-coded badge is shown
```

---

## Feature: Markdown rendering

### SC-PLB-12 -- Block content renders as markdown

```gherkin
Feature: Markdown rendering

  Scenario: Block with markdown formatting renders correctly
    Given the AI has called update_prd with block_type "problem_context"
    And the content includes markdown:
      """
      ## Problem Context

      The core issue is that **PMs at startups** lack structured validation:

      - They receive feature requests from sales daily
      - They have *no framework* to evaluate which requests are worth building
      - The cost of a bad decision is permanent: once shipped, features are rarely removed

      > "We built 3 features last quarter that nobody uses." -- PM at a Series B startup [Evidence]
      """
    When the block renders in the PRD panel
    Then headings, bold text, italic text, lists, and blockquotes render correctly
    And the evidence tag [Evidence] renders as a green badge
    And the markdown rendering does not break the layout (no overflow, no missing styles)
```

---

## Feature: Block independence from conversation scroll

### SC-PLB-13 -- PRD panel scrolls independently

```gherkin
Feature: Independent scroll

  Scenario: PRD panel scrolls without affecting conversation panel
    Given the PRD panel has 6 filled blocks (enough content to require scrolling)
    When the PM scrolls down in the PRD panel
    Then the conversation panel's scroll position does not change
    And the PM can read PRD content while maintaining their place in the conversation

  Scenario: Conversation panel scrolls without affecting PRD panel
    Given the conversation has 20+ messages
    When the PM scrolls up in the conversation panel to review earlier messages
    Then the PRD panel's scroll position does not change
```

---

## Feature: Zustand store sync

### SC-PLB-14 -- PRD blocks sync on page reload

```gherkin
Feature: Store sync

  Scenario: PRD panel restores state on page reload
    Given a Builder PM has 5 filled blocks in the PRD panel
    When the PM reloads the browser page
    Then all 5 blocks are restored from the database
    And they appear in the correct sort order
    And evidence tags are preserved
    And the remaining 7 blocks show empty placeholders
    And the confidence score (if computed) is restored in the header
```
