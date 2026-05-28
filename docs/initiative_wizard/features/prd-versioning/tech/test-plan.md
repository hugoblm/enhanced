# Test Plan — PRD Versioning

> Test strategy and scenario mapping for the PRD Versioning feature. Maps to Gherkin scenarios
> in `../product/gherkin-tests.md`.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Test Strategy

| Level | Tool | Scope |
|-------|------|-------|
| Unit | Vitest | `createVersion` helper, version numbering logic |
| Integration | Vitest + Supabase local | DB operations, RLS policies, API routes |
| E2E | Playwright | Full flow — generation/refinement triggers version, UI displays it |

---

## Unit Tests

### UT-PV-01: createVersion creates correct row
**Maps to:** SC-PV-01
**File:** `src/lib/__tests__/versions.test.ts`

```
- GIVEN a PRD with id "prd-1" and 0 existing versions
  WHEN createVersion is called with:
    - prdId: "prd-1"
    - blockId: "block-1"
    - content: "Test content"
    - trigger: "generation"
  THEN a prd_versions row is created with:
    - prd_id: "prd-1"
    - block_id: "block-1"
    - version_number: 1
    - content_snapshot: "Test content"
    - trigger: "generation"
  AND the function returns { versionId: <uuid>, versionNumber: 1 }
```

### UT-PV-02: Version numbering is sequential per PRD
**Maps to:** SC-PV-01b
**File:** `src/lib/__tests__/versions.test.ts`

```
- GIVEN PRD "prd-1" has 3 existing versions (1, 2, 3)
  AND PRD "prd-2" has 1 existing version (1)
  WHEN createVersion is called for prd-1
  THEN the new version has version_number 4

  WHEN createVersion is called for prd-2
  THEN the new version has version_number 2
```

### UT-PV-03: createVersion handles null block_id
**Maps to:** (data model, future full-PRD snapshots)
**File:** `src/lib/__tests__/versions.test.ts`

```
- GIVEN a PRD with id "prd-1"
  WHEN createVersion is called with blockId: null
  THEN a prd_versions row is created with block_id: null
  AND version_number is correctly incremented
```

### UT-PV-04: createVersion distinguishes trigger types
**Maps to:** SC-PV-01, SC-PV-02
**File:** `src/lib/__tests__/versions.test.ts`

```
- GIVEN a PRD with 1 existing version (trigger: 'generation')
  WHEN createVersion is called with trigger: 'refinement'
  THEN the new version has trigger: 'refinement'
  AND version_number is 2 (not reset for different trigger)
```

---

## Integration Tests

### IT-PV-01: GET /api/prd/[prdId]/versions returns correct list
**Maps to:** SC-PV-03
**File:** `src/app/api/prd/[prdId]/versions/__tests__/route.test.ts`

```
- GIVEN user "user-1" owns PRD "prd-1"
  AND prd-1 has 5 versions (3 generation, 2 refinement)
  WHEN GET /api/prd/prd-1/versions is called with user-1's auth
  THEN response status is 200
  AND response body contains 5 version entries
  AND entries are ordered by version_number DESC (5, 4, 3, 2, 1)
  AND each entry includes: id, version_number, block_id, block_type, trigger, created_at

- GIVEN user "user-2" does NOT own PRD "prd-1"
  WHEN GET /api/prd/prd-1/versions is called with user-2's auth
  THEN response status is 404
```

### IT-PV-02: GET /api/prd/[prdId]/versions/[versionId] returns content
**Maps to:** SC-PV-05
**File:** `src/app/api/prd/[prdId]/versions/[versionId]/__tests__/route.test.ts`

```
- GIVEN user "user-1" owns PRD "prd-1"
  AND version "v-1" exists with content_snapshot "Le probleme: les PM..."
  WHEN GET /api/prd/prd-1/versions/v-1 is called
  THEN response status is 200
  AND response body includes content_snapshot: "Le probleme: les PM..."
```

### IT-PV-03: RLS blocks cross-user version access
**Maps to:** (security invariant)
**File:** `src/lib/supabase/__tests__/rls-versions.test.ts`

```
- GIVEN user A owns PRD "prd-1" with 3 versions
  AND user B is authenticated
  WHEN user B queries prd_versions WHERE prd_id = "prd-1"
  THEN the query returns 0 rows
```

### IT-PV-04: Version creation from update_prd tool
**Maps to:** SC-PV-01
**File:** `src/app/api/chat/__tests__/versioning.test.ts`

```
- GIVEN a wizard session with PRD "prd-1"
  WHEN the conversation engine calls update_prd to generate "first_use_case" block
  THEN a prd_versions row is created with:
    - prd_id: "prd-1"
    - block_id: the new block's id
    - trigger: "generation"
    - content_snapshot: the block's content
    - version_number: 1
```

### IT-PV-05: Version creation from /api/refine
**Maps to:** SC-PV-02
**File:** `src/app/api/refine/__tests__/versioning.test.ts`

```
- GIVEN a PRD with 3 versions and a "first_use_case" block
  WHEN the PM refines the block with instruction "Ajouter le contexte startup"
  AND the refinement completes
  THEN a prd_versions row is created with:
    - version_number: 4
    - trigger: "refinement"
    - content_snapshot: the REFINED content (not the original)
    - block_id: the "first_use_case" block id
```

### IT-PV-06: Unauthenticated request rejected
**Maps to:** (security)
**File:** `src/app/api/prd/[prdId]/versions/__tests__/route.test.ts`

```
- GIVEN no auth cookie in the request
  WHEN GET /api/prd/prd-1/versions is called
  THEN response status is 401
  AND response body is { error: "Unauthorized" }
```

---

## E2E Tests

### E2E-PV-01: Version created on block generation
**Maps to:** SC-PV-01
**File:** `e2e/prd-versioning.spec.ts`

```
- Authenticate as a test user
- Start a wizard session
- Progress conversation until AI generates the "First Use Case" block
- Open version history panel
- ASSERT: 1 version entry visible
- ASSERT: version 1, trigger "Generation", block "Cas d'usage principal"
```

### E2E-PV-02: Sequential versions across multiple generations
**Maps to:** SC-PV-01b
**File:** `e2e/prd-versioning.spec.ts`

```
- Continue the wizard through multiple block generations
- Open version history panel
- ASSERT: multiple version entries (1, 2, 3...) in sequential order
- ASSERT: each entry shows the correct block type and trigger
```

### E2E-PV-03: Version created on block refinement
**Maps to:** SC-PV-02
**File:** `e2e/prd-versioning.spec.ts`

```
- With a PRD at version 3 (3 generated blocks)
- Hover over "First Use Case" block
- Click "Refine"
- Enter "Ajouter le contexte startup early-stage"
- Wait for refinement to complete
- Open version history panel
- ASSERT: version 4 exists with trigger "Refinement" and block "Cas d'usage principal"
```

### E2E-PV-04: Version history panel displays correctly
**Maps to:** SC-PV-03, SC-PV-04
**File:** `e2e/prd-versioning.spec.ts`

```
- With a PRD that has 5 versions
- Click "Version history" button in PRD panel header
- ASSERT: panel opens
- ASSERT: 5 version entries displayed
- ASSERT: entries ordered newest first (version 5 at top)
- ASSERT: latest version labeled "Version actuelle"
- ASSERT: each entry shows version number, trigger badge, block name, relative timestamp
```

### E2E-PV-05: View past version content
**Maps to:** SC-PV-05
**File:** `e2e/prd-versioning.spec.ts`

```
- Open version history panel
- Click on version 1
- ASSERT: read-only view opens
- ASSERT: banner shows "Version 1 -- {date} (lecture seule)"
- ASSERT: content is rendered as markdown
- ASSERT: evidence tags ([Evidence], [Assumption]) are styled
- ASSERT: no "Refine" button visible
```

### E2E-PV-06: Return to current version
**Maps to:** SC-PV-06
**File:** `e2e/prd-versioning.spec.ts`

```
- While viewing version 1 in read-only mode
- Click "Retour a la version actuelle" button
- ASSERT: read-only view closes
- ASSERT: PRD panel shows current (latest) block content
```

### E2E-PV-07: Empty state
**Maps to:** SC-PV-04b
**File:** `e2e/prd-versioning.spec.ts`

```
- With a PRD that has 0 versions
- Click "Version history" button
- ASSERT: panel opens with message "Aucune version pour le moment"
- ASSERT: no version entries displayed
```

### E2E-PV-08: Rapid successive refinements
**Maps to:** SC-PV-E1
**File:** `e2e/prd-versioning.spec.ts`

```
- With a PRD at version 3
- Refine "Objectives" block with "Rendre l'objectif 2 plus mesurable"
- Wait for completion (version 4 created)
- Immediately refine same block with "Ajouter un KPI concret"
- Wait for completion (version 5 created)
- Open version history
- ASSERT: versions 4 and 5 both exist
- ASSERT: both reference "Objectives" block
- ASSERT: content_snapshot differs between versions 4 and 5
```

---

## Non-regression Tests

### NR-PV-01: Chat flow unaffected
**Maps to:** (non-regression)
**File:** `e2e/prd-versioning.spec.ts`

```
- Complete a full wizard conversation (steps 1-4)
- ASSERT: conversation flow works normally
- ASSERT: PRD blocks generated correctly
- ASSERT: version creation is transparent (no UI interruption, no latency spike)
```

### NR-PV-02: Block refinement unaffected
**Maps to:** (non-regression)
**File:** `e2e/prd-versioning.spec.ts`

```
- Refine a block via the standard refinement flow
- ASSERT: block content updates correctly in the PRD panel
- ASSERT: refinement UI (hover, input, completion) works as before
- ASSERT: version is created without interfering with the refinement UX
```

---

## Smoke Checklist (Manual)

Before merging `feat/prd-versioning`:

- [ ] Generate 3+ blocks in a wizard session
- [ ] Open version history → 3+ versions visible, newest first
- [ ] Each version shows correct block type, trigger badge, timestamp
- [ ] Click a past version → content displayed in read-only mode
- [ ] Evidence tags rendered with styling in read-only view
- [ ] "Retour a la version actuelle" → returns to current PRD
- [ ] Refine a block → new version appears in history
- [ ] Version numbers are sequential (no gaps, no duplicates)
- [ ] Empty state displays correctly when no versions exist
- [ ] Another user cannot see your version history (RLS check)
