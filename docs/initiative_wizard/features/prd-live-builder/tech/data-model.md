# Data Model — PRD Live Builder

> The `prds` and `prd_blocks` tables, block sort order, evidence tags JSONB format, and
> the `prd_versions` table for version tracking.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Table: prds

The `prds` table was defined in the deferred-auth data model (auth-relevant columns). This
spec documents the full table with all columns, including those used by the PRD Live Builder
and Public Sharing features.

### Schema

```sql
CREATE TABLE public.prds (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title             TEXT NOT NULL DEFAULT 'Draft PRD',
  share_slug        TEXT UNIQUE,
  is_public         BOOLEAN NOT NULL DEFAULT false,
  confidence_score  SMALLINT CHECK (confidence_score BETWEEN 0 AND 100),
  recommendation    TEXT CHECK (recommendation IN ('build', 'test_first', 'abandon')),
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Indexes

```sql
CREATE INDEX idx_prds_session_id ON public.prds(session_id);
CREATE INDEX idx_prds_user_id ON public.prds(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_prds_share_slug ON public.prds(share_slug) WHERE share_slug IS NOT NULL;
```

### RLS policies

```sql
ALTER TABLE public.prds ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own PRDs
CREATE POLICY "prds_select_own"
  ON public.prds FOR SELECT
  USING (auth.uid() = user_id);

-- Public PRDs are readable by anyone (for public-sharing feature)
CREATE POLICY "prds_select_public"
  ON public.prds FOR SELECT
  USING (is_public = true);

-- Authenticated users can update their own PRDs
CREATE POLICY "prds_update_own"
  ON public.prds FOR UPDATE
  USING (auth.uid() = user_id);

-- INSERT: allow when user_id matches auth or is null (anonymous creation)
CREATE POLICY "prds_insert"
  ON public.prds FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
```

### PRD-Live-Builder-specific columns

| Column | Type | Used by | Notes |
|--------|------|---------|-------|
| `confidence_score` | SMALLINT (0-100) | Updated by `update_prd` tool when `block_type = 'confidence_score'` | Displayed in PRD header badge |
| `recommendation` | TEXT (enum) | Updated alongside confidence_score | `build`, `test_first`, or `abandon` |
| `metadata` | JSONB | Future extensibility | Currently unused in V1 |

---

## Table: prd_blocks

### Schema

```sql
CREATE TABLE public.prd_blocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id          UUID NOT NULL REFERENCES public.prds(id) ON DELETE CASCADE,
  block_type      TEXT NOT NULL CHECK (block_type IN (
    'first_use_case', 'problem_context', 'data_signals',
    'risk_value', 'risk_usability', 'risk_feasibility', 'risk_viability',
    'confidence_score', 'success_criteria', 'kill_criteria',
    'next_steps', 'executive_summary'
  )),
  content         TEXT NOT NULL DEFAULT '',
  sort_order      SMALLINT NOT NULL,
  evidence_tags   JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT prd_blocks_unique_type UNIQUE(prd_id, block_type)
);
```

**Content length:** Maximum 10,000 characters per block. Enforced at the application layer (Zod validation on the `update_prd` tool parameters and the `/api/refine` endpoint). With 12 block types, the theoretical maximum PRD size is 120,000 characters. Content is rendered via `react-markdown` with sanitization to prevent XSS.

**Zod validation on `update_prd` tool content parameter:**

```typescript
content: z.string().max(10000, 'Block content cannot exceed 10,000 characters')
```

### Indexes

```sql
-- Primary query: load all blocks for a PRD in display order
CREATE INDEX idx_prd_blocks_prd ON public.prd_blocks(prd_id, sort_order);
```

### RLS policies

```sql
ALTER TABLE public.prd_blocks ENABLE ROW LEVEL SECURITY;

-- Blocks inherit access from their parent PRD
-- Includes anonymous access (defense in depth, app-layer verifies cookie)
CREATE POLICY "prd_blocks_select_via_prd"
  ON public.prd_blocks FOR SELECT
  USING (
    prd_id IN (
      SELECT id FROM public.prds
      WHERE auth.uid() = user_id OR is_public = true OR user_id IS NULL
    )
  );

-- INSERT/UPDATE: only the PRD owner (through the update_prd tool's server-side execute)
CREATE POLICY "prd_blocks_insert_via_prd"
  ON public.prd_blocks FOR INSERT
  WITH CHECK (
    prd_id IN (
      SELECT id FROM public.prds WHERE auth.uid() = user_id OR user_id IS NULL
    )
  );

CREATE POLICY "prd_blocks_update_via_prd"
  ON public.prd_blocks FOR UPDATE
  USING (
    prd_id IN (
      SELECT id FROM public.prds WHERE auth.uid() = user_id
    )
  );
```

### UNIQUE constraint on (prd_id, block_type)

The unique constraint is critical for the `update_prd` tool's UPSERT behavior:

```sql
INSERT INTO prd_blocks (prd_id, block_type, content, sort_order, evidence_tags)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (prd_id, block_type) DO UPDATE SET
  content = EXCLUDED.content,
  evidence_tags = EXCLUDED.evidence_tags,
  updated_at = now();
```

This ensures each PRD has at most one block per type. Calling `update_prd` for the same
block_type multiple times updates the existing block rather than creating duplicates.

---

## Block sort order (fixed)

The sort order is the PRD structure itself. It does not change in V1.

| sort_order | block_type | Display heading (FR) | Wizard step |
|-----------|------------|---------------------|-------------|
| 1 | `first_use_case` | Cas d'usage principal | Step 1 |
| 2 | `problem_context` | Contexte du probleme | Step 1 |
| 3 | `data_signals` | Signaux data | Step 2 |
| 4 | `risk_value` | Risque -- Valeur | Step 3 |
| 5 | `risk_usability` | Risque -- Utilisabilite | Step 3 |
| 6 | `risk_feasibility` | Risque -- Faisabilite | Step 3 |
| 7 | `risk_viability` | Risque -- Viabilite business | Step 3 |
| 8 | `confidence_score` | Score de confiance | Step 3 |
| 9 | `success_criteria` | Criteres de succes | Step 4 |
| 10 | `kill_criteria` | Kill criteria | Step 4 |
| 11 | `next_steps` | Prochaines etapes | Step 4 |
| 12 | `executive_summary` | Resume executif | Step 4 |

**Implementation:** `src/lib/prd/block-types.ts`

```typescript
export const BLOCK_TYPES = [
  'first_use_case',
  'problem_context',
  'data_signals',
  'risk_value',
  'risk_usability',
  'risk_feasibility',
  'risk_viability',
  'confidence_score',
  'success_criteria',
  'kill_criteria',
  'next_steps',
  'executive_summary',
] as const

export type BlockType = (typeof BLOCK_TYPES)[number]

export const BLOCK_SORT_ORDER: Record<BlockType, number> = {
  first_use_case: 1,
  problem_context: 2,
  data_signals: 3,
  risk_value: 4,
  risk_usability: 5,
  risk_feasibility: 6,
  risk_viability: 7,
  confidence_score: 8,
  success_criteria: 9,
  kill_criteria: 10,
  next_steps: 11,
  executive_summary: 12,
}

export const BLOCK_HEADINGS: Record<BlockType, string> = {
  first_use_case: 'Cas d\'usage principal',
  problem_context: 'Contexte du probleme',
  data_signals: 'Signaux data',
  risk_value: 'Risque — Valeur',
  risk_usability: 'Risque — Utilisabilite',
  risk_feasibility: 'Risque — Faisabilite',
  risk_viability: 'Risque — Viabilite business',
  confidence_score: 'Score de confiance',
  success_criteria: 'Criteres de succes',
  kill_criteria: 'Kill criteria',
  next_steps: 'Prochaines etapes',
  executive_summary: 'Resume executif',
}

export const BLOCK_STEP: Record<BlockType, number> = {
  first_use_case: 1,
  problem_context: 1,
  data_signals: 2,
  risk_value: 3,
  risk_usability: 3,
  risk_feasibility: 3,
  risk_viability: 3,
  confidence_score: 3,
  success_criteria: 4,
  kill_criteria: 4,
  next_steps: 4,
  executive_summary: 4,
}

export const BLOCK_PLACEHOLDER: Record<BlockType, string> = {
  first_use_case: 'Cette section sera remplie durant l\'étape 1 — Cadrage',
  problem_context: 'Cette section sera remplie durant l\'étape 1 — Cadrage',
  data_signals: 'Cette section sera remplie durant l\'étape 2 — Données',
  risk_value: 'Cette section sera remplie durant l\'étape 3 — Risques',
  risk_usability: 'Cette section sera remplie durant l\'étape 3 — Risques',
  risk_feasibility: 'Cette section sera remplie durant l\'étape 3 — Risques',
  risk_viability: 'Cette section sera remplie durant l\'étape 3 — Risques',
  confidence_score: 'Cette section sera remplie durant l\'étape 3 — Risques',
  success_criteria: 'Cette section sera remplie durant l\'étape 4 — PRD final',
  kill_criteria: 'Cette section sera remplie durant l\'étape 4 — PRD final',
  next_steps: 'Cette section sera remplie durant l\'étape 4 — PRD final',
  executive_summary: 'Cette section sera remplie durant l\'étape 4 — PRD final',
}
```

---

## evidence_tags JSONB format

Each `prd_blocks.evidence_tags` column stores an array of tagged claims:

```typescript
interface EvidenceTag {
  text: string   // The claim or statement being tagged
  tag: 'evidence' | 'assumption' | 'to_verify'
}
```

**Example:**

```json
[
  { "text": "80% of features are rarely used", "tag": "evidence" },
  { "text": "PMs prefer guided validation", "tag": "assumption" },
  { "text": "Measure completion rate post-launch", "tag": "to_verify" }
]
```

**Display mapping:**

| tag | Label | Badge color | Accessible text |
|-----|-------|-------------|----------------|
| `evidence` | [Evidence] | Green (Obra `--color-green-500`) | "Backed by evidence" |
| `assumption` | [Assumption] | Amber (Obra `--color-amber-500`) | "Unverified assumption" |
| `to_verify` | [To verify] | Red (Obra `--color-red-500`) | "Needs verification" |

---

## Table: prd_versions

Version snapshots for tracking block changes over time.

### Schema

```sql
CREATE TABLE public.prd_versions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id            UUID NOT NULL REFERENCES public.prds(id) ON DELETE CASCADE,
  block_id          UUID REFERENCES public.prd_blocks(id) ON DELETE SET NULL,
  version_number    INTEGER NOT NULL,
  content_snapshot  TEXT NOT NULL,
  trigger           TEXT NOT NULL CHECK (trigger IN ('generation', 'refinement')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prd_versions_prd_desc ON public.prd_versions(prd_id, version_number DESC);
CREATE INDEX idx_prd_versions_block_id ON public.prd_versions(block_id) WHERE block_id IS NOT NULL;
```

### RLS policies

```sql
ALTER TABLE public.prd_versions ENABLE ROW LEVEL SECURITY;

-- Includes anonymous access (defense in depth, app-layer verifies cookie)
CREATE POLICY "prd_versions_select_own"
  ON public.prd_versions FOR SELECT
  USING (
    prd_id IN (
      SELECT id FROM public.prds WHERE auth.uid() = user_id
    )
  );

CREATE POLICY "prd_versions_select_public"
  ON public.prd_versions FOR SELECT
  USING (
    prd_id IN (
      SELECT id FROM public.prds WHERE is_public = true OR user_id IS NULL
    )
  );

CREATE POLICY "prd_versions_insert"
  ON public.prd_versions FOR INSERT
  WITH CHECK (
    prd_id IN (
      SELECT id FROM public.prds WHERE auth.uid() = user_id OR user_id IS NULL
    )
  );
```

**Note:** `prd_versions` is primarily for the COULD feature `prd-versioning`. The `update_prd`
tool creates version entries regardless, so the data is available if versioning is built later.

---

## Triggers

### Auto-update `updated_at`

```sql
CREATE TRIGGER prd_blocks_updated_at
  BEFORE UPDATE ON public.prd_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

(The `update_updated_at()` function is defined in the deferred-auth migration.)

---

## Migration files

Two migration files under `supabase/migrations/`:

1. **`YYYYMMDDHHMMSS_create_prd_blocks.sql`**
   - `prd_blocks` table + unique constraint + indexes + RLS + `updated_at` trigger

2. **`YYYYMMDDHHMMSS_create_prd_versions.sql`**
   - `prd_versions` table + indexes + RLS

Dependencies:
- `prds` table (created by the deferred-auth migration)
- `update_updated_at()` function (created by the deferred-auth migration)

---

## Invariants

> **Invariant — Each PRD has at most one block per type**
> - **What:** The `UNIQUE(prd_id, block_type)` constraint guarantees no duplicate blocks.
>   The `update_prd` tool uses UPSERT (ON CONFLICT DO UPDATE) to enforce this.
> - **Where:** `prd_blocks` table, unique constraint, `update_prd` tool execute function.
> - **Breaks if:** The unique constraint is removed or INSERT is used without ON CONFLICT
>   → duplicate blocks appear, rendering is unpredictable.

> **Invariant — Block sort order is deterministic**
> - **What:** The display order of blocks is always determined by the `BLOCK_SORT_ORDER` map
>   in `block-types.ts`, not by the `sort_order` column alone. The column exists for DB-level
>   ordering but the client always uses the TypeScript constant.
> - **Where:** `block-types.ts`, `prd-viewer.tsx`.
> - **Breaks if:** The client sorts by `created_at` or insertion order → blocks appear in
>   wrong positions.

> **Invariant — Evidence tags are a valid JSON array**
> - **What:** The `evidence_tags` column defaults to `'[]'` and must always be a valid JSON
>   array of `{ text, tag }` objects. The `update_prd` tool validates this via Zod before
>   writing.
> - **Where:** `prd_blocks.evidence_tags`, `update_prd` tool parameters.
> - **Breaks if:** Invalid JSON is inserted → evidence tag rendering crashes.
