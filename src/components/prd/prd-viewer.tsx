"use client";

import { useEffect, useMemo } from "react";
import { db } from "@/lib/db/dexie";
import { BLOCK_TYPES } from "@/lib/prd/constants";
import { useWizardStore } from "@/stores/wizard-store";
import { PrdBlock } from "./prd-block";
import { PrdBlockPlaceholder } from "./prd-block-placeholder";
import { PrdHeader } from "./prd-header";

function deriveTitle(
  firstUseCase: string | null | undefined,
  rawIdea: string | null,
): string | null {
  const fromBlock = firstUseCase?.split("\n")[0]?.replace(/^#+\s*/, "").trim();
  if (fromBlock) return fromBlock.slice(0, 80);
  const fromIdea = rawIdea?.trim();
  if (fromIdea) return fromIdea.slice(0, 80);
  return null;
}

export function PrdViewer() {
  const sessionId = useWizardStore((s) => s.sessionId);
  const rawIdea = useWizardStore((s) => s.rawIdea);
  const blocks = useWizardStore((s) => s.blocks);
  const confidenceScore = useWizardStore((s) => s.confidenceScore);
  const recommendation = useWizardStore((s) => s.recommendation);
  const lastUpdatedBlockType = useWizardStore((s) => s.lastUpdatedBlockType);
  const hydrateBlocks = useWizardStore((s) => s.hydrateBlocks);
  const clearLastUpdated = useWizardStore((s) => s.clearLastUpdated);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      const [rows, session] = await Promise.all([
        db.prdBlocks.where("sessionId").equals(sessionId).toArray(),
        db.sessions.get(sessionId),
      ]);
      if (cancelled) return;
      hydrateBlocks(
        rows,
        session?.confidenceScore ?? null,
        session?.recommendation ?? null,
      );
    })().catch((err) => {
      console.error("[prd-viewer] hydration failed:", err);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId, hydrateBlocks]);

  const title = useMemo(
    () => deriveTitle(blocks.first_use_case?.content, rawIdea),
    [blocks.first_use_case, rawIdea],
  );

  return (
    <section
      role="region"
      aria-label="Document PRD"
      className="flex h-full flex-col bg-background"
    >
      <PrdHeader
        title={title}
        confidenceScore={confidenceScore}
        recommendation={recommendation}
      />
      <div
        aria-live="polite"
        className="flex-1 overflow-y-auto px-6 py-4"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {BLOCK_TYPES.map((blockType) => {
            const block = blocks[blockType];
            if (block) {
              return (
                <PrdBlock
                  key={blockType}
                  block={block}
                  isHighlighted={lastUpdatedBlockType === blockType}
                  onAnimationEnd={clearLastUpdated}
                />
              );
            }
            return (
              <PrdBlockPlaceholder key={blockType} blockType={blockType} />
            );
          })}
        </div>
      </div>
    </section>
  );
}
