import type { InferUITools, UIMessage } from "ai";
import { conversationTools } from "@/lib/ai/tools";

// `kind: "nudge"` marks the invisible auto-continuation message used to recover
// from a model turn that ended without an ask_user (see conversation.tsx). Such
// messages are never rendered and never persisted.
export type AppMessageMetadata = { kind?: "nudge" };

export type AppUIMessage = UIMessage<
  AppMessageMetadata,
  never,
  InferUITools<typeof conversationTools>
>;

export type AppUIMessagePart = AppUIMessage["parts"][number];
