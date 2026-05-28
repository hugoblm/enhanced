# API — PRD Versioning

> Routes, helper functions, and request/response contracts for the PRD Versioning feature.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Overview

PRD Versioning has two API surfaces:

1. **Version creation** — a helper function called internally by other features (`update_prd`
   tool execution and block refinement completion). Not a standalone endpoint.
2. **Version listing** — a Route Handler for fetching the version history of a PRD.

---

## File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/versions.ts` | Helper function | `createVersion()` — inserts a version row |
| `src/app/api/prd/[prdId]/versions/route.ts` | Route Handler (GET) | List versions for a PRD |
| `src/components/version-history.tsx` | Client Component | Version history panel UI |
| `src/components/version-viewer.tsx` | Client Component | Read-only view of a past version |

---

## Helper Function: `createVersion`

**File:** `src/lib/versions.ts`

Called internally by the conversation engine (on `update_prd` tool execution) and by the
block refinement endpoint (on refinement completion). Not exposed as an API endpoint.

### Signature

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export async function createVersion(
  supabase: SupabaseClient<Database>,
  params: {
    prdId: string;
    blockId: string | null;
    content: string;
    trigger: 'generation' | 'refinement';
  }
): Promise<{ versionId: string; versionNumber: number } | { error: string }> {
  // ...
}
```

### Implementation

```typescript
export async function createVersion(
  supabase: SupabaseClient<Database>,
  params: {
    prdId: string;
    blockId: string | null;
    content: string;
    trigger: 'generation' | 'refinement';
  }
) {
  const { prdId, blockId, content, trigger } = params;

  // Get the next version number for this PRD
  const { data: maxVersion } = await supabase
    .from('prd_versions')
    .select('version_number')
    .eq('prd_id', prdId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const nextVersionNumber = (maxVersion?.version_number ?? 0) + 1;

  // Insert the version row
  const { data, error } = await supabase
    .from('prd_versions')
    .insert({
      prd_id: prdId,
      block_id: blockId,
      version_number: nextVersionNumber,
      content_snapshot: content,
      trigger,
    })
    .select('id, version_number')
    .single();

  if (error) {
    console.error('[createVersion] Failed:', error);
    return { error: error.message };
  }

  return { versionId: data.id, versionNumber: data.version_number };
}
```

### Integration Points

**In `/api/chat` (conversation engine) — after `update_prd` tool execution:**

```typescript
// Inside the update_prd tool handler
const { data: block } = await supabase
  .from('prd_blocks')
  .upsert({ prd_id: prdId, block_type: blockType, content, sort_order })
  .select('id')
  .single();

// Create a version snapshot
await createVersion(supabase, {
  prdId,
  blockId: block.id,
  content,
  trigger: 'generation',
});
```

**In `/api/refine` (block refinement) — after refinement completion:**

```typescript
// After the AI regenerates the block
const { data: updatedBlock } = await supabase
  .from('prd_blocks')
  .update({ content: refinedContent })
  .eq('id', blockId)
  .select('id, prd_id')
  .single();

// Create a version snapshot
await createVersion(supabase, {
  prdId: updatedBlock.prd_id,
  blockId: updatedBlock.id,
  content: refinedContent,
  trigger: 'refinement',
});
```

---

## Route Handler: `GET /api/prd/[prdId]/versions`

**File:** `src/app/api/prd/[prdId]/versions/route.ts`

Returns the version history for a PRD, ordered newest first.

### Authentication

Requires an authenticated user. The user must own the PRD (enforced by RLS).

### Request

```
GET /api/prd/{prdId}/versions
```

**Path parameters:**
- `prdId` (UUID) — the PRD to fetch versions for.

**Query parameters:** None. No pagination in V1 (versions will be <100 per PRD).

### Response

**200 OK:**

```typescript
interface VersionListResponse {
  versions: Array<{
    id: string;
    version_number: number;
    block_id: string | null;
    block_type: string | null;  // joined from prd_blocks
    trigger: 'generation' | 'refinement';
    created_at: string;         // ISO 8601
  }>;
}
```

**Example:**

```json
{
  "versions": [
    {
      "id": "a1b2c3d4-...",
      "version_number": 5,
      "block_id": "e5f6g7h8-...",
      "block_type": "jtbd",
      "trigger": "refinement",
      "created_at": "2026-05-27T10:15:00Z"
    },
    {
      "id": "i9j0k1l2-...",
      "version_number": 4,
      "block_id": "m3n4o5p6-...",
      "block_type": "first_use_case",
      "trigger": "refinement",
      "created_at": "2026-05-27T10:10:00Z"
    },
    {
      "id": "q7r8s9t0-...",
      "version_number": 3,
      "block_id": "u1v2w3x4-...",
      "block_type": "objectives",
      "trigger": "generation",
      "created_at": "2026-05-27T10:05:00Z"
    }
  ]
}
```

**401 Unauthorized:** User is not authenticated.

```json
{ "error": "Unauthorized" }
```

**404 Not Found:** PRD does not exist or user does not own it (RLS returns 0 rows).

```json
{ "error": "PRD not found" }
```

### Implementation

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ prdId: string }> }
) {
  const { prdId } = await params;
  const supabase = await createClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify PRD exists and belongs to user (RLS handles ownership check)
  const { data: prd } = await supabase
    .from('prds')
    .select('id')
    .eq('id', prdId)
    .single();

  if (!prd) {
    return NextResponse.json({ error: 'PRD not found' }, { status: 404 });
  }

  // Fetch versions with block_type join
  const { data: versions, error: versionsError } = await supabase
    .from('prd_versions')
    .select(`
      id,
      version_number,
      block_id,
      trigger,
      created_at,
      prd_blocks!block_id (block_type)
    `)
    .eq('prd_id', prdId)
    .order('version_number', { ascending: false });

  if (versionsError) {
    console.error('[GET /api/prd/versions] Error:', versionsError);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }

  // Flatten the join result
  const formattedVersions = (versions ?? []).map((v) => ({
    id: v.id,
    version_number: v.version_number,
    block_id: v.block_id,
    block_type: v.prd_blocks?.block_type ?? null,
    trigger: v.trigger,
    created_at: v.created_at,
  }));

  return NextResponse.json({ versions: formattedVersions });
}
```

---

## Route Handler: `GET /api/prd/[prdId]/versions/[versionId]`

**File:** `src/app/api/prd/[prdId]/versions/[versionId]/route.ts`

Returns the full content of a specific version.

### Response

**200 OK:**

```typescript
interface VersionDetailResponse {
  id: string;
  version_number: number;
  block_id: string | null;
  block_type: string | null;
  content_snapshot: string;
  trigger: 'generation' | 'refinement';
  created_at: string;
}
```

**401 / 404:** Same as version list endpoint.

### Implementation

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ prdId: string; versionId: string }> }
) {
  const { prdId, versionId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: version } = await supabase
    .from('prd_versions')
    .select(`
      id,
      version_number,
      block_id,
      content_snapshot,
      trigger,
      created_at,
      prd_blocks!block_id (block_type)
    `)
    .eq('id', versionId)
    .eq('prd_id', prdId)
    .single();

  if (!version) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: version.id,
    version_number: version.version_number,
    block_id: version.block_id,
    block_type: version.prd_blocks?.block_type ?? null,
    content_snapshot: version.content_snapshot,
    trigger: version.trigger,
    created_at: version.created_at,
  });
}
```

---

## UI Components

### `VersionHistory`

**File:** `src/components/version-history.tsx`

A panel (sheet or modal) accessible from the PRD panel header via a "Version history" button.
Displays the version list and handles navigation to version detail views.

**Props:**

```typescript
interface VersionHistoryProps {
  prdId: string;
  isOpen: boolean;
  onClose: () => void;
}
```

**Behavior:**
- Fetches version list from `GET /api/prd/[prdId]/versions` on open.
- Displays each version as a row: version number, trigger badge ("Generation" / "Refinement"),
  block type label, relative timestamp.
- Latest version labeled "Version actuelle".
- Click a version entry -> opens `VersionViewer` with the version's `content_snapshot`.
- Empty state: "Aucune version pour le moment" if 0 versions exist.

### `VersionViewer`

**File:** `src/components/version-viewer.tsx`

Read-only display of a past version's content.

**Props:**

```typescript
interface VersionViewerProps {
  prdId: string;
  versionId: string;
  onClose: () => void;
}
```

**Behavior:**
- Fetches version detail from `GET /api/prd/[prdId]/versions/[versionId]`.
- Renders `content_snapshot` as markdown (with evidence tag styling).
- Shows banner: "Version {n} -- {date} (lecture seule)".
- No "Refine" button visible (read-only).
- Close button returns to the current PRD view.

---

## Block Type Labels

Block type labels are defined in the shared constants file `src/lib/prd/constants.ts` (see architecture.md section 3). All features MUST import from this file rather than defining their own mapping.

Canonical mapping:

| `block_type` | Display label |
|--------------|---------------|
| `first_use_case` | Cas d'usage principal |
| `problem_context` | Contexte du probleme |
| `data_signals` | Signaux data |
| `risk_value` | Risque — Valeur |
| `risk_usability` | Risque — Utilisabilite |
| `risk_feasibility` | Risque — Faisabilite |
| `risk_viability` | Risque — Viabilite business |
| `confidence_score` | Score de confiance |
| `success_criteria` | Criteres de succes |
| `kill_criteria` | Kill criteria |
| `next_steps` | Prochaines etapes |
| `executive_summary` | Resume executif |
