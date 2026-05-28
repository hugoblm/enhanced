# User Stories & JTBD — PDF Export

> Captures **who** needs **what** and **why**. Pairs with the PRD. Stories drive the Gherkin
> acceptance tests (`gherkin-tests.md`) -- each story maps to at least one scenario.

**Evidence discipline:** tag the rationale of a story `[Evidence]` / `[Assumption]` / `[To verify]`.
A story with no evidence and no link to a verified problem is a candidate for cutting.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Jobs To Be Done (JTBD)

The underlying jobs users are "hiring" this feature to do. Job statements are solution-agnostic.

- **Main job:** When I've completed my PRD validation and need to share the result with stakeholders who won't log into Enhanced, I want to export a professional, self-contained document, so I can communicate my findings through the channels my team already uses (email, Slack, meetings).

- **Related jobs:**
  - When I present a feature proposal in a stakeholder review, I want a polished document that looks credible, so that the structured validation work is taken seriously and not dismissed as "AI-generated filler."
  - When I want to archive a point-in-time PRD decision, I want a downloadable snapshot, so I can keep a record outside of Enhanced.

---

## Personas (quick reference)

- **Builder PM** -- PM at startup/scale-up, ships fast, tech-savvy, time-constrained. Exports the PRD after completing the wizard. PRODUCER.
- **Stakeholder** -- CPO/CEO/lead who receives the PDF for review. Does not use Enhanced directly. CONSUMER.
- **Team Lead** -- Engineering lead who reads the PRD to scope technical work. Receives the PDF. CONSUMER.

---

## User stories

### US-PE-1 -- Export a completed PRD as branded PDF

- **Story:** As a **Builder PM**, I want to click an export button in the PRD panel and download a branded PDF of my completed PRD, so I can share the result with my team without requiring them to create an Enhanced account.
- **Priority:** `MUST`
- **Why (rationale):** The PRD's organizational impact depends on its ability to leave Enhanced and reach stakeholders. A PDF is the universal document format -- it works in email, Slack, Google Drive, Notion, and printed handouts. Without export, the PRD is trapped in the tool, limiting its value to the PM alone. `[Evidence]` -- traces to Discovery Problem 1 (no structured validation = nothing to share). The PRD section 5 explicitly lists PDF export as MUST for the webinar demo.
- **Acceptance criteria:**
  - [ ] An "Export PDF" button (icon + label) is visible in the PRD panel header
  - [ ] Clicking the button triggers a server request to `GET /api/export/[prdId]/pdf`
  - [ ] The server generates the PDF using `@react-pdf/renderer`
  - [ ] The PDF is returned with `Content-Disposition: attachment; filename="enhanced-prd-[slug].pdf"`
  - [ ] The browser opens the download dialog (not a new tab)
  - [ ] A loading state (spinner on the button or overlay) is visible during generation
  - [ ] The button returns to its default state after download completes or fails
  - [ ] If generation fails, an error message is displayed (toast or inline): "Impossible de generer le PDF. Reessayez."
- **Maps to Gherkin:** `gherkin-tests.md` --> SC-PE-01, SC-PE-02, SC-PE-06, SC-PE-08

### US-PE-2 -- PDF includes all PRD sections with evidence tags

- **Story:** As a **Stakeholder**, I want the exported PDF to contain all PRD sections in order with evidence tags clearly visible, so I can review the validation work and judge the confidence level of each claim without asking the PM for context.
- **Priority:** `MUST`
- **Why (rationale):** Evidence tagging is Enhanced's core differentiator. If the PDF strips the tags or renders them as plain text, the stakeholder loses the most important signal: which claims are backed by data and which are assumptions. `[Evidence]` -- traces to Discovery Problem 5 (evidence vs. assumption is never made explicit) and PRD Objective 2 (make evidence distinction visible and systematic).
- **Acceptance criteria:**
  - [ ] The PDF contains all PRD blocks in their defined order (JTBD, First Use Case, Objectives, Context, Vision, Target Audience, Problems, Solution, Benchmark, Features, Risks, Success Criteria)
  - [ ] Each block is rendered with its title as a section heading
  - [ ] Evidence tags are visually distinguished:
    - `[Evidence]` -- rendered with a green background or green-colored label
    - `[Assumption]` -- rendered with an amber/yellow background or label
    - `[To verify]` -- rendered with a blue background or label
  - [ ] Markdown formatting within blocks is preserved (bold, italic, lists, links)
  - [ ] The confidence score (if calculated) is displayed prominently -- e.g., in the header or as a summary section
  - [ ] The final recommendation (Go / No-Go / Needs More Data) is visible
  - [ ] Empty blocks (not yet generated) are either omitted or shown as "Section non completee"
- **Maps to Gherkin:** `gherkin-tests.md` --> SC-PE-03, SC-PE-04, SC-PE-05

### US-PE-3 -- PDF is branded and professional

- **Story:** As a **Builder PM**, I want the exported PDF to look professional and carry Enhanced branding, so that when I share it with my CPO or team, it looks like a serious validation artifact -- not a raw AI dump.
- **Priority:** `MUST`
- **Why (rationale):** The PDF is Enhanced's ambassador outside the product. A poorly formatted or unbranded PDF undermines the PM's credibility and Enhanced's positioning as a "pre-build quality gate." The branding also creates organic awareness -- every shared PDF is a subtle product demo. `[Assumption]` -- branding drives awareness. This is a reasonable assumption for B2B tools but unvalidated for Enhanced specifically.
- **Acceptance criteria:**
  - [ ] The PDF header includes the Enhanced logo and the document title (PRD name or session title)
  - [ ] The PDF uses Obra typography: Kedebideri for headings (section titles), Cantarell for body text
  - [ ] Fonts are embedded in the PDF (base64) so rendering is consistent regardless of the reader's installed fonts `[To verify]` -- font embedding with @react-pdf/renderer needs validation for Kedebideri/Cantarell format compatibility
  - [ ] The PDF footer includes: page number, generation date, "Generated with Enhanced" text
  - [ ] The layout is clean with consistent margins, spacing, and section breaks
  - [ ] The PDF looks professional when viewed in macOS Preview, Chrome PDF viewer, and Adobe Acrobat
  - [ ] The PDF is reasonably sized (< 2MB for a typical PRD with no images) `[To verify]`
- **Maps to Gherkin:** `gherkin-tests.md` --> SC-PE-07

---

## Out of scope (non-stories)

Things users might expect that we are deliberately **not** doing in this feature, and why.

- **DOCX / Word export:** Word adds a different rendering pipeline and format negotiation. PDF is the universal read-only format. Word export is a V2 candidate if stakeholders request editable documents. `[Assumption]`
- **Custom PDF templates / theming:** In V1, there is one PDF template. Customizable templates (different branding, layouts) are a V2 feature. `[Assumption]`
- **PDF with interactive elements:** The PDF is a static snapshot. No clickable links (except URLs rendered as text), no form fields, no comments. PDFs are for reading, not interacting. `[Evidence]` -- @react-pdf/renderer does not support interactive PDF elements.
- **Print-optimized CSS alternative:** A "print this page" approach (CSS @media print) was rejected in favor of server-side PDF generation because CSS print output is inconsistent across browsers and does not support font embedding or precise layout control. `[Evidence]` -- architectural decision.
- **Batch export (multiple PRDs):** The PM exports one PRD at a time. Batch export adds API complexity with unclear demand. `[Assumption]`
- **Images or charts in the PDF:** V1 PRDs are text-only. If future PRD blocks include charts or images, the PDF renderer will need updates. `[Assumption]`

> **Challenge:** Does every `MUST` story trace to a verified problem in the PRD/Discovery? Does
> every story have at least one acceptance criterion that a test could check? If not, fix it
> before it reaches engineering.
>
> Traceability check:
> - US-PE-1 (export as PDF) --> Discovery Problem 1 (no structured validation = nothing to share). PRD section 5 lists PDF export as MUST. Verified.
> - US-PE-2 (all sections + evidence tags) --> Discovery Problem 5 (evidence never made explicit). PRD Objective 2 (make evidence distinction visible). Verified.
> - US-PE-3 (branded and professional) --> PRD requirement for Obra design system in PDF. The branding-as-awareness claim is `[Assumption]` but the professional appearance requirement traces to the stakeholder persona's need for credible documents. Verified.
>
> All stories have multiple testable acceptance criteria. The `[To verify]` items (font embedding compatibility, PDF file size) are technical risks that must be resolved during implementation, not design decisions.
