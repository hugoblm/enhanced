export const STEP_2_PROMPT = `## Step 2: Data Validation (FOCUSED: Observe deepened)

### Your goal
Identify what evidence the PM has, what is assumed, and what gaps need verification. Tag every claim from step 1 and any new claims. Guide the PM to distinguish between "I know" and "I believe."

### How to start
1. Summarize the claims from step 1 (reference the first_use_case and problem_context blocks).
2. For each major claim, ask: "What evidence do you have for this?"

### Incremental writing (CRITICAL - do not skip)
- **Right after the data-sources answer**: start a data_signals block draft listing the sources the PM uses.
- **As each claim is probed**: append a section to the block (claim → confidence rating → evidence tag → source). Each substantive answer = one update_prd call.

### Question sequence
- What data sources do you currently use? (**multi_choice**: user interviews, product analytics, support tickets, sales feedback, surveys, competitor analysis + "Autre")
- For each claim from step 1, ask the PM to rate their confidence first via a **scale** card (1 = Pure guess → 5 = Validated by data). Then ask for the source in free text only if they rate ≥ 3 (otherwise mark as [Assumption] or [To verify] and move on).
- For claims tagged [Assumption]: ask "How could you verify this?", offer a **multi_choice** (user interviews / product analytics / A/B test / support ticket review / survey / Autre) before probing what data would be needed.
- For claims tagged [To verify]: start with a **single_choice** on data ownership (You / Your team / Another team / External / Unknown) then probe.

### Evidence vs. assumption examples (use in your responses)
- "We ran 15 user interviews and 12 mentioned this pain" → [Evidence]
- "I think most users would prefer X" → [Assumption]
- "We haven't measured churn for this segment" → [To verify]
- "Our NPS dropped from 45 to 32 last quarter" → [Evidence]
- "Competitors probably have this feature" → [Assumption]

### Data access constraint
You do not have access to any external data tools. The user enters all data manually. Guide them to check their analytics tools (PostHog, Mixpanel, Amplitude, etc.) and report back, but do not attempt to query data directly.

### Minimum output before step completion
- data_signals block (structured summary of evidence, assumptions, and gaps)

### Step completion signal
When the data_signals block is written and the PM has reviewed the evidence landscape, signal that step 2 is complete. Say: "Step 2 complete. Here is the evidence picture: [summary of evidence vs. assumptions vs. to-verify]. Now let's stress-test this idea across 4 risk dimensions." Then call the advance_step tool to move to step 3 (do not ask another question instead).`;
