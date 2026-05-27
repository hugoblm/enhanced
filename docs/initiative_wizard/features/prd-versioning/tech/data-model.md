# Data Model — PRD Versioning

> Database table, constraints, indexes, and RLS policies for the PRD Versioning feature.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Table: `prd_versions`

Stores immutable snapshots of PRD block content at the moment of generation or refinement.

> **Note:** The `prd_versions` table is **DEFINED in the prd-live-builder migration**, not
> re-created here. See [`../../../prd-live-builder/tech/data-model.md`](../../../prd-live-builder/tech/data-model.md)
> for the canonical CREATE TABLE, indexes, and base RLS policies. The prd-versioning feature
> adds its **READ path** (API, UI) and any additional RLS policies but does NOT create the table.

**Canonical schema (reference only -- source of truth is prd-live-builder):**

```sql
-- Defined in prd-live-builder migration, NOT duplicated here
CREATE TABLE public.prd_versions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id           UUID NOT NULL REFERENCES public.prds(id) ON DELETE CASCADE,
  block_id         UUID REFERENCES public.prd_blocks(id) ON DELETE SET NULL,
  version_number   INTEGER NOT NULL,
  content_snapshot TEXT NOT NULL,
  trigger          TEXT NOT NULL CHECK (trigger IN ('generation', 'refinement')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Indexes

```sql
-- Primary query: list versions for a PRD, newest first
CREATE INDEX idx_prd_versions_prd_desc
  ON public.prd_versions(prd_id, version_number DESC);

-- Lookup by block_id (for future per-block history views)
CREATE INDEX idx_prd_versions_block_id
  ON public.prd_versions(block_id)
  WHERE block_id IS NOT NULL;
```

---

## RLS Policies

```sql
ALTER TABLE public.prd_versions ENABLE ROW LEVEL SECURITY;

-- Users can view versions of their own PRDs
CREATE POLICY "prd_versions_select_own"
  ON public.prd_versions FOR SELECT
  USING (
    prd_id IN (
      SELECT id FROM public.prds WHERE user_id = auth.uid()
    )
  );

-- Users can view versions of public PRDs (for public-sharing feature)
CREATE POLICY "prd_versions_select_public"
  ON public.prd_versions FOR SELECT
  USING (
    prd_id IN (
      SELECT id FROM public.prds WHERE is_public = true
    )
  );

-- INSERT: only for PRDs owned by the current user
-- (Version creation happens server-side, but the RLS policy ensures
--  the user can only create versions for their own PRDs)
CREATE POLICY "prd_versions_insert_own"
  ON public.prd_versions FOR INSERT
  WITH CHECK (
    prd_id IN (
      SELECT id FROM public.prds WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );
```

**Notes:**
- No UPDATE or DELETE policies. Version rows are **immutable** — once created, they are
  never modified or removed.
- The SELECT policy uses a subquery on `prds` to check ownership. This is acceptable for
  the expected cardinality (<100 versions per PRD, <100 PRDs per user).

---

## Version Numbering

Version numbers are **sequential per PRD** (not per block, not globally). The numbering
is determined at INSERT time using a subquery:

```sql
-- Used by the createVersion helper function
INSERT INTO public.prd_versions (prd_id, block_id, version_number, content_snapshot, trigger)
VALUES (
  $1,  -- prd_id
  $2,  -- block_id (nullable)
  (SELECT COALESCE(MAX(version_number), 0) + 1
   FROM public.prd_versions
   WHERE prd_id = $1),
  $3,  -- content_snapshot
  $4   -- trigger: 'generation' | 'refinement'
);
```

**Why subquery instead of a sequence?**
- Postgres sequences are global. Per-PRD sequential numbering requires a subquery or a
  separate counter column on the `prds` table. The subquery approach is simpler and avoids
  schema changes to `prds`.
- The `idx_prd_versions_prd_desc` index ensures the `MAX()` subquery is efficient.

**Concurrency note:** If two version INSERTs for the same PRD execute simultaneously, they
could get the same `version_number`. This is a theoretical risk but extremely unlikely in
practice (a single user interacting with a single PRD). If needed, add a `UNIQUE(prd_id,
version_number)` constraint — but this would require retry logic on conflict. Deferred for
V1.

---

## Column Details

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key, auto-generated |
| `prd_id` | UUID | NO | FK to `prds.id`. Cascades on delete. |
| `block_id` | UUID | YES | FK to `prd_blocks.id`. NULL = full PRD snapshot (not used in V1). SET NULL on block delete — preserves version history even if the block is removed. |
| `version_number` | INTEGER | NO | Sequential per PRD. Starts at 1. |
| `content_snapshot` | TEXT | NO | Full content of the block at the time of versioning. Stored as-is (markdown text with evidence tags). |
| `trigger` | TEXT | NO | `'generation'` (created by `update_prd` tool) or `'refinement'` (created by block refinement). |
| `created_at` | TIMESTAMPTZ | NO | Timestamp of version creation. |

---

## Relationship to Other Tables

```
prds (1) ──── (N) prd_versions
                    │
prd_blocks (1) ── (N) prd_versions (via block_id, nullable)
```

- Deleting a PRD cascades to delete all its versions.
- Deleting a prd_block sets `block_id = NULL` on its versions (preserves the snapshot content
  even though the block no longer exists).
- No version row references `sessions` or `messages` directly — the relationship is
  transitive via `prds.session_id`.

---

## Migration File

> **Note:** The `prd_versions` CREATE TABLE and indexes are defined in the **prd-live-builder**
> migration (`YYYYMMDDHHMMSS_create_prd_versions.sql`). See
> [`../../../prd-live-builder/tech/data-model.md`](../../../prd-live-builder/tech/data-model.md)
> for the canonical definition.
>
> The prd-versioning feature adds its READ path (API, UI, additional RLS policies for public
> access) but does NOT re-create the table. The migration below adds only the supplementary
> policies.

**File:** `supabase/migrations/YYYYMMDDHHMMSS_prd_versioning_policies.sql`

```sql
-- Additional RLS policies for prd-versioning feature
-- (Table + base INSERT policy already exist from prd-live-builder migration)

CREATE POLICY "prd_versions_select_own" ON public.prd_versions FOR SELECT
  USING (prd_id IN (SELECT id FROM public.prds WHERE user_id = auth.uid()));

CREATE POLICY "prd_versions_select_public" ON public.prd_versions FOR SELECT
  USING (prd_id IN (SELECT id FROM public.prds WHERE is_public = true));

-- INSERT: allow for PRDs owned by the current user OR anonymous sessions
CREATE POLICY "prd_versions_insert_own" ON public.prd_versions FOR INSERT
  WITH CHECK (prd_id IN (SELECT id FROM public.prds WHERE user_id = auth.uid() OR user_id IS NULL));
```
