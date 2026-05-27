# UX & Accessibility -- Public Sharing

> UX flows, interaction patterns, and WCAG 2.1 AA accessibility requirements for the
> public sharing feature -- both the PM-facing toggle and the Stakeholder-facing public page.

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

## Primary flow: PM makes PRD public and shares

```
Builder PM has completed the wizard (all 4 steps)
  |
  v
PRD panel header shows:
  [Title] [Confidence: 3.5/5 - Test first] [Export PDF] [Share]
  |
  v
PM clicks "Share" button
  |
  v
Share menu opens:
  [ ] Make public (toggle, currently OFF)
  |
  v
PM toggles "Make public" to ON
  |
  v
System generates nanoid slug (10 chars) if none exists
  → prds.share_slug = "xK9mN2pQ7w"
  → prds.is_public = true
  |
  v
Share menu updates:
  [x] Make public (toggle, now ON)
  URL: enhanced.pm/p/xK9mN2pQ7w
  [Copy link]
  |
  v
PM clicks "Copy link"
  → URL copied to clipboard
  → "Link copied!" confirmation (3s, then fades)
  |
  v
PM pastes link in Slack / email / Notion
  → Stakeholder receives the link
```

---

## Primary flow: Stakeholder views shared PRD

```
Stakeholder receives link (via Slack / email / Notion)
  |
  v
Link preview shows: title + description (from OG meta tags)
  |
  v
Stakeholder clicks the link
  |
  v
Browser navigates to enhanced.pm/p/xK9mN2pQ7w
  |
  v
Server Component renders:
  → Supabase query: SELECT prd + blocks WHERE share_slug = slug AND is_public = true
  → generateMetadata() sets OG tags
  |
  +--> [PRD found and public]
  |      |
  |      v
  |    Full page renders:
  |      Header: PRD title, confidence score badge, recommendation
  |      Body: 12 blocks in sort order, evidence tags as badges
  |      Footer: "Made with Enhanced" badge (links to homepage)
  |      No login prompt, no wizard elements, no "Refine" buttons
  |
  +--> [Slug not found OR is_public = false]
         |
         v
       404 page:
         Enhanced branding
         "This PRD doesn't exist or is no longer public"
         Link to homepage
```

---

## Sub-flow: PM revokes public access

```
Builder PM in the wizard, PRD is currently public
  |
  v
PM clicks "Share" button → share menu opens
  |
  v
PM toggles "Make public" to OFF
  → prds.is_public = false (slug is preserved for re-toggle)
  → URL and "Copy link" button disappear from the share menu
  |
  v
Any Stakeholder refreshing the URL → sees 404 immediately
  |
  v
PM toggles "Make public" back ON
  → Same slug reused: prds.is_public = true
  → URL reappears
  → Stakeholder can access again
```

---

## Error flow: Database failure on toggle

```
PM toggles "Make public" ON
  |
  v
Server Action: update prds set is_public = true, share_slug = nanoid()
  |
  +--> [Success] → normal flow
  |
  +--> [DB error]
        |
        v
       Toggle reverts to OFF position
       Error toast: "Could not make this PRD public. Please try again."
       No slug is generated
       No URL is displayed
```

---

## UX requirements

### Share toggle (PM-facing)

- **Location:** Inside a "Share" dropdown/popover in the PRD panel header. The Share button is visible at all times after step 4 completion. `[Assumption]` -- a dropdown is cleaner than cluttering the header with toggle + URL + copy button permanently.
- **Toggle control:** Standard toggle switch (on/off). Uses Obra design token colors. ON state = primary color (blue/green), OFF state = muted.
- **URL display:** The public URL is displayed as selectable text below the toggle when ON. PM can also manually select and copy (in addition to the "Copy link" button).
- **Copy confirmation:** A brief "Link copied!" tooltip or text change on the "Copy link" button. Appears for 3 seconds, then reverts. No modal or alert.
- **Re-toggle:** When toggling off, no destructive confirmation is needed ("Are you sure?") because the slug is preserved and toggling back on restores it. `[Assumption]` -- the reversibility makes confirmation unnecessary. If user tests show PMs are accidentally toggling off, add confirmation.
- **Pre-step-4:** The Share button should be available even before step 4 completion, but with a subtle indication that the PRD is incomplete. `[To verify]` -- whether PMs should be able to share incomplete PRDs needs user testing.

### Public page (Stakeholder-facing)

- **Layout:** Single-column layout, centered on desktop (max-width ~720px for readability). No split view, no sidebar. The page is a clean document view. `[Assumption]` -- 720px is a readable line length for long-form text. Wider layouts would cause eye strain.
- **Header:** PRD title (h1), confidence score badge, recommendation text. Enhanced logo in the top-left corner (links to homepage). No navigation bar (the Stakeholder has no other pages to visit).
- **Content:** 12 blocks in sort order, each with its section title as a heading. Markdown rendered. Evidence tags as colored badges. Same visual styling as the wizard's PRD panel (typography, colors, spacing, badge design). `[Evidence]` -- consistency between the wizard view and the public view ensures the PM and the Stakeholder are reading the same document.
- **Footer:** "Made with Enhanced" badge. Clean, understated. Links to Enhanced's homepage. Not a full footer with links/legal/social (that's for the landing page, not a document view).
- **No interactive elements:** No "Refine" buttons, no chat input, no step indicator, no cards. The page is static and read-only. No JavaScript is required for the content to render (SSR).
- **Print-friendly:** The page should print cleanly (ctrl+P or cmd+P). Evidence tag colors should be visible in print. `[Assumption]` -- some stakeholders may print the page for review meetings. This is a nice-to-have, not a blocker.

### 404 page

- **Visual style:** Uses Enhanced branding (logo, Obra design tokens). Same typography and colors as the rest of the product.
- **Message:** "This PRD doesn't exist or is no longer public" -- phrased to cover both cases (invalid slug, revoked access) without revealing which one.
- **CTA:** A link to Enhanced's homepage: "Go to Enhanced" or "Back to Enhanced."
- **No detail:** No slug displayed, no error codes, no stack traces, no metadata about the PRD.

---

## WCAG 2.1 AA requirements

### Perceivable

| Requirement | Implementation | Guideline |
|-------------|----------------|-----------|
| Text contrast | All text on the public page meets 4.5:1 contrast ratio. PRD content, headings, evidence tags, footer. | 1.4.3 Contrast (Minimum) |
| Evidence tag colors | Badges include text labels (not color-only). Colorblind users can read "[Evidence]" without relying on green. | 1.4.1 Use of Color |
| Confidence score | Score uses color (green/amber/red) but always includes the numeric value and recommendation text. | 1.4.1 Use of Color |
| Text resize | Content is readable at 200% zoom. Single-column layout reflows naturally. | 1.4.4 Resize Text |
| Images of text | No images of text. All content is real HTML text. | 1.4.5 Images of Text |
| Responsive | Content adapts from 1440px down to 320px without horizontal scrolling. | 1.4.10 Reflow |

### Operable

| Requirement | Implementation | Guideline |
|-------------|----------------|-----------|
| Keyboard navigation (toggle) | The "Make public" toggle is keyboard-accessible: Tab to focus, Space/Enter to toggle. | 2.1.1 Keyboard |
| Focus visible (toggle) | The toggle and "Copy link" button show a visible focus ring. | 2.4.7 Focus Visible |
| Touch targets | Toggle and "Copy link" are at least 44x44px on touch devices. | 2.5.5 Target Size |
| Public page keyboard | The public page has no interactive elements (read-only), but all links (homepage, footer) are keyboard-accessible. | 2.1.1 Keyboard |
| Skip to content | The public page has a skip link to jump past the header directly to the PRD content. | 2.4.1 Bypass Blocks |
| Page title | The public page's `<title>` matches the PRD title: "[PRD title] - Enhanced". | 2.4.2 Page Titled |

### Understandable

| Requirement | Implementation | Guideline |
|-------------|----------------|-----------|
| 404 message | The 404 page uses plain language: "This PRD doesn't exist or is no longer public." No jargon, no error codes. | 3.1.1 Language of Page |
| Toggle behavior | The toggle's state (ON/OFF) is immediately reflected visually. No ambiguity about whether the PRD is currently public. | 3.2.1 On Focus |
| Copy feedback | "Link copied!" confirmation is clear and disappears automatically (no action required from the PM). | 3.3.1 Error Identification |
| Language | The public page language matches the PRD content language (set in the HTML `lang` attribute). | 3.1.1 Language of Page |

### Robust

| Requirement | Implementation | Guideline |
|-------------|----------------|-----------|
| Toggle ARIA | The toggle uses `role="switch"` with `aria-checked="true/false"` and `aria-label="Make PRD public"`. | 4.1.2 Name, Role, Value |
| Copy button ARIA | The "Copy link" button has `aria-label="Copy public link to clipboard"`. After copying, `aria-live="polite"` announces "Link copied." | 4.1.3 Status Messages |
| Semantic markup (public page) | The public page uses semantic HTML: `<main>`, `<article>`, `<h1>` for title, `<section>` per block with heading. | 4.1.1 Parsing |
| Heading hierarchy (public page) | The PRD title is `<h1>`. Block section titles are `<h2>`. Sub-headings within block content are `<h3>`. | 2.4.6 Headings and Labels |
| Landmark regions | Public page has `<header>` (logo + score), `<main>` (PRD content), `<footer>` (Enhanced badge). | 4.1.2 Name, Role, Value |

---

## A11y checklist (pre-release)

### PM-facing (toggle)
- [ ] "Make public" toggle is keyboard-accessible (Tab + Space/Enter)
- [ ] Toggle has `role="switch"` with correct `aria-checked` state
- [ ] "Copy link" button has an accessible name
- [ ] Copy confirmation is announced via aria-live
- [ ] Focus ring is visible on toggle and Copy link button

### Stakeholder-facing (public page)
- [ ] All text meets 4.5:1 contrast ratio (run Lighthouse or axe scan)
- [ ] Evidence tags have text labels (not color-only)
- [ ] Confidence score has numeric value + text (not color-only)
- [ ] Page has a `<title>` matching the PRD title
- [ ] Page has a skip link to the PRD content
- [ ] Heading hierarchy is correct: h1 (title), h2 (sections), h3 (sub-content)
- [ ] All links (homepage, footer) are keyboard-navigable
- [ ] Page is readable at 200% zoom without horizontal scroll
- [ ] Page renders without JavaScript (SSR -- content is in the initial HTML)
- [ ] HTML `lang` attribute is set correctly
- [ ] 404 page is accessible: heading, clear message, homepage link
- [ ] Screen reader (VoiceOver) can navigate the PRD by heading to jump between blocks
