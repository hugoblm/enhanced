import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RECOMMENDATION_LABELS } from "@/lib/prd/constants";
import type { Recommendation } from "@/lib/db/dexie";
import { cn } from "@/lib/utils";

interface Props {
  title: string | null;
  confidenceScore: number | null;
  recommendation: Recommendation | null;
}

function scoreClasses(score: number): string {
  if (score >= 80) {
    return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  }
  if (score >= 50) {
    return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
  }
  return "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200";
}

function ScoreBadge({
  score,
  recommendation,
}: {
  score: number;
  recommendation: Recommendation | null;
}) {
  return (
    <div
      role="status"
      aria-label={`Score de confiance ${score} sur 100${
        recommendation ? `, recommandation : ${RECOMMENDATION_LABELS[recommendation]}` : ""
      }`}
      className={cn(
        "inline-flex items-baseline gap-2 rounded-full px-3 py-1 text-sm",
        scoreClasses(score),
      )}
    >
      <span className="font-semibold tabular-nums">{score}/100</span>
      {recommendation && (
        <span className="text-xs uppercase tracking-wide">
          · {RECOMMENDATION_LABELS[recommendation]}
        </span>
      )}
    </div>
  );
}

export function PrdHeader({ title, confidenceScore, recommendation }: Props) {
  return (
    <header className="flex shrink-0 flex-col gap-3 border-b border-border bg-background px-6 py-4">
      <div className="flex items-start justify-between gap-4">
        <h2 className="min-w-0 text-lg font-semibold leading-tight">
          {title ?? "Brouillon PRD"}
        </h2>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            aria-disabled="true"
            title="Disponible bientôt — pdf-export"
          >
            <Download size={14} />
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            aria-disabled="true"
            title="Disponible bientôt — public-sharing"
          >
            <Share2 size={14} />
            Partager
          </Button>
        </div>
      </div>

      {confidenceScore !== null ? (
        <ScoreBadge score={confidenceScore} recommendation={recommendation} />
      ) : (
        <p className="text-xs text-muted-foreground">
          Le score de confiance apparaîtra après l&apos;étape 3 (Risques).
        </p>
      )}
    </header>
  );
}
