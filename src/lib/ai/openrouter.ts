import { openrouter } from "@openrouter/ai-sdk-provider";

const DEFAULT_MODEL_ID = "anthropic/claude-sonnet-4-20250514";

export function conversationModel() {
  return openrouter(process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL_ID);
}
