"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  question: string;
  submitted?: boolean;
  children: ReactNode;
}

export function CardShell({ question, submitted = false, children }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-background p-4",
        submitted ? "border-border/60 opacity-80" : "border-border",
      )}
    >
      <p className="mb-3 flex items-start gap-2 text-sm font-medium">
        {submitted && <Check size={14} className="mt-1 shrink-0 text-muted-foreground" />}
        <span>{question}</span>
      </p>
      {children}
    </div>
  );
}
