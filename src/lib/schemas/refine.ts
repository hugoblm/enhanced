import { z } from "zod";
import { BLOCK_TYPES } from "@/lib/prd/constants";

const ContextBlockSchema = z.object({
  blockType: z.enum(BLOCK_TYPES),
  content: z.string(),
  sortOrder: z.number().int().min(1).max(12),
});

export const refineRequestSchema = z.object({
  sessionId: z.uuid(),
  blockType: z.enum(BLOCK_TYPES),
  currentContent: z.string().min(1).max(10_000),
  instruction: z.string().trim().min(1).max(1000),
  allBlocks: z.array(ContextBlockSchema),
  step: z.number().int().min(1).max(4),
});

export type RefineRequest = z.infer<typeof refineRequestSchema>;
export type RefineContextBlock = z.infer<typeof ContextBlockSchema>;
