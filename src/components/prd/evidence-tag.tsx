import type { EvidenceTagKind } from "@/lib/db/dexie";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  tag: EvidenceTagKind;
}

const TAG_LABELS: Record<EvidenceTagKind, string> = {
  evidence: "Preuve",
  assumption: "Hypothèse",
  to_verify: "À vérifier",
};

const TAG_STYLES: Record<EvidenceTagKind, string> = {
  evidence: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  assumption: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  to_verify: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

export function EvidenceTag({ text, tag }: Props) {
  const label = TAG_LABELS[tag];
  return (
    <span
      role="note"
      aria-label={`Tag ${label.toLowerCase()} : ${text}`}
      className={cn(
        "inline-flex items-baseline gap-1.5 rounded-full px-2.5 py-0.5 text-xs leading-snug",
        TAG_STYLES[tag],
      )}
    >
      <span className="font-semibold uppercase tracking-wide">[{label}]</span>
      <span>{text}</span>
    </span>
  );
}
