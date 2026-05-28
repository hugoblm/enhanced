"use client";

import { useEffect } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BLOCK_HEADINGS } from "@/lib/prd/constants";
import type { PrdBlockMirror } from "@/stores/wizard-store";
import { cn } from "@/lib/utils";
import { EvidenceTag } from "./evidence-tag";
import { PrdMarkdown } from "./prd-markdown";

interface Props {
  block: PrdBlockMirror;
  isHighlighted: boolean;
  onAnimationEnd: () => void;
}

const HIGHLIGHT_DURATION_MS = 1000;

export function PrdBlock({ block, isHighlighted, onAnimationEnd }: Props) {
  useEffect(() => {
    if (!isHighlighted) return;
    const timer = setTimeout(onAnimationEnd, HIGHLIGHT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isHighlighted, onAnimationEnd]);

  const heading = BLOCK_HEADINGS[block.blockType];
  const headingId = `prd-block-${block.blockType}`;
  const hasTags = block.evidenceTags.length > 0;

  return (
    <article
      data-state="filled"
      data-block-type={block.blockType}
      aria-labelledby={headingId}
      className={cn(
        "rounded-lg border border-border bg-background p-4",
        "animate-in fade-in slide-in-from-top-2 duration-300",
        "transition-shadow",
        isHighlighted && "ring-2 ring-amber-400 ring-offset-2 ring-offset-background",
      )}
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <h3 id={headingId} className="text-base font-semibold">
          {heading}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          disabled
          aria-disabled="true"
          title="Disponible bientôt — affiner ce bloc"
          className="shrink-0"
        >
          <Wand2 size={14} />
          Affiner
        </Button>
      </header>

      <div className="text-sm">
        <PrdMarkdown>{block.content}</PrdMarkdown>
      </div>

      {hasTags && (
        <footer className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
          {block.evidenceTags.map((tag, idx) => (
            <EvidenceTag
              key={`${tag.tag}-${idx}`}
              text={tag.text}
              tag={tag.tag}
            />
          ))}
        </footer>
      )}
    </article>
  );
}
