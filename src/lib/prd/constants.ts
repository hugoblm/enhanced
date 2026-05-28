import {
  BLOCK_SORT_ORDER,
  BLOCK_TYPES,
  STEP_REQUIREMENTS,
  type BlockType,
} from "@/lib/ai/tools";
import type { Recommendation } from "@/lib/db/dexie";

export { BLOCK_SORT_ORDER, BLOCK_TYPES, STEP_REQUIREMENTS };
export type { BlockType };

export const BLOCK_HEADINGS: Record<BlockType, string> = {
  first_use_case: "Cas d'usage principal",
  problem_context: "Contexte du problème",
  data_signals: "Signaux data",
  risk_value: "Risque — Valeur",
  risk_usability: "Risque — Utilisabilité",
  risk_feasibility: "Risque — Faisabilité",
  risk_viability: "Risque — Viabilité business",
  confidence_score: "Score de confiance",
  success_criteria: "Critères de succès",
  kill_criteria: "Kill criteria",
  next_steps: "Prochaines étapes",
  executive_summary: "Résumé exécutif",
};

const STEP_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: "Cadrage",
  2: "Données",
  3: "Risques",
  4: "PRD",
};

// Derive BLOCK_STEP (inverse of STEP_REQUIREMENTS).
function deriveBlockStep(): Record<BlockType, 1 | 2 | 3 | 4> {
  const map = {} as Record<BlockType, 1 | 2 | 3 | 4>;
  for (const stepStr of Object.keys(STEP_REQUIREMENTS)) {
    const step = Number(stepStr) as 1 | 2 | 3 | 4;
    for (const blockType of STEP_REQUIREMENTS[step] ?? []) {
      map[blockType] = step;
    }
  }
  return map;
}

export const BLOCK_STEP: Record<BlockType, 1 | 2 | 3 | 4> = deriveBlockStep();

export const BLOCK_PLACEHOLDERS: Record<BlockType, string> = Object.fromEntries(
  BLOCK_TYPES.map((blockType) => {
    const step = BLOCK_STEP[blockType];
    return [blockType, `Sera rempli pendant l'étape ${step} (${STEP_LABELS[step]}).`];
  }),
) as Record<BlockType, string>;

export const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  build: "Construire",
  test_first: "Tester d'abord",
  abandon: "Abandonner",
};
