"use client";

import { type AskUserInput, CardRenderer } from "@/components/cards/card-renderer";
import type { AskUserOutput } from "@/lib/ai/tools";
import { cn } from "@/lib/utils";
import { MessageMarkdown } from "./message-markdown";
import type { AppUIMessage, AppUIMessagePart } from "./types";

interface Props {
  message: AppUIMessage;
  onAskUserSubmit: (toolCallId: string, output: AskUserOutput) => void;
}

interface AskUserPart {
  type: "tool-ask_user";
  toolCallId: string;
  state: string;
  input?: AskUserInput;
  output?: AskUserOutput;
}

function isAskUserPart(p: AppUIMessagePart): p is AppUIMessagePart & AskUserPart {
  return "type" in p && p.type === "tool-ask_user";
}

export function MessageBubble({ message, onAskUserSubmit }: Props) {
  if (message.role === "system") return null;
  // Invisible auto-continuation nudge — never shown in the thread.
  if (message.metadata?.kind === "nudge") return null;

  const isUser = message.role === "user";

  const textContent = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");

  const askUserParts = message.parts.filter(isAskUserPart);

  if (!textContent && askUserParts.length === 0) return null;

  return (
    <div className={cn("flex w-full flex-col gap-3", isUser ? "items-end" : "items-start")}>
      {textContent && (
        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-6",
            isUser
              ? "whitespace-pre-wrap bg-foreground text-background"
              : "border border-border bg-background text-foreground",
          )}
        >
          {isUser ? textContent : <MessageMarkdown>{textContent}</MessageMarkdown>}
        </div>
      )}
      {askUserParts.map((part) => {
        if (!part.input) return null;
        const isSubmitted =
          part.state === "output-available" || part.state === "output-error";
        return (
          <div key={part.toolCallId} className="w-full max-w-[85%]">
            <CardRenderer
              input={part.input}
              isSubmitted={isSubmitted}
              submittedOutput={part.output}
              onSubmit={(output) => onAskUserSubmit(part.toolCallId, output)}
            />
          </div>
        );
      })}
    </div>
  );
}
