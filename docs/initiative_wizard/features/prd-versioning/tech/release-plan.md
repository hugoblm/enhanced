# Release Plan — PRD Versioning

> Branch strategy, commit sequence, and deployment checklist for the PRD Versioning feature.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Branch

- **Branch name:** `feat/prd-versioning`
- **Base:** `staging`
- **Merge target:** `staging` (via PR)
- **Dependencies:**
  - `prd-live-builder` must be merged (provides `update_prd` tool + `prd_blocks` table).
  - `block-refinement` must be merged (provides `/api/refine` endpoint).
  - `deferred-auth` must be merged (provides `prds` table).

This feature is sequenced at position 7 in the feature breakdown — after all its
dependencies.

---

## Commit Sequence

### Commit 1: Migration — prd_versions table

**Files:**
- `supabase/migrations/YYYYMMDDHHMMSS_create_prd_versions.sql`

**Contains:**
- `prd_versions` table DDL with all columns and constraints
- Indexes: `idx_prd_versions_prd_desc`, `idx_prd_versions_block_id`
- RLS policies: `prd_versions_select_own`, `prd_versions_select_public`,
  `prd_versions_insert_own`

**Verify:** `npx supabase db reset` runs cleanly. Table exists with correct schema.

---

### Commit 2: createVersion helper function

**Files:**
- `src/lib/versions.ts` (new)

**Contains:**
- `createVersion()` function with Supabase client, version numbering logic, error handling.
- Type exports for `CreateVersionParams` and `CreateVersionResult`.

**Verify:** Unit test passes — function creates a version row with correct version_number.

---

### Commit 3: Hook version creation into update_prd tool

**Files:**
- `src/app/api/chat/route.ts` (modified — add `createVersion` call after block upsert)

**Contains:**
- Import `createVersion` from `@/lib/versions`.
- After `update_prd` tool upserts a block, call `createVersion` with trigger `'generation'`.

**Verify:** Start a wizard session, generate a PRD block. Check `prd_versions` table —
version 1 exists with correct `prd_id`, `block_id`, `content_snapshot`, trigger `'generation'`.

---

### Commit 4: Hook version creation into /api/refine

**Files:**
- `src/app/api/refine/route.ts` (modified — add `createVersion` call after block update)

**Contains:**
- Import `createVersion` from `@/lib/versions`.
- After block refinement completes, call `createVersion` with trigger `'refinement'`.

**Verify:** Refine a block. Check `prd_versions` table — new version exists with correct
data and trigger `'refinement'`. Version number is sequential (e.g., if generation created
version 3, refinement creates version 4).

---

### Commit 5: GET /api/prd/[prdId]/versions route

**Files:**
- `src/app/api/prd/[prdId]/versions/route.ts` (new)
- `src/app/api/prd/[prdId]/versions/[versionId]/route.ts` (new)

**Contains:**
- GET handler for version list (with block_type join).
- GET handler for version detail (with content_snapshot).
- Auth check, error handling.

**Verify:** Call via browser/curl with auth cookie. Returns correct JSON response. Returns
401 without auth. Returns 404 for non-existent PRD.

---

### Commit 6: Version history UI components

**Files:**
- `src/components/version-history.tsx` (new)
- `src/components/version-viewer.tsx` (new)

**Contains:**
- `VersionHistory` panel component (fetches and displays version list).
- `VersionViewer` read-only component (fetches and displays version content).
- Empty state handling.
- "Version actuelle" label on latest version.

**Verify:** Open PRD panel → click "Version history" → panel shows versions. Click a version
→ content displayed in read-only mode. Close → returns to current PRD.

---

### Commit 7: Wire version history button into PRD panel header

**Files:**
- PRD panel header component (modified — add "Version history" button + state)

**Contains:**
- Import `VersionHistory` component.
- Add button with clock/history icon.
- Toggle `isOpen` state to show/hide the panel.

**Verify:** Button visible in PRD panel header. Click opens version history. Panel populated
with real version data.

---

### Commit 8: Regenerate Supabase types

**Files:**
- `src/lib/supabase/types.ts` (regenerated)

**Command:**
```bash
npx supabase gen types typescript --local > src/lib/supabase/types.ts
```

**Verify:** TypeScript compilation passes. `Database` type includes `prd_versions` table.

---

## Pre-merge Checklist

- [ ] Migration runs cleanly on `npx supabase db reset`
- [ ] Version created on block generation (trigger = 'generation')
- [ ] Version created on block refinement (trigger = 'refinement')
- [ ] Version numbers are sequential per PRD (not global)
- [ ] GET /api/prd/[prdId]/versions returns correct list with block_type
- [ ] Version detail endpoint returns content_snapshot
- [ ] RLS: user can only see versions of their own PRDs
- [ ] Version history panel renders correctly
- [ ] Read-only version viewer displays content with markdown + evidence tags
- [ ] Empty state ("Aucune version") when no versions exist
- [ ] TypeScript compilation passes with regenerated types
- [ ] Main chat flow unaffected (non-regression)
- [ ] Block refinement flow unaffected (non-regression)
- [ ] `.ai-context/` updated to reflect new table and routes

---

## Post-merge Tasks

- Update `.ai-context/README.md`: add `prd_versions` to table list, add version routes.
- Update feature README status from `Planned` to `Done`.
- Update `tech/` entry in feature README from "TBD" to link to specs.
