# AI Context — Block Refinement

> Block refinement lets the user rewrite a single PRD block in place by typing a natural language
> instruction. The "Affiner" button on every filled `PrdBlock` opens a popover that calls a
> structured AI endpoint and applies the response to both Dexie and the Zustand store.

> _Last verified: 2026-05-28 against branch `feat/block-refinement`._

---

## Architecture at a glance

```
PrdBlock (right panel, filled blocks only)
  └── RefinePopover (children = the "Affiner" Button)
        ├── textarea + submit button + inline error
        ├── useRefineBlock() hook
        │     ├── snapshots wizardStore.blocks → allBlocks[]
        │     ├── POST /api/refine { sessionId, blockType, currentContent, instruction, allBlocks, step }
        │     ├── on 2xx:
        │     │     ├── wizardStore.updateBlock(type, content, evidence_tags, step)
        │     │     └── upsertPrdBlock({...}) → Dexie
        │     └── on error: setError, no state mutation
        └── isRefining locks the popover until the request resolves
```

---

## API: `POST /api/refine`

Stateless w.r.t. the DB. The client is the source of truth for the PRD context; the route
forwards it to the model and returns a typed object.

**Body** (validated by `refineRequestSchema` in `src/lib/schemas/refine.ts`):

| Field | Type | Notes |
|-------|------|-------|
| `sessionId` | UUID | Used only for telemetry / future audit; the route does not query Dexie. |
| `blockType` | `BlockType` enum | The target block. |
| `currentContent` | string (1..10 000) | Markdown of the block before refinement. |
| `instruction` | string (1..1000, trimmed) | Natural-language directive. |
| `allBlocks` | array of `{ blockType, content, sortOrder }` | Full PRD context for coherence. |
| `step` | int 1..4 | Used by the client to re-persist the block; round-tripped. |

**Response (2xx):** `{ content: string, evidence_tags: EvidenceTag[] }`. Both validated by an
`Output.object` schema using the shared `EvidenceTagSchema` from `src/lib/ai/tools.ts`.

**Errors:** 400 on Zod failure, 500 on AI provider failure. No 401/429 in V1 (no auth, no
rate-limit).

**Model:** `conversationModel()` (same as `/api/chat`). Pattern: `generateText({ output:
Output.object({ schema }) })` (the non-deprecated v6 path; `generateObject` was deprecated).
`maxDuration = 60`.

---

## Hook: `useRefineBlock` (`src/hooks/use-refine-block.ts`)

```ts
const { refine, isRefining, error, clearError } = useRefineBlock();
await refine({ blockType, currentContent, instruction, step }); // returns boolean
```

- Reads `sessionId` + `blocks` from `useWizardStore.getState()` (no subscription — one-shot).
- Snapshots `allBlocks` from the non-null entries of `blocks`.
- On success: calls `wizardStore.updateBlock(type, content, evidence_tags, step)` then
  `upsertPrdBlock({...})`. `updateBlock` is the same action used by `update_prd` from the
  conversation engine.
- On failure: sets `error`, returns `false`. The store and Dexie are not touched.

The hook does not pass `confidence` to `updateBlock`. Refinement never re-derives the global
confidence score; that field stays owned by the `confidence_score` block's original write from
step 3. See the `confidence` invariant in [`prd-live-builder.md`](prd-live-builder.md).

---

## UI: `RefinePopover` (`src/components/prd/refine-popover.tsx`)

Uses the shadcn Popover (Base UI–backed). The trigger is rendered via the `render` prop so the
"Affiner" button stays the actual trigger element.

- `instruction` state (max 1000 chars, character counter shown).
- Submit gated by `trimmed.length > 0 && !isRefining`.
- `Loader2` spin during the call; popover refuses to close while `isRefining` is true.
- On success: clears the input and closes the popover. On failure: stays open, error shown.

---

## Invariants

> **Invariant — `/api/refine` does not read or write the DB**
> - **What:** The route only calls the model with the body it received. Persistence is
>   entirely client-side via `useRefineBlock` (`upsertPrdBlock` + `wizardStore.updateBlock`).
> - **Where:** `src/app/api/refine/route.ts`, `src/hooks/use-refine-block.ts`.
> - **Breaks if:** the route starts reading Dexie (impossible — Dexie is browser-only) or a
>   future Supabase migration adds server reads without updating the body contract → contract
>   drift between client and server.

> **Invariant — Refine re-uses the same Dexie write path as `update_prd`**
> - **What:** Both flows funnel writes through `upsertPrdBlock` in `src/lib/db/prd-blocks.ts`.
>   There is no second Dexie write path for blocks.
> - **Where:** `src/lib/db/prd-blocks.ts`, called from `conversation.tsx onToolCall` and
>   `useRefineBlock`.
> - **Breaks if:** another caller writes to `db.prdBlocks` directly (skips `upsertPrdBlock`) →
>   `sortOrder` may drift, `updatedAt` may not bump, future analytics miss the write.

> **Invariant — Refine never touches `confidenceScore` / `recommendation`**
> - **What:** `useRefineBlock` calls `updateBlock` without the `confidence` argument. Even if
>   the block being refined is `confidence_score`, the global score state and the
>   `db.sessions.confidenceScore` row are left untouched.
> - **Where:** `src/hooks/use-refine-block.ts`.
> - **Breaks if:** the hook starts passing `confidence` or the AI prompt is changed to ask for
>   a structured score in the refinement output → the score header could be silently rewritten
>   by a refinement on an unrelated block.

---

## V1 scope — deviations from `docs/initiative_wizard/features/block-refinement/`

The doc's tech spec assumes Supabase + auth + versioning + streaming. The shipped V1 differs:

| Spec feature | V1 status | Why |
|--------------|-----------|-----|
| `prd_versions` insert | not implemented | No table in Dexie; `prd-versioning` feature is post-démo. |
| Auth check (`auth.getUser`) | not implemented | V1 is anonymous (see `decisions.md`). |
| `enhanced_anon_id` cookie | not implemented | Same. |
| Rate limiting (10/min/user) | not implemented | Single-user demo. |
| Streaming progressive text | not implemented | `Output.object` returns the full object; ~2–4 s wait before the block updates. |
| Conversation panel log | not implemented | Out of V1 scope. |
| Vitest / Playwright tests | not implemented | Manual smoke is enough for the demo. |

When Supabase is reintroduced, the route needs auth + ownership check + `prd_versions` insert,
and the body contract can drop `allBlocks` in favour of a server-side SELECT.
