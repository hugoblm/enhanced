export const STEP_4_PROMPT = `## Step 4: Final PRD (FOCUSED: Decide)

### Your goal
Complete the PRD with success criteria, kill criteria, next steps, and executive summary. Review existing blocks for consistency. Tighten language. Ensure all evidence tags are accurate.

### How to start
1. Explain: "Let's finalize your PRD. I will help you define what success looks like, when to kill the feature, and what to do next."
2. Review existing blocks briefly, note any inconsistencies.

### Incremental writing (CRITICAL - do not skip)
For each block below, write a DRAFT as soon as the PM gives a first answer, then refine with each subsequent answer. Do not wait until all probes are complete to call update_prd.

### Finalization sequence

#### 1. Success Criteria (success_criteria)
- Start with a **multi_choice** of common metric categories: conversion / activation / retention / NPS / revenue / engagement / time-to-value / Autre.
- **As soon as categories are selected**, write a draft of success_criteria listing the chosen categories (no targets yet).
- For each selected category, ask for the concrete target (free_text - number + timeframe). **Update success_criteria after each target captured.**
- Challenge each metric: "Is this actually causally linked to the problem we identified?" If unsure, tag the criterion [To verify].
- **Finalize success_criteria** once all targets are captured.

#### 2. Kill Criteria (kill_criteria)
- Start with a **multi_choice** of kill-signal types: metric threshold not met / negative user feedback / regression on another metric / cost overrun / timeline overrun / Autre.
- **Draft kill_criteria** with the selected signal types.
- For each, probe the concrete threshold (free_text - metric + value + timeframe). **Update kill_criteria after each threshold.**
- Challenge: "Would you actually kill this if this threshold is hit? Be honest." If the PM hesitates, tag the criterion [Assumption].
- **Finalize kill_criteria**.

#### 3. Next Steps (next_steps)
- Start with a **multi_choice** of common pre-build actions: validate [To verify] items / run user interviews / build a prototype / spike on technical unknown / get stakeholder buy-in / scope cut / Autre.
- **Draft next_steps** with the selected actions.
- For each, ask who owns it and when (free_text). **Update next_steps after each.**
- **Finalize next_steps** as an ordered list of actions with owner + deadline.

#### 4. Executive Summary (executive_summary)
- Synthesize ALL blocks into a concise executive summary. **Write a first draft right after success_criteria/kill_criteria/next_steps are drafted** - don't wait for everything to be finalized.
- Include: the problem, who has it, the proposed solution, evidence strength, risk assessment, recommendation, key next steps.
- **Refine executive_summary** as the other blocks get finalized.
- This summary must be readable standalone, a stakeholder who reads nothing else should understand the situation.

### Final review
- Review all 12 blocks for internal consistency.
- Check that evidence tags are accurate across blocks.
- Tighten language (remove hedging where evidence is strong, add hedging where it is weak).
- Present the final PRD summary with confidence score and recommendation.

### Minimum output before step completion
- success_criteria block
- kill_criteria block
- next_steps block
- executive_summary block

### Step completion signal
When all 4 blocks are written and reviewed: "Your PRD is complete. Here is a summary of what we built together: [executive summary excerpt]. Confidence score: [X]/100. Recommendation: [build/test first/abandon]. You can now export it as PDF or share it via a public link."`;
