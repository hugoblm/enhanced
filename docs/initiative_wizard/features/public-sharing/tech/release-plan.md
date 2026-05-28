# Release Plan — Public Sharing

> How Public Sharing gets built and shipped: atomic commits, sequenced by dependency.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27
**PRD:** [`../../../prd.md`](../../../prd.md) · **Technical spec:** [`technical-spec.md`](technical-spec.md) · **Test plan:** [`test-plan.md`](test-plan.md)

---

## Branching

- Branch from `staging`: `feat/public-sharing`
- Open a PR into `staging`; merge to `main` is a separate release step.
- Plan for 7 atomic commits.

## Dependencies

| Dependency | Feature | What's needed | Status |
|-----------|---------|--------------|--------|
| `prds` table | deferred-auth | Table with `share_slug`, `is_public` columns | Planned |
| `prd_blocks` table | prd-live-builder | Table must exist to load blocks for the public page | Planned |
| PrdBlock component | prd-live-builder | Reused for rendering blocks on the public page | Planned |
| evidence-tag component | prd-live-builder | Reused for rendering tags on the public page | Planned |
| block-types constants | prd-live-builder | BLOCK_TYPES, BLOCK_HEADINGS for sort order and headings | Planned |
| `nanoid` | (new dependency) | Must be installed for slug generation | Not installed |

**Strategy:** Public sharing can be built after the prd-live-builder components exist, since
it reuses them. The `/p/[slug]` page and Server Actions are independent of the conversation
engine and can be developed in parallel.

---

## Commit / PR breakdown

| # | Commit title | Scope (one logical change) | Tests added | Depends on |
|---|-------------|----------------------------|-------------|------------|
| 1 | Add getPrdBySlug query + sharing utilities | `src/lib/prd/sharing.ts` — getPrdBySlug function, stripEvidenceTags helper. Install `nanoid`. | Unit: getPrdBySlug returns null for missing/private slugs. Unit: stripEvidenceTags removes tag text. | prds + prd_blocks tables |
| 2 | Add /p/[slug] Server Component with generateMetadata | `src/app/p/[slug]/page.tsx` — generateMetadata for OG tags, page render with PrdViewerServer, dynamic rendering. | Unit: generateMetadata returns correct OG tags. Integration: page returns 200 for public PRD. | 1, PrdBlock component |
| 3 | Add PrdViewerServer (read-only server component) | `src/components/prd/prd-viewer-server.tsx` — server-compatible PrdViewer that takes blocks as props (no Zustand). | Unit: renders all filled blocks in sort order. Unit: skips empty blocks. | block-types constants, PrdBlock |
| 4 | Add 404 page for invalid/private slugs | `src/app/p/[slug]/not-found.tsx` — branded 404 with generic message. | Integration: /p/nonexistent returns 404 page. Integration: /p/private-slug returns same 404. | 2 |
| 5 | Add togglePublic Server Action + nanoid slug generation | `src/app/actions/sharing.ts` — togglePublic (auth, slug generation, DB update, PostHog event) + getShareUrl. | Integration: toggle creates slug on first enable. Integration: toggle preserves slug on re-enable. Integration: auth required. | 1 |
| 6 | Add share toggle UI in PRD panel header | `src/components/prd/share-toggle.tsx` — Switch component, copy-to-clipboard, URL display. Wire into prd-header.tsx. | Unit: switch toggles state. Unit: copy button copies URL. Unit: URL hidden when private. | 5 |
| 7 | Add public page footer + PostHog tracking | `src/components/prd/public-footer.tsx` — "Made with Enhanced" footer. Add `public_prd_viewed` PostHog event. Add `NEXT_PUBLIC_APP_URL` to env. | Unit: footer renders with link. E2E: full toggle -> copy -> open in incognito flow. | 2, 6 |

---

## Release sequencing

- **Feature flag:** None — the `/p/[slug]` route only resolves when a slug exists and
  `is_public = true`. No risk of exposing unfinished UI.
- **Migrations:** None specific to this feature. The `prds` table's `share_slug` and
  `is_public` columns are created by the deferred-auth migration. The RLS policy
  `prds_select_public` is also created there.
- **Order of deploy:**
  1. Ensure deferred-auth and prd-live-builder migrations are applied
  2. Deploy feat/public-sharing to staging (Vercel preview)
  3. Verify: toggle public -> URL generated -> open in incognito -> PRD visible
  4. Verify: toggle off -> URL returns 404
  5. Verify: OG meta tags in page source
  6. Merge to `staging`
- **Staging -> production:** All 12 Gherkin scenarios must pass. Manual smoke test of the
  full toggle -> share -> view -> revoke flow.

---

## Rollback

- **Trigger:** Public page leaks private PRD data, OG tags not rendering, or toggle causes
  data corruption.
- **How:** Revert the `feat/public-sharing` merge commit. The `/p/[slug]` route and share
  toggle disappear. PRDs remain in the database with their `share_slug` and `is_public` values
  intact. No data loss.
- **Data safety:** Reverting the UI does not change any data. Slugs and public flags persist
  in the database but are inaccessible without the route. On redeployment, the same slugs
  work again.

**Critical rollback scenario:** If the public page is exposing private PRDs due to a RLS bug:

1. Immediately set `is_public = false` on all PRDs via Supabase dashboard SQL:
   ```sql
   UPDATE public.prds SET is_public = false;
   ```
2. Revert the deployment
3. Investigate and fix the RLS policy
4. Redeploy with the fix

---

## Definition of Done (merge checklist)

- [ ] `/p/[slug]` renders public PRD in read-only mode (all 12 block types)
- [ ] `generateMetadata` produces correct OG tags (title, description, type, site_name)
- [ ] OG description strips evidence tag text and truncates to 160 chars
- [ ] 404 page shown for non-existent and private slugs (identical response)
- [ ] `togglePublic` generates nanoid slug on first enable
- [ ] `togglePublic` preserves slug on re-enable (no new slug)
- [ ] Toggle off makes public page return 404 immediately
- [ ] Share toggle UI shows switch + URL + copy button
- [ ] Copy-to-clipboard works with visual confirmation
- [ ] "Made with Enhanced" footer visible on public page with link to homepage
- [ ] Evidence tags render correctly on public page (same as wizard)
- [ ] Confidence score and recommendation displayed on public page
- [ ] `NEXT_PUBLIC_APP_URL` environment variable configured
- [ ] PostHog events fire: `prd_shared_publicly`, `prd_unshared`, `public_prd_viewed`
- [ ] Unit + integration + E2E tests pass (see [`test-plan.md`](test-plan.md))
- [ ] 12 Gherkin scenarios covered
- [ ] Manual smoke pass done (see [`../product/manual-tests.md`](../product/manual-tests.md))
- [ ] `.ai-context/` updated with public sharing documentation
- [ ] Feature README status updated from `Planned` to `Implemented`
