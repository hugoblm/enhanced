import { db, type EvidenceTag } from "@/lib/db/dexie";
import { BLOCK_SORT_ORDER, type BlockType } from "@/lib/prd/constants";

interface UpsertPrdBlockInput {
  sessionId: string;
  blockType: BlockType;
  content: string;
  evidenceTags: EvidenceTag[];
  step: number;
}

export async function upsertPrdBlock(input: UpsertPrdBlockInput): Promise<void> {
  const existing = await db.prdBlocks
    .where("[sessionId+blockType]")
    .equals([input.sessionId, input.blockType])
    .first();

  const now = Date.now();
  if (existing) {
    await db.prdBlocks.update(existing.id, {
      content: input.content,
      evidenceTags: input.evidenceTags,
      step: input.step,
      updatedAt: now,
    });
  } else {
    await db.prdBlocks.put({
      id: crypto.randomUUID(),
      sessionId: input.sessionId,
      blockType: input.blockType,
      content: input.content,
      evidenceTags: input.evidenceTags,
      step: input.step,
      sortOrder: BLOCK_SORT_ORDER[input.blockType],
      updatedAt: now,
    });
  }
}
