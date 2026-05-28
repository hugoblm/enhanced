"use client";

import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

// Empty shell. The prd-live-builder feature renders its content here later.
export function PrdPanel({ className }: Props) {
  return (
    <section aria-label="PRD" className={cn("flex flex-col", className)}>
      <div className="flex-1 p-6">
        <p className="text-muted-foreground text-sm">
          Le PRD apparaîtra ici au fil de la conversation.
        </p>
      </div>
    </section>
  );
}
