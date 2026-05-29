"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { AskUserOutput } from "@/lib/ai/tools";
import { submitOnEnter } from "@/lib/keyboard";
import { cn } from "@/lib/utils";
import { CardShell } from "./card-shell";

type SubmittedOutput = Extract<AskUserOutput, { card_type: "single_choice" }>;

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

export function SingleChoiceCard({
  question,
  options,
  otherOptionId,
  isSubmitted,
  submittedOutput,
  onSubmit,
}: Props) {
  const initialSelectedId = submittedOutput
    ? (options.find((o) => o.label === submittedOutput.selected)?.id ?? null)
    : null;
  const [selected, setSelected] = useState<string | null>(initialSelectedId);
  const [customText, setCustomText] = useState<string>(submittedOutput?.custom_text ?? "");

  const isOther = selected === otherOptionId;
  const canSubmit =
    selected !== null && (!isOther || customText.trim().length > 0) && !isSubmitted;

  function handleSubmit() {
    if (!canSubmit || selected === null) return;
    const selectedOption = options.find((o) => o.id === selected);
    onSubmit({
      card_type: "single_choice",
      selected: selectedOption?.label ?? selected,
      custom_text: isOther ? customText.trim() : undefined,
    });
  }

  if (isSubmitted && submittedOutput) {
    return (
      <CardShell question={question} submitted>
        <div className="text-sm">
          <span className="text-muted-foreground">Réponse : </span>
          <span className="font-medium">{submittedOutput.selected}</span>
          {submittedOutput.custom_text && (
            <p className="mt-1 text-muted-foreground">{submittedOutput.custom_text}</p>
          )}
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell question={question}>
      <RadioGroup
        value={selected ?? ""}
        onValueChange={setSelected}
        className="flex flex-col gap-2"
      >
        {options.map((option) => (
          <label
            key={option.id}
            htmlFor={`opt-${option.id}`}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent",
              selected === option.id && "border-foreground bg-accent",
            )}
          >
            <RadioGroupItem id={`opt-${option.id}`} value={option.id} className="mt-0.5" />
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
      </RadioGroup>
      {isOther && (
        <Textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          onKeyDown={submitOnEnter(handleSubmit)}
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

