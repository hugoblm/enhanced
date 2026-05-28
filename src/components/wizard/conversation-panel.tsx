"use client";

import { Conversation } from "@/components/chat/conversation";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function ConversationPanel({ className }: Props) {
  return (
    <section
      aria-label="Conversation"
      className={cn("flex min-h-0 flex-col", className)}
    >
      <Conversation />
    </section>
  );
}
