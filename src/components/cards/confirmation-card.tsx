"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AskUserOutput } from "@/lib/ai/tools";
import { submitOnEnter } from "@/lib/keyboard";
import { CardShell } from "./card-shell";

type Action = "confirmed" | "reformulate" | "clarify";
type SubmittedOutput = Extract<AskUserOutput, { card_type: "confirmation" }>;

const LABEL_FOR_ACTION: Record<Action, string> = {
  confirmed: "Oui, c'est correct",
  reformulate: "Reformuler",
  clarify: "Préciser",
};

interface Props {
  question: string;
  confirmationText: string;
  isSubmitted: boolean;
  submittedOutput?: SubmittedOutput;
  onSubmit: (output: AskUserOutput) => void;
}

export function ConfirmationCard({
  question,
  confirmationText,
  isSubmitted,
  submittedOutput,
  onSubmit,
}: Props) {
  const [action, setAction] = useState<Action | null>(submittedOutput?.action ?? null);
  const [text, setText] = useState<string>(submittedOutput?.text ?? "");

  const needsText = action === "reformulate" || action === "clarify";
  const canSubmit =
    action !== null && (!needsText || text.trim().length > 0) && !isSubmitted;

  function handleConfirm() {
    onSubmit({ card_type: "confirmation", action: "confirmed" });
  }

  function handleSubmitWithText() {
    if (action === null || !needsText || text.trim().length === 0) return;
    onSubmit({ card_type: "confirmation", action, text: text.trim() });
  }

  if (isSubmitted && submittedOutput) {
    return (
      <CardShell question={question} submitted>
        <Quote text={confirmationText} />
        <div className="mt-3 text-sm">
          <span className="text-muted-foreground">Réponse : </span>
          <span className="font-medium">{LABEL_FOR_ACTION[submittedOutput.action]}</span>
          {submittedOutput.text && (
            <p className="mt-1 text-muted-foreground">{submittedOutput.text}</p>
          )}
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell question={question}>
      <Quote text={confirmationText} />
      {action === null && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handleConfirm} size="sm">
            {LABEL_FOR_ACTION.confirmed} <ArrowRight size={14} />
          </Button>
          <Button onClick={() => setAction("reformulate")} size="sm" variant="outline">
            {LABEL_FOR_ACTION.reformulate}
          </Button>
          <Button onClick={() => setAction("clarify")} size="sm" variant="outline">
            {LABEL_FOR_ACTION.clarify}
          </Button>
        </div>
      )}
      {needsText && (
        <div className="mt-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={submitOnEnter(handleSubmitWithText)}
            placeholder={
              action === "reformulate"
                ? "Reformule à ta façon…"
                : "Ajoute des précisions…"
            }
            rows={3}
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button
              onClick={() => {
                setAction(null);
                setText("");
              }}
              variant="ghost"
              size="sm"
            >
              Retour
            </Button>
            <Button onClick={handleSubmitWithText} disabled={!canSubmit} size="sm">
              Valider <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </CardShell>
  );
}

function Quote({ text }: { text: string }) {
  if (!text) return null;
  return (
    <blockquote className="rounded-lg border-l-2 border-foreground/30 bg-accent/40 px-3 py-2 text-sm italic">
      {text}
    </blockquote>
  );
}
