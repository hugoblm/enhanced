import type { InferUITools, UIMessage } from "ai";
import { conversationTools } from "@/lib/ai/tools";

export type AppUIMessage = UIMessage<unknown, never, InferUITools<typeof conversationTools>>;

export type AppUIMessagePart = AppUIMessage["parts"][number];
