# User Stories & JTBD -- Public Sharing

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

## JTBD

> When I have completed a structured validation of my product idea, I want to share the
> resulting PRD with my stakeholders and team via a simple link -- no accounts, no exports,
> no friction -- so they can review the evidence, risks, and recommendation and make an
> informed go/no-go decision.

---

## Personas

- **Builder PM** -- PM at a startup/scale-up, ships fast, tech-savvy, time-constrained. PRODUCER. Toggles the PRD public and shares the link with stakeholders.
- **Stakeholder** -- CPO/CEO/lead who reviews PRDs. CONSUMER. Receives the public link and reads the PRD in the browser. No account required. This is the primary beneficiary of public sharing.
- **Team Lead** -- Engineering lead who scopes work from PRDs. CONSUMER. Receives the link from the PM or the Stakeholder. Reads risk and feasibility sections to plan sprint work.

---

## User stories

### US-PS-1 -- Make a PRD public

- **Story:** As a **Builder PM**, I want to toggle my PRD to "public" and get a shareable link, so that I can send it to stakeholders who don't have an Enhanced account.
- **Priority:** MUST
- **Why:** Stakeholders and team leads consume the PRD but do not use the wizard. Requiring them to create an account just to read a document adds friction that kills adoption. The public link removes that barrier entirely. `[Evidence]` -- PRD MUST requirement: "No account required to view a shared PRD." Also, PRD section 3: "each shared PRD is a product demo" for organic distribution.
- **Acceptance criteria:**
  - [ ] A "Make public" toggle is visible in the PRD panel (e.g., in the header or share menu)
  - [ ] Toggling "Make public" ON generates a nanoid slug (10 chars, URL-safe) if none exists
  - [ ] The full public URL is displayed: `enhanced.pm/p/[slug]`
  - [ ] A "Copy link" button copies the URL to the clipboard
  - [ ] Visual confirmation is shown when the link is copied (e.g., tooltip "Link copied!")
  - [ ] The `prds.share_slug` and `prds.is_public = true` are saved to the database
  - [ ] If the PRD already has a slug from a previous toggle, the same slug is reused (no new slug generated)
- **Maps to Gherkin:** SC-PS-1, SC-PS-2, SC-PS-3

---

### US-PS-2 -- Share a PRD link with a stakeholder

- **Story:** As a **Builder PM**, I want to paste the public link into Slack, email, or any communication tool, so that my stakeholders can open it in their browser and read the PRD immediately.
- **Priority:** MUST
- **Why:** The PRD must leave Enhanced to have organizational impact. PMs communicate via Slack, email, and Notion. The link must work in all these contexts -- including rendering a rich preview (OG meta tags) in Slack and email clients. `[Evidence]` -- PRD MUST: "OpenGraph meta tags for social preview (title, description, image)."
- **Acceptance criteria:**
  - [ ] The public URL is a standard HTTPS link that opens in any browser
  - [ ] The page renders without JavaScript (SSR Server Component) so it works in all contexts
  - [ ] OG meta tags are present in the HTML:
    - `og:title` = PRD title
    - `og:description` = executive_summary block content (truncated to 200 chars)
    - `og:site_name` = "Enhanced"
    - `og:type` = "article"
  - [ ] Pasting the link in Slack shows a rich preview with title and description
  - [ ] Pasting the link in an email that supports link previews shows title and description
- **Maps to Gherkin:** SC-PS-4, SC-PS-5

---

### US-PS-3 -- View a shared PRD without an account

- **Story:** As a **Stakeholder**, I want to open a PRD link I received and read the full document in my browser without creating an account or logging in, so that I can review the evidence and risks and make a decision quickly.
- **Priority:** MUST
- **Why:** The Stakeholder persona does not use the wizard. Their interaction with Enhanced is through the shared PRD. Any friction (login wall, signup prompt, "please create an account" modal) would cause them to close the tab and ask the PM for a summary in Slack instead -- defeating the purpose of the structured artifact. `[Evidence]` -- PRD persona spec: Stakeholder "does not use the wizard directly (in V1)"; PRD MUST: "No account required to view."
- **Acceptance criteria:**
  - [ ] The public page loads without any authentication prompt
  - [ ] The full PRD is displayed: all 12 block types (those that are filled)
  - [ ] Evidence tags are visible as colored badges: [Evidence] green, [Assumption] amber, [To verify] red
  - [ ] The confidence score and recommendation are displayed
  - [ ] The page uses the same visual styling as the wizard's PRD panel (same typography, colors, spacing)
  - [ ] No "Refine" buttons are shown (read-only view)
  - [ ] No interactive elements from the wizard appear (no card inputs, no chat)
  - [ ] A "Made with Enhanced" footer badge is visible at the bottom
- **Maps to Gherkin:** SC-PS-6, SC-PS-7, SC-PS-8

---

### US-PS-4 -- Get a 404 for invalid or non-public links

- **Story:** As a **Stakeholder** (or anyone), I want to see a clear 404 page when I visit a link with an invalid slug or a PRD that is no longer public, so that I understand the link is broken or revoked and am not confused by an empty or error-ridden page.
- **Priority:** MUST
- **Why:** Public URLs are shareable and persistent. Slugs will be bookmarked, shared in documents, and indexed. A broken slug that shows a cryptic error or a blank page erodes trust in the product. A clean 404 maintains professionalism. `[Evidence]` -- PRD MUST: "404 if slug doesn't exist or PRD is not public." Standard web UX expectation.
- **Acceptance criteria:**
  - [ ] Visiting `/p/nonexistent-slug` shows a 404 page (not a server error or blank page)
  - [ ] The 404 page is branded (Enhanced logo, consistent styling)
  - [ ] The 404 page shows a clear message: "This PRD doesn't exist or is no longer public"
  - [ ] The 404 page includes a link to Enhanced's homepage
  - [ ] If a PM toggles a PRD from public to private, visiting the slug immediately returns 404
  - [ ] The 404 response has HTTP status code 404 (not 200 with error content)
  - [ ] No sensitive information is leaked (no PRD content, no owner info, no session data)
- **Maps to Gherkin:** SC-PS-9, SC-PS-10, SC-PS-11

---

## Out of scope (non-stories)

- **Password-protected sharing** -- No way to add a password to a public link in V1. `[Assumption]` -- if stakeholders need restricted access, the PM can toggle the PRD private and share via PDF instead.
- **Custom slugs** -- The slug is auto-generated via nanoid. PMs cannot choose their own slugs. `[Assumption]` -- custom slugs add vanity without functional value for V1.
- **Analytics on shared PRDs** -- No tracking of how many times a public PRD was viewed, by whom, or for how long. `[To verify]` -- this could be valuable for PMs to know if their stakeholders actually read the PRD, but it's out of scope for V1.
- **Embed widget** -- No way to embed a PRD inside a Notion page, Confluence, or other tool via iframe. `[To verify]` -- potential V2 feature if teams use Notion as their wiki.
- **Multiple public links per PRD** -- One slug per PRD. No A/B testing of different PRD versions via different links.

> Challenge: Does every MUST story trace to a verified problem in the PRD/Discovery? Does
> every story have at least one acceptance criterion that a test could check? If not, fix it
> before it reaches engineering.
>
> Traceability:
> - US-PS-1 (make public) -> PRD MUST: "Generate a public URL enhanced.pm/p/[slug]"
> - US-PS-2 (share link) -> PRD MUST: "OpenGraph meta tags for social preview"
> - US-PS-3 (view without account) -> PRD MUST: "No account required to view" + Stakeholder persona
> - US-PS-4 (404) -> PRD MUST: "404 if slug doesn't exist or PRD is not public"
>
> Every story traces. The feature is tightly scoped and directly maps to PRD requirements.
