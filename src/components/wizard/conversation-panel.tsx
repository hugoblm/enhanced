"use client";

import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

// Empty shell. The conversation-engine feature renders its content here later.
export function ConversationPanel({ className }: Props) {
  return (
    <section
      aria-label="Conversation"
      className={cn("flex flex-col", className)}
    >
      <div className="flex-1 p-6">
        <p className="text-muted-foreground text-sm">
          Chargement de la conversation…
        </p>
      </div>
    </section>
  );
}
