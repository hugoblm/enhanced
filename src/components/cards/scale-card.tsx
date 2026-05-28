"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AskUserOutput } from "@/lib/ai/tools";
import { cn } from "@/lib/utils";
import { CardShell } from "./card-shell";

type SubmittedOutput = Extract<AskUserOutput, { card_type: "scale" }>;

interface Props {
  question: string;
  config: { min: number; max: number; min_label: string; max_label: string };
  isSubmitted: boolean;
  submittedOutput?: SubmittedOutput;
  onSubmit: (output: AskUserOutput) => void;
}

export function ScaleCard({
  question,
  config,
  isSubmitted,
  submittedOutput,
  onSubmit,
}: Props) {
  const [value, setValue] = useState<number | null>(submittedOutput?.value ?? null);

  const range: number[] = [];
  for (let i = config.min; i <= config.max; i += 1) range.push(i);

  const canSubmit = value !== null && !isSubmitted;

  function handleSubmit() {
    if (!canSubmit || value === null) return;
    onSubmit({ card_type: "scale", value });
  }

  if (isSubmitted && submittedOutput) {
    return (
      <CardShell question={question} submitted>
        <div className="text-sm">
          <span className="text-muted-foreground">Note : </span>
          <span className="font-medium">
            {submittedOutput.value} / {config.max}
          </span>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell question={question}>
      <div className="flex items-center justify-between gap-2">
        {range.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setValue(n)}
            aria-label={`Note ${n}`}
            aria-pressed={value === n}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-colors",
              value === n
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:bg-accent",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{config.min_label}</span>
        <span>{config.max_label}</span>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={handleSubmit} disabled={!canSubmit} size="sm">
          Valider <ArrowRight size={14} />
        </Button>
      </div>
    </CardShell>
  );
}

