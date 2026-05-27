# Manual Test Cases — \<Feature name\>

> Human-run test cases that a **non-developer or QA** can execute without touching the code. They
> are derived from the acceptance scenarios in [`gherkin-tests.md`](gherkin-tests.md) and the user
> stories in [`user-stories-and-jtbd.md`](user-stories-and-jtbd.md). Each case must trace back to a
> scenario or story ID.
>
> Manual tests complement — they don't replace — the automated suite in
> [`../tech/test-plan.md`](../tech/test-plan.md). Use them for exploratory checks, UX/judgment
> calls, and a pre-release smoke pass.

**Status:** `Draft` · `In review` · `Approved` · **Author:** \<name\> · **Date:** \<date\>
**Environment:** \<URL / build / device / browser the tester should use\>

---

## How to use this
- Run each case in order; record the result (`Pass` / `Fail` / `Blocked`) and the date/tester.
- On `Fail`, capture what you saw vs. expected, plus a screenshot/recording and steps to reproduce.
- A release is blocked while any `MUST`-linked case is `Fail`.

---

## Test cases

### MT-1 — \<short title\>
- **Traces to:** Gherkin `<scenario name>` · US `<id>`
- **Priority:** `MUST` · `COULD`
- **Pre-conditions:** \<state/data/account needed before starting\>
- **Steps:**
  1. \<action\>
  2. \<action\>
- **Expected result:** \<the observable outcome\>
- **Result:** `Pass / Fail / Blocked` — **Tester:** \<name\> — **Date:** \<date\>
- **Notes / defects:** \<link to ticket if Fail\>

### MT-2 — \<short title\>
- **Traces to:** \<…\>
- **Priority:** `MUST` · `COULD`
- **Pre-conditions:** \<…\>
- **Steps:**
  1. \<…\>
- **Expected result:** \<…\>
- **Result:** `Pass / Fail / Blocked` — **Tester:** \<…\> — **Date:** \<…\>
- **Notes / defects:** \<…\>

<!-- Add MT-3, MT-4… Cover happy path, edge cases, and failure/error states. -->

---

## Exploratory testing
Time-boxed, unscripted testing to find what the cases miss. Note the charter and anything found.
- **Charter:** \<what area/risk to probe\>
- **Findings:** \<…\>

---

## Pre-release smoke checklist
The minimal manual pass before shipping (quick, broad, catches obvious breakage):
- [ ] Primary happy-path flow works end to end
- [ ] Key error states behave (invalid input, no permission, offline if relevant)
- [ ] No visual regression on the touched screens
- [ ] Accessibility quick pass (keyboard + visible focus) — see [`ux-accessibility.md`](ux-accessibility.md)

> 🔍 **Challenge:** Does every `MUST` Gherkin scenario have a matching manual case *or* an
> automated test in `test-plan.md`? A scenario with neither is untested behavior shipping blind.
