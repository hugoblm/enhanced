"use client";

import { useState, type ReactElement } from "react";
import { Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useRefineBlock } from "@/hooks/use-refine-block";
import { BLOCK_HEADINGS } from "@/lib/prd/constants";
import type { BlockType } from "@/lib/ai/tools";

interface Props {
  blockType: BlockType;
  currentContent: string;
  step: number;
  children: ReactElement;
}

const MAX_INSTRUCTION = 1000;

export function RefinePopover({ blockType, currentContent, step, children }: Props) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const { refine, isRefining, error, clearError } = useRefineBlock();

  const trimmed = instruction.trim();
  const canSubmit = trimmed.length > 0 && !isRefining;

  async function handleSubmit() {
    if (!canSubmit) return;
    const ok = await refine({
      blockType,
      currentContent,
      instruction: trimmed,
      step,
    });
    if (ok) {
      setInstruction("");
      setOpen(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (isRefining) return;
    setOpen(next);
    if (!next) {
      clearError();
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={children} />
      <PopoverContent className="w-96 gap-3 p-4" side="bottom" align="end">
        <PopoverHeader>
          <PopoverTitle>Affiner « {BLOCK_HEADINGS[blockType]} »</PopoverTitle>
          <p className="text-xs text-muted-foreground">
            Décris ce que tu veux changer en langage naturel.
          </p>
        </PopoverHeader>

        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Ex : raccourcis, ajoute une métrique chiffrée, challenge cette hypothèse…"
          maxLength={MAX_INSTRUCTION}
          rows={4}
          disabled={isRefining}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{trimmed.length}/{MAX_INSTRUCTION}</span>
          {error && (
            <span role="alert" className="text-destructive">
              {error}
            </span>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isRefining}
          >
            Annuler
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!canSubmit}>
            {isRefining ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Raffinement…
              </>
            ) : (
              "Refiner"
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
