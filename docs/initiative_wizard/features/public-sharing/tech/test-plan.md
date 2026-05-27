# Test Plan (Automated) — Public Sharing

> Automated test strategy mapped to the 12 Gherkin scenarios in
> [`../product/gherkin-tests.md`](../product/gherkin-tests.md).

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27
**Tooling:** Vitest (unit + integration), Playwright (E2E)

---

## Test types

| Type | Mandatory? | What it covers here |
|------|-----------|---------------------|
| **Unit** | Yes | Slug generation, OG tag generation, tag stripping, component rendering |
| **Non-regression** | Yes | Authenticated PRD view unaffected, wizard flow unaffected |
| **Integration** | Yes | togglePublic DB operations, RLS policies, /p/[slug] responses |
| **End-to-end** | Yes | Full toggle -> copy -> view in incognito -> revoke flow |
| **Security** | Yes | RLS enforcement for public vs. private access |

---

## How to run

```bash
# Unit + integration tests
npx vitest run

# E2E tests
npx playwright test

# Coverage
npx vitest run --coverage
```

---

## Non-regression -- what must not break

| Existing behavior | Risk from this change | Protection |
|-------------------|----------------------|------------|
| Authenticated PRD view (wizard panel) | New readOnly prop on PrdViewer | Unit: PrdViewer without readOnly renders normally |
| Auth flow (magic link) | New Server Action `togglePublic` | E2E: auth flow unaffected |
| Wizard conversation | New /p/ route | E2E: /session/[id] route unaffected |
| Landing page | New route | E2E: landing page loads |
| PRD panel refine buttons | readOnly prop hides them | Unit: refine buttons visible when readOnly=false |

---

## Unit tests

### Slug generation

| Test | File | Description |
|------|------|-------------|
| `sharing.test.ts` | `__tests__/lib/prd/sharing.test.ts` | nanoid(10) generates a 10-character string |
| | | Generated slug contains only URL-safe characters (A-Z, a-z, 0-9, _, -) |
| | | Two consecutive calls produce different slugs |

### generateMetadata

| Test | File | Description |
|------|------|-------------|
| `page-metadata.test.ts` | `__tests__/app/p/page-metadata.test.ts` | Returns correct og:title from PRD title |
| | | Returns og:description from executive_summary block (truncated to 160 chars) |
| | | Returns og:site_name = "Enhanced" |
| | | Returns og:type = "article" |
| | | Returns fallback description when no executive_summary block |
| | | Returns "Not Found" title when PRD does not exist |

### stripEvidenceTags

| Test | File | Description |
|------|------|-------------|
| `sharing.test.ts` | `__tests__/lib/prd/sharing.test.ts` | Removes [Evidence] from text |
| | | Removes [Assumption] from text |
| | | Removes [To verify] from text |
| | | Handles case-insensitive matches |
| | | Collapses multiple spaces after removal |
| | | Returns empty string for empty input |
| | | Handles text with no tags (returns unchanged) |

### PrdViewerServer component

| Test | File | Description |
|------|------|-------------|
| `prd-viewer-server.test.tsx` | `__tests__/components/prd/prd-viewer-server.test.tsx` | Renders all filled blocks in sort order |
| | | Skips blocks with empty content |
| | | Does not render placeholders (only filled blocks) |
| | | Renders evidence tags on blocks |
| | | Passes readOnly=true to all PrdBlock components |

### ShareToggle component

| Test | File | Description |
|------|------|-------------|
| `share-toggle.test.tsx` | `__tests__/components/prd/share-toggle.test.tsx` | Renders switch in OFF position by default |
| | | Toggle calls togglePublic Server Action |
| | | Shows URL and copy button when public |
| | | Hides URL when private |
| | | Copy button copies URL to clipboard |
| | | Shows "Copie !" confirmation after copy |
| | | Confirmation disappears after 3 seconds |
| | | Switch disabled during pending state |

### PublicFooter component

| Test | File | Description |
|------|------|-------------|
| `public-footer.test.tsx` | `__tests__/components/prd/public-footer.test.tsx` | Renders "Made with Enhanced" text |
| | | Contains link to homepage |

### 404 page

| Test | File | Description |
|------|------|-------------|
| `not-found.test.tsx` | `__tests__/app/p/not-found.test.tsx` | Renders 404 heading |
| | | Shows generic message (no slug-specific info) |
| | | Contains link back to homepage |

---

## Integration tests

| Test | File | Gherkin | Description |
|------|------|---------|-------------|
| `toggle-public.test.ts` | `__tests__/actions/sharing.test.ts` | SC-PS-1 | togglePublic creates nanoid slug on first enable |
| | | SC-PS-1 | togglePublic sets is_public = true in DB |
| | | SC-PS-3 | togglePublic re-uses existing slug on re-enable |
| | | -- | togglePublic requires authentication |
| | | -- | togglePublic rejects non-owner |
| | | -- | togglePublic returns shareUrl when public |
| `public-page-response.test.ts` | `__tests__/app/p/public-page.test.ts` | SC-PS-6 | /p/[slug] returns 200 for public PRD |
| | | SC-PS-9 | /p/nonexistent returns 404 |
| | | SC-PS-10 | /p/private-slug returns 404 (same as nonexistent) |
| | | SC-PS-4 | Response includes correct OG meta tags in HTML |
| `rls-public-access.test.ts` | `__tests__/db/rls-public-access.test.ts` | SC-PS-12 | Unauthenticated client can read public PRD |
| | | SC-PS-12 | Unauthenticated client cannot read private PRD |
| | | SC-PS-12 | Unauthenticated client gets zero rows querying all PRDs |
| | | -- | Public PRD blocks accessible without auth |
| | | -- | Private PRD blocks not accessible without auth |

---

## End-to-end tests (Playwright)

| Test | File | Gherkin | Description |
|------|------|---------|-------------|
| `toggle-and-share.spec.ts` | `e2e/sharing/toggle-and-share.spec.ts` | SC-PS-1 | Toggle public -> slug generated -> URL displayed |
| | | SC-PS-2 | Copy link -> URL in clipboard |
| | | SC-PS-3 | Toggle off -> toggle on -> same slug reused |
| `public-page-view.spec.ts` | `e2e/sharing/public-page-view.spec.ts` | SC-PS-6 | Open public URL in incognito -> full PRD visible |
| | | SC-PS-7 | Evidence tags display correctly on public page |
| | | SC-PS-8 | Read-only: no refine buttons, no wizard elements |
| | | SC-PS-8 | Confidence score and recommendation visible |
| `og-tags.spec.ts` | `e2e/sharing/og-tags.spec.ts` | SC-PS-4 | OG meta tags present in page source |
| | | SC-PS-5 | (Manual verification: paste URL in Slack simulator) |
| `revocation.spec.ts` | `e2e/sharing/revocation.spec.ts` | SC-PS-11 | Toggle off -> refresh public page -> 404 |
| `four-oh-four.spec.ts` | `e2e/sharing/four-oh-four.spec.ts` | SC-PS-9 | Non-existent slug -> 404 page with generic message |
| | | SC-PS-10 | Private PRD slug -> same 404 page (no info leak) |

---

## Security tests

| Test | File | Gherkin | Description |
|------|------|---------|-------------|
| `rls-enforcement.spec.ts` | `e2e/sharing/rls-enforcement.spec.ts` | SC-PS-12 | Direct Supabase query without auth: public PRD returns data |
| | | SC-PS-12 | Direct Supabase query without auth: private PRD returns empty |
| | | SC-PS-12 | Direct Supabase query without auth: listing all PRDs returns empty |
| `no-info-leak.spec.ts` | `e2e/sharing/no-info-leak.spec.ts` | SC-PS-10 | 404 response for private slug identical to non-existent slug |
| | | -- | Response time for private slug similar to non-existent slug |

---

## Traceability -- Gherkin scenario -> automated test

| Gherkin | US | Test type | Automated test | Status |
|---------|-----|-----------|---------------|--------|
| SC-PS-1 | US-PS-1 | Integration + E2E | toggle-public.test.ts, toggle-and-share.spec.ts | To write |
| SC-PS-2 | US-PS-1 | Unit + E2E | share-toggle.test.tsx, toggle-and-share.spec.ts | To write |
| SC-PS-3 | US-PS-1 | Integration + E2E | toggle-public.test.ts, toggle-and-share.spec.ts | To write |
| SC-PS-4 | US-PS-2 | Unit + Integration + E2E | page-metadata.test.ts, public-page-response.test.ts, og-tags.spec.ts | To write |
| SC-PS-5 | US-PS-2 | E2E (manual) | og-tags.spec.ts (partial) | To write |
| SC-PS-6 | US-PS-3 | Integration + E2E | public-page-response.test.ts, public-page-view.spec.ts | To write |
| SC-PS-7 | US-PS-3 | E2E | public-page-view.spec.ts | To write |
| SC-PS-8 | US-PS-3 | E2E | public-page-view.spec.ts | To write |
| SC-PS-9 | US-PS-4 | Integration + E2E | public-page-response.test.ts, four-oh-four.spec.ts | To write |
| SC-PS-10 | US-PS-4 | Integration + E2E + Security | public-page-response.test.ts, four-oh-four.spec.ts, no-info-leak.spec.ts | To write |
| SC-PS-11 | US-PS-4 | E2E | revocation.spec.ts | To write |
| SC-PS-12 | -- | Integration + Security | rls-public-access.test.ts, rls-enforcement.spec.ts | To write |

---

## Coverage expectations

- **Critical paths:** 100% coverage for slug generation, togglePublic logic, getPrdBySlug
  query, OG tag generation, and evidence tag stripping.
- **Security:** All RLS scenarios covered (public read, private blocked, unauthenticated
  listing blocked). Identical 404 for private and non-existent slugs.
- **Components:** ShareToggle tested for all states (off, on, pending, copied). PrdViewerServer
  tested for block rendering and sort order.
- **E2E:** At minimum, the full toggle -> view in incognito -> revoke flow must pass before
  merge. OG tag verification must pass (check page source).
