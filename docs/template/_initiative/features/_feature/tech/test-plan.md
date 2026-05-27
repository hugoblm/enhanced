# Test Plan (Automated) — \<Feature name\>

> The automated test strategy for this feature. **Unit tests and non-regression tests are
> mandatory.** Acceptance/e2e tests must cover the Gherkin scenarios in
> [`../product/gherkin-tests.md`](../product/gherkin-tests.md). The manual portion lives in
> [`../product/manual-tests.md`](../product/manual-tests.md).

**Status:** `Draft` · `In review` · `Approved` · **Author:** \<name\> · **Date:** \<date\>
**Tooling:** \<test framework / runner — TO BE FILLED with the stack\>

---

## Test types (all that apply are required)

| Type | Mandatory? | What it covers here |
|------|-----------|---------------------|
| **Unit** | ✅ Yes | Pure logic, edge cases, error handling of new functions/components |
| **Non-regression** | ✅ Yes | Existing behavior that must keep working — guards against breakage |
| **Integration** | If the feature crosses modules/services | Contracts between components, data round-trips |
| **End-to-end / acceptance** | If user-facing | The Gherkin scenarios, driven through the real UI/API |

## Non-regression — what must not break
List the existing behaviors at risk from this change, and the test that protects each.
- \<existing behavior\> → covered by \<test name/path\>

> Non-regression tests are not optional: any change that could affect existing behavior must add
> or extend a test that fails *before* the fix/feature and passes *after*.

## Traceability — Gherkin scenario → automated test
Every `MUST` scenario maps to at least one automated test.

| Gherkin scenario | US | Test type | Automated test (name / path) | Status |
|------------------|----|-----------|------------------------------|--------|
| \<scenario\> | \<id\> | unit / e2e | \<…\> | `To write / Done` |
| \<scenario\> | \<id\> | \<…\> | \<…\> | \<…\> |

## Coverage expectations
- \<target for new code — e.g. critical paths fully covered; overall threshold TO BE FILLED\>
- Prioritize meaningful coverage of logic and failure modes over a raw percentage.

## How to run
```bash
# unit            TO BE FILLED with the stack
# e2e             TO BE FILLED
# coverage        TO BE FILLED
```

> 🔍 **Challenge:** Does every `MUST` Gherkin scenario appear in the traceability table with a
> real test? Did you add a non-regression test for the behavior most likely to break? Tests that
> only assert the happy path give false confidence.
