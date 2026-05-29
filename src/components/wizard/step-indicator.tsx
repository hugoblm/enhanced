"use client";

import Link from "next/link";
import { Check, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWizardStore } from "@/stores/wizard-store";

const STEPS = [
  { number: 1, label: "Cadrage" },
  { number: 2, label: "Données" },
  { number: 3, label: "Risques" },
  { number: 4, label: "PRD" },
] as const;

export function StepIndicator() {
  const currentStep = useWizardStore((s) => s.currentStep);
  const viewingStep = useWizardStore((s) => s.viewingStep);
  const goToStep = useWizardStore((s) => s.goToStep);

  return (
    <nav
      aria-label="Progression du wizard"
      className="relative flex items-center justify-center gap-1 sm:gap-2 px-4 py-3 border-b border-border h-[60px] shrink-0"
    >
      <Link
        href="/"
        aria-label="Retour à l'accueil"
        className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:outline-none"
      >
        <Home className="w-5 h-5" />
      </Link>
      {STEPS.map((step) => {
        const isCompleted = step.number < currentStep;
        const isCurrent = step.number === currentStep;
        const isLocked = step.number > currentStep;
        const isViewing = step.number === viewingStep;
        const isClickable = step.number <= currentStep;

        return (
          <button
            key={step.number}
            type="button"
            onClick={() => isClickable && goToStep(step.number)}
            disabled={isLocked}
            aria-current={isCurrent ? "step" : undefined}
            aria-label={`Étape ${step.number} : ${step.label}${
              isCompleted ? " (complétée)" : isLocked ? " (verrouillée)" : ""
            }`}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 min-h-[44px]",
              isCompleted &&
                "text-primary cursor-pointer hover:bg-accent focus-visible:bg-accent",
              isCurrent && "bg-primary text-primary-foreground",
              isLocked && "text-muted-foreground cursor-not-allowed opacity-50",
              isViewing && !isCurrent && "ring-1 ring-primary/40",
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full border text-xs shrink-0",
                isCurrent && "border-primary-foreground/50",
              )}
            >
              {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.number}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
