# PRD — Enhanced Wizard V1

> 🚧 **V1 demo deviations** — la persistance et l'auth sont simplifiées pour la démo publique.
> Le présent PRD décrit la **cible long terme**. Voir [`decisions.md`](./decisions.md) pour le
> journal des écarts assumés en V1 (skip de la feature `deferred-auth`, drop de Supabase au profit
> de Dexie côté client).

> **Product Requirements Document.** This is the *delivery* spec for the Enhanced V1 initiative:
> it says **what** we build and **why**, in enough detail that design and engineering can execute —
> and it **breaks the need down into features** (section 5). It builds on the validated Discovery — it does
> not re-litigate whether to build.

---

## Gate — do not write this PRD without a validated Discovery

- **Linked Discovery:** [`../discovery_wizard/enhanced-wizard-v1.md`](../discovery_wizard/enhanced-wizard-v1.md)
- **Discovery decision:** `Go` ✓
- **Open `[To verify]` items inherited from Discovery:**
  1. Do PMs actually *want* a tool that challenges their ideas, or just one that helps them
     write faster? → Test via webinar engagement and post-demo activation.
  2. Is the `ask_user` card interaction pattern intuitive enough for diverse product ideas? →
     Run 3-5 moderated user tests before the webinar.
  3. Will the deferred signup (magic link after step 1) convert, or will PMs bounce? → Measure
     signup conversion rate post-launch.
  4. Is the 4-step wizard the right length? (Too short = superficial, too long = abandonment.) →
     Measure per-step drop-off rates.
  5. Will block-level refinement feel natural or confusing? → Observe in user tests.
  6. Are PostHog events instrumented to measure all success criteria? → Verify during build.
  7. Is API cost per session sustainable at scale beyond the demo? → Log and estimate during V1.

**Evidence discipline (carries over from Discovery):** tag claims `[Evidence]` /
`[Assumption]` / `[To verify]`. Never invent evidence; ask the human when missing. Each section
has a `> Challenge` — answer it before considering the section done.

**Status:** `Draft`
**Author:** Hugo · **Date:** 2026-05-27

---

## 1. Introduction

### Jobs To Be Done (JTBD)

> When I have a feature idea I'm excited about and my team is ready to build, I want to rigorously challenge
> whether this idea is actually worth building, so I can avoid wasting engineering time on
> features that won't move the needle and instead focus on what matters.

### First Use Case

> I am a **PM at a startup or scale-up**, and when I **have a feature idea from a sales request,
> a user complaint, or my own intuition**, what matters most is **knowing whether the problem
> is real and the solution is the right one before committing engineering resources**, but it
> turns out **there's no structured, low-friction way to challenge my own assumptions** —
> discovery frameworks exist but they're heavyweight documents nobody fills out under time
> pressure, and I have to **either skip validation entirely (and risk building the wrong thing)
> or spend hours assembling a discovery doc from scratch that my team won't read**.

### Objectives

1. **Enable PMs to go from idea to challenged draft PRD in <30 minutes.** The wizard must be
   fast enough that it fits into existing workflows, not alongside them. `[Assumption]` — 30min
   target based on UX design; needs real-user validation.
2. **Make the evidence vs. assumption distinction visible and systematic.** Every claim in the
   output PRD carries `[Evidence]`, `[Assumption]`, or `[To verify]` tags — making the PM's
   confidence level transparent to anyone reading the document. `[Evidence]` — this is a design
   decision within our control.
3. **Prove product-market fit at webinar demo.** The webinar is the first public test of the
   value hypothesis. Success = signups, activation, shared PRDs. `[To verify]`
4. **Establish Enhanced as the pre-build quality gate.** Position the product in a space no tool
   currently occupies: not "build faster" but "decide better." `[Assumption]` — positioning
   hypothesis, validated by market gap analysis in Discovery benchmarks.

### Context

- AI tools have shifted the bottleneck from "can we build it?" to "should we build it?" — but
  no tool addresses the "should" systematically. `[Evidence]` — observable explosion of AI
  coding tools (Cursor, Copilot, Claude Code) with no equivalent on the product-decision side.
- ~80% of SaaS features are rarely or never used (Pendo 2019 feature adoption report), and once
  shipped, features are almost never removed. The cost of a bad feature is permanent. `[Evidence]`
- Enhanced has no users yet. The webinar audience is the first external signal. The product must
  be compelling enough for a live demo and usable enough for independent trial afterward.
  `[Evidence]`
- The tech stack is scaffolded (Next.js 16, Supabase, Vercel AI SDK, shadcn/ui). The build
  risk is low. `[Evidence]`

### Vision

> Every feature that ships started with a moment of honest doubt.

> **Challenge:** Do the Objectives map back to the Discovery's verified problem? Cut any
> objective that doesn't.
>
> Yes. All four objectives trace directly:
> - Objective 1 (30min PRD) → Discovery problem: "discovery frameworks are heavyweight, nobody
>   fills them out under time pressure."
> - Objective 2 (evidence tagging) → Discovery problem: "the decision to build is the least
>   rigorous step — evidence vs. assumption is never made explicit."
> - Objective 3 (webinar PMF) → Discovery's explicit success criteria and the Go decision's
>   condition: "the webinar is the cheapest test of the value hypothesis."
> - Objective 4 (pre-build quality gate) → Discovery's core thesis: "no tool occupies the
>   'should we build this?' space."
>
> No objective is orphaned. The weakest link is Objective 3 — it's a business/marketing goal
> more than a user-need goal. But it's the mechanism that *tests* whether objectives 1-2
> actually resonate, so it earns its place.

---

## 2. Target audience

### Customer profiles / personas

1. **The Builder PM** (primary persona for MVP)
   - **Role:** Product Manager at a startup or scale-up (10-200 people).
   - **Context:** Ships fast with AI tools, has analytics (PostHog, Mixpanel, Amplitude) but
     rarely consults them *before* deciding what to build. Receives feature requests from sales,
     support, founders, and personal intuition.
   - **Relation to Enhanced:** PRODUCER of PRDs. Uses the wizard directly.
   - **Tech level:** Tech-savvy, comfortable with modern web tools, likely already uses ChatGPT
     or Claude for ad-hoc drafting.
   - **Constraints:** Time-constrained. Will not adopt a tool that takes longer than their
     current (non-)process. The 30-minute bar is real.
   - **Emotional need:** Wants to feel confident in build decisions, not guilty about skipping
     validation. `[Assumption]`

2. **The Stakeholder** (secondary persona)
   - **Role:** CPO, CEO, or VP Product who receives and reviews PRDs.
   - **Context:** Makes go/no-go calls on resource allocation. Needs to trust the reasoning
     behind a build recommendation.
   - **Relation to Enhanced:** CONSUMER of PRDs via shared link or PDF export. Does not use
     the wizard directly (in V1).
   - **Tech level:** Variable. Needs clear executive summary, not technical detail.
   - **Emotional need:** Wants to see that the team did their homework. `[Assumption]`

3. **The Team Lead** (secondary persona)
   - **Role:** Engineering lead or tech lead who uses the PRD to scope technical work.
   - **Context:** Cares about feasibility assessment, kill criteria, and what's in/out of scope.
   - **Relation to Enhanced:** CONSUMER of PRDs. Uses the output to plan sprints.
   - **Tech level:** High. Reads the feasibility and risk sections closely.
   - **Emotional need:** Wants to stop building things the team will regret. `[Assumption]`

### Use cases

- **Sales-driven feature request:** PM receives a request from the sales team ("customer X
  needs feature Y or they churn"). PM pitches the idea into Enhanced, the wizard challenges
  whether the problem is real and scoped, the output PRD surfaces the assumptions that need
  validation before committing a sprint. `[Assumption]`
- **Intuition-to-validation:** PM has a gut feeling about a feature. Uses Enhanced to formalize
  the intuition, discover blind spots, and produce a shareable artifact that either builds
  confidence or reveals gaps. `[Assumption]`
- **Stakeholder review:** Stakeholder receives a public PRD link from the PM. Reads the
  executive summary, checks the evidence tags, reviews the risks. Makes an informed go/no-go
  call based on a structured document rather than a pitch in Slack. `[Assumption]`
- **Team alignment:** Engineering and product discuss a proposed feature using the Enhanced PRD
  as the shared reference. The `[To verify]` tags become the team's pre-build checklist.
  `[Assumption]`

> **Challenge:** Are you designing for a real, named segment — or "everyone"? "Everyone" is a
> red flag. Pick the primary persona for the MVP.
>
> The primary persona for MVP is **The Builder PM** — specifically, PMs at startups and
> scale-ups who ship fast with AI tools. This is narrow enough to be actionable: it excludes
> enterprise PMs (too much process already), junior PMs (may not have the authority to kill
> features), and solo founders (no team to share PRDs with — though they might still benefit).
>
> The Stakeholder and Team Lead personas matter because they consume the output, but the V1
> wizard is designed for the Builder PM's hands. If that persona doesn't adopt, the others
> never see the product.

---

## 3. Problems & solutions

### Problems identified

1. **Feature decisions are made without structured validation.** The decision to build is the
   only step in the product process with no standard tooling or formal rigor. Design has Figma,
   engineering has CI/CD, analytics has PostHog — the "should we build this?" decision has a
   Slack thread and a gut feeling. `[Evidence]` — observable industry gap, documented in
   Discovery.

2. **AI accelerates building but not deciding.** AI-assisted development enables 10x faster
   delivery, but the bottleneck has shifted to decision quality. Teams build more, not better.
   `[Evidence]` — the explosion of AI coding tools with no equivalent on the product-decision
   side.

3. **Discovery frameworks are too heavyweight for fast-moving teams.** Structured discovery
   (interviews, data pulls, writeups) gets skipped when teams move fast because the overhead
   exceeds the perceived benefit. `[Assumption]` — inferred from common PM complaints and the
   Discovery's framing, but not backed by direct user interviews for Enhanced specifically.

4. **PRD generators produce agreeable documents, not challenged ones.** PMs using ChatGPT or
   Claude for PRD drafting get output that confirms their thinking rather than stress-testing
   it. The AI agrees with whatever the PM writes unless explicitly prompted to push back.
   `[Evidence]` — direct observation: general-purpose AI is cooperative by default.

5. **Evidence vs. assumption is never made explicit.** Traditional PRDs and feature specs mix
   validated facts with untested beliefs without distinguishing them. Stakeholders reading the
   document can't tell which claims are grounded and which are wishful thinking. `[Evidence]` —
   structural observation: no standard PRD format enforces evidence tagging.

### Proposed solution

- **Overview:** A 4-step conversational wizard that guides PMs through structured hypothesis
  validation — problem framing, data validation, risk challenge, and draft PRD — producing a
  transparent, export-ready PRD that separates evidence from assumptions. The wizard uses a
  split-view interface (AI conversation on the left, live PRD on the right) with structured
  interaction cards and block-level refinement.

- **User benefits:**
  - Go from "I have an idea" to "I have a challenged draft PRD" in under 30 minutes.
  - See clearly which claims are evidence, which are assumptions, and which need verification.
  - Share the output with stakeholders via public link or branded PDF — no account needed to
    read.
  - Refine any section inline without restarting the whole process.

- **Business benefits:**
  - Occupies an uncontested market position: pre-build validation tooling.
  - The webinar demo creates a first cohort of early adopters.
  - Public PRD sharing creates organic distribution (each shared PRD is a product demo).
    `[Assumption]`
  - Evidence tagging builds trust with stakeholders, increasing PRD adoption within teams.
    `[Assumption]`

> **Challenge:** Does every benefit trace to a listed problem? List the simplest alternative
> you rejected and why.
>
> Benefit mapping:
> - 30min PRD → Problem 3 (heavyweight frameworks) + Problem 1 (no structured validation)
> - Evidence tagging → Problem 5 (evidence never explicit) + Problem 4 (AI agrees with everything)
> - Public sharing / PDF → Problem 1 (no structured validation = nothing to share)
> - Block refinement → Problem 4 (AI output is one-shot, can't iterate)
> - Market position → Problem 2 (AI accelerates building, nothing accelerates deciding)
> - Organic distribution → Problem 1 (each shared PRD proves the tool's value)
>
> Every benefit traces. The simplest rejected alternative: **a curated system prompt for
> ChatGPT/Claude** (a "PM Discovery Prompt Pack"). Rejected because: no persistence, no
> artifact, no structured card interactions, no evidence tagging enforcement, no sharing.
> It's also trivially copyable and has no moat. Enhanced's value is in the *product
> experience*, not the prompt. `[Assumption]` — the webinar tests whether the product
> experience actually matters more than a good prompt.

---

## 4. Benchmark

| Tool / approach | Strengths | Weaknesses | Relevant to us? |
|-----------------|-----------|------------|-----------------|
| **Notion AI** | Familiar workspace for PMs. Good at drafting documents from prompts. Large existing user base. | Generates *content*, not *thinking*. No structured challenge of assumptions. The AI agrees with whatever the PM writes. No evidence tagging. | Yes — we beat it by making the AI an adversary, not an assistant. We reuse the split-view mental model (content + context side by side). |
| **Linear** | Excellent project/issue management. Clean UX, loved by engineering teams. | Lives *after* the decision to build. Assumes the feature is already validated and scoped. | Complement, not competitor. Our output could feed into Linear in V2+. We position Enhanced as the step *before* Linear. |
| **ProductBoard** | User feedback aggregation, prioritization frameworks, customer insight tracking. | Prioritizes *among* ideas but doesn't challenge whether any given idea is worth building at all. Different stage of the product process. | Complement. ProductBoard tells you *which* ideas users mention most; Enhanced tells you whether a specific idea is actually validated. |
| **Coda AI** | Flexible doc + AI. Can build custom workflows. Extensible with formulas and automations. | Too open-ended. Requires the PM to know what structure to impose. No opinionated framework for discovery. | Yes — we beat it with structure. The wizard *imposes* the right questions so the PM can't skip the hard parts. |
| **ChatGPT / Claude (direct)** | PMs already use general-purpose AI to draft PRDs, brainstorm, and pressure-test ideas. Free/cheap. Zero onboarding. | No structure, no persistence, no artifact. The conversation is disposable. The AI doesn't push back unless explicitly prompted to. No evidence tagging. | Yes — this is the real incumbent. We beat it by embedding the challenge framework *into* the product and adding persistence (versioning, sharing, PDF export). |
| **Traditional PRD templates** (Confluence, Google Docs) | Established format PMs know. Team collaboration features. Version history built in. | Static documents. No guided extraction. No challenge mechanism. The template is only as good as the PM's discipline in filling it honestly. | Yes — we keep the PRD as the output format (familiar) but replace the blank-page experience with a guided conversation that fills it intelligently. |

> **Challenge:** Given the benchmark, is build still the right call over buy/integrate? Justify.
>
> Yes. No benchmarked tool combines guided extraction + structured challenge + transparent PRD
> output with evidence tagging. The closest alternative is "use ChatGPT with a good system
> prompt" — and that's exactly what some PMs already do. But it lacks structure, persistence,
> the split-view artifact, card interactions, and any mechanism to force honest tagging of
> evidence vs. assumptions. `[Evidence]` — verified in Discovery benchmark analysis.
>
> The risk is that a general-purpose AI with a well-crafted prompt template is "good enough"
> for most PMs. `[Assumption]` If the wizard doesn't deliver meaningfully better outcomes than
> a ChatGPT conversation, the product has no moat. The webinar and early usage will test this.
> But the structural gap (no tool occupies this space) and the product-level differentiation
> (persistence, sharing, evidence tagging, structured cards) justify building rather than
> hacking a prompt on top of an existing tool.

---

## 5. Features — the need broken down

### Feature breakdown (need to features)

The 9 named features this initiative decomposes into. Each `MUST` feature becomes a folder
under `features/<feature-name>/` with its own delivery docs. The sequencing is driven by
dependency chains (auth requires landing page, wizard requires shell, engine requires wizard,
PRD builder requires engine, etc.) and value delivery (earlier features enable later ones).

| # | Feature | Value (one line) | Priority | Sequence | Folder |
|---|---------|------------------|----------|----------|--------|
| 1 | `landing-page` | Frictionless start: minimal homepage, textarea, instant wizard entry, no signup required | `MUST` | 1 | `features/landing-page/` |
| 2 | `deferred-auth` | Magic link signup after first PRD block is rendered (mid-step 1), anonymous-to-authenticated transition, session preservation | `MUST` | 2 | `features/deferred-auth/` |
| 3 | `wizard-shell` | Split-view desktop layout (conversation left ~45%, PRD right ~55%), 4-step navigation, responsive | `MUST` | 3 | `features/wizard-shell/` |
| 4 | `conversation-engine` | AI conversation via OpenRouter, ask_user tool (5 card types), 4-step logic, system prompts, evidence tagging | `MUST` | 4 | `features/conversation-engine/` |
| 5 | `prd-live-builder` | Real-time PRD artifact via update_prd tool, section-by-section construction, 12 block types, evidence tags | `MUST` | 5 | `features/prd-live-builder/` |
| 6 | `block-refinement` | Hover "Refine" button, natural language instruction, single-block regeneration | `MUST` | 6 | `features/block-refinement/` |
| 7 | `prd-versioning` | Auto-version on generation/refine, version history list, read-only consultation | `COULD` | 7 | `features/prd-versioning/` |
| 8 | `pdf-export` | Branded PDF via @react-pdf/renderer, Obra fonts embedded, clean shareable format | `MUST` | 8 | `features/pdf-export/` |
| 9 | `public-sharing` | Public URL enhanced.pm/p/[slug], nanoid slug, SSR page, OG meta, read-only, no account needed | `MUST` | 9 | `features/public-sharing/` |

> **Challenge:** Does every feature trace back to a problem in section 3 (and the discovery)? Delete
> any that doesn't — it's scope creep. Is the sequencing driven by value/risk, or by convenience?
>
> Feature traceability:
> - `landing-page` → P3 (heavyweight frameworks get skipped) — zero-friction entry removes the
>   barrier that kills adoption of discovery tools.
> - `deferred-auth` → P3 (overhead kills adoption) — signup friction is deferred until value is
>   demonstrated. Also enables session persistence for later features.
> - `wizard-shell` → P1 (no structured validation) + P3 (heavyweight) — the split-view is the
>   structural container that makes validation guided, not open-ended.
> - `conversation-engine` → P4 (AI agrees with everything) + P1 (no structured validation) —
>   the core challenge mechanism: AI asks hard questions, structured cards prevent vague answers.
> - `prd-live-builder` → P5 (evidence never explicit) + P1 (no structured validation) — the
>   artifact that makes the process tangible and shareable.
> - `block-refinement` → P4 (one-shot AI output can't be iterated) — enables the PM to fix
>   issues as they appear rather than restarting.
> - `prd-versioning` → P5 (evidence tagging needs audit trail) — weaker trace, hence `COULD`.
>   Nice for iteration tracking but not core to the problem.
> - `pdf-export` → P1 (no structured validation = nothing to share with stakeholders) — the
>   output must leave the tool to have organizational impact.
> - `public-sharing` → P1 (same as pdf-export) — enables stakeholder review without onboarding
>   friction. Also creates organic distribution.
>
> Every feature traces. The weakest link is `prd-versioning` — it's more of a quality-of-life
> feature than a direct problem solver, which is why it's `COULD`.
>
> Sequencing is driven by **dependency**, not convenience: you can't build the wizard shell
> without a landing page to enter from, can't run the conversation without the shell, can't
> build the PRD without the conversation, etc. PDF export and public sharing are at the end
> because they operate on the completed PRD. This is the natural build order.

### Requirements (MoSCoW)

#### Must-have (MUST)

**Landing page (`landing-page`)**
- Minimal homepage with large textarea and clear CTA ("Pitch your product idea")
- Textarea submission creates an anonymous session and navigates to the wizard
- No signup required to start — zero friction entry
- Responsive layout (works on desktop and tablet; not mobile-optimized)
- Obra design system tokens applied (typography, colors, spacing)

**Deferred authentication (`deferred-auth`)**
- Magic link authentication via Supabase Auth
- Signup triggered after the first PRD block is rendered (first `update_prd` tool call, typically the `first_use_case` block mid-step 1) — when the PM has seen the AI's reformulation and experienced the first value moment
- Anonymous-to-authenticated session transition without data loss — the conversation and any
  PRD blocks generated before signup must survive the auth transition
- Session claiming: anonymous session is linked to the newly authenticated user
- Graceful handling of existing accounts (login vs. signup)

**Wizard shell (`wizard-shell`)**
- Split-view desktop layout: conversation panel left (~45% width), PRD panel right (~55% width)
- 4-step navigation with clear step indicators (step name + number)
- Step progression is guided by the conversation engine (not free navigation in V1)
- Responsive: panels stack vertically on narrow viewports (tablet breakpoint)
- Persistent header with session context
- Obra design system styling throughout

**Conversation engine (`conversation-engine`)**
- AI conversation powered by Vercel AI SDK + OpenRouter (`@openrouter/ai-sdk-provider`)
- Streaming responses for real-time feedback
- 4-step conversation logic with distinct system prompts per step:
  - Step 1: Problem framing — extract the problem, target user, current situation. Challenge
    whether the problem is real.
  - Step 2: Data validation — identify evidence and gaps. Tag claims. Guide the PM to
    acknowledge what they know vs. what they assume.
  - Step 3: Risk challenge — pressure-test across Value, Usability, Feasibility, and Business
    Viability. The AI plays devil's advocate.
  - Step 4: Final PRD — assemble the complete tagged PRD. Review and refine.
- `ask_user` tool with 5 structured card types:
  - **Single choice** — pick one option from a list
  - **Multi choice** — pick multiple options
  - **Scale** — rate on a numeric scale (e.g., confidence level 1-5)
  - **Confirmation** — yes/no/modify with the option to elaborate
  - **Free text** — open-ended response
- Every card includes an "Other — specify" option where applicable
- Maximum 2-3 consecutive structured cards before a free text break (to avoid survey fatigue)
- Evidence tagging (`[Evidence]`, `[Assumption]`, `[To verify]`) applied throughout the
  conversation and carried into the PRD

**PRD live builder (`prd-live-builder`)**
- Real-time PRD construction via `update_prd` tool called by the AI during conversation
- Section-by-section assembly: PRD blocks appear in the right panel as the conversation progresses
- 12 block types covering the full PRD structure (mapped to the 4 wizard steps):
  - `first_use_case`, `problem_context`, `data_signals`
  - `risk_value`, `risk_usability`, `risk_feasibility`, `risk_viability`
  - `confidence_score`, `success_criteria`, `kill_criteria`
  - `next_steps`, `executive_summary`
- Each block carries evidence tags (`[Evidence]`, `[Assumption]`, `[To verify]`)
- Blocks render in a clean, readable format with markdown support
- PRD panel scrolls independently from the conversation panel
- Blocks update in place when refined (no duplicates)

**Block refinement (`block-refinement`)**
- Hover interaction: "Refine" button appears when hovering over any PRD block
- Click opens a natural language input: "What would you like to change about this section?"
- Single-block regeneration: the AI re-generates only the targeted block based on the
  instruction, keeping the rest of the PRD intact
- The conversation panel shows the refinement request and AI response
- Updated block replaces the previous version in the PRD panel

**PDF export (`pdf-export`)**
- Generate a branded PDF from the completed PRD using `@react-pdf/renderer`
- Obra design system fonts and styling embedded in the PDF
- Clean, professional format suitable for sharing with stakeholders
- Evidence tags rendered visually (color-coded or labeled)
- Download triggered from a button in the PRD panel or wizard header
- PDF includes: document title, date, all PRD sections with evidence tags, and Enhanced branding

**Public sharing (`public-sharing`)**
- Generate a public URL: `enhanced.pm/p/[slug]`
- Slug generated via nanoid (short, URL-safe, collision-resistant)
- SSR-rendered public page (not behind auth) — accessible to anyone with the link
- OpenGraph meta tags for social preview (title, description, image)
- Read-only view: the PRD is displayed but not editable
- No account required to view a shared PRD
- Share button in the PRD panel or wizard header generates/copies the link

#### Could-have (COULD)

**PRD versioning (`prd-versioning`)**
- Auto-version on each generation event (step completion) and each block refinement
- Version history list accessible from the PRD panel (version number + timestamp)
- Read-only consultation of any previous version
- Current version is always the default view

**Additional COULD items:**
- Dark mode support (Obra tokens already include dark palette)
- Dashboard with list of user's sessions and PRDs
- Wizard step completion indicators (checkmarks, progress bar)

#### Out of scope

Explicitly excluded from V1 — revisit in V2+:
- **MCP analytics connections** (PostHog, Mixpanel, Amplitude for automated data validation) —
  deferred because the wizard UX must prove itself before adding data integrations. Cart before
  horse.
- **Living document mode** (re-launch discovery on an existing PRD) — requires the base
  experience to be validated first.
- **Linear/Jira push** — integration value depends on adoption; premature before V1 validation.
- **WYSIWYG inline editing** of the PRD — block refinement via natural language is the V1
  approach. WYSIWYG adds complexity without proven demand.
- **Team collaboration** (comments, assignments, roles) — collaboration features are a V2
  multiplier once the solo experience works.
- **Billing and pricing** — V1 is free. Monetization decisions depend on adoption data.
- **Mobile-optimized experience** — responsive layout is enough. The split-view wizard is
  inherently a desktop experience. `[Evidence]` — the interaction pattern (conversation +
  PRD side by side) doesn't translate to small screens without fundamental redesign.

> **Challenge:** Could any MUST actually be a COULD? Over-stuffed MUST lists are how MVPs slip.
> Defend each MUST against "what breaks if we ship without it?".
>
> Testing each MUST:
> - `landing-page` — without it, there's no entry point. Obviously MUST.
> - `deferred-auth` — without it, either (a) we force signup before the wizard, which kills
>   conversion for a product nobody knows yet, or (b) we skip auth entirely, which means no
>   session persistence, no PDF/sharing, no return visits. MUST.
> - `wizard-shell` — without the split-view, the product is just a chatbot. The side-by-side
>   layout is the core UX differentiator. MUST.
> - `conversation-engine` — without it, there's no wizard. MUST.
> - `prd-live-builder` — without the live PRD, the conversation has no artifact. The artifact
>   is what gets shared and survives the session. MUST.
> - `block-refinement` — **this is the closest to COULD.** Without it, the PM can still get a
>   PRD, but can't iterate on individual sections — they'd have to ask the AI to redo the whole
>   thing. Verdict: MUST, because a non-refineable PRD feels like a one-shot generator, not a
>   tool. But if timeline forces a cut, this is the first MUST to demote.
> - `pdf-export` — without it, the PRD only lives in Enhanced. For the webinar demo and
>   stakeholder sharing, a downloadable artifact is essential. MUST.
> - `public-sharing` — without it, stakeholders need an Enhanced account to see PRDs. That's
>   too much friction for the secondary personas. Also, public sharing creates organic
>   distribution. MUST for the webinar use case.
>
> If forced to cut one MUST: `block-refinement` is the candidate. Everything else breaks the
> core value proposition.

---

## 6. Technical constraints & requirements

### Constraints

- **Framework:** Next.js 16 (App Router) with TypeScript strict mode. Node 22 runtime.
  `[Evidence]` — already scaffolded and configured.
- **Database + Auth:** Supabase (Postgres + Magic Link auth via `@supabase/ssr`). Row Level
  Security (RLS) enforced on all tables — no exceptions. `[Evidence]` — Supabase is configured.
- **AI provider:** Vercel AI SDK + OpenRouter (`@openrouter/ai-sdk-provider`). Tool calling
  for `ask_user` and `update_prd`. Streaming required for conversation UX. `[Evidence]` —
  dependencies installed.
- **UI framework:** shadcn/ui + Tailwind CSS v4, with Obra design system tokens (custom
  typography, colors, spacing, radius). `[Evidence]` — tokens configured in globals.css.
- **State management:** Zustand for client-side wizard state. Zod for input validation (shared
  schemas client/server). `[Evidence]` — dependencies installed.
- **Deploy:** Vercel (automatic deploys from GitHub). Production on `main`, staging on
  `staging` branch. `[Evidence]` — integration configured.
- **GDPR/Privacy:** User data stored in Supabase (EU region preferred). Magic link means no
  passwords stored. Anonymous sessions must be cleanable (TTL or manual cleanup). `[Assumption]`
  — GDPR compliance details to be finalized.
- **Performance:** PRD panel must update within 500ms of AI tool call. Conversation streaming
  must feel real-time (no perceptible lag beyond network latency). `[Assumption]` — targets,
  not validated.

### Requirements

- **Database schema:** 6 tables minimum:
  - `profiles` — user profile linked to Supabase Auth
  - `sessions` — wizard sessions (anonymous or authenticated)
  - `messages` — conversation messages per session
  - `prds` — PRD documents linked to sessions
  - `prd_blocks` — individual blocks within a PRD (typed, ordered, with evidence tags)
  - `prd_versions` — version snapshots (if versioning is implemented)
- **RLS policies:** Every table must have RLS policies that ensure users can only access their
  own data. Public sharing bypasses user-level RLS via a `is_public` flag on the `prds` table.
- **API routes:** Server Actions or Route Handlers for AI conversation (streaming), PRD
  persistence, PDF generation, and public sharing slug generation.
- **Analytics:** PostHog events for all success criteria metrics (wizard step progression,
  completion rate, time-to-PRD, block refinement usage, PDF export, public sharing).
  `[To verify]` — instrumentation must be implemented during build.
- **Cost control:** Token usage logging per session. Alert threshold if per-session cost
  exceeds $0.50. `[To verify]` — implement during AI service layer build.

> **Challenge:** Any constraint that secretly kills a MUST feature? Surface it now, not in
> delivery.
>
> Potential issues:
> - **Anonymous-to-authenticated session transition** (`deferred-auth`) is the trickiest
>   technical challenge. Supabase Auth creates a new user on magic link confirmation — the
>   anonymous session must be "claimed" by that user without data loss. This requires careful
>   handling of the auth callback flow. Risk: medium. Mitigation: prototype early in week 1.
> - **Streaming + tool calls** (`conversation-engine`): Vercel AI SDK supports tool calls
>   during streaming, but the `ask_user` and `update_prd` tools must trigger UI updates mid-
>   stream. This is supported but needs careful implementation. Risk: low-medium.
> - **@react-pdf/renderer** (`pdf-export`): server-side PDF generation with custom fonts
>   (Obra/Geist) requires font file embedding. If the library doesn't support the specific
>   font format, fallback fonts may be needed. Risk: low.
> - **Public sharing SSR** (`public-sharing`): the public page must be server-rendered for OG
>   meta tags to work. This is straightforward with Next.js App Router but requires a separate
>   route outside the auth middleware. Risk: low.
>
> No constraint kills a MUST feature. The `deferred-auth` transition is the highest-risk item
> and should be prototyped first.

---

## 7. Success criteria

### North Star

The number of bad features NOT built — features that would have been built without the
validation step but were stopped or pivoted after going through Enhanced. `[Assumption]` —
this metric is aspirational and hard to measure directly in V1. Proxy metrics below are
the operational reality.

### OKRs

- **Objective:** Prove that Enhanced helps PMs make better build decisions.
  - **KR1:** 50+ webinar signups. `[To verify]` — measured via registration tool (external).
  - **KR2:** 10+ draft PRDs created within 48h of the webinar. `[To verify]` — measured via
    Supabase query on `prds` table.
  - **KR3:** 3+ PRDs shared publicly (via public link) in the first week post-webinar.
    `[To verify]` — measured via Supabase query on `prds` where `is_public = true`.
  - **KR4:** >60% wizard completion rate (users who start step 1 and finish step 4).
    `[To verify]` — measured via PostHog funnel.

### KPIs

Supporting indicators to monitor continuously:
- **Time-to-PRD:** Median time from wizard start to step 4 completion. Target: <30 minutes.
  `[To verify]` — PostHog event timestamps.
- **Step-by-step drop-off rates:** Percentage of users dropping off at each step transition
  (1→2, 2→3, 3→4). `[To verify]` — PostHog funnel.
- **Block refinement usage rate:** Percentage of completed PRDs where at least one block was
  refined. `[To verify]` — PostHog event count.
- **PDF export rate:** Percentage of completed PRDs exported as PDF. `[To verify]` — PostHog
  event count.
- **Public sharing rate:** Percentage of completed PRDs shared via public link. `[To verify]` —
  PostHog event count.
- **Deferred auth conversion rate:** Percentage of anonymous users who complete magic link
  signup when prompted after the first PRD block is rendered. `[To verify]` — PostHog event count.

### Damage control

Guardrail metrics — what tells us we made something worse or the product isn't working:

- **Abandonment spike at step 2 (data validation):** If >40% drop off at step 2, the manual
  data guidance is too friction-heavy. Action: simplify step 2 or make data validation optional.
  `[To verify]`
- **PRD quality degradation:** If sample-reviewed PRDs show the AI just agreeing with everything
  the PM said, the challenge mechanism isn't working. Action: fix system prompts, increase
  adversarial behavior. `[To verify]` — sample-review 10 PRDs post-webinar.
- **API cost per session:** Must stay under $0.50/session at demo scale. If exceeded, optimize
  prompt length, model selection, or add cost controls. `[To verify]` — token usage logging.
- **Auth conversion <30%:** If fewer than 30% of anonymous users complete signup when prompted,
  the deferred auth timing or UX needs adjustment. `[To verify]`

> **Challenge:** Can each metric be measured with data we collect today? If not, instrument it
> (add to the tech spec). A metric you can't measure isn't a success criterion.
>
> Currently measurable: **none** — Enhanced has no users and no analytics instrumentation.
>
> What must be built during delivery:
> - PostHog events for: wizard_step_started, wizard_step_completed, wizard_completed,
>   block_refined, pdf_exported, prd_shared_publicly, auth_signup_prompted, auth_signup_completed.
>   → Add to `conversation-engine` and `wizard-shell` tech specs.
> - Supabase queries for: total PRDs created, public PRDs count.
>   → Available once the schema is deployed.
> - Token usage logging per session.
>   → Add to `conversation-engine` tech spec.
> - Webinar signups: external tool, not in Enhanced's scope.
>
> Every metric has a clear instrumentation path. The PostHog events are the biggest gap and
> must be implemented as part of the `conversation-engine` and `wizard-shell` features — not
> as an afterthought.

---

## 8. Risks & assumptions

| Risk / assumption | Type | Likelihood | Impact | Mitigation / test |
|-------------------|------|-----------|--------|-------------------|
| PMs don't want to be challenged — they want a tool that helps them write faster, not one that pushes back | Assumption | Medium | Critical | The webinar is the test. If engagement is low and PMs don't create PRDs afterward, the value hypothesis fails. Mitigation: offer a "helper" mode toggle (V2) if adversarial mode alienates users. |
| `ask_user` card interaction feels rigid or survey-like | Assumption | Medium | High | Include "Other — specify" on every card. Limit consecutive structured cards to 2-3 before a free text break. Validate in 3-5 moderated user tests before the webinar. |
| 30 minutes is too long for time-constrained PMs | Assumption | Low-Medium | Medium | Monitor time-to-PRD via PostHog. If median exceeds 30min, optimize prompts for conciseness, reduce card count, or allow step skipping. |
| Deferred auth (magic link after step 1) doesn't convert — PMs bounce when asked to sign up | Assumption | Medium | Medium | Measure signup conversion rate. If <30%, experiment with trigger timing (earlier/later) or social auth providers (V2). The magic link itself may feel slow — test the email delivery latency. |
| AI API costs exceed $0.50/session at scale | To verify | Low | Medium | Log token usage per session from day 1. Set a per-session cost ceiling. Optimize prompt length, use cheaper models for non-critical steps if needed. |
| Split-view doesn't work on small screens / tablets | Evidence | High | Low | Mobile is out of scope for V1. Responsive stacking (panels go vertical) is the fallback. The core experience is desktop-first. |
| PRD quality degrades — AI agrees with everything instead of challenging | To verify | Medium | Critical | This is the product's raison d'etre. If the challenge mechanism fails, the product is just another PRD generator. Mitigation: adversarial system prompts, sample-review post-webinar, prompt iteration. |
| Anonymous-to-authenticated session transition loses data | Technical | Low-Medium | High | Prototype the auth callback flow and session claiming early (week 1). Write integration tests for the transition. |
| Block refinement UX is confusing — PMs don't discover or understand the hover interaction | Assumption | Medium | Medium | Consider a tooltip on first visit, or a "refine any section" callout in the wizard. Validate in user tests. |

> **Challenge:** What's the assumption that, if wrong, sinks the whole initiative? Is it tested?
>
> **"PMs want to be challenged, not just helped."** This is the foundation. If PMs prefer a
> tool that agrees with them and writes faster (like every other AI tool), Enhanced has no
> differentiation and no market.
>
> It is NOT yet tested. The webinar is the first test. The discovery explicitly acknowledges
> this as the biggest risk (Value risk rated highest). The Go decision was made because:
> (a) the structural gap in the market is real, (b) the bet is proportionate (2 weeks of build),
> and (c) the webinar is a cheap, fast way to get a signal.
>
> If the webinar shows PMs don't want to be challenged, the honest response is to **pivot the
> tone** (from adversarial to collaborative-but-honest) rather than abandon the product entirely.
> The structured wizard + evidence tagging still has value even in a softer mode.

---

## 9. Minimum Viable Product

### MVP features

The smallest set that delivers real value and lets us learn:

1. **`landing-page`** — MUST. Entry point. No value without it.
2. **`deferred-auth`** — MUST. Session persistence and return visits require auth. Deferred
   trigger preserves zero-friction entry.
3. **`wizard-shell`** — MUST. The split-view layout is the core UX.
4. **`conversation-engine`** — MUST. The guided AI conversation is the product.
5. **`prd-live-builder`** — MUST. The PRD artifact is the output.
6. **`block-refinement`** — MUST. Iteration is what separates a tool from a one-shot generator.
   (First MUST to demote if timeline forces a cut.)
7. **`pdf-export`** — MUST. Stakeholder sharing requires a portable format.
8. **`public-sharing`** — MUST. Organic distribution and frictionless stakeholder review.
9. **`prd-versioning`** — COULD. Included if time permits. Not required for the webinar demo
   or initial validation.

### MVP scope (detailed)

For each MVP feature: what's in, the key open questions, and what's deferred.

- **`landing-page`**
  - In: large textarea with CTA, responsive layout, Obra design tokens, anonymous session
    creation on submit, navigation to wizard.
  - Open questions: final copy for CTA and supporting text. `[To verify]`
  - Deferred: SEO optimization, testimonials, feature tour, marketing content.

- **`deferred-auth`**
  - In: magic link auth via Supabase, trigger after first PRD block is rendered (mid-step 1), anonymous-to-authenticated
    session claiming without data loss, graceful handling of existing accounts.
  - Open questions: exact UX for the auth prompt (modal? inline? interstitial?). Email
    delivery latency for magic links — if slow, it breaks flow. `[To verify]`
  - Deferred: OAuth providers (Google, GitHub), team invites, account settings page.

- **`wizard-shell`**
  - In: split-view layout (conversation ~45% left, PRD ~55% right), 4-step navigation with
    step indicators, responsive stacking on narrow viewports, persistent header.
  - Open questions: exact breakpoint for panel stacking. Whether step navigation allows
    backward movement in V1. `[To verify]`
  - Deferred: panel resize handles, mobile-optimized layout, customizable panel ratios.

- **`conversation-engine`**
  - In: 4-step conversation logic with per-step system prompts, streaming via Vercel AI SDK +
    OpenRouter, `ask_user` tool with 5 card types, evidence tagging, "Other — specify" on
    cards, 2-3 card limit before free text.
  - Open questions: exact model selection on OpenRouter (cost vs. quality tradeoff). System
    prompt iteration — initial prompts will need tuning based on test conversations.
    `[To verify]`
  - Deferred: conversation branching, undo, conversation export, model selection UI.

- **`prd-live-builder`**
  - In: `update_prd` tool called by AI, 12 block types, evidence tags on all blocks, real-time
    rendering in PRD panel, markdown support, independent scroll.
  - Open questions: exact block type taxonomy — do 12 types cover all PRD sections adequately?
    How are blocks ordered when the AI generates them out of sequence? `[To verify]`
  - Deferred: drag-and-drop block reorder, custom block types, block templates.

- **`block-refinement`**
  - In: hover "Refine" button on each PRD block, natural language input for refinement
    instruction, single-block regeneration, conversation-panel feedback showing the refinement
    exchange.
  - Open questions: does the refinement call use the full conversation context, or just the
    block content + instruction? Performance implications of full-context refinement.
    `[To verify]`
  - Deferred: multi-block refinement, undo/revert per block, refinement history.

- **`pdf-export`**
  - In: branded PDF with Obra fonts, all PRD sections, evidence tags rendered visually,
    download button in PRD panel.
  - Open questions: Obra font format compatibility with @react-pdf/renderer. Fallback font
    strategy if embedding fails. `[To verify]`
  - Deferred: custom PDF templates, Word/DOCX export, print-optimized CSS alternative.

- **`public-sharing`**
  - In: public URL (`enhanced.pm/p/[slug]`), nanoid slug generation, SSR-rendered read-only
    page, OG meta tags, share button with copy-to-clipboard.
  - Open questions: should the PM be able to revoke a public link? (Likely yes — add a toggle.)
    OG image generation strategy (static template vs. dynamic). `[To verify]`
  - Deferred: embed widget, password-protected sharing, custom slugs, analytics on shared
    PRD views.

- **`prd-versioning`** (COULD)
  - In (if built): auto-version on step completion and block refinement, version list with
    timestamps, read-only view of past versions.
  - Open questions: storage strategy — full snapshots or diffs? Full snapshots are simpler
    but heavier. `[To verify]`
  - Deferred: version comparison (diff view), version branching, manual version naming.

> **Challenge:** Is this the *minimum* viable, or just "v1 with a few cuts"? If you removed the
> single biggest item, would we still learn what we need to? If yes, remove it.
>
> The single biggest item is `conversation-engine` — but removing it means there's no wizard.
> So test the *second* biggest: `block-refinement`. Could we ship without it?
>
> Without `block-refinement`, the PM gets a one-shot PRD they can't iterate on. They'd have to
> re-run the conversation or copy the PRD into another tool to edit. This would still let us
> learn whether PMs want structured validation — but it would make the product feel like a
> demo, not a tool. For the webinar, a non-refineable PRD might be acceptable. For post-webinar
> independent usage, it's a dealbreaker.
>
> Verdict: keep `block-refinement` as MUST for now, but if the timeline slips, it's the first
> feature to cut. The core learning (do PMs want structured pushback?) doesn't depend on it.
> The product quality does.
>
> The COULD feature (`prd-versioning`) is genuinely optional — we learn nothing from it that
> we can't learn without it. It stays COULD.

---

*This PRD is the bridge between the validated Discovery and the feature-level delivery specs.
Each feature listed in section 5 has a corresponding folder under
[`features/`](features/) with its own user stories, acceptance criteria, UX flows, and
technical specs.*

*Full decision trail: [Discovery](../discovery_wizard/enhanced-wizard-v1.md) |
[Executive Summary](executive-summary.md) | [Initiative README](README.md)*
