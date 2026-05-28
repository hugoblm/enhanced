# AI Context — PRD Live Builder

> The PRD live builder is the right panel of the wizard. It renders the 12 typed PRD blocks in
> a fixed order, fed by `update_prd` tool calls coming from the conversation engine. It is the
> tangible artifact that makes Enhanced "a tool, not a chatbot."

> _Last verified: 2026-05-28 against branch `feat/block-refinement`._

---

## Architecture at a glance

```
PrdPanel (wizard slot, transparent wrapper)
  └── PrdViewer (client component)
        ├── hydrates blocks + confidence from Dexie at mount
        │     (db.prdBlocks.where(sessionId) + db.sessions.get(sessionId))
        │     → wizardStore.hydrateBlocks(rows, score, recommendation)
        ├── subscribes to wizardStore: blocks, confidenceScore, recommendation,
        │     lastUpdatedBlockType, hydrateBlocks, clearLastUpdated
        ├── derives title from blocks.first_use_case.content first line (max 80 chars)
        │     with rawIdea fallback
        ├── renders PrdHeader (sticky, shrink-0): title + ScoreBadge + disabled
        │     Export PDF / Partager buttons
        ├── renders scrollable container with per-block ref map + onScroll handler
        │     (auto-scroll pause when distance from bottom > 50px)
        └── iterates BLOCK_TYPES (already in sortOrder): PrdBlock if filled,
              PrdBlockPlaceholder otherwise. Each PrdBlock receives clearLastUpdated
              directly as onAnimationEnd (stable Zustand action ref).
```

---

## Data flow (update_prd → re-render)

The `update_prd` tool is **client-resolved** by the conversation engine (no `execute`
server-side). The full path is:

```
AI streamText (server) emits tool call update_prd({ block_type, content, evidence_tags, confidence? })
  └── streamed SSE → useChat in Conversation
        └── onToolCall (conversation.tsx)
              ├── await upsertPrdBlock(sessionId, currentStep, input) → Dexie db.prdBlocks
              ├── useWizardStore.getState().updateBlock(
              │     input.block_type, input.content, input.evidence_tags ?? [],
              │     currentStep, input.confidence
              │   )
              │     ├── set blocks[type] = PrdBlockMirror (no id/sessionId)
              │     ├── set lastUpdatedBlockType = type
              │     └── if confidence && type === "confidence_score":
              │           → set confidenceScore + recommendation
              │           → db.sessions.update(sessionId, { confidenceScore, recommendation })
              │             (best-effort, catch + log)
              └── submit({ output: { written: block_type } }) → AI continues
PrdViewer re-renders (Zustand reactivity)
  └── PrdBlock (lastUpdatedBlockType === block.blockType) gets ring-2 highlight
        └── 1s setTimeout → onAnimationEnd → clearLastUpdated()
PrdViewer useEffect on [lastUpdatedBlockType]
  └── if !userScrolledAwayRef.current:
        blockRefs.current[lastUpdatedBlockType]?.scrollIntoView({ behavior: "smooth" })
```

---

## Invariants

> **Invariant — `db.prdBlocks` is the source of truth, the Zustand store mirrors it**
> - **What:** `wizardStore.blocks` is a render-only mirror. `db.prdBlocks` rows are written
>   exclusively by `upsertPrdBlock` in `src/lib/db/prd-blocks.ts`. `wizardStore.updateBlock`
>   never writes to `db.prdBlocks` — only to state.
> - **Where:** `src/lib/db/prd-blocks.ts` (the helper) called from `src/components/chat/conversation.tsx`
>   (update_prd flow) and `src/hooks/use-refine-block.ts` (refine flow). `src/stores/wizard-store.ts`.
> - **Breaks if:** another caller writes to `db.prdBlocks` directly without going through
>   `upsertPrdBlock` and forgets to call `wizardStore.updateBlock` — the store will be stale
>   until the next reload.

> **Invariant — `confidence` is a structured tool field, not parsed from markdown**
> - **What:** The `update_prd` tool input has an optional `confidence: { score, recommendation }`
>   field validated by Zod. The PRD header reads `state.confidenceScore` / `state.recommendation`
>   set directly from this field. The markdown `content` of the `confidence_score` block must
>   stay user-friendly (no embedded `Score: 78/100. Recommendation: build.` line).
> - **Where:** `src/lib/ai/tools.ts` (ConfidenceSchema), `src/lib/ai/prompts/step-3.ts`,
>   `src/stores/wizard-store.ts updateBlock`.
> - **Breaks if:** someone re-adds regex parsing of the content, or instructs the AI to embed
>   the score in the markdown — the rendered block becomes polluted and the score header may
>   diverge from the content.

> **Invariant — `confidence` only applies to `confidence_score` block**
> - **What:** `updateBlock` has a defensive gate
>   `confidence && blockType === "confidence_score"`. If a future caller passes `confidence` for
>   another block type, it is silently ignored.
> - **Where:** `src/stores/wizard-store.ts updateBlock`.
> - **Breaks if:** the gate is removed and another step accidentally includes a `confidence`
>   arg — the global score would be overwritten by an unrelated block.

> **Invariant — Block sort order comes from `BLOCK_TYPES` array, not from the data**
> - **What:** The 12 blocks render in the order of the `BLOCK_TYPES` constant (which matches
>   `BLOCK_SORT_ORDER`). The DB `sortOrder` column exists for cross-cutting consumers (PDF
>   export, future) but the viewer iterates `BLOCK_TYPES` directly.
> - **Where:** `src/lib/prd/constants.ts`, `src/components/prd/prd-viewer.tsx`.
> - **Breaks if:** the `BLOCK_TYPES` order is reshuffled (changes the visual layout for every
>   session immediately) or a new block type is added without inserting it at the right index.

---

## Components (`src/components/prd/`)

| File | Role |
|------|------|
| `prd-viewer.tsx` | Client root. Hydrates Dexie, subscribes to store, owns scroll container + auto-scroll. |
| `prd-header.tsx` | Server component. Title (with "Brouillon PRD" fallback), inline `ScoreBadge` (vert/ambre/rouge by 80/50 thresholds), disabled Export PDF / Partager buttons. `shrink-0`. |
| `prd-block.tsx` | Client. Filled block: heading, `PrdMarkdown`, conditional evidence tag footer, `Wand2` "Affiner" button wrapped in `RefinePopover` (see [`refine.md`](refine.md)). Entry animation (`animate-in fade-in slide-in-from-top-2`) + amber `ring-2` when `isHighlighted` (cleared via `onAnimationEnd` 1s timer). |
| `refine-popover.tsx` | Client. Popover with textarea + submit hosting the refine flow. Detailed in [`refine.md`](refine.md). |
| `prd-block-placeholder.tsx` | Server component. Dashed muted article with FR heading + "Sera rempli pendant l'étape N" hint. `data-state="empty"`. Shares heading id pattern `prd-block-${blockType}` with `PrdBlock` (no DOM collision — never rendered simultaneously for same type). |
| `evidence-tag.tsx` | Server component. Rounded pill with FR label `[Preuve]` / `[Hypothèse]` / `[À vérifier]` (always visible — no color-only encoding) + emerald/amber/red Tailwind utilities (~8:1 WCAG AA). `role="note"` + full `aria-label`. |
| `prd-markdown.tsx` | Client. `react-markdown` + `remark-gfm` + `rehype-sanitize` (XSS guard since content is AI-generated) with prose styles tuned for document layout (h1=text-lg, h2=text-base, h3=text-sm, table support with horizontal scroll). Distinct from `chat/message-markdown.tsx` which uses bubble-compact styles. |

---

## Store (`src/stores/wizard-store.ts`)

New state slice added on top of the existing session fields:

```ts
blocks: Record<BlockType, PrdBlockMirror | null>  // 12 entries, null = not yet written
confidenceScore: number | null                     // 0-100
recommendation: Recommendation | null              // 'build' | 'test_first' | 'abandon'
lastUpdatedBlockType: BlockType | null             // drives the highlight ring
```

`PrdBlockMirror = Omit<PrdBlockRow, "id" | "sessionId">` — omits Dexie-only fields. The UI never
reads `id` / `sessionId` from the store.

New actions:

| Action | Caller | Effect |
|--------|--------|--------|
| `hydrateBlocks(rows, score, recommendation)` | `PrdViewer` mount | Rebuilds `blocks` map from Dexie rows, sets score + recommendation, resets `lastUpdatedBlockType` to null. |
| `updateBlock(type, content, tags, step, confidence?)` | `conversation.tsx onToolCall` after `upsertPrdBlock` | Sets `blocks[type]` + `lastUpdatedBlockType`. If `confidence && type === "confidence_score"`, also sets the score state and persists it to `db.sessions` (best-effort). |
| `clearLastUpdated()` | `PrdBlock onAnimationEnd` (passed by `PrdViewer`) | Resets `lastUpdatedBlockType` to null so the highlight ring stops. |

`initialize` resets the PRD slice (`blocks`, `confidenceScore`, `recommendation`,
`lastUpdatedBlockType`) so re-navigating between sessions starts clean.

---

## Constants (`src/lib/prd/constants.ts`)

Single source of truth re-exported from `src/lib/ai/tools.ts` plus FR display labels:

| Export | Type | Purpose |
|--------|------|---------|
| `BLOCK_TYPES` | `readonly BlockType[]` | 12 type tokens in canonical sort order. |
| `BLOCK_SORT_ORDER` | `Record<BlockType, number>` | 1..12, used by `upsertPrdBlock` to set `sortOrder` on the Dexie row. |
| `STEP_REQUIREMENTS` | `Record<number, readonly BlockType[]>` | Which blocks must be present before a step is complete (used by `conversation.tsx canAdvance`). |
| `BLOCK_HEADINGS` | `Record<BlockType, string>` | FR section titles ("Cas d'usage principal", etc.). |
| `BLOCK_PLACEHOLDERS` | `Record<BlockType, string>` | FR "Sera rempli pendant l'étape N (label)" text for `PrdBlockPlaceholder`. |
| `BLOCK_STEP` | `Record<BlockType, 1|2|3|4>` | Inverse of `STEP_REQUIREMENTS`, derived once. |
| `RECOMMENDATION_LABELS` | `Record<Recommendation, string>` | FR labels for the ScoreBadge ("Construire", "Tester d'abord", "Abandonner"). |

Adding a new block type means: append to `BLOCK_TYPES` in `tools.ts`, add it to `STEP_REQUIREMENTS`,
add entries to `BLOCK_HEADINGS` + `BLOCK_PLACEHOLDERS` + `BLOCK_SORT_ORDER`. All three Records are
exhaustive `Record<BlockType, ...>` so TypeScript flags the missing keys.

---

## Auto-scroll behavior

`PrdViewer` keeps a ref map `blockRefs: Partial<Record<BlockType, HTMLDivElement | null>>` and a
single `userScrolledAwayRef: useRef<boolean>(false)`.

- An `onScroll` handler on the scrollable container updates `userScrolledAwayRef.current` from
  `(scrollHeight - scrollTop - clientHeight) > SCROLL_PAUSE_THRESHOLD_PX` (50px).
- A `useEffect` on `[lastUpdatedBlockType]` reads the ref and either calls `scrollIntoView` or
  skips silently if the user has scrolled away. When the user scrolls back near the bottom, the
  next update re-engages auto-scroll.

This is purposely **not** stored in React state — auto-scroll decisions are read once per update
and should not trigger re-renders.

---

## Header / score badge thresholds

| Score | Color | Recommendation token (LLM enum) | French label shown |
|-------|-------|---------------------------------|--------------------|
| ≥ 80  | emerald | `build` | Construire |
| 50–79 | amber  | `test_first` | Tester d'abord |
| < 50  | red    | `abandon` | Abandonner |

Before step 3 (or if the AI did not fill `confidence`), the header shows the empty state
"Le score de confiance apparaîtra après l'étape 3 (Risques)." The Export PDF + Partager
buttons are always rendered but `disabled` with a tooltip pointing at the future feature.
