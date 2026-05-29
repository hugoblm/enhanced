"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AskUserOutput } from "@/lib/ai/tools";
import { submitOnEnter } from "@/lib/keyboard";
import { CardShell } from "./card-shell";

type SubmittedOutput = Extract<AskUserOutput, { card_type: "free_text" }>;

interface Props {
  question: string;
  placeholder?: string;
  isSubmitted: boolean;
  submittedOutput?: SubmittedOutput;
  onSubmit: (output: AskUserOutput) => void;
}

export function FreeTextCard({
  question,
  placeholder = "Ta réponse…",
  isSubmitted,
  submittedOutput,
  onSubmit,
}: Props) {
  const [text, setText] = useState<string>(submittedOutput?.text ?? "");

  const canSubmit = text.trim().length > 0 && !isSubmitted;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({ card_type: "free_text", text: text.trim() });
  }

  if (isSubmitted && submittedOutput) {
    return (
      <CardShell question={question} submitted>
        <p className="whitespace-pre-wrap text-sm">{submittedOutput.text}</p>
      </CardShell>
    );
  }

  return (
    <CardShell question={question}>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={submitOnEnter(handleSubmit)}
        placeholder={placeholder}
        rows={4}
      />
      <div className="mt-3 flex justify-end">
        <Button onClick={handleSubmit} disabled={!canSubmit} size="sm">
          Valider <ArrowRight size={14} />
        </Button>
      </div>
    </CardShell>
  );
}

