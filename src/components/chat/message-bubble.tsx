"use client";

import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";

interface Props {
  message: UIMessage;
}

export function MessageBubble({ message }: Props) {
  if (message.role === "system") return null;

  const isUser = message.role === "user";

  const textContent = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");

  if (!textContent) return null;

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-6",
          isUser
            ? "bg-foreground text-background"
            : "border border-border bg-background text-foreground",
        )}
      >
        {textContent}
      </div>
    </div>
  );
}
