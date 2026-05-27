# Gherkin Tests -- Public Sharing

> Acceptance scenarios in Given/When/Then. Each scenario traces to a user story. Covers
> toggle public, slug generation, public page rendering, OG meta tags, read-only view,
> evidence tags, 404 handling, and toggle off.

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

## Feature: Make PRD public

### SC-PS-1 -- Toggle public generates slug

> Traces to: US-PS-1

```gherkin
Feature: Make PRD public

  Background:
    Given a Builder PM has completed all 4 wizard steps
    And the PRD is currently private (is_public = false, share_slug = null)

  Scenario: PM toggles PRD to public for the first time
    Given the PRD panel header shows a "Make public" toggle in the OFF position
    When the PM clicks the "Make public" toggle
    Then the toggle switches to the ON position
    And a nanoid slug is generated (10 characters, URL-safe: [a-zA-Z0-9_-])
    And the full URL is displayed: "enhanced.pm/p/<slug>"
    And a "Copy link" button appears next to the URL
    And prds.is_public is set to true in the database
    And prds.share_slug is set to the generated slug in the database
```

### SC-PS-2 -- Copy link to clipboard

> Traces to: US-PS-1

```gherkin
  Scenario: PM copies the public link
    Given the PRD is public and the URL is displayed
    When the PM clicks the "Copy link" button
    Then the URL "https://enhanced.pm/p/<slug>" is copied to the system clipboard
    And visual confirmation is shown: a tooltip or text change reading "Link copied!"
    And the confirmation disappears after 3 seconds
```

### SC-PS-3 -- Re-toggle uses same slug

> Traces to: US-PS-1

```gherkin
  Scenario: PM toggles off then back on -- same slug is reused
    Given the PRD was previously public with slug "aBcDeF1234"
    And the PM toggled it off (is_public = false)
    When the PM toggles "Make public" back ON
    Then the slug "aBcDeF1234" is reused (no new slug generated)
    And the URL displayed is "enhanced.pm/p/aBcDeF1234"
    And the public page is immediately accessible again
```

---

## Feature: OG meta tags

### SC-PS-4 -- Public page has OG meta tags

> Traces to: US-PS-2

```gherkin
Feature: OG meta tags

  Background:
    Given a PRD is public with slug "xK9mN2pQ7w"
    And the PRD title is "AI-Powered Search for Documentation"
    And the executive_summary block contains "This PRD evaluates adding AI search to our documentation platform. Evidence suggests users spend an average of 4.2 minutes searching for answers, and 35% abandon without finding one."

  Scenario: Public page includes correct OG meta tags
    When a client fetches "https://enhanced.pm/p/xK9mN2pQ7w"
    Then the HTML response includes the following meta tags:
      | property        | content                                                                        |
      | og:title        | AI-Powered Search for Documentation                                            |
      | og:description  | This PRD evaluates adding AI search to our documentation platform. Evidence ... |
      | og:site_name    | Enhanced                                                                       |
      | og:type         | article                                                                        |
    And the og:description is truncated to at most 200 characters if the summary is longer
    And no evidence tags appear in the og:description (raw text only, badges stripped)
```

### SC-PS-5 -- Slack preview renders from OG tags

> Traces to: US-PS-2

```gherkin
  Scenario: Link pasted in Slack shows rich preview
    Given the public page has correct OG meta tags
    When a user pastes "https://enhanced.pm/p/xK9mN2pQ7w" into a Slack message
    Then Slack unfurls the link showing:
      | element     | content                                    |
      | Title       | AI-Powered Search for Documentation        |
      | Description | This PRD evaluates adding AI search to ... |
      | Site name   | Enhanced                                   |
```

---

## Feature: Public page rendering

### SC-PS-6 -- Public page renders full PRD read-only

> Traces to: US-PS-3

```gherkin
Feature: Public page rendering

  Background:
    Given a PRD is public with slug "xK9mN2pQ7w"
    And the PRD has all 12 blocks filled
    And the confidence score is 3.5/5 with recommendation "Test first"

  Scenario: Stakeholder views the full PRD
    When a Stakeholder navigates to "https://enhanced.pm/p/xK9mN2pQ7w"
    Then no login or signup prompt is shown
    And the page renders with the PRD title as the page heading
    And all 12 PRD blocks are displayed in the correct sort order:
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
    And the content is rendered as formatted markdown
    And no horizontal scrolling is required on desktop (viewport >= 1024px)
```

### SC-PS-7 -- Evidence tags visible on public page

> Traces to: US-PS-3

```gherkin
  Scenario: Evidence tags display correctly on public page
    Given the data_signals block contains:
      """
      - User churn rate is 8% monthly [Evidence]
      - Competitors likely have this feature [Assumption]
      - Impact on revenue is unknown [To verify]
      """
    When a Stakeholder views the public page
    Then [Evidence] renders as a green badge with text
    And [Assumption] renders as an amber badge with text
    And [To verify] renders as a red badge with text
    And the badges are inline with the text (same rendering as the wizard's PRD panel)
```

### SC-PS-8 -- Read-only view (no wizard elements)

> Traces to: US-PS-3

```gherkin
  Scenario: Public page is read-only with no wizard elements
    When a Stakeholder views the public page
    Then no "Refine" buttons are visible on any block
    And no chat input or conversation panel is shown
    And no ask_user cards or interactive elements appear
    And no step indicator or wizard navigation is shown
    And a "Made with Enhanced" footer badge is visible at the bottom of the page
    And the footer badge links to Enhanced's homepage

  Scenario: Confidence score and recommendation displayed
    When a Stakeholder views the public page
    Then the confidence score "3.5/5" is displayed with an amber badge
    And the recommendation "Test first" is displayed next to the score
    And the score and recommendation are visible near the top of the page (above the first block or in a header)
```

---

## Feature: 404 handling

### SC-PS-9 -- Invalid slug returns 404

> Traces to: US-PS-4

```gherkin
Feature: 404 handling

  Scenario: Non-existent slug returns 404
    When a user navigates to "https://enhanced.pm/p/does-not-exist"
    Then the HTTP response status code is 404
    And a branded 404 page is displayed
    And the page shows the message: "This PRD doesn't exist or is no longer public"
    And the page includes a link to Enhanced's homepage
    And no server error or stack trace is visible
    And no PRD content or metadata is leaked
```

### SC-PS-10 -- Private PRD slug returns 404

> Traces to: US-PS-4

```gherkin
  Scenario: PRD exists but is private -- returns 404
    Given a PRD exists with slug "aBcDeF1234" but is_public is false
    When a user navigates to "https://enhanced.pm/p/aBcDeF1234"
    Then the HTTP response status code is 404
    And the same branded 404 page is displayed
    And the message is: "This PRD doesn't exist or is no longer public"
    And the response does NOT reveal that the slug exists but is private
```

### SC-PS-11 -- Toggle off makes page 404 immediately

> Traces to: US-PS-4

```gherkin
  Scenario: PM toggles PRD private -- public page becomes 404 immediately
    Given a PRD is public with slug "xK9mN2pQ7w"
    And a Stakeholder has the URL bookmarked
    When the Builder PM toggles "Make public" to OFF
    And the Stakeholder refreshes the bookmarked page
    Then the HTTP response status code is 404
    And the branded 404 page is displayed
    And the previously visible PRD content is no longer accessible
```

---

## Feature: RLS enforcement

### SC-PS-12 -- RLS allows public read, blocks private read

```gherkin
Feature: RLS enforcement

  Scenario: Unauthenticated user can read public PRD via RLS
    Given a PRD with is_public = true and share_slug = "xK9mN2pQ7w"
    When an unauthenticated Supabase client queries prds where share_slug = "xK9mN2pQ7w"
    Then the query returns the PRD row
    And the query also returns associated prd_blocks rows

  Scenario: Unauthenticated user cannot read private PRD via RLS
    Given a PRD with is_public = false and share_slug = "aBcDeF1234"
    When an unauthenticated Supabase client queries prds where share_slug = "aBcDeF1234"
    Then the query returns zero rows
    And no error is thrown (RLS silently filters)

  Scenario: Unauthenticated user cannot query PRDs without a slug
    When an unauthenticated Supabase client queries all prds
    Then the query returns zero rows (RLS blocks all rows for unauthenticated users)
    And no PRD data is leaked
```
