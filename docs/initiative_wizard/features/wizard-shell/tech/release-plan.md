# Release Plan -- Wizard Shell

**Status:** Draft -- **Author:** Hugo -- **Date:** 2026-05-27

---

## Branching

- **Source branch:** `staging`
- **Feature branch:** `feat/wizard-shell`
- **Merge target:** `staging` (via PR, squash merge)
- **Naming convention:** All commits prefixed with `feat(wizard):` or `chore(wizard):`

---

## Atomic commits

| # | Commit | Scope | Tests | Depends on |
|---|--------|-------|-------|------------|
| 1 | `feat(wizard): add (app) route group + layout` | `src/app/(app)/layout.tsx` | None (structural) | -- |
| 2 | `feat(wizard): add session/[id] page + not-found` | `src/app/(app)/session/[id]/page.tsx`, `not-found.tsx` | Unit: session loading, 404 on missing | Supabase migration |
| 3 | `feat(wizard): add session types` | `src/lib/types/session.ts` | None (type definitions) | -- |
| 4 | `feat(wizard): add useMediaQuery hook` | `src/hooks/use-media-query.ts` | Unit: returns boolean, no SSR mismatch | -- |
| 5 | `feat(wizard): add wizard-store Zustand store` | `src/stores/wizard-store.ts` | Unit: initialize, advanceStep, goToStep, setActivePanel | -- |
| 6 | `feat(wizard): add step-indicator component` | `src/components/wizard/step-indicator.tsx` | Unit: renders 4 steps, highlights current, disables future, click completed | #5 |
| 7 | `feat(wizard): add conversation-panel + prd-panel containers` | `src/components/wizard/conversation-panel.tsx`, `prd-panel.tsx` | None (empty shells) | -- |
| 8 | `feat(wizard): add wizard-shell layout with grid + responsive tabs` | `src/components/wizard/wizard-shell.tsx` | Unit: renders grid on desktop, tabs on mobile | #4, #5, #6, #7 |
| 9 | `feat(wizard): add wizard-client wrapper + store hydration` | `src/app/(app)/session/[id]/wizard-client.tsx` | Unit: initializes store from session props | #5, #8 |
| 10 | `feat(wizard): add PostHog step tracking` | `src/stores/wizard-store.ts` | Manual: verify event in PostHog | #5 |

**Notes:**
- Commits 3, 4, 5 are independent and can be authored in parallel.
- Commit 2 requires the Supabase `sessions` table migration to be available (same dependency as landing-page).

---

## Prerequisites / external dependencies

| Dependency | Status | Blocks |
|------------|--------|--------|
| Supabase migration for `sessions` + `prds` tables | Not created | Commit #2 (page loads session from DB) |
| `landing-page` feature merged (creates sessions to navigate to) | In progress | Full E2E flow |
| shadcn `Tabs` component installed | Need to check | Commit #8 (`npx shadcn@latest add tabs`) |
| PostHog provider in root layout | Not configured | Commit #10 |

---

## Release sequencing

1. **Pre-flight:**
   - Ensure Supabase migration is applied locally.
   - Install shadcn Tabs component if not present: `npx shadcn@latest add tabs`.
2. **Feature branch development:** Commits 1-10 on `feat/wizard-shell`.
3. **PR to staging:** Squash merge after review.
4. **Staging validation:**
   - Create a session via landing page (or directly in DB).
   - Navigate to `/session/[id]` -- verify split-view renders.
   - Resize viewport to < 1024px -- verify tabs appear.
   - Navigate to `/session/invalid-id` -- verify 404 page.
5. **Integration note:** The wizard-shell renders empty containers until `conversation-engine` and `prd-live-builder` are implemented. This is expected and acceptable.

---

## Rollback

| Scenario | Action |
|----------|--------|
| Shell renders but panels are empty | Expected until conversation-engine and prd-live-builder are deployed. Not a rollback trigger. |
| Step indicator doesn't render | Check Zustand store initialization in wizard-client.tsx. Verify session data is passed correctly. |
| Mobile tabs don't switch | Verify shadcn Tabs component is installed. Check useMediaQuery hook. |
| Full rollback needed | Revert the merge commit on `staging`. `/session/[id]` will 404 (acceptable since landing-page redirect targets it). |

---

## Definition of Done checklist

- [ ] `src/app/(app)/layout.tsx` exists and renders full-height container
- [ ] `src/app/(app)/session/[id]/page.tsx` loads session from Supabase, validates access, returns 404 on missing
- [ ] `src/app/(app)/session/[id]/not-found.tsx` shows user-friendly message + link to home
- [ ] `src/app/(app)/session/[id]/wizard-client.tsx` initializes Zustand store from server data
- [ ] `src/components/wizard/wizard-shell.tsx` renders grid on desktop, tabs on mobile
- [ ] `src/components/wizard/step-indicator.tsx` shows 4 steps with correct states
- [ ] `src/components/wizard/conversation-panel.tsx` renders as scrollable container
- [ ] `src/components/wizard/prd-panel.tsx` renders as scrollable container
- [ ] `src/stores/wizard-store.ts` supports initialize, advanceStep, goToStep, setActivePanel
- [ ] `src/hooks/use-media-query.ts` works without SSR hydration mismatch
- [ ] `src/lib/types/session.ts` exports Session and Prd types
- [ ] Unit: StepIndicator renders 4 steps, correct states
- [ ] Unit: Zustand store step transitions (advance, go back, locked)
- [ ] E2E: split-view renders on 1024px+ viewport
- [ ] E2E: tabs render on < 1024px viewport
- [ ] E2E: invalid session ID shows not-found page
- [ ] PostHog `wizard_step_changed` event fires on step navigation
- [ ] `.ai-context/` updated with new routes and components
