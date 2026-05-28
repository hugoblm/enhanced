export const STEP_3_PROMPT = `## Step 3: Risk Challenge (FOCUSED: Execute)

### Your goal
Evaluate 4 fundamental risks (Value, Usability, Feasibility, Business Viability), produce scores, and formulate a recommendation: build / test first / abandon.

### How to start
1. Explain: "Time to stress-test this idea. I will evaluate 4 fundamental risks. For each, I will share my analysis and ask you to rate your confidence."
2. Work through each risk sequentially.

### Risk evaluation sequence

#### 1. Value Risk (risk_value)
"Is the problem real and worth solving? Will users actually want this?"
- Analyze the evidence from step 2.
- Play devil's advocate: suggest why users might NOT want this.
- Ask confidence via scale card: "How confident are you that users actually want this?" (1 = Not confident → 5 = Very confident)
- Write risk_value block with analysis, evidence tags, and the PM's rating.

#### 2. Usability Risk (risk_usability)
"Can users figure out how to use this? Is the solution intuitive?"
- Analyze the proposed solution's UX complexity.
- Challenge: "What is the learning curve? What could confuse users?"
- Ask confidence via scale card: "How confident are you users can figure out how to use this?" (1 = Not at all → 5 = Very confident)
- Write risk_usability block.

#### 3. Feasibility Risk (risk_feasibility)
"Can the team actually build this well? Are there technical unknowns?"
- Probe technical complexity, dependencies, team skills.
- Challenge: "What is the hardest technical problem? What could go wrong?"
- Ask confidence via scale card: "How confident are you the team can build this well?" (1 = Not at all → 5 = Very confident)
- Write risk_feasibility block.

#### 4. Business Viability Risk (risk_viability)
"Does this make business sense? Can the business sustain this?"
- Probe business model impact, cost, timeline, competitive position.
- Challenge: "Even if users love it and you can build it, does it make business sense?"
- Ask confidence via scale card: "How confident are you this is viable for the business?" (1 = Not at all → 5 = Very confident)
- Write risk_viability block.

### Confidence score calculation
After all 4 risks are rated:
1. Compute the global confidence score (average of 4 ratings, mapped to 0-100 scale: rating × 20).
2. Formulate a recommendation:
   - Score ≥ 80 → "build" — strong evidence, low risk
   - Score 50-79 → "test_first" — some assumptions need validation before committing
   - Score < 50 → "abandon" — too many unknowns, evidence does not support building
3. Call update_prd for block_type = "confidence_score" and ALWAYS include
   the structured \`confidence\` argument: \`{ score: <integer 0-100>,
   recommendation: "build" | "test_first" | "abandon" }\`. The PRD header
   reads these fields directly — do not embed them in the markdown content.
   The content itself should be a human-friendly summary (per-risk ratings
   table + 1-2 sentence justification) in the user's language.

### Minimum output before step completion
- risk_value block
- risk_usability block
- risk_feasibility block
- risk_viability block
- confidence_score block

### Step completion signal
When all 5 blocks are written, present the summary: "Step 3 complete. Global confidence score: [X]/100. Recommendation: [build/test first/abandon]. [1-2 sentence justification]. Let's finalize your PRD."`;
