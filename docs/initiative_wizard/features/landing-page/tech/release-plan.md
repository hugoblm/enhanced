# Release Plan -- Landing Page

**Status:** Draft -- **Author:** Hugo -- **Date:** 2026-05-27

---

## Branching

- **Source branch:** `staging`
- **Feature branch:** `feat/landing-page`
- **Merge target:** `staging` (via PR, squash merge)
- **Naming convention:** All commits prefixed with `feat(landing):` or `chore(landing):`

---

## Atomic commits

| # | Commit | Scope | Tests | Depends on |
|---|--------|-------|-------|------------|
| 1 | `feat(landing): add (marketing) route group + layout` | `src/app/(marketing)/layout.tsx` | None (structural) | -- |
| 2 | `feat(landing): add landing page Server Component` | `src/app/(marketing)/page.tsx` | None (static content) | #1 |
| 3 | `feat(landing): add pitch-form Client Component` | `src/components/landing/pitch-form.tsx` | Unit: form renders, error display, loading state | #1 |
| 4 | `feat(landing): add rawIdea Zod schema` | `src/lib/schemas/session.ts` | Unit: min length, max length, trim, empty string | -- |
| 5 | `feat(landing): add createSession Server Action` | `src/app/actions/session.ts` | Unit: validation, mock Supabase calls, error handling | #4 |
| 6 | `feat(landing): wire form submission to session creation + redirect` | `pitch-form.tsx`, `page.tsx` | E2E: full flow (type -> submit -> redirect) | #3, #5 |
| 7 | `feat(landing): add PostHog event tracking` | `pitch-form.tsx` | Manual: verify event in PostHog dashboard | #6 |
| 8 | `feat(landing): responsive styles + visual polish` | `page.tsx`, `pitch-form.tsx`, `layout.tsx` | Manual: tablet viewport check | #6 |
| 9 | `chore(landing): remove old placeholder page` | Remove `src/app/page.tsx` | E2E: root `/` still renders | #2 |

**Notes:**
- Commits 1 and 4 are independent and can be authored in either order.
- Commit 9 (removing the old placeholder) is last to avoid breaking the root route during development.

---

## Prerequisites / external dependencies

| Dependency | Status | Blocks |
|------------|--------|--------|
| Supabase migration for `sessions` + `prds` tables | Not created | Commit #5 (createSession needs the tables) |
| PostHog provider in root layout | Not configured | Commit #7 (tracking event) |
| Supabase RLS policies on `sessions` and `prds` | Not created | Commit #5 (inserts must pass RLS) |

If the Supabase migration is not yet available, commits 1-4 can proceed. Commit 5 requires the DB schema. During development, use Supabase local (`npx supabase start`) with the migration applied locally.

---

## Release sequencing

1. **Pre-flight:** Ensure Supabase migration for `sessions` and `prds` tables is applied to local and staging environments.
2. **Feature branch development:** Commits 1-9 on `feat/landing-page`.
3. **PR to staging:** Squash merge after review. Verify staging deployment.
4. **Staging validation:** Run the E2E test suite against staging. Manual smoke test: type idea -> submit -> check redirect + DB row.
5. **Merge to main:** Only after wizard-shell is also on staging (landing redirects to `/session/[id]` which must exist).

---

## Rollback

| Scenario | Action |
|----------|--------|
| Landing page renders but createSession fails | Check Supabase connectivity + RLS policies. The action returns a user-facing error; no data corruption. |
| Redirect loops or 404 on `/session/[id]` | `/session/[id]` does not exist until `wizard-shell` is deployed. During landing-page-only development, the redirect will 404 -- this is expected and acceptable. |
| Full rollback needed | Revert the merge commit on `staging`. The old placeholder page is removed in commit #9; if reverted, it returns. |

---

## Definition of Done checklist

- [ ] `src/app/(marketing)/layout.tsx` exists and renders without app chrome
- [ ] `src/app/(marketing)/page.tsx` renders value proposition + pitch form
- [ ] `src/components/landing/pitch-form.tsx` handles textarea, validation, loading, errors
- [ ] `src/lib/schemas/session.ts` exports `rawIdeaSchema` with min 20 / max 5000 / trim
- [ ] `src/app/actions/session.ts` creates session + PRD + sets cookie + redirects
- [ ] Zod validation unit tests pass (min length, empty, whitespace, max length)
- [ ] E2E: valid submission creates DB rows and redirects
- [ ] E2E: empty submission shows error, no DB row created
- [ ] E2E: short submission (< 20 chars) shows error with minimum length message
- [ ] Responsive: textarea + CTA visible at 768px without horizontal scroll
- [ ] Touch target: CTA button >= 44x44px
- [ ] PostHog `landing_pitch_submitted` event fires on successful submission
- [ ] Old `src/app/page.tsx` removed; root `/` route still works
- [ ] `.ai-context/` updated if routes or data flows changed
