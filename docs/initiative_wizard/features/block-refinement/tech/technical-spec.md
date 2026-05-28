# Technical Specification -- Block Refinement

**Status:** Draft -- **Author:** Hugo -- **Date:** 2026-05-27
**PRD:** [`../../prd.md`](../../prd.md) -- **Relevant .ai-context:** [`.ai-context/README.md`](../../../../../.ai-context/README.md)

---

## Spec files (index)

| File | Concern |
|------|---------|
| `technical-spec.md` | Architecture, components, state management, data flow |
| `api.md` | POST /api/refine endpoint contract |
| `ai-integration.md` | Refinement prompt design, model configuration |
| `release-plan.md` | Branching, atomic commits, rollback, DoD |
| `test-plan.md` | Vitest + Playwright test plan, Gherkin traceability |

---

## 1. Summary & approach

Block refinement allows the Builder PM to hover over any PRD block, click a "Refine" button, type a natural language instruction, and have the AI regenerate only that block. The rest of the PRD remains unchanged. The block updates in-place via streaming, and a version snapshot is auto-created in `prd_versions`.

This feature touches 3 layers:
1. **UI** -- hover interaction, popover, streaming display (`prd-block.tsx`, `refine-popover.tsx`)
2. **API** -- `POST /api/refine` route that validates, loads context, and streams a response
3. **AI** -- a focused refinement prompt that regenerates one block with full PRD context

---

## 2. Architecture at a glance

```
User hovers PRD block
  |
  v
prd-block.tsx               <-- Shows "Refine" button on hover (absolute, top-right)
  |
  v (click)
refine-popover.tsx           <-- Popover with textarea + "Refiner" button
  |
  v (submit)
POST /api/refine             <-- Route handler (streaming)
  |
  +-- Zod validate { prd_id, block_id, instruction }
  +-- Auth check (Supabase server client)
  +-- Load block + full PRD context (all blocks)
  +-- Call streamText() with refinement prompt
  +-- Stream response via createUIMessageStreamResponse()
  +-- On finish callback:
  |     UPDATE prd_blocks SET content = new, updated_at = now()
  |     INSERT prd_versions (trigger = 'refinement')
  |
  v
Client receives stream
  |
  +-- Update block content in Zustand store (progressive)
  +-- Close popover on completion
  +-- Log refinement in conversation panel
```

### Component tree (within prd-panel)

```
PrdPanel
  +-- PrdViewer
        +-- PrdBlock (one per block)
              +-- Block content (markdown rendered)
              +-- RefineButton (visible on hover, absolute top-right)
              +-- RefinePopover (anchored to block, open on click)
                    +-- textarea
                    +-- "Refiner" button
                    +-- Error display
```

---

## 3. Detailed specs

### 3.1 Component: `src/components/prd/prd-block.tsx`

Each PRD block renders its content and hosts the refinement interaction.

**Hover behavior:**
- The "Refine" button is always in the DOM but hidden by default (`opacity-0`).
- On `group-hover`, it becomes visible (`opacity-100`).
- This uses Tailwind's `group` + `group-hover:opacity-100` pattern for CSS-only hover.
- The button is positioned `absolute top-2 right-2` within a `relative` container.

```tsx
"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefinePopover } from "@/components/prd/refine-popover";
import { cn } from "@/lib/utils";

interface Props {
  blockId: string;
  prdId: string;
  blockType: string;
  content: string;
  isRefining: boolean;
}

export function PrdBlock({ blockId, prdId, blockType, content, isRefining }: Props) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  return (
    <div className="group relative rounded-lg border border-border p-4 mb-3">
      {/* Block content */}
      <div className={cn("prose prose-sm max-w-none", isRefining && "opacity-60")}>
        {/* Rendered markdown content */}
      </div>

      {/* Loading indicator during refinement */}
      {isRefining && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
          <div className="animate-pulse text-sm text-muted-foreground">
            Raffinement en cours...
          </div>
        </div>
      )}

      {/* Refine button (visible on hover) */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsPopoverOpen(true)}
        className={cn(
          "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity",
          "gap-1.5 text-xs",
          isRefining && "hidden"
        )}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Refine
      </Button>

      {/* Refinement popover */}
      <RefinePopover
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        blockId={blockId}
        prdId={prdId}
        blockType={blockType}
        currentContent={content}
      />
    </div>
  );
}
```

### 3.2 Component: `src/components/prd/refine-popover.tsx`

shadcn Popover anchored to the block. Contains a textarea for the instruction and a submit button.

```tsx
"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useRefineBlock } from "@/hooks/use-refine-block";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockId: string;
  prdId: string;
  blockType: string;
  currentContent: string;
}

export function RefinePopover({
  open,
  onOpenChange,
  blockId,
  prdId,
  blockType,
  currentContent,
}: Props) {
  const [instruction, setInstruction] = useState("");
  const { refine, isRefining, error } = useRefineBlock();

  async function handleSubmit() {
    if (!instruction.trim()) return;

    const success = await refine({
      prdId,
      blockId,
      blockType,
      instruction: instruction.trim(),
      currentContent,
    });

    if (success) {
      setInstruction("");
      onOpenChange(false);
    }
    // On failure: popover stays open, instruction preserved (SC-BR-6)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <span /> {/* Invisible trigger; open state controlled by parent */}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-4"
        side="left"
        align="start"
        sideOffset={8}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">
            Que souhaitez-vous modifier ?
          </p>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Ex: raccourcis, ajoute le contexte B2C, plus de metriques..."
            className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            disabled={isRefining}
          />
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isRefining}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isRefining || !instruction.trim()}
            >
              {isRefining ? "Raffinement..." : "Refiner"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### 3.3 Hook: `src/hooks/use-refine-block.ts`

Custom hook encapsulating the refinement API call and store updates.

```tsx
"use client";

import { useState, useCallback } from "react";
import { useWizardStore } from "@/stores/wizard-store";

interface RefineParams {
  prdId: string;
  blockId: string;
  blockType: string;
  instruction: string;
  currentContent: string;
}

export function useRefineBlock() {
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateBlockContent = useWizardStore((s) => s.updateBlockContent);
  const setBlockRefining = useWizardStore((s) => s.setBlockRefining);

  const refine = useCallback(async (params: RefineParams): Promise<boolean> => {
    setIsRefining(true);
    setError(null);
    setBlockRefining(params.blockId, true);

    // Save original content for rollback
    const originalContent = params.currentContent;

    try {
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prd_id: params.prdId,
          block_id: params.blockId,
          instruction: params.instruction,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Erreur ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error("Pas de reponse en streaming");
      }

      // Read the stream and progressively update the block
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        updateBlockContent(params.blockId, accumulated);
      }

      setBlockRefining(params.blockId, false);
      setIsRefining(false);
      return true;
    } catch (err) {
      // Rollback to original content on failure (SC-BR-6)
      updateBlockContent(params.blockId, originalContent);
      setBlockRefining(params.blockId, false);
      setIsRefining(false);
      setError(
        err instanceof Error
          ? err.message
          : "Le raffinement a echoue. Veuillez reessayer."
      );
      return false;
    }
  }, [updateBlockContent, setBlockRefining]);

  return { refine, isRefining, error };
}
```

### 3.4 Zustand store additions: `src/stores/wizard-store.ts`

The wizard store is extended with block-level state for refinement:

```tsx
// Additional state fields
interface WizardState {
  // ... existing fields ...

  // Block refinement
  blocks: Record<string, PrdBlockState>;
  updateBlockContent: (blockId: string, content: string) => void;
  setBlockRefining: (blockId: string, isRefining: boolean) => void;
}

interface PrdBlockState {
  content: string;
  isRefining: boolean;
}

// Additional actions
updateBlockContent: (blockId, content) =>
  set((state) => ({
    blocks: {
      ...state.blocks,
      [blockId]: { ...state.blocks[blockId], content },
    },
  })),

setBlockRefining: (blockId, isRefining) =>
  set((state) => ({
    blocks: {
      ...state.blocks,
      [blockId]: { ...state.blocks[blockId], isRefining },
    },
  })),
```

### 3.5 Conversation panel integration

After a successful refinement, a system message is appended to the conversation panel showing:
- The block type that was refined
- The instruction the PM gave
- A summary of what changed

This is handled by the `useRefineBlock` hook calling `addMessage()` on the Zustand store after a successful refinement.

### 3.6 Race condition handling (SC-BR-7)

When the PM starts a second refinement on the same block before the first completes:
- The `isRefining` flag on the block prevents the hover button from appearing.
- The popover is closed after a successful refinement, so the PM must hover and click again.
- If they manage to trigger a second refinement (e.g., via a different block), each refinement operates on the block's current content at the time of the API call, not a stale snapshot.
- The API is stateless per request -- no server-side locking is needed. The last write wins.

---

## 4. Non-functional requirements

| Requirement | Target | How |
|-------------|--------|-----|
| Streaming latency | First token < 1s after submit | Direct `streamText()` call, no intermediate queuing |
| Block update smoothness | No layout jumps | Block container has `min-h` set to current height before refinement starts; expands smoothly via CSS `transition-[height]` |
| Rollback on error | 100% original content preserved | `originalContent` saved before API call; restored in `catch` block |
| Popover positioning | No overlap with viewport edges | shadcn Popover handles collision detection via Radix primitives |
| Rate limiting | Max 10 refines/min/user | Enforced server-side in `/api/refine` |
| Scope isolation | Only targeted block changes | API only returns new content for the specified block_id; store updates only that block |
| Evidence tag preservation | Tags survive refinement | Prompt instructs AI to preserve or update evidence tags |

---

## 5. Delivery & testing

- **API spec:** [`api.md`](api.md)
- **AI integration spec:** [`ai-integration.md`](ai-integration.md)
- **Release plan:** [`release-plan.md`](release-plan.md)
- **Test plan:** [`test-plan.md`](test-plan.md)

---

## 6. Open questions [To verify]

| # | Question | Impact | Resolved? |
|---|----------|--------|-----------|
| 1 | Should the refinement use full PRD context (all blocks) or just the target block? | Token cost vs quality | No -- spec uses full context for quality. Monitor token usage. |
| 2 | Should the conversation panel show refinement as a "system" or "user"+"assistant" message pair? | UX consistency | No -- spec uses "user" (the instruction) + "assistant" (confirmation) |
| 3 | How does refinement interact with prd-versioning auto-versioning? | Data integrity | No -- spec creates a version on each refinement. If versioning is cut (COULD), this INSERT is skipped. |
| 4 | Touch devices: hover doesn't exist on touch. How is the refine button triggered? | Mobile/tablet UX | No -- options: long-press, always-visible button on mobile, or a "refine mode" toggle. Deferred to responsive polish. |
| 5 | Should there be a "Retry" button in the error state, or does the PM re-open the popover? | Error UX | No -- spec keeps popover open with instruction preserved + error message. PM clicks "Refiner" again. |
