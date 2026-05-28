# Technical Spec — PRD Versioning

> Overview and index of the technical documentation for the PRD Versioning feature.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27
**Feature:** [`../README.md`](../README.md) · **PRD:** [`../../../prd.md`](../../../prd.md)

---

## Summary

PRD Versioning provides a lightweight audit trail for PRD changes. Each time the conversation
engine generates a PRD block (via `update_prd` tool) or the PM refines a block (via the block
refinement flow), a version entry is automatically created in the `prd_versions` table. The PM
can browse a chronological list of versions from the PRD panel header and view any past version
as a read-only snapshot.

**V1 scope:**
- Auto-versioning on generation and refinement (automatic, no user action).
- Version history list (newest first).
- Read-only view of past version content.

**Explicitly not in V1:**
- Diff view between versions.
- Restore/rollback to a previous version.
- Version naming or annotation.
- Full-PRD snapshots (only per-block snapshots).

---

## Architecture Overview

```
conversation-engine (/api/chat)
  └── AI calls update_prd tool
        ├── Upsert prd_blocks row
        └── Call createVersion(prdId, blockId, content, 'generation')
              └── INSERT prd_versions (auto-increment version_number per PRD)

block-refinement (/api/refine)
  └── AI regenerates single block
        ├── Update prd_blocks row
        └── Call createVersion(prdId, blockId, content, 'refinement')
              └── INSERT prd_versions

PRD panel header
  └── "Version history" button
        └── GET /api/prd/[prdId]/versions
              └── Returns version list (id, version_number, block_type, trigger, created_at)

Version history panel
  └── Click a version entry
        └── Display content_snapshot in read-only view
```

---

## Sub-specifications

| Document | Scope |
|----------|-------|
| [`data-model.md`](data-model.md) | `prd_versions` table, indexes, RLS, version numbering |
| [`api.md`](api.md) | Version creation helper, GET versions endpoint |
| [`release-plan.md`](release-plan.md) | Branch strategy, commit sequence, dependencies |
| [`test-plan.md`](test-plan.md) | Unit / integration / E2E test mapping to Gherkin scenarios |

---

## Key Design Decisions

1. **Per-block snapshots, not full-PRD snapshots.** Each version row stores the content of a
   single block at the moment it was created or refined. This is storage-efficient and maps
   naturally to the block-level interaction model. Full-PRD snapshots (`block_id = NULL`) are
   schema-ready but not used in V1.

2. **Sequential version numbering per PRD.** Version numbers are sequential per PRD (not per
   block, not globally). This gives a simple, human-readable timeline: "Version 1, 2, 3..."
   regardless of which block was affected.

3. **Immutable version rows.** Version entries are never updated or deleted. They are append-only.
   This ensures the audit trail is reliable and tamper-evident.

4. **No restore in V1.** Viewing a past version is read-only. Restoring a block to a previous
   version would require updating `prd_blocks` and creating a new version entry with the
   restored content. This adds complexity and is deferred.

5. **Trigger column for context.** Each version records whether it was created by `'generation'`
   (initial block creation during conversation) or `'refinement'` (block refinement by the PM).
   This provides context in the version history list without needing to parse content.

---

## Dependencies

- **`prd-live-builder`** — the `update_prd` tool must exist for generation-triggered versioning.
- **`block-refinement`** — the `/api/refine` endpoint must exist for refinement-triggered
  versioning.
- **`deferred-auth`** — the `prds` and `prd_blocks` tables must exist.
- **`conversation-engine`** — the `/api/chat` route must exist (version creation hooks into
  it).

This feature is sequenced after all its dependencies (position 7 in the feature breakdown).

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Version table grows large for heavily refined PRDs | Low | Low | Max ~100 versions per PRD in realistic usage; no pagination needed in V1 |
| Version creation adds latency to update_prd / refine | Low | Low | Single INSERT, indexed table, negligible latency |
| Version numbering gaps (if INSERT fails) | Low | Low | Gaps are cosmetic — version_number is display-only, not a FK |
