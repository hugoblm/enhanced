# Test Plan (Automated) — PRD Live Builder

> Automated test strategy mapped to the 14 Gherkin scenarios in
> [`../product/gherkin-tests.md`](../product/gherkin-tests.md).

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27
**Tooling:** Vitest (unit + integration), Playwright (E2E)

---

## Test types

| Type | Mandatory? | What it covers here |
|------|-----------|---------------------|
| **Unit** | Yes | Zustand store logic, block type constants, component rendering, evidence tag display |
| **Non-regression** | Yes | Conversation panel unaffected, landing page, auth flow |
| **Integration** | Yes | update_prd DB upsert, prd_versions creation, RLS policies on prd_blocks |
| **End-to-end** | Yes | Block appears after update_prd, sort order, page reload, animations |

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
| Conversation panel rendering | New PRD panel could affect layout | E2E: conversation panel renders independently |
| Landing page at `/` | No change to landing route | E2E: landing page loads |
| Auth flow (magic link) | No change to auth | E2E: auth flow unaffected |
| Sessions table RLS | New prd_blocks table could interact | Integration: sessions RLS unchanged |

---

## Unit tests

### Zustand store (`src/stores/wizard-store.ts`)

| Test | File | Description |
|------|------|-------------|
| `wizard-store.test.ts` | `__tests__/stores/wizard-store.test.ts` | `updateBlock` adds new block to store |
| | | `updateBlock` updates existing block content |
| | | `updateBlock` updates evidence tags |
| | | `updateBlock` sets lastUpdatedBlockType for animation |
| | | `hydrateBlocks` populates blocks map keyed by blockType |
| | | `hydrateBlocks` overwrites existing blocks (full rehydration) |
| | | `setConfidenceScore` updates score and recommendation |
| | | `advanceStep` increments from 1 to 2 |
| | | `advanceStep` does not exceed 4 |
| | | `togglePrdPanel` toggles isPrdPanelCollapsed |
| | | `clearLastUpdated` resets lastUpdatedBlockType to null |

### Block type constants (`src/lib/prd/block-types.ts`)

| Test | File | Description |
|------|------|-------------|
| `block-types.test.ts` | `__tests__/lib/prd/block-types.test.ts` | BLOCK_TYPES has exactly 12 entries |
| | | BLOCK_SORT_ORDER has an entry for every block type |
| | | BLOCK_SORT_ORDER values are 1-12 with no gaps |
| | | BLOCK_HEADINGS has an entry for every block type |
| | | BLOCK_PLACEHOLDER has an entry for every block type |
| | | BLOCK_STEP maps blocks to correct steps |

### PrdViewer component (`src/components/prd/prd-viewer.tsx`)

| Test | File | Description |
|------|------|-------------|
| `prd-viewer.test.tsx` | `__tests__/components/prd/prd-viewer.test.tsx` | Renders 12 block slots |
| | | Renders PrdBlock for filled blocks |
| | | Renders PrdBlockPlaceholder for empty blocks |
| | | Blocks appear in correct sort order |
| | | readOnly prop hides refine buttons |

### PrdBlock component (`src/components/prd/prd-block.tsx`)

| Test | File | Description |
|------|------|-------------|
| `prd-block.test.tsx` | `__tests__/components/prd/prd-block.test.tsx` | Renders heading text |
| | | Renders markdown content (bold, lists, headers) |
| | | Renders evidence tags as badges |
| | | Shows refine button on hover (when not readOnly) |
| | | Hides refine button when readOnly |
| | | Applies highlight class when isJustUpdated |
| | | Removes highlight class after timeout |

### PrdBlockPlaceholder component

| Test | File | Description |
|------|------|-------------|
| `prd-block-placeholder.test.tsx` | `__tests__/components/prd/prd-block-placeholder.test.tsx` | Renders heading |
| | | Renders placeholder text |
| | | Has reduced opacity (muted styling) |
| | | Has dashed border |

### EvidenceTag component (`src/components/prd/evidence-tag.tsx`)

| Test | File | Description |
|------|------|-------------|
| `evidence-tag.test.tsx` | `__tests__/components/prd/evidence-tag.test.tsx` | `evidence` tag renders green badge with "[Evidence]" |
| | | `assumption` tag renders amber badge with "[Assumption]" |
| | | `to_verify` tag renders red badge with "[To verify]" |
| | | Badge has title attribute with claim text |
| | | Badge has aria-label for accessibility |

### PrdHeader component

| Test | File | Description |
|------|------|-------------|
| `prd-header.test.tsx` | `__tests__/components/prd/prd-header.test.tsx` | Renders PRD title |
| | | Shows score when available (with correct color) |
| | | Shows recommendation label |
| | | Shows empty state message when no score |
| | | readOnly hides action buttons |

---

## Integration tests

| Test | File | Gherkin | Description |
|------|------|---------|-------------|
| `prd-blocks-rls.test.ts` | `__tests__/db/prd-blocks-rls.test.ts` | -- | Authenticated user can read own PRD blocks |
| | | -- | Authenticated user cannot read others' blocks |
| | | -- | Public PRD blocks readable without auth |
| `update-prd-upsert.test.ts` | `__tests__/lib/ai/update-prd-upsert.test.ts` | SC-PLB-1 | First insert creates new block row |
| | | SC-PLB-2 | Second insert for same block_type updates (UPSERT) |
| | | -- | Unique constraint prevents duplicate (prd_id, block_type) |
| | | -- | Version snapshot created on each upsert |
| | | -- | confidence_score update propagates to prds table |

---

## End-to-end tests (Playwright)

| Test | File | Gherkin | Description |
|------|------|---------|-------------|
| `block-rendering.spec.ts` | `e2e/prd/block-rendering.spec.ts` | SC-PLB-1 | update_prd call -> block appears in PRD panel within 500ms |
| | | SC-PLB-2 | Existing block updates with animation (no duplicate) |
| | | SC-PLB-3 | Auto-scroll to new block. Manual scroll pauses auto-scroll. |
| `evidence-tags.spec.ts` | `e2e/prd/evidence-tags.spec.ts` | SC-PLB-4 | Each tag type renders with correct color |
| | | SC-PLB-5 | Block with mixed tags renders all three |
| `sort-order.spec.ts` | `e2e/prd/sort-order.spec.ts` | SC-PLB-6 | Blocks maintain fixed sort order regardless of creation order |
| | | SC-PLB-6 | Out-of-order block creation still sorts correctly |
| `empty-states.spec.ts` | `e2e/prd/empty-states.spec.ts` | SC-PLB-7 | 12 placeholders shown at session start |
| | | SC-PLB-7 | Placeholder replaced when block is filled (animated) |
| `complete-prd.spec.ts` | `e2e/prd/complete-prd.spec.ts` | SC-PLB-8 | All 12 blocks filled after step 4 completion |
| | | SC-PLB-9 | Header shows title, score, recommendation, buttons |
| `confidence-score.spec.ts` | `e2e/prd/confidence-score.spec.ts` | SC-PLB-10 | Score appears after step 3 with correct value and color |
| | | SC-PLB-11 | Score shows empty state before step 3 |
| `markdown-rendering.spec.ts` | `e2e/prd/markdown-rendering.spec.ts` | SC-PLB-12 | Markdown formatting (headers, bold, lists, blockquotes) renders correctly |
| `independent-scroll.spec.ts` | `e2e/prd/independent-scroll.spec.ts` | SC-PLB-13 | PRD panel scrolls independently from conversation |
| `store-sync.spec.ts` | `e2e/prd/store-sync.spec.ts` | SC-PLB-14 | Page reload restores all blocks, tags, and score from DB |

---

## Traceability -- Gherkin scenario -> automated test

| Gherkin | US | Test type | Automated test | Status |
|---------|-----|-----------|---------------|--------|
| SC-PLB-1 | US-PLB-1 | Integration + E2E | update-prd-upsert.test.ts, block-rendering.spec.ts | To write |
| SC-PLB-2 | US-PLB-1 | Integration + E2E | update-prd-upsert.test.ts, block-rendering.spec.ts | To write |
| SC-PLB-3 | US-PLB-1 | E2E | block-rendering.spec.ts | To write |
| SC-PLB-4 | US-PLB-2 | Unit + E2E | evidence-tag.test.tsx, evidence-tags.spec.ts | To write |
| SC-PLB-5 | US-PLB-2 | E2E | evidence-tags.spec.ts | To write |
| SC-PLB-6 | US-PLB-3 | Unit + E2E | block-types.test.ts, sort-order.spec.ts | To write |
| SC-PLB-7 | US-PLB-3 | Unit + E2E | prd-viewer.test.tsx, empty-states.spec.ts | To write |
| SC-PLB-8 | US-PLB-4 | E2E | complete-prd.spec.ts | To write |
| SC-PLB-9 | US-PLB-4 | Unit + E2E | prd-header.test.tsx, complete-prd.spec.ts | To write |
| SC-PLB-10 | US-PLB-5 | E2E | confidence-score.spec.ts | To write |
| SC-PLB-11 | US-PLB-5 | Unit + E2E | prd-header.test.tsx, confidence-score.spec.ts | To write |
| SC-PLB-12 | -- | E2E | markdown-rendering.spec.ts | To write |
| SC-PLB-13 | -- | E2E | independent-scroll.spec.ts | To write |
| SC-PLB-14 | -- | Integration + E2E | store-sync.spec.ts | To write |

---

## Coverage expectations

- **Critical paths:** 100% coverage for Zustand store actions, block type constants, and
  evidence tag rendering.
- **Components:** All components tested for rendering, props variations, and edge cases
  (empty content, missing tags, long markdown).
- **Integration:** update_prd UPSERT behavior fully covered (insert, update, duplicate
  prevention, version creation).
- **E2E:** At minimum, a block appearing after an update_prd call and persisting across
  page reload must pass before merge.
