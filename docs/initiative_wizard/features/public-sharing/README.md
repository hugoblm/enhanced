# Public Sharing

> One-screen overview.

**Status:** `Planned`
**Owner:** Hugo · **Last updated:** 2026-05-27
**Part of initiative:** [`../../README.md`](../../README.md) · **PRD:** [`../../prd.md`](../../prd.md)

## In one paragraph

Public Sharing lets PMs share their completed PRD with anyone via a public URL (`enhanced.pm/p/[slug]`). A "Make public" toggle in the PRD panel generates a nanoid slug (10 chars, URL-safe) and stores it on `prds.share_slug`. The public page is a Next.js Server Component at `src/app/p/[slug]/page.tsx` -- SSR-rendered for OG meta tag support, with `generateMetadata()` pulling the PRD title and executive_summary block for social previews. The page renders the full PRD read-only (same visual as the wizard, without refine buttons), with evidence tags visible and the confidence score + recommendation displayed prominently. No account is required to view. A "Made with Enhanced" footer badge provides organic branding. Invalid or non-public slugs return a 404. RLS enforces public access: `SELECT` is allowed when `is_public = true AND share_slug IS NOT NULL`. The toggle can be reversed (making the PRD private again), which immediately makes the public page return 404. `[Evidence]` -- public sharing solves two validated needs: it enables stakeholder review without onboarding friction (PRD Problem 1), and it creates organic distribution where each shared PRD is a product demo (PRD section 3).

## Documents in this folder

| Doc | What's inside |
|-----|---------------|
| [`product/user-stories-and-jtbd.md`](product/user-stories-and-jtbd.md) | JTBD + 4 user stories with acceptance criteria |
| [`product/gherkin-tests.md`](product/gherkin-tests.md) | 12 acceptance scenarios in Given/When/Then |
| [`product/manual-tests.md`](product/manual-tests.md) | 8 human-run test cases + smoke checklist |
| [`product/ux-accessibility.md`](product/ux-accessibility.md) | UX flows + WCAG 2.1 AA requirements |
| [`tech/technical-spec.md`](tech/technical-spec.md) | Overview, architecture, Server Component approach, slug preservation |
| [`tech/api.md`](tech/api.md) | `/p/[slug]` page, generateMetadata, togglePublic Server Action, share toggle UI |
| [`tech/security.md`](tech/security.md) | Slug entropy, RLS for public access, enumeration prevention, revocation |
| [`tech/release-plan.md`](tech/release-plan.md) | 7 atomic commits, dependencies, rollback strategy |
| [`tech/test-plan.md`](tech/test-plan.md) | Unit + integration + E2E + security tests mapped to 12 Gherkin scenarios |

## Current state / next step

No implementation yet. The `prds` table does not exist. No `share_slug` column, no public page route, no nanoid generation. Next step: add `share_slug` (unique, nullable) and `is_public` (boolean, default false) columns to the `prds` table migration, create the `/p/[slug]` Server Component with `generateMetadata()`, and implement the `togglePublic` Server Action.
