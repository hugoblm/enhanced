# Acceptance Tests (Gherkin) — \<Feature name\>

> Acceptance criteria written as **Given / When / Then** scenarios. They define "done" in
> observable terms and can be turned into automated tests. Every `MUST` user story should have at
> least one scenario here; reference the story ID.

**Status:** `Draft` · `In review` · `Approved` · **Author:** \<name\> · **Date:** \<date\>

---

## How to write these

- **Given** = the starting context. **When** = the action. **Then** = the observable result.
- One behavior per scenario. Keep them concrete and testable — no "works correctly".
- Use `Scenario Outline` + `Examples` when the same rule has several data cases.
- Cover the **happy path, the edge cases, and the failure modes** — not just the success case.

---

```gherkin
Feature: <Feature name>
  As a <persona>
  I want <capability>
  So that <benefit>

  # Maps to: US-1
  Scenario: <happy path — short descriptive name>
    Given <initial context>
    And <more context if needed>
    When <the user action>
    Then <the expected, observable outcome>
    And <any additional expected outcome>

  # Maps to: US-1
  Scenario: <edge case — short descriptive name>
    Given <context that triggers the edge case>
    When <action>
    Then <expected handling>

  # Maps to: US-2
  Scenario: <failure mode — what should NOT happen / graceful error>
    Given <context>
    When <invalid or failing action>
    Then <the system fails safely / shows the right error>

  # Data-driven example
  Scenario Outline: <rule that varies by input>
    Given <context with "<input>">
    When <action>
    Then <result is "<expected>">

    Examples:
      | input   | expected |
      | <value> | <value>  |
      | <value> | <value>  |
```

---

> 🔍 **Challenge:** Does every `MUST` story have a scenario? Did you cover the failure and edge
> cases, or only the happy path? An acceptance suite that only proves the happy path proves
> almost nothing.
