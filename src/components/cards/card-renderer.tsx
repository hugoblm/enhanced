"use client";

import type { AskUserOutput } from "@/lib/ai/tools";
import { ConfirmationCard } from "./confirmation-card";
import { FreeTextCard } from "./free-text-card";
import { MultiChoiceCard } from "./multi-choice-card";
import { ScaleCard } from "./scale-card";
import { SingleChoiceCard } from "./single-choice-card";

export interface AskUserInput {
  card_type: "single_choice" | "multi_choice" | "scale" | "confirmation" | "free_text";
  question: string;
  options?: { id: string; label: string; description?: string }[];
  scale_config?: { min: number; max: number; min_label: string; max_label: string };
  placeholder?: string;
  confirmation_text?: string;
}

interface Props {
  input: AskUserInput;
  isSubmitted: boolean;
  submittedOutput?: AskUserOutput;
  onSubmit: (output: AskUserOutput) => void;
}

const OTHER_OPTION_ID = "__other__";
const OTHER_OPTION_LABEL = "Autre — préciser";

export function CardRenderer({ input, isSubmitted, submittedOutput, onSubmit }: Props) {
  const optionsWithOther = withOtherOption(input.options);

  switch (input.card_type) {
    case "single_choice":
      return (
        <SingleChoiceCard
          question={input.question}
          options={optionsWithOther}
          isSubmitted={isSubmitted}
          submittedOutput={
            submittedOutput?.card_type === "single_choice" ? submittedOutput : undefined
          }
          onSubmit={onSubmit}
          otherOptionId={OTHER_OPTION_ID}
        />
      );
    case "multi_choice":
      return (
        <MultiChoiceCard
          question={input.question}
          options={optionsWithOther}
          isSubmitted={isSubmitted}
          submittedOutput={
            submittedOutput?.card_type === "multi_choice" ? submittedOutput : undefined
          }
          onSubmit={onSubmit}
          otherOptionId={OTHER_OPTION_ID}
        />
      );
    case "scale":
      return (
        <ScaleCard
          question={input.question}
          config={input.scale_config ?? { min: 1, max: 5, min_label: "Min", max_label: "Max" }}
          isSubmitted={isSubmitted}
          submittedOutput={
            submittedOutput?.card_type === "scale" ? submittedOutput : undefined
          }
          onSubmit={onSubmit}
        />
      );
    case "confirmation":
      return (
        <ConfirmationCard
          question={input.question}
          confirmationText={input.confirmation_text ?? ""}
          isSubmitted={isSubmitted}
          submittedOutput={
            submittedOutput?.card_type === "confirmation" ? submittedOutput : undefined
          }
          onSubmit={onSubmit}
        />
      );
    case "free_text":
      return (
        <FreeTextCard
          question={input.question}
          placeholder={input.placeholder}
          isSubmitted={isSubmitted}
          submittedOutput={
            submittedOutput?.card_type === "free_text" ? submittedOutput : undefined
          }
          onSubmit={onSubmit}
        />
      );
    default:
      return null;
  }
}

function withOtherOption(
  options: AskUserInput["options"],
): { id: string; label: string; description?: string }[] {
  const base = options ?? [];
  const hasOther = base.some((o) => {
    if (o.id === OTHER_OPTION_ID) return true;
    if (o.label === OTHER_OPTION_LABEL) return true;
    const normalized = o.label.toLowerCase();
    return normalized.startsWith("autre —") || normalized.startsWith("other —");
  });
  if (hasOther) return base;
  return [...base, { id: OTHER_OPTION_ID, label: OTHER_OPTION_LABEL }];
}
