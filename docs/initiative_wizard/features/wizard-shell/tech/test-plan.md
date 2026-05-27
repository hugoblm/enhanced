# Test Plan (Automated) -- Wizard Shell

**Status:** Draft -- **Author:** Hugo -- **Date:** 2026-05-27
**Tooling:** Vitest (unit) + Playwright (e2e)

---

## Test types

### Unit tests (Vitest)

**File:** `src/stores/__tests__/wizard-store.test.ts`

| Test | Action | Expected |
|------|--------|----------|
| Initial state | Read store before initialize | `sessionId: null`, `currentStep: 1`, `viewingStep: 1`, `activePanel: "conversation"` |
| Initialize sets all fields | Call `initialize({ sessionId: "abc", currentStep: 2, rawIdea: "idea", status: "active" })` | `sessionId: "abc"`, `currentStep: 2`, `viewingStep: 2`, `rawIdea: "idea"` |
| advanceStep from 1 to 2 | Initialize at step 1, call `advanceStep()` | `currentStep: 2`, `viewingStep: 2` |
| advanceStep from 4 does nothing | Initialize at step 4, call `advanceStep()` | `currentStep: 4` (unchanged) |
| goToStep to completed step | Initialize at step 3, call `goToStep(1)` | `viewingStep: 1`, `currentStep: 3` (unchanged) |
| goToStep to current step | Initialize at step 2, call `goToStep(2)` | `viewingStep: 2` (no change) |
| goToStep to future step does nothing | Initialize at step 2, call `goToStep(4)` | `viewingStep: 2` (unchanged) |
| goToStep to invalid step (0) | Initialize at step 2, call `goToStep(0)` | `viewingStep: 2` (unchanged) |
| goToStep to invalid step (5) | Initialize at step 2, call `goToStep(5)` | `viewingStep: 2` (unchanged) |
| setActivePanel to "prd" | Call `setActivePanel("prd")` | `activePanel: "prd"` |
| setActivePanel to "conversation" | Call `setActivePanel("conversation")` | `activePanel: "conversation"` |

**File:** `src/components/wizard/__tests__/step-indicator.test.tsx`

| Test | Setup | Expected |
|------|-------|----------|
| Renders 4 steps | Store at step 1 | 4 buttons visible, labels "Cadrage", "Donnees", "Risques", "PRD" |
| Current step is highlighted | Store at step 2 | Step 2 has `aria-current="step"`, primary styling |
| Completed steps are clickable | Store at step 3 | Steps 1 and 2 are not disabled, have cursor pointer |
| Locked steps are disabled | Store at step 2 | Steps 3 and 4 have `disabled` attribute |
| Click on completed step calls goToStep | Store at step 3, click step 1 | `goToStep(1)` called |
| Click on locked step does nothing | Store at step 2, click step 4 | No state change |
| Completed step shows checkmark | Store at step 3 | Steps 1 and 2 contain a check icon (not the number) |
| Step labels hidden on narrow screen | Render at < 640px | Labels have `hidden sm:inline` class |

**File:** `src/hooks/__tests__/use-media-query.test.ts`

| Test | Setup | Expected |
|------|-------|----------|
| Returns false before mount (SSR safety) | Render with `window.matchMedia` mocked | Initial value is `false` |
| Returns true when query matches | Mock `matchMedia` returning `matches: true` | Returns `true` |
| Updates on media change | Mock change event | Value updates |

**File:** `src/components/wizard/__tests__/wizard-shell.test.tsx`

| Test | Setup | Expected |
|------|-------|----------|
| Renders grid layout on desktop | Mock `useMediaQuery` returning `true` | Grid container with two children visible |
| Renders tabs on mobile | Mock `useMediaQuery` returning `false` | Tabs component with "Conversation" and "PRD" triggers |
| Both panels present on desktop | Desktop mock | ConversationPanel and PrdPanel both in DOM |
| Tab switch shows correct panel | Mobile mock, click "PRD" tab | PrdPanel content visible, ConversationPanel hidden |

### E2E tests (Playwright)

**File:** `e2e/wizard-shell.spec.ts`

| Test | Steps | Expected |
|------|-------|----------|
| Split-view on desktop | Create session, navigate to `/session/{id}` at 1280px viewport | Two panels visible side by side, step indicator at top |
| Step indicator shows 4 steps | Load wizard at step 1 | 4 step buttons visible: "Cadrage", "Donnees", "Risques", "PRD" |
| Step 1 highlighted on entry | Load new session | Step 1 has active styling, steps 2-4 dimmed |
| Tabs on tablet viewport | Navigate at 768px viewport | Tabs visible ("Conversation", "PRD"), only one panel at a time |
| Tab switch works | Mobile viewport, click "PRD" tab | PRD panel visible, conversation hidden; switch back works |
| Independent panel scroll | Desktop, fill both panels with long content | Scrolling one panel doesn't move the other |
| Invalid session 404 | Navigate to `/session/invalid-uuid` | "Session introuvable" message visible, link to home |
| Click completed step (navigate back) | Advance store to step 3, click step 1 | Step 1 conversation visible, step indicator highlights step 1 |
| Click locked step (no effect) | At step 2, click step 4 | Nothing changes, step 2 remains current |
| Loading state | Navigate to `/session/{id}` (intercept slow response) | Skeleton or placeholder visible before content loads |

---

## Non-regression

| Check | Why |
|-------|-----|
| Landing page still works | Adding `(app)` route group must not break `(marketing)` group |
| Middleware still runs for session routes | New route `/session/[id]` must not be excluded from Supabase middleware |
| Root layout (fonts, CSS) inherited | Both `(marketing)` and `(app)` layouts must inherit root layout |
| No hydration mismatch warnings | `useMediaQuery` must handle SSR → client transition without warnings |

---

## Traceability -- Gherkin to automated test

| Gherkin scenario | US | Test type | Test path | Status |
|------------------|-----|-----------|-----------|--------|
| SC-WS-1 -- Split-view renders on desktop | US-WS-1 | E2E | `e2e/wizard-shell.spec.ts` | Planned |
| SC-WS-2 -- Step indicator on session start | US-WS-2 | E2E + Unit | `e2e/wizard-shell.spec.ts`, `step-indicator.test.tsx` | Planned |
| SC-WS-3 -- Step indicator updates on completion | US-WS-2 | Unit | `step-indicator.test.tsx`, `wizard-store.test.ts` | Planned |
| SC-WS-4 -- Navigate back to completed step | US-WS-3 | E2E + Unit | `e2e/wizard-shell.spec.ts`, `wizard-store.test.ts` | Planned |
| SC-WS-5 -- Cannot navigate forward to incomplete step | US-WS-3 | E2E + Unit | `e2e/wizard-shell.spec.ts`, `wizard-store.test.ts` | Planned |
| SC-WS-6 -- Panels scroll independently | US-WS-4 | E2E | `e2e/wizard-shell.spec.ts` | Planned |
| SC-WS-7 -- Panels collapse on tablet | US-WS-5 | E2E | `e2e/wizard-shell.spec.ts` | Planned |
| SC-WS-8 -- Switch between panels on tablet | US-WS-5 | E2E + Unit | `e2e/wizard-shell.spec.ts`, `wizard-shell.test.tsx` | Planned |
| SC-WS-9 -- Loading state | US-WS-1 | E2E | `e2e/wizard-shell.spec.ts` | Planned |
| SC-WS-10 -- Invalid session ID | US-WS-1 | E2E | `e2e/wizard-shell.spec.ts` | Planned |

---

## Coverage expectations

| Layer | Target |
|-------|--------|
| Zustand store (`wizard-store.ts`) | 100% branch coverage (all actions and edge cases) |
| StepIndicator component | All 3 states (completed, current, locked) + click interactions |
| useMediaQuery hook | SSR safety + change events |
| WizardShell component | Desktop vs mobile render paths |
| E2E wizard flow | Happy path + responsive + 404 + step navigation |

---

## How to run

```bash
# Unit tests (Vitest)
npx vitest run src/stores/__tests__/wizard-store.test.ts
npx vitest run src/components/wizard/__tests__/step-indicator.test.tsx
npx vitest run src/hooks/__tests__/use-media-query.test.ts
npx vitest run src/components/wizard/__tests__/wizard-shell.test.tsx

# All unit tests
npx vitest run

# E2E tests (Playwright) -- requires dev server + Supabase running
npx playwright test e2e/wizard-shell.spec.ts

# E2E with UI (headed mode for debugging)
npx playwright test e2e/wizard-shell.spec.ts --headed
```
