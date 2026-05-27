# Test Plan (Automated) -- Landing Page

**Status:** Draft -- **Author:** Hugo -- **Date:** 2026-05-27
**Tooling:** Vitest (unit) + Playwright (e2e)

---

## Test types

### Unit tests (Vitest)

**File:** `src/lib/schemas/__tests__/session.test.ts`

| Test | Input | Expected |
|------|-------|----------|
| Valid idea (20 chars) | `"A tool for PM validation"` | `success: true` |
| Valid idea (long) | 2000-character string | `success: true` |
| Empty string | `""` | `success: false`, error contains "20 caracteres" |
| Whitespace only | `"     "` | `success: false` (trim reduces to empty) |
| Too short (19 chars) | `"Fix the onboarding"` | `success: false`, error contains "20 caracteres" |
| Too long (> 5000 chars) | 5001-character string | `success: false`, error contains "5000 caracteres" |
| Exactly 20 chars after trim | `"  A valid idea text!  "` (20 non-space chars) | `success: true` |
| Null input | `null` | `success: false` |
| Numeric input | `12345` | `success: false` (not a string) |

**File:** `src/app/actions/__tests__/session.test.ts`

| Test | Setup | Expected |
|------|-------|----------|
| createSession with valid input | Mock Supabase insert returning session ID | Returns `undefined` (redirect called), Supabase `sessions.insert` called with correct shape, Supabase `prds.insert` called with session FK |
| createSession with invalid input (empty) | No mock needed | Returns `{ error: "..." }`, no Supabase calls made |
| createSession with Supabase error | Mock Supabase insert returning error | Returns `{ error: "Impossible de creer la session..." }`, no redirect |
| createSession sets cookie | Mock Supabase insert OK | `cookies().set` called with `enhanced_anon_id`, httpOnly, secure, sameSite=lax |
| createSession generates unique anonymous IDs | Two calls | Each call produces a different UUID |

**File:** `src/components/landing/__tests__/pitch-form.test.tsx`

| Test | Action | Expected |
|------|--------|----------|
| Renders textarea and CTA button | Mount component | Textarea with placeholder visible, button with "Lancer le cadrage" visible |
| Shows error on empty submit | Submit empty form | Error paragraph appears with validation message |
| Clears error on typing | Submit empty -> type text | Error paragraph disappears |
| Shows loading state during submission | Submit valid form | Button text changes to "Lancement...", button is disabled |
| Preserves textarea value on error | Submit short text | Textarea still contains the typed text |

### E2E tests (Playwright)

**File:** `e2e/landing-page.spec.ts`

| Test | Steps | Expected |
|------|-------|----------|
| Full happy path | Navigate to `/`, type 25-char idea, click CTA | URL changes to `/session/{uuid}`, DB has new session row |
| Long idea preserved | Type 2000-char idea, submit | Redirect happens, idea text not truncated in DB |
| Empty submission blocked | Click CTA without typing | Stay on `/`, error message visible near textarea, focus on textarea |
| Short submission blocked | Type "Fix onboarding", click CTA | Stay on `/`, error mentions 20-character minimum, typed text preserved |
| Error clears on typing | Submit empty -> type valid text | Error disappears |
| Server error handling | Simulate DB failure (if feasible) | Stay on `/`, user-friendly error message, textarea preserved, CTA re-enabled |
| Tablet viewport | Set viewport 768px wide | Textarea + CTA visible, no horizontal scroll, CTA >= 44x44px |
| Value proposition visible | Navigate to `/` | Value prop text visible above textarea without scrolling |

---

## Non-regression

| Check | Why |
|-------|-----|
| Root layout still renders (fonts, metadata) | Moving to `(marketing)` route group could break root layout inheritance |
| Middleware still runs (Supabase session refresh) | New route group must not be excluded from middleware matcher |
| No other routes affected | Adding `(marketing)` group must not break existing routes |

---

## Traceability -- Gherkin to automated test

| Gherkin scenario | US | Test type | Test path | Status |
|------------------|-----|-----------|-----------|--------|
| SC-LP-1 -- Submit valid idea, enter wizard | US-LP-1 | E2E | `e2e/landing-page.spec.ts` | Planned |
| SC-LP-2 -- Submit long idea, preserved | US-LP-1 | E2E | `e2e/landing-page.spec.ts` | Planned |
| SC-LP-3 -- Empty textarea, error shown | US-LP-2 | E2E + Unit | `e2e/landing-page.spec.ts`, `session.test.ts` | Planned |
| SC-LP-4 -- Too-short input, error with min length | US-LP-2 | E2E + Unit | `e2e/landing-page.spec.ts`, `session.test.ts` | Planned |
| SC-LP-5 -- Error clears on valid typing | US-LP-2 | E2E + Unit | `e2e/landing-page.spec.ts`, `pitch-form.test.tsx` | Planned |
| SC-LP-6 -- Server error, user-friendly message | US-LP-1 | E2E | `e2e/landing-page.spec.ts` | Planned |
| SC-LP-7 -- Tablet viewport responsive | US-LP-3 | E2E | `e2e/landing-page.spec.ts` | Planned |
| SC-LP-8 -- Value proposition visible + clear | US-LP-4 | E2E | `e2e/landing-page.spec.ts` | Planned |

---

## Coverage expectations

| Layer | Target |
|-------|--------|
| Zod schema (`rawIdeaSchema`) | 100% branch coverage (all validation paths) |
| Server Action (`createSession`) | 100% branch coverage (valid, invalid, DB error) |
| PitchForm component | Render + interaction tests (not snapshot-based) |
| E2E landing flow | Happy path + 3 error paths + responsive |

---

## How to run

```bash
# Unit tests (Vitest)
npx vitest run src/lib/schemas/__tests__/session.test.ts
npx vitest run src/app/actions/__tests__/session.test.ts
npx vitest run src/components/landing/__tests__/pitch-form.test.tsx

# All unit tests
npx vitest run

# E2E tests (Playwright) -- requires dev server running
npx playwright test e2e/landing-page.spec.ts

# E2E with UI (headed mode for debugging)
npx playwright test e2e/landing-page.spec.ts --headed
```
