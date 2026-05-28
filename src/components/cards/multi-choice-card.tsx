"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { AskUserOutput } from "@/lib/ai/tools";
import { cn } from "@/lib/utils";
import { CardShell } from "./card-shell";

type SubmittedOutput = Extract<AskUserOutput, { card_type: "multi_choice" }>;

interface Option {
  id: string;
  label: string;
  description?: string;
}

interface Props {
  question: string;
  options: Option[];
  otherOptionId: string;
  isSubmitted: boolean;
  submittedOutput?: SubmittedOutput;
  onSubmit: (output: AskUserOutput) => void;
}

export function MultiChoiceCard({
  question,
  options,
  otherOptionId,
  isSubmitted,
  submittedOutput,
  onSubmit,
}: Props) {
  const initialSelectedIds = submittedOutput
    ? new Set(
        options
          .filter((o) => submittedOutput.selected.includes(o.label))
          .map((o) => o.id),
      )
    : new Set<string>();

  const [selected, setSelected] = useState<Set<string>>(initialSelectedIds);
  const [customText, setCustomText] = useState<string>(submittedOutput?.custom_text ?? "");

  const isOther = selected.has(otherOptionId);
  const canSubmit =
    selected.size > 0 && (!isOther || customText.trim().length > 0) && !isSubmitted;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    if (!canSubmit) return;
    const selectedLabels = options
      .filter((o) => selected.has(o.id))
      .map((o) => o.label);
    onSubmit({
      card_type: "multi_choice",
      selected: selectedLabels,
      custom_text: isOther ? customText.trim() : undefined,
    });
  }

  if (isSubmitted && submittedOutput) {
    return (
      <CardShell question={question} submitted>
        <div className="text-sm">
          <span className="text-muted-foreground">Réponses : </span>
          <span className="font-medium">{submittedOutput.selected.join(", ")}</span>
          {submittedOutput.custom_text && (
            <p className="mt-1 text-muted-foreground">{submittedOutput.custom_text}</p>
          )}
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell question={question}>
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <label
            key={option.id}
            htmlFor={`opt-${option.id}`}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent",
              selected.has(option.id) && "border-foreground bg-accent",
            )}
          >
            <Checkbox
              id={`opt-${option.id}`}
              checked={selected.has(option.id)}
              onCheckedChange={() => toggle(option.id)}
              className="mt-0.5"
            />
            <span className="flex-1 text-sm">
              <span className="font-medium">{option.label}</span>
              {option.description && (
                <span className="block text-xs text-muted-foreground">
                  {option.description}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
      {isOther && (
        <Textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Précise…"
          rows={2}
          className="mt-3"
        />
      )}
      <div className="mt-4 flex justify-end">
        <Button onClick={handleSubmit} disabled={!canSubmit} size="sm">
          Valider <ArrowRight size={14} />
        </Button>
      </div>
    </CardShell>
  );
}

