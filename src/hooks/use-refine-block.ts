"use client";

import { useCallback, useState } from "react";
import { useWizardStore } from "@/stores/wizard-store";
import { upsertPrdBlock } from "@/lib/db/prd-blocks";
import type { EvidenceTag } from "@/lib/db/dexie";
import type { BlockType } from "@/lib/ai/tools";
import type { RefineContextBlock } from "@/lib/schemas/refine";

interface RefineParams {
  blockType: BlockType;
  currentContent: string;
  instruction: string;
  step: number;
}

interface RefineResponse {
  content: string;
  evidence_tags: EvidenceTag[];
}

export function useRefineBlock() {
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refine = useCallback(async (params: RefineParams): Promise<boolean> => {
    const { sessionId, blocks } = useWizardStore.getState();
    if (!sessionId) {
      setError("Session introuvable.");
      return false;
    }

    setIsRefining(true);
    setError(null);

    const allBlocks: RefineContextBlock[] = Object.values(blocks)
      .filter((b): b is NonNullable<typeof b> => b !== null)
      .map((b) => ({
        blockType: b.blockType,
        content: b.content,
        sortOrder: b.sortOrder,
      }));

    try {
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          blockType: params.blockType,
          currentContent: params.currentContent,
          instruction: params.instruction,
          allBlocks,
          step: params.step,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = (await response.json()) as RefineResponse;

      useWizardStore.getState().updateBlock(
        params.blockType,
        data.content,
        data.evidence_tags,
        params.step,
      );

      await upsertPrdBlock({
        sessionId,
        blockType: params.blockType,
        content: data.content,
        evidenceTags: data.evidence_tags,
        step: params.step,
      });

      setIsRefining(false);
      return true;
    } catch (err) {
      console.error("[use-refine-block] refine failed:", err);
      setError(err instanceof Error ? err.message : "Le raffinement a échoué.");
      setIsRefining(false);
      return false;
    }
  }, []);

  return { refine, isRefining, error, clearError: () => setError(null) };
}
