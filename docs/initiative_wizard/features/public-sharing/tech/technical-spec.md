# Technical Specification — Public Sharing

> Overview and index of the technical documentation for the Public Sharing feature.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27
**Feature:** [`../README.md`](../README.md) · **PRD:** [`../../../prd.md`](../../../prd.md)

---

## Spec files (index)

| File | Concern | Required when |
|------|---------|---------------|
| `technical-spec.md` (this file) | Overview, approach, architecture at a glance | Always |
| [`api.md`](api.md) | `/p/[slug]` page, `generateMetadata`, `togglePublic` Server Action | There's an API/interface |
| [`security.md`](security.md) | Slug security, RLS for public access, enumeration prevention | There's sensitive data or access control |
| [`release-plan.md`](release-plan.md) | Atomic commits, branching, dependencies, rollback | Always |
| [`test-plan.md`](test-plan.md) | Unit / integration / E2E tests mapped to 12 Gherkin scenarios | Always |

---

## 1. Summary & approach

Public Sharing lets PMs share their completed PRD with anyone via a public URL at
`enhanced.pm/p/[slug]`. The public page is a Next.js Server Component that renders the full
PRD in read-only mode. OG meta tags via `generateMetadata()` enable rich social previews. A
toggle in the PRD panel header lets the PM control visibility. The slug is generated via
nanoid (10 chars, URL-safe) and persisted on the `prds` table.

Two decisions shape everything:

1. **Server Component for the public page.** The `/p/[slug]` page is a pure Server Component
   (no client-side JavaScript needed for rendering). This ensures OG meta tags are in the
   initial HTML response (required for social preview unfurling), keeps the page fast, and
   avoids exposing the Zustand store or useChat logic to unauthenticated visitors.

2. **Slug preserved on toggle-off.** When the PM makes a PRD private, `is_public` is set to
   `false` but `share_slug` is NOT deleted. Re-enabling public access restores the same URL.
   This prevents link rot and avoids confusing the PM with a new URL every time they toggle.

---

## 2. Architecture at a glance

### Components touched / added

```
src/
├── app/
│   ├── p/
│   │   └── [slug]/
│   │       └── page.tsx              # Public PRD page (Server Component)
│   └── actions/
│       └── sharing.ts                # togglePublic + getShareUrl Server Actions
├── components/
│   └── prd/
│       ├── prd-viewer.tsx            # Reused with readOnly=true
│       ├── share-toggle.tsx          # Switch + copy-to-clipboard UI
│       └── public-footer.tsx         # "Made with Enhanced" badge
└── lib/
    └── prd/
        └── sharing.ts                # getPrdBySlug query, slug generation
```

### Data flow

```
PM toggles "Make public" in PRD panel
  │
  ▼
togglePublic Server Action:
  ├── Authenticate user (must own the PRD)
  ├── If making public and no slug: generate slug via nanoid(10)
  ├── UPDATE prds SET is_public = !current, share_slug = slug
  └── Return { isPublic, shareUrl }
  │
  ▼
Client shows toggle ON + copy-to-clipboard URL

---

Stakeholder visits enhanced.pm/p/[slug]
  │
  ▼
/p/[slug] Server Component:
  ├── generateMetadata(): query prds by slug, build OG tags
  ├── Query prds WHERE share_slug = slug AND is_public = true (RLS)
  │     ├── Found → load prd_blocks, render PrdViewer(readOnly=true)
  │     └── Not found → notFound() (Next.js 404)
  └── Footer: "Made with Enhanced — enhanced.pm"
```

### Key decisions & trade-offs

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Page type | Server Component | Client Component | OG meta tags require server-rendered HTML; no client state needed |
| Slug generator | nanoid(10) | UUID, sequential ID, custom slugs | Short, URL-safe, collision-resistant (10^17 combinations), unguessable |
| Slug on toggle-off | Preserved (is_public=false, slug kept) | Deleted on toggle-off | Prevents link rot; same URL on re-enable; simpler mental model for PM |
| Public page layout | Reuse PrdViewer with readOnly prop | Separate public-only component | DRY; ensures visual consistency between wizard and public page |
| Auth on public page | None required | Supabase anon session | Public pages must work for anyone with the link; RLS handles access control |

---

## 3. Detailed specs

- **API / interfaces:** `/p/[slug]` Server Component with `generateMetadata`, `togglePublic`
  Server Action, `getShareUrl` helper. See [`api.md`](api.md).
- **Security & privacy:** Slug security, RLS for public access, enumeration prevention,
  immediate revocation. See [`security.md`](security.md).

---

## 4. Non-functional requirements

### Performance

- **Public page load time:** The `/p/[slug]` page must render within 500ms (server-side). It
  is a single DB query (prds + blocks) with no AI calls.
- **OG meta tags:** Must be present in the initial HTML response (no client-side rendering
  delay). Social preview unfurlers do not execute JavaScript.
- **Toggle latency:** The `togglePublic` Server Action must complete within 200ms (single DB
  update).

### Observability

| Event | Properties | Purpose |
|-------|-----------|---------|
| `prd_shared_publicly` | `session_id`, `prd_id`, `slug` | KR3 (3+ PRDs shared publicly) |
| `prd_unshared` | `session_id`, `prd_id` | Track toggle-off behavior |
| `public_prd_viewed` | `slug`, `referrer` | Organic distribution analytics |
| `share_link_copied` | `session_id`, `prd_id` | Share funnel |

### SEO / Social

- OG tags: `og:title`, `og:description`, `og:site_name`, `og:type`
- Description truncated to 160 chars from executive_summary block
- No evidence tag badge text in OG description (raw text only)

---

## 5. Delivery & testing

- **How it ships:** see [`release-plan.md`](release-plan.md) (7 atomic commits).
- **How it's tested:** see [`test-plan.md`](test-plan.md) (unit + integration + E2E, mapped to
  12 Gherkin scenarios) and [`../product/manual-tests.md`](../product/manual-tests.md).

---

## 6. Open questions

- **OG image:** Should we generate a dynamic OG image (e.g., via Vercel OG / `@vercel/og`)
  showing the PRD title and confidence score? This would improve social previews significantly
  but adds complexity. Tentatively deferred to post-V1. `[To verify]`
- **Public page caching:** ~~Should `/p/[slug]` be statically generated (ISR) or always
  server-rendered?~~ **RESOLVED:** `export const dynamic = 'force-dynamic'` is **required** on `/p/[slug]/page.tsx`. Without it, Next.js may cache the page, which would serve stale content after a PM toggles their PRD to private. Immediate revocation depends on this setting.
- **Custom slugs:** Should PMs be able to choose their own slug? Deferred to post-V1.
  `[To verify]`
