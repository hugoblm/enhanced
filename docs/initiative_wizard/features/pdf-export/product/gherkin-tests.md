# Gherkin Tests — PDF Export

> Acceptance scenarios in Given/When/Then format. Each scenario traces to a user story in
> `user-stories-and-jtbd.md` and represents a testable behavior that must pass before the
> feature is considered complete.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Feature: Export button and download flow

### SC-PE-01 -- Export button visible in PRD panel header
**Traces to:** US-PE-1

```gherkin
Feature: PDF export trigger

  Scenario: Export button is visible for a completed PRD
    Given I am an authenticated user in the wizard
    And my PRD has at least 1 generated block
    When I look at the PRD panel header
    Then an "Export PDF" button is visible
    And the button has an icon (download or document icon) and the label "Export PDF"
```

### SC-PE-02 -- Clicking export triggers download
**Traces to:** US-PE-1

```gherkin
  Scenario: PM clicks export and downloads the PDF
    Given I am an authenticated user with a completed PRD
    And I am viewing the PRD panel
    When I click the "Export PDF" button
    Then a loading indicator appears on the button (spinner replaces icon or overlay)
    And a request is sent to GET /api/export/[prdId]/pdf
    And the server generates the PDF using @react-pdf/renderer
    And the response has Content-Type "application/pdf"
    And the response has Content-Disposition "attachment; filename=enhanced-prd-[slug].pdf"
    And the browser opens the download dialog
    And the loading indicator disappears after download starts
```

---

## Feature: PDF content -- all sections with evidence tags

### SC-PE-03 -- PDF contains all PRD blocks in order
**Traces to:** US-PE-2

```gherkin
Feature: PDF content completeness

  Scenario: PDF includes all generated PRD blocks in correct order
    Given I have a completed PRD with the following blocks:
      | order | block_type      | content                                    |
      | 1     | jtbd            | "Quand j'ai une idée de feature..."        |
      | 2     | first_use_case  | "Je suis PM dans une startup..."           |
      | 3     | objectives      | "Permettre aux PM de valider en 30 min..." |
      | 4     | context         | "Les outils AI accélèrent le build..."     |
      | 5     | vision          | "Chaque feature livrée commence par..."    |
      | 6     | target_audience | "PM Builder: startup, tech-savvy..."       |
      | 7     | problems        | "Les décisions feature sont prises sans..." |
      | 8     | solution        | "Un wizard conversationnel en 4 étapes..." |
      | 9     | benchmark       | "Notion AI, Linear, ChatGPT direct..."     |
      | 10    | features        | "Landing page, Deferred auth, Wizard..."   |
      | 11    | risks           | "Les PM ne veulent pas être challengés..." |
      | 12    | success_criteria| "50+ inscrits webinar, 10+ PRD créés..."   |
    When I export the PRD as PDF
    Then the PDF contains 12 sections
    And the sections appear in the order: JTBD, First Use Case, Objectives, Context, Vision, Target Audience, Problems, Solution, Benchmark, Features, Risks, Success Criteria
    And each section has a heading matching the block type name
    And each section contains the block content
```

### SC-PE-04 -- Evidence tags are visually distinguished in PDF
**Traces to:** US-PE-2

```gherkin
  Scenario: Evidence tags are rendered with visual distinction
    Given a PRD block contains the text "Les outils AI accélèrent le build [Evidence]"
    And another block contains "Les PM veulent être challengés [Assumption]"
    And another block contains "Taux de conversion signup [To verify]"
    When I export the PRD as PDF
    Then "[Evidence]" is rendered with a green background or green-colored label
    And "[Assumption]" is rendered with an amber/yellow background or label
    And "[To verify]" is rendered with a blue background or label
    And the tags are visually distinct from surrounding body text
```

### SC-PE-05 -- Confidence score and recommendation displayed
**Traces to:** US-PE-2

```gherkin
  Scenario: PDF displays confidence score and recommendation
    Given my PRD has a calculated confidence score of 72%
    And the recommendation is "Go with caution"
    When I export the PRD as PDF
    Then the confidence score "72%" is displayed prominently (header area or summary section)
    And the recommendation "Go with caution" is displayed near the confidence score
    And both are visually emphasized (larger font, bold, or distinct section)
```

---

## Feature: Branded layout and typography

### SC-PE-07 -- PDF uses Obra design tokens and Enhanced branding
**Traces to:** US-PE-3

```gherkin
Feature: PDF branding

  Scenario: PDF is branded with Obra typography and Enhanced identity
    Given I export a completed PRD as PDF
    When I open the downloaded PDF in a viewer
    Then the PDF header contains the Enhanced logo
    And the document title (PRD name) is displayed in the header
    Then section headings use the Kedebideri font family
    And body text uses the Cantarell font family
    And the PDF footer shows: page number, generation date, "Generated with Enhanced"
    And the layout has consistent margins and spacing
    And the overall appearance is clean and professional
```

---

## Feature: Loading and error states

### SC-PE-06 -- Loading state during PDF generation
**Traces to:** US-PE-1

```gherkin
Feature: Export loading state

  Scenario: Loading indicator visible during generation
    Given I click the "Export PDF" button
    When the server is generating the PDF (takes 1-3 seconds)
    Then the export button shows a loading spinner
    And the button is disabled (cannot be clicked again)
    And the rest of the wizard remains interactive
    When the PDF is ready and the download starts
    Then the loading spinner disappears
    And the button returns to its default state
```

### SC-PE-08 -- Error handling during PDF generation
**Traces to:** US-PE-1

```gherkin
Feature: Export error handling

  Scenario: PDF generation fails gracefully
    Given I click the "Export PDF" button
    And the server encounters an error during PDF generation (e.g., font embedding failure, timeout)
    When the error response is received
    Then the loading spinner disappears
    And the button returns to its default state
    And an error message is displayed: "Impossible de générer le PDF. Réessayez."
    And the error message is a toast notification or inline message
    And the PM can click the export button again to retry
```

---

## Edge cases

### SC-PE-E1 -- Export with partially completed PRD
**Traces to:** US-PE-2

```gherkin
  Scenario: Export a PRD with only some blocks generated
    Given my PRD has 4 blocks generated (JTBD, First Use Case, Objectives, Context)
    And 8 blocks have not been generated yet
    When I export the PRD as PDF
    Then the PDF contains the 4 generated blocks with their content
    And the 8 missing blocks are either omitted entirely or shown as "Section non complétée"
    And the PDF is still valid and downloadable
```

### SC-PE-E2 -- Export button disabled when no blocks exist
**Traces to:** US-PE-1

```gherkin
  Scenario: Export button is disabled when PRD has no content
    Given I am in the wizard with a new session
    And my PRD has 0 generated blocks
    When I look at the PRD panel header
    Then the "Export PDF" button is visible but disabled (grayed out)
    And hovering shows a tooltip: "Complétez au moins une section pour exporter"
```

### SC-PE-E3 -- Concurrent export requests
**Traces to:** US-PE-1

```gherkin
  Scenario: PM cannot trigger multiple concurrent exports
    Given I clicked "Export PDF" and the loading spinner is visible
    When I attempt to click the "Export PDF" button again
    Then the click is ignored (button is disabled during loading)
    And only one PDF generation request is sent to the server
```

### SC-PE-E4 -- Markdown rendering in PDF
**Traces to:** US-PE-2

```gherkin
  Scenario: Markdown content is properly rendered in PDF
    Given a PRD block contains markdown: "**Problème principal**: les PM _skipent_ la validation\n- Point 1\n- Point 2"
    When I export the PRD as PDF
    Then "Problème principal" is rendered in bold
    And "skipent" is rendered in italic
    And "Point 1" and "Point 2" are rendered as bullet points
    And the formatting matches the on-screen PRD panel rendering
```
