# AI Integration — PRD Live Builder

> How `update_prd` tool results flow from the AI to the PRD panel: the Zustand store,
> state sync strategy, and component hierarchy.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## update_prd tool execution flow

The `update_prd` tool is defined in `conversation-engine/tech/ai-integration.md`. This
document focuses on what happens **after** the tool executes -- how the result reaches the
PRD panel.

```
1. AI decides to write a PRD block
   │
2. AI calls update_prd({ block_type, content, evidence_tags })
   │
3. Server-side execute function runs:
   │  a. UPSERT prd_blocks: INSERT ... ON CONFLICT (prd_id, block_type) DO UPDATE
   │  b. If block_type = 'confidence_score': UPDATE prds SET confidence_score
   │  c. INSERT prd_versions (trigger = 'generation')
   │  d. Return { updated: block_type, content_length, evidence_tag_count }
   │
4. Tool result is streamed to client (part of the SSE stream)
   │
5. Client's useChat receives the tool result in the message stream
   │
6. Client-side effect intercepts update_prd results:
   │  a. Extract block_type, content, evidence_tags from the tool call args
   │  b. Call wizardStore.updateBlock(block_type, content, evidence_tags)
   │
7. Zustand store updates → prd-viewer re-renders the affected block
   │
   └── Animation triggers: fade-in for new blocks, highlight for updates
```

### Step 6 detail: intercepting tool results

The `update_prd` tool results must be intercepted on the client to update the Zustand store.
This is done by observing the messages from `useChat`:

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { useWizardStore } from '@/stores/wizard-store'

export function useUpdatePrdSync(messages: ReturnType<typeof useChat>['messages']) {
  const updateBlock = useWizardStore((s) => s.updateBlock)
  const processedCallIds = useRef(new Set<string>())

  useEffect(() => {
    for (const message of messages) {
      if (!message.toolInvocations) continue

      for (const invocation of message.toolInvocations) {
        if (invocation.toolName !== 'update_prd') continue
        if (!('result' in invocation)) continue
        if (processedCallIds.current.has(invocation.toolCallId)) continue

        // Mark as processed to avoid duplicate updates
        processedCallIds.current.add(invocation.toolCallId)

        const { block_type, content, evidence_tags } = invocation.args as {
          block_type: string
          content: string
          evidence_tags?: { text: string; tag: string }[]
        }

        updateBlock(block_type, content, evidence_tags ?? [])
      }
    }
  }, [messages, updateBlock])
}
```

**Why a ref for processed IDs:** `useChat` may re-render with the same messages multiple times
(React strict mode, streaming updates). The ref prevents calling `updateBlock` repeatedly for
the same tool result.

---

## Zustand store design

**File:** `src/stores/wizard-store.ts`

```typescript
import { create } from 'zustand'
import type { BlockType } from '@/lib/prd/block-types'

// --- Types ---

export interface EvidenceTag {
  text: string
  tag: 'evidence' | 'assumption' | 'to_verify'
}

export interface PrdBlock {
  id: string | null         // null for blocks not yet in DB
  blockType: BlockType
  content: string
  sortOrder: number
  evidenceTags: EvidenceTag[]
  updatedAt: string | null
}

export interface WizardState {
  // Session
  sessionId: string | null
  currentStep: 1 | 2 | 3 | 4

  // PRD metadata
  prdId: string | null
  prdTitle: string
  confidenceScore: number | null
  recommendation: 'build' | 'test_first' | 'abandon' | null

  // Blocks — keyed by block_type for O(1) access
  blocks: Record<string, PrdBlock>

  // UI state
  isPrdPanelCollapsed: boolean
  activeRefineBlockId: string | null
  lastUpdatedBlockType: string | null   // for animation trigger

  // Actions
  setSession: (id: string, step: number) => void
  setPrd: (prdId: string, title: string, score: number | null, rec: string | null) => void
  updateBlock: (blockType: string, content: string, tags?: EvidenceTag[]) => void
  setConfidenceScore: (score: number, recommendation: string) => void
  advanceStep: () => void
  setRefineBlock: (blockId: string | null) => void
  togglePrdPanel: () => void
  hydrateBlocks: (blocks: PrdBlock[]) => void
  clearLastUpdated: () => void
}

// --- Store ---

export const useWizardStore = create<WizardState>((set, get) => ({
  // Initial state
  sessionId: null,
  currentStep: 1,
  prdId: null,
  prdTitle: 'Draft PRD',
  confidenceScore: null,
  recommendation: null,
  blocks: {},
  isPrdPanelCollapsed: false,
  activeRefineBlockId: null,
  lastUpdatedBlockType: null,

  // Actions

  setSession: (id, step) =>
    set({ sessionId: id, currentStep: step as 1 | 2 | 3 | 4 }),

  setPrd: (prdId, title, score, rec) =>
    set({
      prdId,
      prdTitle: title,
      confidenceScore: score,
      recommendation: rec as WizardState['recommendation'],
    }),

  updateBlock: (blockType, content, tags = []) =>
    set((state) => ({
      blocks: {
        ...state.blocks,
        [blockType]: {
          ...state.blocks[blockType],
          blockType: blockType as BlockType,
          content,
          evidenceTags: tags,
          updatedAt: new Date().toISOString(),
        },
      },
      lastUpdatedBlockType: blockType,
    })),

  setConfidenceScore: (score, recommendation) =>
    set({
      confidenceScore: score,
      recommendation: recommendation as WizardState['recommendation'],
    }),

  advanceStep: () =>
    set((state) => ({
      currentStep: Math.min(4, state.currentStep + 1) as 1 | 2 | 3 | 4,
    })),

  setRefineBlock: (blockId) =>
    set({ activeRefineBlockId: blockId }),

  togglePrdPanel: () =>
    set((state) => ({ isPrdPanelCollapsed: !state.isPrdPanelCollapsed })),

  hydrateBlocks: (blocks) => {
    const blockMap: Record<string, PrdBlock> = {}
    for (const block of blocks) {
      blockMap[block.blockType] = block
    }
    set({ blocks: blockMap })
  },

  clearLastUpdated: () =>
    set({ lastUpdatedBlockType: null }),
}))
```

---

## State sync strategy

### 1. Initial load (Server Component -> Client Component)

```typescript
// src/app/session/[id]/page.tsx (Server Component)

import { createClient } from '@/lib/supabase/server'
import { WizardClient } from './wizard-client'
import { BLOCK_SORT_ORDER } from '@/lib/prd/block-types'

export default async function SessionPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Load session
  const { data: session } = await supabase
    .from('sessions')
    .select('id, current_step, title, raw_idea')
    .eq('id', params.id)
    .single()

  if (!session) notFound()

  // Load PRD + blocks
  const { data: prd } = await supabase
    .from('prds')
    .select('id, title, confidence_score, recommendation')
    .eq('session_id', params.id)
    .single()

  const { data: blocks } = await supabase
    .from('prd_blocks')
    .select('id, block_type, content, sort_order, evidence_tags, updated_at')
    .eq('prd_id', prd?.id ?? '')
    .order('sort_order')

  // Load messages for conversation restore
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', params.id)
    .order('created_at')

  return (
    <WizardClient
      session={session}
      prd={prd}
      blocks={blocks ?? []}
      messages={messages ?? []}
    />
  )
}
```

### 2. Client hydration

```typescript
// src/app/session/[id]/wizard-client.tsx (Client Component)

'use client'

import { useEffect } from 'react'
import { useWizardStore } from '@/stores/wizard-store'
import type { PrdBlock } from '@/stores/wizard-store'
import { BLOCK_SORT_ORDER } from '@/lib/prd/block-types'

export function WizardClient({ session, prd, blocks, messages }: Props) {
  const { setSession, setPrd, hydrateBlocks } = useWizardStore()

  // Hydrate store on mount (once)
  useEffect(() => {
    setSession(session.id, session.current_step)

    if (prd) {
      setPrd(prd.id, prd.title, prd.confidence_score, prd.recommendation)
    }

    const mappedBlocks: PrdBlock[] = blocks.map((b) => ({
      id: b.id,
      blockType: b.block_type,
      content: b.content,
      sortOrder: BLOCK_SORT_ORDER[b.block_type] ?? 99,
      evidenceTags: b.evidence_tags ?? [],
      updatedAt: b.updated_at,
    }))

    hydrateBlocks(mappedBlocks)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — intentional mount-only

  return (
    // Split-view layout: ConversationPanel + PrdViewer
  )
}
```

### 3. During conversation (tool result -> store update)

Handled by the `useUpdatePrdSync` hook documented above. The hook runs as a side effect
of the `useChat` messages changing, intercepts `update_prd` tool results, and calls
`wizardStore.updateBlock()`.

### 4. On page reload

The full cycle repeats: Server Component fetches from DB -> Client Component hydrates store.
No localStorage persistence needed because the DB is the source of truth.

---

## Component hierarchy

### prd-viewer.tsx

The top-level PRD panel component. Maps over all 12 block types in fixed sort order.

```typescript
'use client'

import { useWizardStore } from '@/stores/wizard-store'
import { BLOCK_TYPES, BLOCK_HEADINGS, BLOCK_PLACEHOLDER } from '@/lib/prd/block-types'
import { PrdBlock } from './prd-block'
import { PrdBlockPlaceholder } from './prd-block-placeholder'
import { PrdHeader } from './prd-header'

interface PrdViewerProps {
  readOnly?: boolean  // true for public sharing page
}

export function PrdViewer({ readOnly = false }: PrdViewerProps) {
  const blocks = useWizardStore((s) => s.blocks)
  const lastUpdatedBlockType = useWizardStore((s) => s.lastUpdatedBlockType)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <PrdHeader readOnly={readOnly} />

      <div className="flex-1 space-y-4 p-4">
        {BLOCK_TYPES.map((blockType) => {
          const block = blocks[blockType]
          const heading = BLOCK_HEADINGS[blockType]

          if (block && block.content) {
            return (
              <PrdBlock
                key={blockType}
                blockType={blockType}
                heading={heading}
                content={block.content}
                evidenceTags={block.evidenceTags}
                isJustUpdated={lastUpdatedBlockType === blockType}
                readOnly={readOnly}
              />
            )
          }

          return (
            <PrdBlockPlaceholder
              key={blockType}
              heading={heading}
              placeholderText={BLOCK_PLACEHOLDER[blockType]}
            />
          )
        })}
      </div>
    </div>
  )
}
```

### prd-block.tsx

A single filled block with heading, markdown content, evidence tags, and optional refine button.

```typescript
'use client'

import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { EvidenceTag } from './evidence-tag'
import { useWizardStore } from '@/stores/wizard-store'
import type { EvidenceTag as EvidenceTagType } from '@/stores/wizard-store'

interface PrdBlockProps {
  blockType: string
  heading: string
  content: string
  evidenceTags: EvidenceTagType[]
  isJustUpdated: boolean
  readOnly: boolean
}

export function PrdBlock({
  blockType,
  heading,
  content,
  evidenceTags,
  isJustUpdated,
  readOnly,
}: PrdBlockProps) {
  const clearLastUpdated = useWizardStore((s) => s.clearLastUpdated)
  const setRefineBlock = useWizardStore((s) => s.setRefineBlock)
  const blockRef = useRef<HTMLDivElement>(null)

  // Clear animation state after transition
  useEffect(() => {
    if (isJustUpdated) {
      const timer = setTimeout(clearLastUpdated, 2000)
      return () => clearTimeout(timer)
    }
  }, [isJustUpdated, clearLastUpdated])

  return (
    <div
      ref={blockRef}
      className={`rounded-lg border p-4 transition-all duration-500 group
        ${isJustUpdated ? 'ring-2 ring-primary/50 bg-primary/5' : 'bg-card'}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {heading}
        </h3>
        {!readOnly && (
          <button
            onClick={() => setRefineBlock(blockType)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground"
          >
            Affiner
          </button>
        )}
      </div>

      <div className="prose prose-sm max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      {evidenceTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {evidenceTags.map((tag, i) => (
            <EvidenceTag key={i} text={tag.text} tag={tag.tag} />
          ))}
        </div>
      )}
    </div>
  )
}
```

### prd-block-placeholder.tsx

Empty state for blocks not yet filled.

```typescript
interface PrdBlockPlaceholderProps {
  heading: string
  placeholderText: string
}

export function PrdBlockPlaceholder({ heading, placeholderText }: PrdBlockPlaceholderProps) {
  return (
    <div className="rounded-lg border border-dashed p-3 opacity-50">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {heading}
      </h3>
      <p className="text-xs text-muted-foreground mt-1">{placeholderText}</p>
    </div>
  )
}
```

### evidence-tag.tsx

Colored badge component for evidence classification.

```typescript
interface EvidenceTagProps {
  text: string
  tag: 'evidence' | 'assumption' | 'to_verify'
}

const TAG_STYLES = {
  evidence: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    label: 'Evidence',
    srLabel: 'Backed by evidence',
  },
  assumption: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    label: 'Assumption',
    srLabel: 'Unverified assumption',
  },
  to_verify: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    label: 'To verify',
    srLabel: 'Needs verification',
  },
} as const

export function EvidenceTag({ text, tag }: EvidenceTagProps) {
  const style = TAG_STYLES[tag]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      title={text}
      role="status"
      aria-label={`${style.srLabel}: ${text}`}
    >
      [{style.label}]
    </span>
  )
}
```

### prd-header.tsx

Header with title, confidence score badge, and action buttons.

```typescript
'use client'

import { useWizardStore } from '@/stores/wizard-store'

interface PrdHeaderProps {
  readOnly?: boolean
}

export function PrdHeader({ readOnly = false }: PrdHeaderProps) {
  const title = useWizardStore((s) => s.prdTitle)
  const score = useWizardStore((s) => s.confidenceScore)
  const recommendation = useWizardStore((s) => s.recommendation)

  const scoreColor = score !== null
    ? score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'
    : 'text-muted-foreground'

  const recommendationLabel: Record<string, string> = {
    build: 'Build',
    test_first: 'Test first',
    abandon: 'Abandon',
  }

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {score !== null ? (
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-sm font-medium ${scoreColor}`}>
              {score}/100
            </span>
            {recommendation && (
              <span className="text-xs text-muted-foreground">
                — {recommendationLabel[recommendation] ?? recommendation}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">
            Le score de confiance apparaitra apres l'evaluation des risques
          </p>
        )}
      </div>

      {!readOnly && (
        <div className="flex items-center gap-2">
          {/* Export + Share buttons added by pdf-export and public-sharing features */}
        </div>
      )}
    </div>
  )
}
```

---

## Auto-scroll behavior

When a new block appears or an existing block is updated, the PRD panel should scroll to show
the affected block. However, if the PM has manually scrolled away, auto-scroll should pause.

**Implementation strategy:**

```typescript
// Inside prd-viewer.tsx

const bottomRef = useRef<HTMLDivElement>(null)
const [userHasScrolled, setUserHasScrolled] = useState(false)
const containerRef = useRef<HTMLDivElement>(null)

// Detect manual scroll
useEffect(() => {
  const container = containerRef.current
  if (!container) return

  const handleScroll = () => {
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50
    setUserHasScrolled(!isAtBottom)
  }

  container.addEventListener('scroll', handleScroll)
  return () => container.removeEventListener('scroll', handleScroll)
}, [])

// Auto-scroll when a new block is updated (and user hasn't scrolled away)
useEffect(() => {
  if (lastUpdatedBlockType && !userHasScrolled) {
    const blockElement = document.getElementById(`prd-block-${lastUpdatedBlockType}`)
    blockElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}, [lastUpdatedBlockType, userHasScrolled])
```
