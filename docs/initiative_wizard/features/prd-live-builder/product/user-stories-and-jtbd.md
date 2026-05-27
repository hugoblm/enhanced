# User Stories & JTBD -- PRD Live Builder

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

## JTBD

> When I am going through a structured validation conversation with the AI, I want to see
> the PRD document being assembled in real time as I answer questions, so I can track my
> progress, see the tangible output of my effort, and catch errors or misinterpretations
> before the document is finalized.

---

## Personas

- **Builder PM** -- PM at a startup/scale-up, ships fast, tech-savvy, time-constrained. PRODUCER. Watches the PRD build as they converse with the AI. The live PRD is what turns a chat session into a tangible artifact.
- **Stakeholder** -- CPO/CEO/lead who reviews PRDs. CONSUMER. Does not see the live builder directly; consumes the final PRD via public link or PDF. But the quality of what the Stakeholder reads is shaped by what the Builder PM sees during construction.
- **Team Lead** -- Engineering lead who scopes work from PRDs. CONSUMER. Reads the risk and feasibility sections closely. The live builder's evidence tagging helps the Team Lead trust (or question) the PRD's claims.

---

## User stories

### US-PLB-1 -- See the PRD build in real time

- **Story:** As a **Builder PM**, I want to see PRD sections appear in the right panel as the AI writes them during our conversation, so that I can track how my answers translate into a structured document and feel a sense of progress.
- **Priority:** MUST
- **Why:** A PRD that only appears at the end turns Enhanced into a black box -- the PM talks to an AI for 20 minutes and then gets a document dump. Real-time construction creates engagement, trust, and the feeling of co-authoring rather than delegating. `[Evidence]` -- PRD MUST requirement: "PRD builds section by section during conversation (never generated at the end)." Also, the live artifact is the core UX differentiator from ChatGPT-generated PRDs.
- **Acceptance criteria:**
  - [ ] When the AI calls `update_prd` with a block, the block appears in the PRD panel within 500ms `[Assumption]` -- 500ms target is a design goal, not validated
  - [ ] New blocks animate in with a fade-in and brief highlight effect
  - [ ] Blocks appear in a fixed sort order matching the PRD structure (not in the order they were created)
  - [ ] If a block is updated (content changes), the update animates with a content transition
  - [ ] The PRD panel scrolls to the newly added or updated block (auto-scroll to latest change)
  - [ ] After auto-scrolling, the PM can freely scroll the PRD panel without being pulled back
- **Maps to Gherkin:** SC-PLB-1, SC-PLB-2, SC-PLB-3

---

### US-PLB-2 -- See evidence tags on PRD blocks

- **Story:** As a **Builder PM**, I want to see `[Evidence]`, `[Assumption]`, and `[To verify]` tags displayed as colored badges on each PRD block, so that I can immediately see which claims are substantiated and which are not.
- **Priority:** MUST
- **Why:** Evidence tagging is the entire product thesis. A PRD without visible tags is just another document -- it doesn't separate what's known from what's assumed. The visual distinction (green, amber, red) makes the PM's confidence level transparent at a glance. `[Evidence]` -- PRD Problem 5: "Evidence vs. assumption is never made explicit." PRD MUST: "Each block shows evidence tags as colored badges."
- **Acceptance criteria:**
  - [ ] `[Evidence]` tags render as green badges
  - [ ] `[Assumption]` tags render as amber/yellow badges
  - [ ] `[To verify]` tags render as red badges
  - [ ] Tags are inline within the block text, not in a separate section
  - [ ] Tags are not color-only -- the text label is always visible (a11y requirement)
  - [ ] Hovering a tag does NOT show a tooltip in V1 (keep it simple) `[Assumption]`
  - [ ] Tags are readable at the block's default text size (no tiny superscript)
- **Maps to Gherkin:** SC-PLB-4, SC-PLB-5

---

### US-PLB-3 -- See empty states for unfilled sections

- **Story:** As a **Builder PM**, I want to see placeholder cards for PRD sections that haven't been filled yet, so that I know what the complete PRD will contain and how much work remains.
- **Priority:** MUST
- **Why:** Without empty states, the PM only sees what has been written -- they have no sense of what's missing. The empty states serve as a progress indicator for the PRD itself (complementing the step indicator for the conversation). `[Assumption]` -- empty states are standard UX practice for document builders. Whether PMs find them helpful or noisy needs user testing.
- **Acceptance criteria:**
  - [ ] All 12 block types are represented in the PRD panel from the start of the session
  - [ ] Unfilled blocks show as collapsed or muted placeholders with the section title
  - [ ] The placeholder text indicates: "This section will be filled during step N" (matching the step where the block is typically generated)
  - [ ] As blocks are filled, the placeholder is replaced by the actual content (with animation)
  - [ ] The PM can visually distinguish filled blocks from empty placeholders at a glance
  - [ ] Empty placeholders do not interfere with reading filled blocks (they are compact, not full-height)
- **Maps to Gherkin:** SC-PLB-6, SC-PLB-7

---

### US-PLB-4 -- View the complete PRD after step 4

- **Story:** As a **Builder PM**, I want to see the fully assembled PRD with all 12 sections filled, a confidence score, and a recommendation after completing the wizard, so that I have a complete, export-ready document.
- **Priority:** MUST
- **Why:** The complete PRD is the deliverable. Everything in the wizard converges on this moment: the PM has a tangible artifact they can share, export, and act on. If the final PRD is incomplete or hard to read, the entire session feels wasted. `[Evidence]` -- PRD objective 1: "Enable PMs to go from idea to challenged draft PRD in <30 minutes."
- **Acceptance criteria:**
  - [ ] All 12 block types are filled with content from the conversation
  - [ ] No empty placeholder blocks remain (if any block was not filled, it shows a note explaining why)
  - [ ] The PRD header shows the PRD title, the confidence score as a badge, and the recommendation
  - [ ] The confidence score badge uses color to indicate level: green (>= 80), amber (50-79), red (< 50)
  - [ ] Export (PDF) and Share (public link) buttons are visible and functional in the header
  - [ ] The complete PRD is readable without scrolling back to the conversation (self-contained)
  - [ ] Evidence tags are visible on all blocks
- **Maps to Gherkin:** SC-PLB-8, SC-PLB-9

---

### US-PLB-5 -- See the confidence score

- **Story:** As a **Builder PM**, I want to see a global confidence score displayed prominently in the PRD panel, so that I have a quick, at-a-glance assessment of how well-validated this idea is.
- **Priority:** MUST
- **Why:** The confidence score is the distilled output of the risk challenge (step 3). It answers the question "should I build this?" in a single number. Without it, the PM has to read all 4 risk sections to form a judgment. `[Evidence]` -- PRD step 3 spec: "Global confidence score. Explicit recommendation: build / test first / abandon."
- **Acceptance criteria:**
  - [ ] The confidence score is displayed in the PRD header (visible without scrolling)
  - [ ] The score is a number out of 100 (e.g., 76/100) with a color-coded badge
  - [ ] Color coding: green (>= 80 — Build), amber (50-79 — Test first), red (< 50 — Abandon)
  - [ ] The score is accompanied by the recommendation text: "Build", "Test first", or "Abandon"
  - [ ] The score appears after step 3 completion (not before)
  - [ ] Before step 3, the confidence score area shows an empty state: "Confidence score will appear after risk assessment"
  - [ ] The score updates if any risk block is refined later (via block refinement feature)
- **Maps to Gherkin:** SC-PLB-10, SC-PLB-11

---

## Out of scope (non-stories)

- **Drag-and-drop block reorder** -- Blocks render in a fixed sort order. PMs cannot rearrange them. `[Assumption]` -- fixed order keeps the PRD structure consistent and predictable. Reordering is a V2+ feature if user tests reveal a need.
- **WYSIWYG inline editing** -- Blocks are read-only in the PRD panel. Editing is done via the conversation (block refinement feature). `[Evidence]` -- PRD out of scope: "WYSIWYG inline editing of the PRD -- block refinement via natural language is the V1 approach."
- **Custom block types** -- The 12 block types are fixed. PMs cannot add custom sections. `[Assumption]` -- 12 types cover the standard PRD structure. Custom types add complexity without proven demand.
- **Block templates** -- Each block's content is generated by the AI during conversation. No pre-filled templates.
- **Dark mode** -- PRD panel follows the system/app theme. Dark mode is a COULD for the initiative, not a feature-level requirement.

> Challenge: Does every MUST story trace to a verified problem in the PRD/Discovery? Does
> every story have at least one acceptance criterion that a test could check? If not, fix it
> before it reaches engineering.
>
> Traceability:
> - US-PLB-1 (real-time build) -> PRD MUST: "PRD builds section by section during conversation"
> - US-PLB-2 (evidence tags) -> PRD Problem 5: "Evidence vs. assumption is never made explicit"
> - US-PLB-3 (empty states) -> standard UX; serves as progress indicator (supports PRD Objective 1)
> - US-PLB-4 (complete PRD) -> PRD Objective 1: "idea to challenged draft PRD in <30 minutes"
> - US-PLB-5 (confidence score) -> PRD step 3: "Global confidence score + explicit recommendation"
>
> Every story traces. US-PLB-3 (empty states) has the weakest trace -- it's a UX quality
> requirement rather than a direct problem solver. But without it, the PM has no sense of
> PRD completeness, which undermines the "tangible artifact" value proposition.
