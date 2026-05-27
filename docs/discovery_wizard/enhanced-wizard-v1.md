# Discovery — Enhanced Wizard V1

> **Framework:** FOCUSED. **Purpose:** qualify and *challenge* the need before any solution is
> committed. This document ends with an explicit **Go / No-Go / Pivot** decision. A No-Go is a
> success — it stops us building the wrong thing.
>
> **Expectations:** this should be understandable in **15 minutes**, by someone opening it
> **6 months later**, **without** the author's voiceover.

---

**Status:** `Validated (Go)`
**Author:** Hugo · **Date:** 2026-05-27 · **Stakeholders:** Hugo

**Discovery size** (time-box the effort):
`[ ] XS — 1 week` · `[x] S — 2 weeks` · `[ ] M — 3 weeks` · `[ ] L — 5 weeks` · `[ ] XL — 8 weeks`

---

## Scope

**Context** — Enhanced's company priority is to validate the core product hypothesis: that a
guided, structured wizard can help product teams make better build/no-build decisions. The V1
targets a **webinar demo in front of PMs** as the first public validation moment.

**Brief** — Enhanced V1 is a conversational wizard that guides PMs through structured hypothesis
validation before building, producing a transparent draft PRD that separates evidence from
assumptions.

**Out of scope** (explicitly deferred to V2+):
- MCP analytics connections (PostHog, Mixpanel, Amplitude) for automated data validation
- Living document mode (relaunch discovery on an existing PRD)
- Linear/Jira push or any backlog integration
- WYSIWYG editing of the PRD artifact
- Team collaboration features (comments, assignments, roles)
- Billing, pricing, or monetization logic
- Mobile-optimized experience

> **Challenge:** Is this tied to a *stated* objective? If you can't link a priority or OKR,
> stop and ask why we're doing it at all.
>
> Yes. Enhanced's single company priority right now is **proving the core product hypothesis** —
> that PMs will use a guided wizard to challenge their own assumptions before building. The
> webinar demo is the first external test of that hypothesis. Every V1 scope decision is
> subordinated to making that demo compelling and the product usable enough for early adopters
> to try it independently afterward.

---

## Immerse

### Research

- **What's wrong with the current solution / situation?**
  The decision to build a feature is the least rigorous step in the product process. It typically
  happens through oral conversations, Slack threads, sales requests, or gut feeling — and is
  never formally challenged before engineering resources are committed. `[Evidence]` — this is
  directly stated in the product brief and matches widely documented industry observations
  (Marty Cagan's "feature teams vs. product teams" framing, Teresa Torres's continuous
  discovery critique of assumption-driven roadmaps).

- **AI compounds the problem.** AI-assisted development enables teams to build 10x faster, but
  not 10x better. The bottleneck has shifted from "can we build it?" to "should we build it?" —
  and no tool addresses the "should" systematically. `[Evidence]` — the brief's core thesis,
  corroborated by the observable explosion of AI coding tools (Cursor, Copilot, Claude Code)
  with no equivalent on the product-decision side.

- **The real cost of a bad feature is not the build.** It's permanent maintenance, UX confusion,
  missed opportunity cost, and the political impossibility of reverting shipped features.
  `[Evidence]` — the brief states this explicitly. Industry data supports it: Pendo's 2019
  feature adoption report found ~80% of features are rarely or never used, and once shipped,
  features are almost never removed.

- **Qualitative insights:**
  - PMs already know they should validate more, but they lack a structured, low-friction process
    to do it. The overhead of running a proper discovery (interviews, data pulls, writeups) means
    it gets skipped when the team is moving fast. `[Assumption]` — inferred from the brief's
    framing and common PM complaints, but not backed by direct user interviews for Enhanced
    specifically.
  - Teams using analytics tools (PostHog, Mixpanel, Amplitude) have the data but rarely consult
    it *before* deciding what to build — they use it *after* to measure what shipped.
    `[Assumption]` — matches the brief's ICP description, but no quantitative validation yet.

- **Quantitative insights:**
  - No product-specific analytics yet — Enhanced has no users. `[Evidence]`
  - Industry proxy: Pendo reports ~80% of SaaS features are rarely or never used. `[Evidence]`
  - The webinar audience size and PM interest level will provide the first quantitative signal.
    `[To verify]` — measure signup count and post-webinar engagement.

### Problem definition

**Jobs To Be Done (JTBD):**
> When I have a feature idea I'm excited about and my team is ready to build, I want to
> rigorously challenge whether this idea is actually worth building, so I can avoid wasting
> engineering time on features that won't move the needle and instead focus on what matters.

**First Use Case:**
> I am a **PM at a startup or scale-up**,
> and when I **have a feature idea from a sales request, a user complaint, or my own intuition**,
> what matters most to me is **knowing whether the problem is real and the solution is the right
> one before committing engineering resources**,
> but it turns out **there's no structured, low-friction way to challenge my own assumptions** —
> discovery frameworks exist but they're heavyweight documents nobody fills out under time pressure,
> and I have to **either skip validation entirely (and risk building the wrong thing) or spend
> hours assembling a discovery doc from scratch that my team won't read**.

**Success criteria** — how we'll know we solved it:
- A PM can go from "I have an idea" to "I have a clear, honest draft PRD" in under 30 minutes
  using the wizard. `[Assumption]` — target based on the brief's UX design; needs validation
  with real users.
- The output PRD clearly separates `[Evidence]`, `[Assumption]`, and `[To verify]` tags — making
  the PM's confidence level transparent. `[Evidence]` — this is a design decision within our
  control.
- After using Enhanced, a PM can articulate at least one assumption they hadn't identified before.
  `[To verify]` — qualitative metric to test during webinar follow-ups.

**Damage control** — KPIs to watch for regressions:
- Wizard completion rate doesn't drop below 60%. If PMs abandon mid-flow, the tool is too
  heavy — we've recreated the problem we're solving. `[To verify]`
- Time-to-first-PRD stays under 30 minutes. If it balloons, friction is too high. `[To verify]`
- PRD quality doesn't degrade into "the AI just agreed with everything I said." The challenge
  mechanism must actually push back. `[To verify]`

> **Challenge:** What is the single strongest piece of evidence the problem is real? Who has
> confirmed it first-hand?
>
> The strongest evidence is **structural, not anecdotal**: the decision to build is the only step
> in the product process with no standard tooling or formal rigor. Design has Figma. Engineering
> has CI/CD. Analytics has PostHog. The "should we build this?" decision has... a Slack thread
> and a gut feeling. `[Evidence]` — observable industry gap.
>
> However, the claim that PMs *want* a tool to fix this (rather than just acknowledging the
> problem) is `[Assumption]`. The cheapest experiment to turn it into evidence: **the webinar
> itself**. If PMs sign up, engage, and try the product afterward, the demand signal is real.
> If they don't, the problem may be real but our solution shape may be wrong.

---

## Pitch

> **Launch tweet:**
> "You can build anything in a weekend now. The hard part isn't building — it's knowing what's
> worth building. Enhanced guides you through the questions you should ask *before* writing
> the first line of code. Pitch your idea, get a brutally honest PRD."

> **Challenge:** If you can't pitch the value in one tweet a real user would care about, the
> problem or the value isn't clear enough yet.
>
> The pitch lands on a real tension PMs feel daily: the gap between build speed and decision
> quality. "Brutally honest PRD" is the differentiator — it promises the tool won't just help
> you write, it'll help you *think*. The risk is that "brutally honest" sounds threatening rather
> than valuable — but for the ICP (PMs who care about rigor), it should resonate. `[To verify]`
> — test messaging during webinar promotion.

---

## Inspire

### Benchmarks

| Tool | What it does well | What it misses | What we reuse / beat |
|------|-------------------|----------------|----------------------|
| **Notion AI** | Good at drafting documents from prompts. Familiar workspace for PMs. | Generates *content*, not *thinking*. No structured challenge of assumptions. The AI agrees with whatever you write. | We reuse the split-view mental model (content + context). We beat it by making the AI an adversary, not an assistant. |
| **Linear** | Excellent project/issue management. Clean UX. | Lives *after* the decision to build. Assumes the feature is already validated. | We position Enhanced as the step *before* Linear. Our output could eventually feed into Linear (V2+). |
| **ProductBoard** | Captures user feedback, prioritizes features by impact. | Helps you prioritize *among* ideas but doesn't challenge whether any given idea is worth building at all. | We complement ProductBoard — it tells you *which* ideas your users mention most; we tell you whether a specific idea is actually validated. |
| **Coda AI** | Flexible doc + AI. Can build custom workflows. | Too open-ended. Requires the PM to know what structure to impose. No opinionated framework. | We beat it by being opinionated — the wizard *imposes* the right structure so the PM can't skip the hard questions. |
| **ChatGPT / Claude for product work** | PMs already use general-purpose AI to draft PRDs, brainstorm, and pressure-test ideas. | No structure, no persistence, no artifact. The conversation is disposable. The AI doesn't push back unless explicitly prompted to. | We beat it by embedding the challenge framework *into* the product. The PM doesn't need to know how to prompt — the wizard does it for them. We add persistence (versioning, sharing, PDF export). |
| **Traditional PRD templates** (Confluence, Google Docs) | Established format PMs know. | Static documents. No guided extraction. No challenge mechanism. The template is only as good as the PM's discipline in filling it honestly. | We keep the PRD as the output format (familiar) but replace the blank-page experience with a guided conversation that fills it intelligently. |

> **Challenge:** Has someone already solved this well enough that we should buy/integrate
> instead of build?
>
> No. The closest alternative is "use ChatGPT with a good system prompt" — and that's exactly
> what some PMs already do. But it lacks structure, persistence, the split-view artifact, and
> any mechanism to force honest tagging of evidence vs. assumptions. The gap is real.
> `[Evidence]` — none of the benchmarked tools combine guided extraction + structured challenge
> + transparent PRD output.
>
> The risk is that a general-purpose AI with a good prompt template is "good enough" for most
> PMs. `[Assumption]` — if the wizard doesn't deliver meaningfully better outcomes than a
> ChatGPT conversation, the product has no moat. The webinar and early usage will test this.

---

## Map

### Solution overview: the 4-step wizard

Enhanced V1 is a **split-view conversational wizard**:
- **Left panel:** AI-guided conversation that extracts, challenges, and structures the PM's
  thinking through `ask_user` tool calls (5 card types: single choice, multi choice, scale,
  confirmation, free text).
- **Right panel:** Draft PRD that builds in real-time as the conversation progresses. Each
  block can be refined via a hover "Refine" button (natural language re-prompt).

**The 4 steps:**

| Step | Name | Purpose | Key interactions |
|------|------|---------|------------------|
| 1 | **Problem framing** | Extract the problem, the target user, and the current situation. Challenge whether the problem is real. | Free text pitch → AI reformulation → confirmation cards → deferred signup (magic link after first wow moment) |
| 2 | **Data validation** | Identify what evidence exists and what's missing. Tag claims. | Scale cards (confidence level), multi-choice (data sources), free text (evidence details). Manual guidance in V1 — no MCP connections yet. |
| 3 | **Risk challenge** | Pressure-test the idea across Value, Usability, Feasibility, and Business Viability. | Single-choice cards (risk assessment), free text (mitigation). The AI plays devil's advocate. |
| 4 | **Final PRD** | Assemble the complete, tagged PRD. Review, version, export. | Confirmation cards, block-level refinement, PDF export, public sharing link. |

**Key touchpoints:**
- **Landing page:** Minimal homepage, big textarea, "Pitch your product idea." No signup required
  upfront — zero friction to start.
- **Deferred auth:** Magic link signup triggered at end of step 1, after the first reformulation
  delivers the "wow" moment. The PM has already invested effort and seen value.
- **Block refinement:** Any PRD block can be refined inline via natural language — the PM hovers,
  clicks "Refine," types what they want changed, and the block updates.
- **Export and share:** PDF export and public sharing link for stakeholder review.

> **Challenge:** Does every part of this map trace back to a problem in **Immerse**?
>
> - 4-step wizard → solves "no structured, low-friction process to challenge assumptions"
> - Split-view → solves "discovery frameworks are heavyweight documents nobody reads" by
>   showing the output *as it forms*, keeping the PM engaged
> - `ask_user` cards → solves "open-ended AI chat doesn't push back" by forcing structured
>   responses
> - Deferred auth → solves "signup required upfront kills conversion" `[Assumption]` — this is
>   a UX hypothesis, not a validated problem. We believe it's right based on PLG best practices,
>   but haven't tested it.
> - Block refinement → solves "PRD is a one-shot output you can't iterate on"
>
> Nothing in the map exists without a traced problem. The deferred auth is the weakest link —
> it's a conversion optimization hypothesis, not a core problem solution.

---

## Craft

### Rationale — why this shape

**Wizard, not template.** A blank template puts the burden on the PM to know what to write and
in what order. A wizard controls the sequence, asks the right questions at the right time, and
prevents skipping the hard parts. The structure is the product. `[Evidence]` — the benchmark
analysis shows that template-based tools (Notion, Confluence, Coda) fail precisely because they
rely on PM discipline.

**Guided conversation, not open chat.** An open chat (ChatGPT-style) lets the PM steer — which
means they steer around the uncomfortable questions. The `ask_user` tool with structured card
types forces specific answers and prevents vague hand-waving. The AI controls the conversation
flow. `[Evidence]` — direct observation: PMs using ChatGPT for PRD drafting get agreeable output,
not challenged output.

**Split-view for real-time feedback.** Showing the PRD forming in real-time as the conversation
progresses keeps the PM engaged and gives them confidence that their answers are producing
something useful. It also enables block-level refinement — the PM can fix issues as they appear
rather than waiting until the end. `[Assumption]` — we believe this UX pattern increases
completion rate, but haven't validated it.

**Deferred signup after first value.** Requiring auth before any interaction kills conversion
for a product nobody knows yet. Letting the PM start immediately and asking for signup after
the first reformulation (when they've seen value) follows the PLG playbook. `[Assumption]` —
standard PLG pattern, but untested for this specific product.

### Rejected alternatives

| Alternative | Why rejected |
|-------------|--------------|
| **Form-based questionnaire** | Too rigid. Can't adapt follow-up questions based on answers. Feels like bureaucracy, not thinking. |
| **Pure chatbot (no artifact)** | No persistent output. The conversation is the product, but conversations are disposable. PMs need a shareable document. |
| **Template with inline AI assistance** | Too close to Notion AI. The PM still controls the structure, which means they skip the hard parts. |
| **Multi-user collaborative tool** | Adds complexity without validating the core hypothesis. Collaboration is a V2 feature once the solo experience is proven. |
| **Analytics-first approach** | Starting with MCP analytics connections before proving the wizard UX works puts the cart before the horse. Data validation is manual in V1 intentionally. |

> **Challenge:** What did we *not* choose, and why?
>
> Answered in the table above. The strongest rejected alternative is "pure chatbot" — it's the
> simplest to build, and some PMs might prefer it. We rejected it because the PRD artifact is
> the differentiator: it's what gets shared with stakeholders, what survives the conversation,
> and what makes the tool's output actionable beyond the PM who used it. `[Assumption]` — we
> believe the artifact matters more than the conversation. The webinar will test this: do PMs
> share their PRDs?

---

## Test — the four risks

| Risk | Question | Current read | Evidence / test to run |
|------|----------|--------------|------------------------|
| **Value** | Will PMs actually use a tool to challenge their own ideas? | **Medium-high confidence.** The problem is real and well-documented. But wanting to validate ≠ wanting to be challenged. PMs may prefer tools that *help* them build, not tools that *stop* them. | `[Evidence]` Industry gap is observable — no tool occupies this space. `[Assumption]` PMs will welcome structured pushback rather than resent it. `[To verify]` Webinar signup rate and post-demo engagement. Target: 50+ signups, 10+ PRDs created within 48h. |
| **Usability** | Can a PM go from pitch to PRD in under 30 minutes without getting stuck or frustrated? | **Medium confidence.** The wizard structure should guide them, but 4 steps with structured cards is a new interaction pattern. Risk of feeling too rigid or too long. | `[Assumption]` The `ask_user` card types provide enough flexibility for diverse product ideas. `[To verify]` Run 3-5 moderated user tests before the webinar. Measure completion rate, time-to-PRD, and frustration points. |
| **Feasibility** | Can we build this in 2 weeks with the current stack? | **High confidence.** The tech stack is scaffolded (Next.js 16, Supabase, Vercel AI SDK). The core is an AI conversation with structured tool calls — well within current AI SDK capabilities. Split-view is a UI challenge, not a technical risk. | `[Evidence]` Stack is already set up and dependencies installed. AI SDK supports tool calls natively. `[Assumption]` Block-level refinement and real-time PRD rendering won't introduce unexpected complexity. `[To verify]` Prototype the split-view + streaming in week 1. |
| **Business viability** | Does it work for the webinar demo and early adoption? | **High confidence for V1.** No monetization needed yet — V1 is free, targeting validation. The webinar is a marketing event, not a revenue play. Cost is AI API calls (manageable at demo scale). | `[Evidence]` No billing or pricing logic needed for V1. `[Assumption]` AI API costs at demo scale (50-200 users) are manageable (<$100). `[To verify]` Estimate token usage per session and set a cost ceiling. |

> **Challenge:** Which of the four risks is the **biggest** right now? Have you tested *that*
> one, or only the comfortable ones?
>
> The biggest risk is **Value** — specifically, the assumption that PMs will *welcome* being
> challenged rather than finding it annoying or patronizing. Everything else (usability,
> feasibility, viability) is solvable with iteration. But if PMs don't want a tool that pushes
> back on their ideas, the entire product thesis fails.
>
> We have NOT tested this yet. The feasibility risk is the most comfortable (and the one we've
> de-risked by scaffolding the stack), but it's also the least dangerous. The cheapest test for
> the value risk: **the webinar itself.** If PMs sign up, engage with the demo, and then
> actually create PRDs on their own — the value hypothesis holds. If they watch politely and
> never return, it doesn't. A secondary test: **share the "launch tweet" pitch on relevant PM
> communities** before the webinar and measure click-through interest. `[To verify]`

---

## Follow

**Success criteria** (outcome metrics):
- **Webinar signups:** 50+ PMs register. `[To verify]`
- **Post-webinar activation:** 10+ draft PRDs created within 48h of the webinar. `[To verify]`
- **Public sharing:** At least 3 PRDs shared via public link within the first week. `[To verify]`
- **Wizard completion rate:** >60% of users who start step 1 finish step 4. `[To verify]`
- **Time-to-PRD:** Median under 30 minutes. `[To verify]`

**Damage control** (guardrail KPIs):
- **Abandonment spike at step 2 (data validation):** If >40% drop off at step 2, the manual
  data guidance is too friction-heavy — consider simplifying or making it optional. `[To verify]`
- **PRD quality degradation:** If PRDs are just the AI agreeing with everything, the challenge
  mechanism isn't working. Sample-review 10 PRDs post-webinar. `[To verify]`
- **API cost per session:** Must stay under $0.50/session at demo scale. `[To verify]`

**Review date:** 2026-06-15 — two weeks after expected webinar date, enough time to collect
post-demo usage data.

> **Challenge:** Are these measurable with data we actually collect today?
>
> Not yet — Enhanced has no users and no analytics instrumentation. This must be addressed
> during delivery:
> - **PostHog** is in the stack but not instrumented. Wizard step progression, completion rate,
>   and time-to-PRD must be tracked as PostHog events. `[To verify]` — instrument during build.
> - **Webinar signups** are measured via whatever registration tool is used (external to Enhanced).
> - **Public sharing count** requires a query on the sharing table in Supabase. `[To verify]`
> - **API cost** requires logging token usage per session. `[To verify]` — add to the AI
>   service layer during build.

---

## Decision gate

- **Decision:** `Go`

- **Rationale:**
  The problem is real and structurally evidenced: the decision to build is the only step in the
  product process with no standard tooling or formal rigor. `[Evidence]` The industry gap is
  observable (no benchmarked tool combines guided extraction + structured challenge + transparent
  output). `[Evidence]` The feasibility risk is low — the stack is scaffolded and the core
  technology (AI tool calls + streaming) is proven. `[Evidence]` The business viability risk is
  negligible for V1 (free product, demo-scale costs). `[Evidence]`

  The main risk is Value — whether PMs will welcome structured pushback on their ideas. This
  risk is `[Assumption]`-level, but the webinar serves as the cheapest possible test: it puts
  the product in front of the target audience with minimal investment. A V1 scoped to 2 weeks
  of build is a proportionate bet.

- **Open `[To verify]` items remaining:**
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

- **Next step:**
  On **Go** → create the initiative: copy `docs/template/_initiative/` to
  `docs/initiative_wizard/`, and link this discovery from the initiative README +
  the PRD gate. The PRD then breaks the V1 need into features (landing page, wizard engine,
  split-view, auth flow, export/sharing, etc.).

> **Final challenge:** Would you bet your own time/money on this Go?
>
> Yes — but with clear conditions. The bet is proportionate: 2 weeks of build for a product
> that tests a strong structural hypothesis (the product-decision gap) in front of the right
> audience (PMs at a webinar). The downside is small (2 weeks), the upside is high (validated
> product direction + early users + public PRDs as social proof). The honest caveat: if the
> webinar audience watches politely and nobody creates a PRD afterward, the value hypothesis
> fails and we pivot — not double down.
