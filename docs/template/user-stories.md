# User Stories & JTBD — \<Feature name\>

> Captures **who** needs **what** and **why**. Pairs with the PRD. Stories drive the Gherkin
> acceptance tests (`gherkin-tests.md`) — each story should map to at least one scenario.

**Evidence discipline:** tag the rationale of a story `[Evidence]` / `[Assumption]` / `[To verify]`.
A story with no evidence and no link to a verified problem is a candidate for cutting.

**Status:** `Draft` · `In review` · `Approved` · **Author:** \<name\> · **Date:** \<date\>

---

## Jobs To Be Done (JTBD)

The underlying jobs users are "hiring" this feature to do. Job statements are solution-agnostic.

> When \<situation\>, I want to \<motivation / job\>, so I can \<expected outcome\>.

- **Main job:** \<…\>
- **Related jobs:** \<…\>

---

## Personas (quick reference)

Pulled from the PRD's target audience — name them so stories below can reference them.
- **\<persona\>** — \<one line: role, context, tech level\>

---

## User stories

Format: **As a** \<persona\>, **I want** \<capability\>, **so that** \<benefit\>.
Each story gets an ID, a priority (MoSCoW), and acceptance criteria.

### US-1 — \<short title\>
- **Story:** As a \<persona\>, I want \<capability\>, so that \<benefit\>.
- **Priority:** `MUST` · `COULD`
- **Why (rationale):** \<…\> `[Evidence|Assumption|To verify]`
- **Acceptance criteria:**
  - [ ] \<observable, testable condition\>
  - [ ] \<…\>
- **Maps to Gherkin:** `gherkin-tests.md` → \<scenario name(s)\>

### US-2 — \<short title\>
- **Story:** As a \<persona\>, I want \<capability\>, so that \<benefit\>.
- **Priority:** `MUST` · `COULD`
- **Why (rationale):** \<…\>
- **Acceptance criteria:**
  - [ ] \<…\>
- **Maps to Gherkin:** \<…\>

<!-- Add US-3, US-4… Keep MUST stories few and sharp. -->

---

## Out of scope (non-stories)

Things users might expect that we are deliberately **not** doing in this feature, and why.
- \<…\>

> 🔍 **Challenge:** Does every `MUST` story trace to a verified problem in the PRD/Discovery? Does
> every story have at least one acceptance criterion that a test could check? If not, fix it
> before it reaches engineering.
