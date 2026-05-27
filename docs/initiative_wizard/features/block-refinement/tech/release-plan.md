# Release Plan -- Block Refinement

**Status:** Draft -- **Author:** Hugo -- **Date:** 2026-05-27

---

## Branching

- **Source branch:** `staging`
- **Feature branch:** `feat/block-refinement`
- **Merge target:** `staging` (via PR, squash merge)
- **Naming convention:** All commits prefixed with `feat(refine):` or `chore(refine):`

---

## Atomic commits

| # | Commit | Scope | Tests | Depends on |
|---|--------|-------|-------|------------|
| 1 | `feat(refine): add refine request Zod schema` | `src/lib/schemas/refine.ts` | Unit: UUID validation, instruction min/max, empty strings | -- |
| 2 | `feat(refine): add refine-popover component` | `src/components/prd/refine-popover.tsx` | Unit: renders textarea + buttons, handles open/close, disables during loading | shadcn Popover |
| 3 | `feat(refine): add hover refine button to prd-block` | `src/components/prd/prd-block.tsx` | Unit: button visible on hover (group-hover), hidden during refining | prd-live-builder (prd-block must exist) |
| 4 | `feat(refine): add refinement prompt builder` | `src/lib/ai/prompts/refine.ts` | Unit: correct prompt assembly with block content, instruction, PRD context |  -- |
| 5 | `feat(refine): add OpenRouter model helper` | `src/lib/ai/model.ts` | Unit: returns model instance, reads env var | -- |
| 6 | `feat(refine): add rate limiter utility` | `src/lib/rate-limit.ts` | Unit: allows under limit, blocks over limit, resets after window | -- |
| 7 | `feat(refine): add POST /api/refine route` | `src/app/api/refine/route.ts` | Integration: Zod validation, auth check, streaming response, DB updates | #1, #4, #5, #6 |
| 8 | `feat(refine): add useRefineBlock hook` | `src/hooks/use-refine-block.ts` | Unit: calls API, updates store on success, rolls back on error | #7 |
| 9 | `feat(refine): wire client flow (popover -> API -> store update)` | `refine-popover.tsx`, `prd-block.tsx`, `use-refine-block.ts` | E2E: hover -> click -> type -> submit -> block updates | #2, #3, #8 |
| 10 | `feat(refine): add auto-versioning on refinement completion` | `src/app/api/refine/route.ts` (onFinish) | Integration: prd_versions row created after refinement | #7 |
| 11 | `feat(refine): add error handling + rollback on failure` | `use-refine-block.ts`, `refine-popover.tsx` | Unit: original content restored on error, error message displayed, popover stays open | #8 |

**Notes:**
- Commits 1, 4, 5, 6 are independent and can be authored in parallel.
- Commit 3 modifies `prd-block.tsx` which is created by the `prd-live-builder` feature. This feature branch must be based on a staging that includes `prd-live-builder`.

---

## Prerequisites / external dependencies

| Dependency | Status | Blocks |
|------------|--------|--------|
| `prd-live-builder` feature merged | Not started | Commit #3 (`prd-block.tsx` must exist to add hover behavior) |
| `conversation-engine` feature merged | Not started | Full integration (refinement exchange logged in conversation panel) |
| Supabase migration for `prd_blocks` + `prd_versions` tables | Not created | Commit #7 (API reads/writes these tables) |
| OpenRouter API key configured in `.env.local` | Not verified | Commit #7 (API calls OpenRouter) |
| shadcn Popover component installed | Need to check | Commit #2 (`npx shadcn@latest add popover`) |
| `OPENROUTER_MODEL` env var set | Not verified | Commit #5 (model helper reads it) |

---

## Release sequencing

1. **Pre-flight:**
   - Ensure `prd-live-builder` is merged to `staging`.
   - Ensure `conversation-engine` is merged (for conversation panel integration).
   - Install shadcn Popover if not present: `npx shadcn@latest add popover`.
   - Verify OpenRouter API key and model env vars in `.env.local`.
   - Ensure Supabase migration for `prd_blocks` and `prd_versions` is applied locally.
2. **Feature branch development:** Commits 1-11 on `feat/block-refinement`.
3. **PR to staging:** Squash merge after review.
4. **Staging validation:**
   - Open a session with a generated PRD (requires conversation-engine).
   - Hover over a block -- verify refine button appears.
   - Click, type instruction, submit -- verify block updates with streaming.
   - Verify only the targeted block changed.
   - Verify prd_versions row was created.
   - Simulate error (disconnect network) -- verify rollback.
5. **Merge to main:** Only after all dependencies are also on main.

---

## Rollback

| Scenario | Action |
|----------|--------|
| Refinement API returns 500 | Client rolls back block content to original. User sees error message. No data corruption. |
| Streaming interrupts mid-block | Client has accumulated partial content. `onFinish` callback does not fire, so DB is NOT updated. Block shows partial content in UI but DB retains the original. Refresh the page to restore from DB. |
| Rate limiter too aggressive | Adjust `maxRequests` constant in `src/lib/rate-limit.ts`. No migration needed. |
| Full rollback needed | Revert the merge commit on `staging`. PRD blocks still render (from prd-live-builder) but without the refine button. No data loss. |

---

## Definition of Done checklist

- [ ] `src/lib/schemas/refine.ts` exports `refineRequestSchema` with UUID + instruction validation
- [ ] `src/components/prd/refine-popover.tsx` renders textarea + "Refiner" button in a Popover
- [ ] `src/components/prd/prd-block.tsx` shows refine button on hover, hides during refinement
- [ ] `src/lib/ai/prompts/refine.ts` exports `buildRefinePrompt()` with system prompt + user message
- [ ] `src/lib/ai/model.ts` exports `getOpenRouterModel()` reading from env
- [ ] `src/lib/rate-limit.ts` exports `checkRateLimit()` with configurable window/max
- [ ] `src/app/api/refine/route.ts` handles POST, validates, streams, persists
- [ ] `src/hooks/use-refine-block.ts` calls API, updates store progressively, rolls back on error
- [ ] Unit: Zod schema validates correctly (UUIDs, instruction length)
- [ ] Unit: Prompt builder assembles correct content
- [ ] Unit: Rate limiter allows/blocks correctly
- [ ] Unit: Popover opens/closes, disables during refinement
- [ ] Unit: useRefineBlock rolls back on error
- [ ] Integration: POST /api/refine returns streaming response
- [ ] E2E: Hover -> click -> type -> submit -> block updates
- [ ] E2E: Only targeted block changes, others unchanged
- [ ] E2E: Error shows message, popover stays open, instruction preserved
- [ ] DB: prd_versions row created after each refinement
- [ ] PostHog `block_refined` event fires on successful refinement
- [ ] `.ai-context/` updated with new API route and components
