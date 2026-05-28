# Technical Specification — PRD Live Builder

> Overview and index of the technical documentation for the PRD Live Builder feature.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27
**Feature:** [`../README.md`](../README.md) · **PRD:** [`../../../prd.md`](../../../prd.md)

---

## Spec files (index)

| File | Concern | Required when |
|------|---------|---------------|
| `technical-spec.md` (this file) | Overview, approach, architecture at a glance | Always |
| [`data-model.md`](data-model.md) | `prds` + `prd_blocks` tables, block sort order, evidence tags format | There's persisted data |
| [`ai-integration.md`](ai-integration.md) | `update_prd` tool execution flow, Zustand sync strategy, component hierarchy | AI tooling + state concern |
| [`release-plan.md`](release-plan.md) | Atomic commits, branching, dependencies, rollback | Always |
| [`test-plan.md`](test-plan.md) | Unit / integration / E2E tests mapped to 14 Gherkin scenarios | Always |

---

## 1. Summary & approach

The PRD Live Builder is the right panel of the wizard: the artifact that makes Enhanced a tool,
not a chatbot. As the conversation progresses, the AI calls `update_prd` to upsert blocks into
the PRD, and each block appears in the panel in real time. The PRD has 12 typed blocks rendered
in a fixed sort order. Each block displays evidence tags as colored badges. The panel is
backed by a Zustand store that mirrors the database state, updated via tool call results.

Two decisions shape everything:

1. **Fixed 12-block structure, not freeform.** The PRD always has exactly 12 slots. Empty ones
   show placeholders. This ensures consistency across all PRDs and prevents the AI from inventing
   arbitrary sections. The block types and sort order are hardcoded.

2. **Zustand store mirrors DB, not owns.** The DB is the source of truth. The Zustand store is
   a client-side mirror for reactive rendering. Initial load comes from the Server Component
   (DB query -> props -> store hydration). Updates come from `update_prd` tool results
   intercepted on the client.

---

## 2. Architecture at a glance

### Components touched / added

```
src/
├── stores/
│   └── wizard-store.ts               # Zustand store: blocks, confidence, PRD metadata
├── components/
│   └── prd/
│       ├── prd-viewer.tsx             # Full PRD panel: header + block list
│       ├── prd-block.tsx              # Single block: heading + content + tags
│       ├── prd-block-placeholder.tsx  # Empty state for unfilled blocks
│       ├── prd-header.tsx             # Title, confidence score, export/share buttons
│       └── evidence-tag.tsx           # Colored badge: evidence/assumption/to_verify
├── lib/
│   └── prd/
│       ├── block-types.ts             # Block type constants, sort order, display headings
│       └── types.ts                   # Shared TypeScript types for PRD domain
└── app/
    └── session/
        └── [id]/
            └── page.tsx               # Server Component: loads PRD + blocks, passes to client
```

### Data flow

```
Server Component (page load)
  │
  ├── SELECT prds + prd_blocks FROM DB
  └── Pass as props to Client Component
        │
        ▼
Client Component hydrates Zustand store
  │
  ▼
prd-viewer.tsx maps over all 12 block types (in sort order)
  │
  ├── Block has content → renders prd-block.tsx (markdown + evidence tags)
  └── Block empty → renders prd-block-placeholder.tsx (muted placeholder)

During conversation:
  │
  AI calls update_prd tool → server execute → DB upsert
  │
  ▼
Tool result streamed to client
  │
  ▼
Client intercepts tool result → calls wizardStore.updateBlock()
  │
  ▼
Zustand reactivity → prd-viewer re-renders affected block
  │
  └── Animation: fade-in for new blocks, highlight for updates
```

### Key decisions & trade-offs

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Block structure | Fixed 12 types | Freeform blocks | Consistency, predictable sort order, AI knows exactly what to write |
| State management | Zustand (mirrors DB) | AI SDK state / React context | Zustand provides reactive updates to the PRD panel independently of the conversation state. AI SDK manages messages, Zustand manages the artifact. |
| Rendering | react-markdown | Custom parser / dangerouslySetInnerHTML | react-markdown is already installed, handles all common markdown, is XSS-safe by default |
| Sort order | Hardcoded map | DB column only | The sort order never changes in V1 (it is the PRD structure itself). Hardcoding avoids incorrect ordering from DB inconsistencies. |
| Empty state | All 12 placeholders shown from start | Show blocks only when filled | Showing all 12 from the start gives the PM a preview of the complete PRD structure and a sense of progress as blocks fill in |

---

## 3. Detailed specs

- **Data model:** `prds` and `prd_blocks` tables with RLS, fixed sort order, evidence tags
  JSONB format. See [`data-model.md`](data-model.md).
- **AI integration + state:** `update_prd` tool execution flow, Zustand store design, state
  sync strategy, component hierarchy. See [`ai-integration.md`](ai-integration.md).

---

## 4. Non-functional requirements

### Performance

- **Block update latency:** From `update_prd` tool result arriving on the client to the block
  being visible in the PRD panel: <500ms (per PRD requirement).
- **Markdown rendering:** react-markdown must render a block's content within 50ms. Large
  blocks (>2000 chars) should not cause visible jank.
- **Scroll performance:** The PRD panel must scroll smoothly with all 12 blocks rendered,
  including those with long markdown content and multiple evidence tags.

### Observability

| Event | Properties | Purpose |
|-------|-----------|---------|
| `update_prd_block_written` | `session_id`, `block_type`, `content_length`, `evidence_tag_count`, `trigger` | PRD construction analytics |
| `prd_panel_scrolled` | `session_id`, `direction` | UX analytics (auto-scroll behavior) |

### Accessibility

- All evidence tag badges must have accessible text (not color-only).
- Block headings use semantic `<h3>` elements.
- PRD panel is keyboard-navigable (Tab through blocks).
- Color contrast: evidence tag badge colors meet WCAG 2.1 AA against their background.

---

## 5. Delivery & testing

- **How it ships:** see [`release-plan.md`](release-plan.md) (8 atomic commits).
- **How it's tested:** see [`test-plan.md`](test-plan.md) (unit + integration + E2E, mapped to
  14 Gherkin scenarios) and [`../product/manual-tests.md`](../product/manual-tests.md).

---

## 6. Open questions

- **Auto-scroll behavior:** When a new block is added and the PM has manually scrolled away,
  should auto-scroll be disabled until the PM scrolls back to the bottom? Current spec says
  yes (SC-PLB-3). Implementation approach: IntersectionObserver on a sentinel element at the
  bottom of the block list. `[To verify]`
- **Block update animation:** CSS transition or Framer Motion? CSS is simpler and lighter.
  Framer Motion provides more control. V1 preference: CSS transitions unless they prove
  insufficient. `[To verify]`
- **react-markdown plugins:** Should we add remark-gfm for tables and strikethrough? The AI
  might generate tables in risk analysis blocks. Tentatively yes. `[To verify]`
