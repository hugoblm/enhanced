# Release Plan — PRD Live Builder

> How the PRD Live Builder gets built and shipped: atomic commits, sequenced by dependency.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27
**PRD:** [`../../../prd.md`](../../../prd.md) · **Technical spec:** [`technical-spec.md`](technical-spec.md) · **Test plan:** [`test-plan.md`](test-plan.md)

---

## Branching

- Branch from `staging`: `feat/prd-live-builder`
- Open a PR into `staging`; merge to `main` is a separate release step.
- Plan for 8 atomic commits.

## Dependencies

| Dependency | Feature | What's needed | Status |
|-----------|---------|--------------|--------|
| `prds` table | deferred-auth | Table must exist (created in deferred-auth migration) | Planned |
| `update_prd` tool | conversation-engine | Tool definition + execute function | Planned |
| Wizard shell | wizard-shell | Split-view layout must exist to host the PRD panel | Planned |

**Strategy:** The PRD Live Builder's components (prd-viewer, prd-block, etc.) can be built
independently of the conversation engine. The integration (wiring update_prd tool results to
the Zustand store) is the final commit. The `prd_blocks` and `prd_versions` migrations can be
applied independently of the conversation engine.

---

## Commit / PR breakdown

| # | Commit title | Scope (one logical change) | Tests added | Depends on |
|---|-------------|----------------------------|-------------|------------|
| 1 | Add prd_blocks table migration | `supabase/migrations/YYYYMMDDHHMMSS_create_prd_blocks.sql` — table, unique constraint, indexes, RLS, updated_at trigger. | Integration: migration runs clean. RLS policies work as expected. | prds table (deferred-auth) |
| 2 | Add prd_versions table migration | `supabase/migrations/YYYYMMDDHHMMSS_create_prd_versions.sql` — table, indexes, RLS. | Integration: migration runs clean. | prds table (deferred-auth), prd_blocks (#1) |
| 3 | Add block type constants and shared types | `src/lib/prd/block-types.ts` — BLOCK_TYPES, BLOCK_SORT_ORDER, BLOCK_HEADINGS, BLOCK_PLACEHOLDER, BLOCK_STEP. `src/lib/prd/types.ts` — shared TypeScript types. | Unit: all 12 block types have sort order, heading, placeholder. | -- |
| 4 | Add Zustand wizard-store | `src/stores/wizard-store.ts` — full store with all actions. | Unit: updateBlock updates state correctly. Unit: hydrateBlocks populates blocks map. Unit: advanceStep increments. | 3 |
| 5 | Add prd-viewer + prd-block + placeholder components | `src/components/prd/prd-viewer.tsx`, `prd-block.tsx`, `prd-block-placeholder.tsx`, `prd-header.tsx`. | Unit: PrdViewer renders 12 slots. Unit: PrdBlock renders markdown content. Unit: placeholder renders muted text. | 3, 4 |
| 6 | Add evidence-tag component | `src/components/prd/evidence-tag.tsx` — colored badge with accessible text. | Unit: correct color for each tag type. Unit: accessible label present. | -- |
| 7 | Wire update_prd tool results to Zustand store | `useUpdatePrdSync` hook. Integration between useChat messages and wizardStore.updateBlock(). | Integration: tool result triggers store update. | 4, conversation-engine |
| 8 | Add block update animation + auto-scroll | CSS transition for new/updated blocks (ring highlight). Auto-scroll with manual-scroll pause. Regenerate Supabase types. | Unit: animation class applied on lastUpdatedBlockType. E2E: block appears in PRD panel after update_prd. | 5, 7 |

---

## Release sequencing

- **Feature flag:** None — the PRD panel is a core UI element. It renders empty placeholders
  by default, which is a valid initial state.
- **Migrations:** `prd_blocks` and `prd_versions` migrations must be applied before the code
  that writes to these tables (the `update_prd` tool from conversation-engine). Apply
  migrations to staging before deploying the conversation-engine feature.
- **Order of deploy:**
  1. Apply `prd_blocks` + `prd_versions` migrations to staging Supabase
  2. Deploy feat/prd-live-builder to staging (Vercel preview)
  3. Verify: PRD panel renders 12 empty placeholders
  4. Deploy feat/conversation-engine (which writes to the tables)
  5. Verify: update_prd tool calls populate the PRD panel in real time
  6. Merge both to `staging`
- **Staging -> production:** PRD panel renders correctly with all 12 block types. Evidence
  tags display with correct colors. Auto-scroll works. Page reload preserves state.

---

## Rollback

- **Trigger:** PRD panel crashes, blocks render incorrectly, or evidence tags display wrong
  data.
- **How:** Revert the `feat/prd-live-builder` merge commit. The PRD panel disappears from
  the wizard layout. The conversation engine continues to work (it writes blocks to DB but
  nothing renders them). Migrations do NOT need to be rolled back.
- **Data safety:** No data loss. PRD blocks persist in the database regardless of whether the
  panel is rendered. Reverting the UI does not affect the data.

---

## Definition of Done (merge checklist)

- [ ] `prd_blocks` and `prd_versions` tables created with correct constraints and RLS
- [ ] All 12 block types render with correct headings and sort order
- [ ] Empty placeholders shown for unfilled blocks (with step-specific text)
- [ ] Filled blocks render markdown content correctly (via react-markdown)
- [ ] Evidence tags display as colored badges (green/amber/red) with accessible text
- [ ] Zustand store updates reactively when update_prd tool results arrive
- [ ] Block update animation works (ring highlight on new/updated blocks)
- [ ] Auto-scroll to updated blocks works (with manual-scroll pause)
- [ ] Page reload restores all blocks from DB
- [ ] PRD header shows title, confidence score (when available), and recommendation
- [ ] readOnly mode hides refine buttons (for public sharing)
- [ ] Unit + integration tests pass (see [`test-plan.md`](test-plan.md))
- [ ] 14 Gherkin scenarios covered
- [ ] Manual smoke pass done (see [`../product/manual-tests.md`](../product/manual-tests.md))
- [ ] `.ai-context/` updated with PRD panel domain documentation
- [ ] Supabase types regenerated
- [ ] Feature README status updated from `Planned` to `Implemented`
