# PRD — \<Initiative name\>

> **Product Requirements Document.** This is the *delivery* spec for an **initiative**: it says
> **what** we build and **why**, in enough detail that design and engineering can execute — and it
> **breaks the need down into features** (§5). It builds on a validated Discovery — it does not
> re-litigate whether to build.

---

## 🚦 Gate — do not write this PRD without a validated Discovery

A PRD without a Go-decision Discovery behind it is a solution in search of a problem. Before
filling anything below:

- **Linked Discovery:** \<link to `docs/discovery/<need>.md`\>
- **Discovery decision:** `Go` ✓ (if not `Go`, stop — this PRD shouldn't exist yet)
- **Open `[To verify]` items inherited from Discovery:** \<list, or "none"\>

**Evidence discipline (carries over from Discovery):** tag claims `[Evidence]` /
`[Assumption]` / `[To verify]`. Never invent evidence; ask the human when missing. Each section
has a `> 🔍 Challenge` — answer it before considering the section done.

**Status:** `Draft` · `In review` · `Approved` · `In progress` · `Shipped`
**Author:** \<name\> · **Date:** \<date\>

---

## 1. Introduction

### Jobs To Be Done (JTBD)
> When \<situation\>, I want to \<motivation\>, so I can \<expected outcome\>.

### First Use Case
> I am a \<persona\>, and when I \<trigger\>, what matters most is \<need\>, but it turns out
> \<obstacle\>, and I have to \<workaround\>.

### Objectives
What this initiative must achieve (business + user). Keep it short and rankable.
- \<…\>

### Context
The situation today, why it matters now, and any constraints from the wider system or strategy.
- \<…\> `[Evidence|Assumption|To verify]`

### Vision
> One inspiring sentence: where this leads if it succeeds.

> 🔍 **Challenge:** Do the Objectives map back to the Discovery's verified problem? Cut any
> objective that doesn't.

---

## 2. Target audience

### Customer profiles / personas
Who is this for? Segment by role and, where useful, by maturity (e.g. technical vs non-technical),
and by whether they **produce** or **consume** the thing.
- \<persona\> — \<context, needs, tech level\>

### Use cases
The concrete situations these personas are in when they need this.
- \<…\>

> 🔍 **Challenge:** Are you designing for a real, named segment — or "everyone"? "Everyone" is a
> red flag. Pick the primary persona for the MVP.

---

## 3. Problems & solutions

### Problems identified
The specific problems this initiative addresses. Each with evidence and, where unknown, an open
question.
- \<problem\> `[Evidence|Assumption|To verify]`

### Proposed solution
- **Overview** — what the solution is, in plain language: \<…\>
- **User benefits** — what the user gains: \<…\>
- **Business benefits** — what the business gains: \<…\>

> 🔍 **Challenge:** Does every benefit trace to a listed problem? List the simplest alternative
> you rejected and why.

---

## 4. Benchmark

How others (competitors, internal tools, prior art) solve this — and what we take or beat.
| Tool / approach | Strengths | Weaknesses | Relevant to us? |
|-----------------|-----------|------------|-----------------|
| \<…\> | | | |

> 🔍 **Challenge:** Given the benchmark, is build still the right call over buy/integrate? Justify.

---

## 5. Features — the need broken down

### Feature breakdown (need → features)
The named features this initiative decomposes into. **This is the bridge** from "the need" to
"what we build". Each `MUST`/`COULD` feature here becomes a folder under `features/<feature-name>/`
with its own delivery docs (stories, Gherkin, tests, UX, tech spec). Keep this in sync with the
feature index in the initiative `README.md`.

| # | Feature | Value (one line) | Priority | Sequence | Folder |
|---|---------|------------------|----------|----------|--------|
| 1 | \<name\> | \<…\> | `MUST` / `COULD` | \<order\> | `features/<name>/` |
| 2 | \<…\> | \<…\> | \<…\> | \<…\> | \<…\> |

> 🔍 **Challenge:** Does every feature trace back to a problem in §3 (and the discovery)? Delete
> any that doesn't — it's scope creep. Is the sequencing driven by value/risk, or by convenience?

### Requirements (MoSCoW)
The requirement detail. Group it so each requirement maps to a feature above.

#### Must-have (MUST)
The initiative is pointless without these.
- \<…\>

#### Could-have (COULD)
Valuable but droppable for v1.
- \<…\>

#### Out of scope
Explicitly excluded (and why), to prevent scope creep.
- \<…\>

> 🔍 **Challenge:** Could any MUST actually be a COULD? Over-stuffed MUST lists are how MVPs slip.
> Defend each MUST against "what breaks if we ship without it?".

---

## 6. Technical constraints & requirements

### Constraints
Hard limits to respect (platform, performance, security, legal/GDPR, existing systems).
- \<…\>

### Requirements
Non-negotiables this initiative must satisfy.
- \<…\>

> 🔍 **Challenge:** Any constraint that secretly kills a MUST feature? Surface it now, not in
> delivery.

---

## 7. Success criteria

### North Star
The single metric that best captures success.
- \<…\>

### OKRs
- **Objective:** \<…\>
  - **KR1:** \<measurable\>
  - **KR2:** \<measurable\>

### KPIs
Supporting indicators to monitor.
- \<…\>

### Damage control
Guardrail metrics — what tells us we made something worse.
- \<…\>

> 🔍 **Challenge:** Can each metric be measured with data we collect today? If not, instrument it
> (add to the tech spec). A metric you can't measure isn't a success criterion.

---

## 8. Risks & assumptions

| Risk / assumption | Likelihood | Impact | Mitigation / test |
|-------------------|-----------|--------|-------------------|
| \<…\> | | | |

> 🔍 **Challenge:** What's the assumption that, if wrong, sinks the whole initiative? Is it tested?

---

## 9. Minimum Viable Product

### Discovery scoring criteria
If choosing between options/tools/approaches, score them. Two scores per row (1–3): one for
**how well it answers the need**, one for **effort** (for the people who'll build/maintain it).
| Persona | Criterion | Option A | Option B | Option C | Effort | Comments |
|---------|-----------|----------|----------|----------|--------|----------|
| \<…\> | \<…\> | | | | | |

### MVP features
The smallest set that delivers real value and lets us learn. Mark each as `POC` if it's a
learning spike rather than production-ready.
- \<feature\> — \<MUST/COULD\> \<(POC?)\>

### MVP scope (detailed)
For each MVP feature, the specifics: what's in, the key open questions, and what's deferred.
- **\<feature\>**
  - In: \<…\>
  - Open questions: \<…\> `[To verify]`
  - Deferred to later: \<…\>

> 🔍 **Challenge:** Is this the *minimum* viable, or just "v1 with a few cuts"? If you removed the
> single biggest item, would we still learn what we need to? If yes, remove it.
