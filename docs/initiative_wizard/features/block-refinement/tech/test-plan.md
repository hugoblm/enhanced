# Test Plan (Automated) -- Block Refinement

**Status:** Draft -- **Author:** Hugo -- **Date:** 2026-05-27
**Tooling:** Vitest (unit) + Playwright (e2e)

---

## Test types

### Unit tests (Vitest)

**File:** `src/lib/schemas/__tests__/refine.test.ts`

| Test | Input | Expected |
|------|-------|----------|
| Valid request | `{ prd_id: valid UUID, block_id: valid UUID, instruction: "raccourcis" }` | `success: true` |
| Invalid prd_id (not UUID) | `{ prd_id: "not-a-uuid", ... }` | `success: false`, error "prd_id invalide" |
| Invalid block_id (not UUID) | `{ block_id: "abc", ... }` | `success: false`, error "block_id invalide" |
| Empty instruction | `{ instruction: "", ... }` | `success: false`, error "ne peut pas etre vide" |
| Whitespace-only instruction | `{ instruction: "   ", ... }` | `success: false` (trim reduces to empty) |
| Instruction too long (> 1000 chars) | 1001-character instruction | `success: false`, error "1000 caracteres" |
| Instruction at max length (1000 chars) | 1000-character instruction | `success: true` |
| Missing prd_id | `{ block_id: UUID, instruction: "test" }` | `success: false` |
| Missing all fields | `{}` | `success: false` |

**File:** `src/lib/ai/prompts/__tests__/refine.test.ts`

| Test | Setup | Expected |
|------|-------|----------|
| System prompt is non-empty | Call `buildRefinePrompt()` | `systemPrompt` contains "raffine" and "evidence" |
| User message includes block content | Target block with content "Test content" | `userMessage` contains "Test content" |
| User message includes instruction | Instruction "ajoute des metriques" | `userMessage` contains "ajoute des metriques" |
| User message includes full PRD context | 3 blocks provided | `userMessage` contains all 3 block types |
| PRD context is sorted by sort_order | Blocks with sort_order 3, 1, 2 | Blocks appear in order 1, 2, 3 in the message |
| Block type labels are formatted | block_type "target_audience" | `userMessage` contains "Public cible" |
| Unknown block type passes through | block_type "custom_section" | `userMessage` contains "custom_section" |

**File:** `src/lib/__tests__/rate-limit.test.ts`

| Test | Action | Expected |
|------|--------|----------|
| First request allowed | `checkRateLimit("user1", { maxRequests: 10, windowMs: 60000 })` | `{ allowed: true, remaining: 9 }` |
| 10th request allowed | 10 calls with same key | Last returns `{ allowed: true, remaining: 0 }` |
| 11th request blocked | 11 calls with same key within window | Returns `{ allowed: false, remaining: 0 }` |
| Different keys independent | 10 calls "user1", then 1 call "user2" | "user2" returns `{ allowed: true }` |
| Resets after window | 10 calls, advance clock past windowMs, 1 more call | Returns `{ allowed: true }` |
| Zero maxRequests | `{ maxRequests: 0 }` | First call returns `{ allowed: false }` |

**File:** `src/components/prd/__tests__/refine-popover.test.tsx`

| Test | Action | Expected |
|------|--------|----------|
| Renders textarea and buttons when open | Mount with `open={true}` | Textarea, "Refiner" button, "Annuler" button visible |
| Textarea is empty on first open | Mount with `open={true}` | Textarea value is empty |
| Submit disabled when instruction empty | Mount, don't type | "Refiner" button is disabled |
| Submit enabled when instruction typed | Type "raccourcis" | "Refiner" button is enabled |
| Textarea disabled during refinement | Mock `useRefineBlock` with `isRefining: true` | Textarea has `disabled` attribute |
| Error message displayed | Mock `useRefineBlock` with `error: "Erreur"` | Error paragraph visible with "Erreur" |
| Annuler closes popover | Click "Annuler" | `onOpenChange(false)` called |
| Submit calls refine with correct params | Type instruction, click "Refiner" | `refine()` called with `{ prdId, blockId, instruction }` |

**File:** `src/components/prd/__tests__/prd-block.test.tsx`

| Test | Action | Expected |
|------|--------|----------|
| Refine button hidden by default | Mount block | Button has `opacity-0` class |
| Refine button visible on hover | Simulate hover (add `group-hover` class) | Button has `opacity-100` class |
| Refine button hidden during refinement | Mount with `isRefining={true}` | Button has `hidden` class |
| Click refine button opens popover | Click refine button | Popover is open |
| Loading overlay during refinement | Mount with `isRefining={true}` | Overlay with "Raffinement en cours..." visible |

**File:** `src/hooks/__tests__/use-refine-block.test.ts`

| Test | Setup | Expected |
|------|-------|----------|
| Successful refinement updates store | Mock fetch returning streaming response | `updateBlockContent` called with accumulated text, returns `true` |
| Failed refinement rolls back | Mock fetch returning 500 | `updateBlockContent` called with original content, `error` is set, returns `false` |
| Network error rolls back | Mock fetch throwing TypeError | `updateBlockContent` called with original content, `error` is set |
| isRefining true during request | Start refinement | `isRefining` is `true` until complete |
| isRefining false after success | Complete refinement | `isRefining` is `false` |
| isRefining false after failure | Failed refinement | `isRefining` is `false` |
| setBlockRefining called correctly | Start + complete | Called with `(blockId, true)` then `(blockId, false)` |

### Integration tests (Vitest with mocked Supabase)

**File:** `src/app/api/refine/__tests__/route.test.ts`

| Test | Setup | Expected |
|------|-------|----------|
| Returns 400 on invalid body | POST with `{ prd_id: "not-uuid" }` | Status 400, body `{ error: "prd_id invalide" }` |
| Returns 400 on empty instruction | POST with valid UUIDs, instruction "" | Status 400 |
| Returns 401 without auth | No user session, no anonymous cookie | Status 401 |
| Returns 404 on missing block | Valid auth, non-existent block_id | Status 404 |
| Returns 404 on wrong ownership | Valid auth but session belongs to another user | Status 404 or 401 |
| Returns 429 when rate limited | 11 requests within 60s | Status 429 on 11th |
| Returns 200 with streaming body | Valid request, mocked AI response | Status 200, response body is a ReadableStream |
| Persists new content on success | Complete request | `prd_blocks.update` called with new content |
| Creates version on success | Complete request | `prd_versions.insert` called with trigger "refinement" |

### E2E tests (Playwright)

**File:** `e2e/block-refinement.spec.ts`

| Test | Steps | Expected |
|------|-------|----------|
| Refine button on hover | Navigate to session with PRD blocks, hover over a block | "Refine" button appears |
| Refine button disappears on mouse leave | Hover then move away | Button disappears |
| Full refinement flow | Hover -> click refine -> type "ajoute des metriques" -> submit | Block content updates, popover closes, other blocks unchanged |
| Block streams progressively | Submit refinement, observe | Block content updates token by token (not all at once) |
| Only targeted block changes | Capture all block hashes before, refine one, capture after | Only the refined block hash differs |
| Error shows message + preserves instruction | Intercept API to return 500, submit refinement | Error message visible, popover open, instruction text preserved |
| Rollback on error | Intercept API to return 500 | Block content is identical to pre-refinement |
| Rapid successive refinements | Refine block A, immediately refine block A again | Second refinement succeeds, no corruption |

---

## Non-regression

| Check | Why |
|-------|-----|
| Main conversation still works | Adding /api/refine must not break /api/chat or conversation flow |
| PRD rendering unaffected | Adding hover behavior to prd-block must not break existing rendering |
| PRD panel scroll still works | Popover and hover interactions must not interfere with panel scrolling |
| Step navigation still works | Refinement state must not affect wizard step indicator |
| Landing page still works | New API route and components must not affect marketing pages |

---

## Traceability -- Gherkin to automated test

| Gherkin scenario | US | Test type | Test path | Status |
|------------------|-----|-----------|-----------|--------|
| SC-BR-1 -- Refine button appears on hover | US-BR-1 | E2E + Unit | `e2e/block-refinement.spec.ts`, `prd-block.test.tsx` | Planned |
| SC-BR-2 -- Complete refinement flow | US-BR-1 | E2E | `e2e/block-refinement.spec.ts` | Planned |
| SC-BR-3 -- Block updates progressively | US-BR-2 | E2E | `e2e/block-refinement.spec.ts` | Planned |
| SC-BR-4 -- Refinement shortens a block | US-BR-3 | E2E | `e2e/block-refinement.spec.ts` | Planned |
| SC-BR-5 -- Refinement adds specific content | US-BR-3 | E2E | `e2e/block-refinement.spec.ts` | Planned |
| SC-BR-6 -- Refinement fails, error + rollback | US-BR-4 | E2E + Unit | `e2e/block-refinement.spec.ts`, `use-refine-block.test.ts` | Planned |
| SC-BR-7 -- Rapid successive refinements | US-BR-4 | E2E | `e2e/block-refinement.spec.ts` | Planned |
| SC-BR-8 -- Only targeted block modified | US-BR-1 | E2E | `e2e/block-refinement.spec.ts` | Planned |

---

## Coverage expectations

| Layer | Target |
|-------|--------|
| Zod schema (`refineRequestSchema`) | 100% branch coverage |
| Prompt builder (`buildRefinePrompt`) | All block types, sorting, instruction inclusion |
| Rate limiter (`checkRateLimit`) | 100% branch coverage (allow, block, reset, different keys) |
| API route (`/api/refine`) | All response codes (400, 401, 404, 429, 500, 200) |
| RefinePopover component | Open/close, submit, disabled states, error display |
| PrdBlock component | Hover states, refining overlay, button visibility |
| useRefineBlock hook | Success, failure, rollback, loading states |
| E2E | Happy path + error + scope isolation + progressive update |

---

## How to run

```bash
# Unit tests (Vitest)
npx vitest run src/lib/schemas/__tests__/refine.test.ts
npx vitest run src/lib/ai/prompts/__tests__/refine.test.ts
npx vitest run src/lib/__tests__/rate-limit.test.ts
npx vitest run src/components/prd/__tests__/refine-popover.test.tsx
npx vitest run src/components/prd/__tests__/prd-block.test.tsx
npx vitest run src/hooks/__tests__/use-refine-block.test.ts

# Integration tests (Vitest)
npx vitest run src/app/api/refine/__tests__/route.test.ts

# All unit + integration tests
npx vitest run

# E2E tests (Playwright) -- requires dev server + Supabase + OpenRouter API key
npx playwright test e2e/block-refinement.spec.ts

# E2E with UI (headed mode for debugging)
npx playwright test e2e/block-refinement.spec.ts --headed
```
