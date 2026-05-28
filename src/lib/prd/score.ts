import type { Recommendation } from "@/lib/db/dexie";

const STRICT_SCORE_REGEX = /^Score:\s*(\d{1,3})\b/m;
const FALLBACK_SCORE_REGEX = /\b(\d{1,3})\b/;
const RECOMMENDATION_REGEX = /Recommandation:\s*(build|test_first|abandon)/i;

export function parseConfidenceScore(content: string): number | null {
  const strict = content.match(STRICT_SCORE_REGEX);
  const raw = strict?.[1] ?? content.match(FALLBACK_SCORE_REGEX)?.[1];
  if (!raw) return null;
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  return Math.max(0, Math.min(100, n));
}

export function parseRecommendation(content: string): Recommendation | null {
  const match = content.match(RECOMMENDATION_REGEX);
  if (!match) return null;
  return match[1].toLowerCase() as Recommendation;
}
