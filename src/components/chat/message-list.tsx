"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { Loader2 } from "lucide-react";
import { MessageBubble } from "./message-bubble";

interface Props {
  messages: UIMessage[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        {messages.length === 0 && !isStreaming && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Tape un message pour démarrer la conversation.
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {isStreaming && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            <span>L&apos;assistant rédige…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
