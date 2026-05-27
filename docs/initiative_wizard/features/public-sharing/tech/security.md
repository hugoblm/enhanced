# Security — Public Sharing

> Slug security, RLS for public access, enumeration prevention, and immediate revocation.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Threat model

Public sharing exposes PRD content to anyone with the URL. The security design must ensure:

1. **Only intentionally public PRDs are accessible.** Private PRDs must never be reachable
   via the public route.
2. **Slugs are unguessable.** An attacker cannot enumerate or brute-force slugs to find
   public (or private) PRDs.
3. **Revocation is immediate.** Toggling a PRD private makes the public page return 404
   instantly, with no cache delay.
4. **No information leakage.** The 404 response for private or non-existent slugs must be
   indistinguishable.

---

## Slug security

### Generation

- **Algorithm:** nanoid with 10 characters
- **Alphabet:** URL-safe: `A-Z`, `a-z`, `0-9`, `_`, `-` (64 characters)
- **Entropy:** 10 * log2(64) = 60 bits of entropy
- **Keyspace:** 64^10 = 1.15 x 10^18 possible slugs
- **Collision probability at 10,000 PRDs:** ~4.3 x 10^-11 (negligible)
- **Brute-force resistance:** At 1000 requests/second, exhausting the keyspace would take
  ~36 million years. At V1 scale, rate limiting is not even necessary for slug protection.

### Storage

- Slugs are stored in `prds.share_slug` (unique index, nullable).
- Slugs are generated once on first toggle-to-public and never regenerated.
- Toggling off sets `is_public = false` but preserves the slug for re-enable.

### URL structure

```
https://enhanced.pm/p/{slug}
```

The `/p/` prefix is a namespace that:
- Avoids collision with other routes (`/session/`, `/auth/`, etc.)
- Makes it clear this is a public page
- Enables route-level middleware exclusion if needed

---

## RLS for public access

### prds table policies (relevant to public sharing)

```sql
-- Public PRDs are readable by anyone (including unauthenticated users)
CREATE POLICY "prds_select_public"
  ON public.prds FOR SELECT
  USING (is_public = true);
```

This policy allows any Supabase client (including one using only the anon key, with no
authenticated user) to SELECT rows where `is_public = true`.

**Defense-in-depth:** The application layer (`getPrdBySlug`) also explicitly filters
`is_public = true` in its query. Even if the RLS policy is misconfigured, the application
query would not return private PRDs.

### prd_blocks table policies (relevant to public sharing)

```sql
-- Blocks are readable if their parent PRD is accessible
CREATE POLICY "prd_blocks_select_via_prd"
  ON public.prd_blocks FOR SELECT
  USING (
    prd_id IN (
      SELECT id FROM public.prds
      WHERE auth.uid() = user_id OR is_public = true
    )
  );
```

This allows unauthenticated users to read blocks of public PRDs. The join to `prds` ensures
that blocks of private PRDs are never exposed.

### What unauthenticated users CAN do

- SELECT prds where `is_public = true` (filtered by slug in the application layer)
- SELECT prd_blocks where the parent PRD is public

### What unauthenticated users CANNOT do

- SELECT prds where `is_public = false` (RLS blocks the row)
- SELECT prds without knowing the slug (no listing endpoint)
- INSERT, UPDATE, or DELETE any data
- Access messages, sessions, or profiles

---

## Enumeration prevention

### No listing endpoint

There is no API or page that lists all public PRDs. The only way to access a public PRD is
via its slug in the URL. This means:

- An attacker cannot discover public PRDs by browsing
- Search engines can only index pages they discover via links (organic sharing)

### Identical 404 for private and non-existent slugs

The `/p/[slug]` page returns the same 404 page for:
- Slugs that do not exist in the database
- Slugs that exist but belong to private PRDs (`is_public = false`)

The 404 message is generic: "Ce PRD n'existe pas ou n'est plus public." This prevents an
attacker from determining whether a slug has ever been assigned.

**Implementation:** The `getPrdBySlug` function queries with `is_public = true`. If the PRD
exists but is private, the query returns null (same as a non-existent slug). The page calls
`notFound()` in both cases.

### No timing attack

Both cases (non-existent slug and private slug) execute the same database query:

```sql
SELECT * FROM prds WHERE share_slug = $1 AND is_public = true LIMIT 1
```

The query returns 0 rows in both cases (the first because the row does not exist, the second
because `is_public = false` is filtered by RLS). The response time is indistinguishable.

---

## Immediate revocation

When a PM toggles a PRD from public to private:

1. `togglePublic` Server Action sets `prds.is_public = false`
2. `revalidatePath('/p/${slug}')` invalidates any Next.js cache for the page
3. The next request to `/p/[slug]` executes a fresh DB query
4. The query returns null (RLS blocks `is_public = false`)
5. The page returns 404

**No ISR/SSG:** The `/p/[slug]` page is always server-rendered (dynamic rendering, not
statically generated). This ensures that revocation is immediate with no stale cache.

**Next.js force-dynamic (if needed):**

```typescript
// src/app/p/[slug]/page.tsx
export const dynamic = 'force-dynamic'
```

This ensures Next.js never caches the page at the edge, guaranteeing that every request hits
the database.

---

## Content exposure

When a PRD is public, the following is intentionally exposed:

- Full PRD content (all 12 blocks)
- Evidence tags (with text and classification)
- Confidence score and recommendation
- PRD title

This is by design: the PM chose to share the PRD publicly. The "Made with Enhanced" footer
provides attribution.

**Not exposed:**
- The PM's identity (name, email)
- The session (conversation history)
- The raw idea submitted on the landing page
- Version history
- Other PRDs by the same user

---

## GDPR considerations

- Public PRD content may contain personal data if the PM included it in their conversation
  (e.g., mentions of team members, customer names). Enhanced does not scrub PRD content.
- The PM is responsible for the content they choose to share publicly.
- Toggling off makes the content inaccessible, but cached versions in search engines or
  social previews may persist. This is standard behavior for any public web page.
- V1 does not include a "delete all my data" feature. This is tracked as a future GDPR
  compliance item.

---

## Rate limiting on public page

The `/p/[slug]` page does not have explicit rate limiting in V1. It is a simple DB query
with no write operations. Vercel's edge network provides basic DDoS protection. If abuse
is detected post-launch, add rate limiting at the middleware level.

---

## Summary: security invariants

> **Invariant — Private PRDs are never accessible via the public route**
> - **What:** The `/p/[slug]` page returns 404 for any PRD where `is_public = false`,
>   regardless of whether the slug exists.
> - **Where:** RLS policy `prds_select_public`, application query in `getPrdBySlug`.
> - **Breaks if:** The RLS policy allows `is_public = false` rows, or the application
>   query omits the `is_public = true` filter.

> **Invariant — Slugs are unguessable**
> - **What:** nanoid(10) provides 60 bits of entropy. Slugs are not sequential, not
>   predictable, and not enumerable.
> - **Where:** `nanoid(10)` call in `togglePublic` Server Action.
> - **Breaks if:** nanoid is replaced with a sequential counter or a predictable hash.

> **Invariant — 404 does not leak slug existence**
> - **What:** The same 404 page and response is returned for non-existent slugs and
>   private slugs. No timing difference, no error message difference.
> - **Where:** `/p/[slug]/page.tsx`, `/p/[slug]/not-found.tsx`.
> - **Breaks if:** A different error message is shown for "exists but private" vs.
>   "does not exist".
