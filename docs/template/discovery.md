# Discovery — \<Project / Feature name\>

> **Framework:** FOCUSED. **Purpose:** qualify and *challenge* the need before any solution is
> committed. This document ends with an explicit **Go / No-Go / Pivot** decision. A No-Go is a
> success — it stops us building the wrong thing.
>
> **Expectations:** this should be understandable in **15 minutes**, by someone opening it
> **6 months later**, **without** the author's voiceover.

---

## How to use this template (agent + author)

This template forces verification of the need. Follow these rules while filling it:

- **Tag every claim** about the problem, users, or impact:
  - `[Evidence]` — backed by data, a quote, an analytics number, a real ticket. Cite the source.
  - `[Assumption]` — believed but not proven. Must be testable.
  - `[To verify]` — open question to resolve before the gate.
- **Never invent evidence.** If you (the agent) don't have it, write `[To verify]` and ask the
  human. A confident-sounding but unsourced claim is the failure mode this template exists to stop.
- **Each section has a `> 🔍 Challenge`** block. Answer it honestly. If you can't, the section
  isn't done.
- **Solution-space sections (Map, Craft) stay empty until the problem is real.** Don't pitch a
  solution to an unverified problem.

**Status:** `Draft` · `In review` · `Validated (Go)` · `Rejected (No-Go)` · `Pivot`
**Author:** \<name\> · **Date:** \<date\> · **Stakeholders:** \<names\>

**Discovery size** (time-box the effort):
`[ ] XS — 1 week` · `[ ] S — 2 weeks` · `[ ] M — 3 weeks` · `[ ] L — 5 weeks` · `[ ] XL — 8 weeks`

---

## 📏 Scope

**Context** — Which company priority / OKR does this serve? Link it.
- Priority: \<link\>
- OKR: \<link\>

**Brief** — What is this about, in one or two sentences?
> \<…\>

**Out of scope** — What are we explicitly *not* doing here? (Be specific; this protects the discovery.)
- \<…\>

> 🔍 **Challenge:** Is this tied to a *stated* objective? If you can't link a priority or OKR,
> stop and ask why we're doing it at all.

---

## 👀 Immerse

### Research
- **What's wrong with the current solution / situation?** \<…\> `[Evidence|Assumption|To verify]`
- **Qualitative insights** (quotes, interviews, support tickets): \<…\> `[Evidence|…]`
- **Quantitative insights** (analytics, volumes, conversion, cost): \<…\> `[Evidence|…]`

### Problem definition

**Jobs To Be Done (JTBD)** — the underlying job the user is trying to get done:
> When \<situation\>, I want to \<motivation\>, so I can \<expected outcome\>.

**First Use Case** — the sharpest concrete instance of the problem:
> I am a \<persona\>,
> and when I \<situation / trigger\>,
> what matters most to me is \<core need\>,
> but it turns out \<the obstacle / what fails today\>,
> and I have to \<the painful workaround\>.

**Success criteria** — how we'll know we solved it (leading + outcome signals):
- \<…\>

**Damage control** — the KPI we watch to make sure we didn't make something *worse*:
- \<…\>

> 🔍 **Challenge:** What is the single strongest piece of evidence the problem is real? Who has
> confirmed it first-hand? If the best you have is `[Assumption]`, name the cheapest experiment
> that would turn it into `[Evidence]` — and consider running it before going further.

---

## 📣 Pitch

How would we announce this if it shipped today? Write the **launch tweet** (or a short FAQ).
> \<launch tweet — one or two crisp sentences a user would care about\>

> 🔍 **Challenge:** If you can't pitch the value in one tweet a real user would care about, the
> problem or the value isn't clear enough yet. Tighten it before continuing.

---

## 💡 Inspire

Nuggets, prior art, and benchmarks worth reusing or beating:
- **Nugget** — an idea/pattern to reuse: \<…\>
- **Benchmark** — how others solve this (links): \<…\>

> 🔍 **Challenge:** Has someone already solved this well enough that we should buy/integrate
> instead of build? Note it explicitly.

---

## 📐 Map

High-level description of the solution and its **key touchpoints** (where the user meets it).
*Fill this only once the problem above is verified.*
> \<…\>

> 🔍 **Challenge:** Does every part of this map trace back to a problem in **Immerse**? Delete
> anything that doesn't — it's scope creep.

---

## 🖍 Craft

- **Rationale** — why this shape of solution over the alternatives: \<…\>
- **Design** — link to mockups / Figma / flows: \<…\>

> 🔍 **Challenge:** What did we *not* choose, and why? A solution with no rejected alternatives
> usually hasn't been thought through.

---

## 🧪 Test — the four risks

This is the heart of the discovery. For each risk: state your current read, the evidence, and the
**cheapest test** that would de-risk it. Do not mark a risk "handled" on an assumption.

| Risk | Question | Current read | Evidence / test to run |
|------|----------|--------------|------------------------|
| **Value** | Will users actually use / want it? | \<…\> | `[Evidence|To verify]` |
| **Usability** | Can they figure out how to use it? | \<…\> | `[Evidence|To verify]` |
| **Feasibility** | Can we realistically build it? | \<…\> | `[Evidence|To verify]` |
| **Business viability** | Does it work for the business (cost, legal, GTM)? | \<…\> | `[Evidence|To verify]` |

> 🔍 **Challenge:** Which of the four risks is the **biggest** right now? Have you tested *that*
> one, or only the comfortable ones? The riskiest assumption should be tested first and cheapest.

---

## 📈 Follow

How we'll measure this *after* launch:
- **Success criteria** (outcome metrics): \<…\>
- **Damage control** (guardrail KPIs): \<…\>
- **Review date** — when we'll look back and judge: \<date\>

> 🔍 **Challenge:** Are these measurable with data we actually collect today? If not, instrument
> it as part of delivery.

---

## ✅ Decision gate

The discovery is complete only when this is filled.

- **Decision:** `Go` · `No-Go` · `Pivot`
- **Rationale:** \<why — reference the evidence and the risk reads above\>
- **Open `[To verify]` items remaining:** \<list, or "none"\>
- **Next step:**
  - On **Go** → create an initiative: copy `docs/template/_initiative/` to
    `docs/initiative/<name>/`, and link *this* discovery from the initiative README + the PRD gate.
    The PRD then breaks the need down into features.
  - On **No-Go** → record the reason; keep this doc in `docs/discovery/` as institutional memory.
  - On **Pivot** → state the new framing and loop back to **Immerse**.

> 🔍 **Final challenge:** Would you bet your own time/money on this Go? If the honest answer is
> "only because we already started," that's a No-Go.
