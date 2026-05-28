import type { BlockType } from "../tools";
import { BASE_PROMPT } from "./system";
import { STEP_1_PROMPT } from "./step-1";
import { STEP_2_PROMPT } from "./step-2";
import { STEP_3_PROMPT } from "./step-3";
import { STEP_4_PROMPT } from "./step-4";

const STEP_PROMPTS: Record<number, string> = {
  1: STEP_1_PROMPT,
  2: STEP_2_PROMPT,
  3: STEP_3_PROMPT,
  4: STEP_4_PROMPT,
};

export function getStepPrompt(step: number): string {
  const prompt = STEP_PROMPTS[step];
  if (!prompt) {
    throw new Error(`No prompt defined for step ${step}`);
  }
  return prompt;
}

interface PrdBlockSummary {
  blockType: BlockType;
  content: string;
  evidenceTagCounts?: {
    evidence: number;
    assumption: number;
    to_verify: number;
  };
}

interface BuildSystemPromptInput {
  step: number;
  rawIdea: string;
  prdBlocks: PrdBlockSummary[];
}

export function buildSystemPrompt({
  step,
  rawIdea,
  prdBlocks,
}: BuildSystemPromptInput): string {
  return [
    BASE_PROMPT,
    getStepPrompt(step),
    buildRawIdeaSection(rawIdea),
    buildPrdContextSection(prdBlocks),
  ].join("\n\n---\n\n");
}

function buildRawIdeaSection(rawIdea: string): string {
  return `## Raw idea (from landing page)\n\n> ${rawIdea.trim()}`;
}

function buildPrdContextSection(blocks: PrdBlockSummary[]): string {
  if (blocks.length === 0) {
    return "## Current PRD state\n\nNo blocks written yet.";
  }

  const summaries = blocks
    .map((b) => {
      const counts = b.evidenceTagCounts;
      const tagSummary = counts
        ? ` (${counts.evidence}E/${counts.assumption}A/${counts.to_verify}V)`
        : "";
      return `- **${b.blockType}** - ${b.content.length} chars${tagSummary}`;
    })
    .join("\n");

  return `## Current PRD state\n\nBlocks written:\n${summaries}\n\nRefer to these blocks when continuing the conversation. Do not repeat content already captured - build on it.`;
}
