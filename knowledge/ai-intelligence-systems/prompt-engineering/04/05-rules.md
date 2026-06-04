---
id: ku-04
title: "Token Budget Allocation - Rules"
subdomain: "prompt-engineering"
ku-type: "optimization"
date-created: "2026-06-02"
---

## Rules for Token Budget Allocation

### R1: Define explicit token budgets per agent and per request type before writing prompts
- **Category:** Cost Management
- **Rule:** For each agent, define a max token budget (input + output total) and allocate it across prompt components (system, examples, user input, output) before any prompting work begins; enforce at runtime.
- **Reason:** Without a budget, prompts grow organically — developers add "just one more instruction" until the prompt is 8000 tokens and costs 4x what it should. Budgets force discipline.
- **Bad Example:** A customer support agent prompt that grew to 6000 tokens because each developer added their own instructions, costing $0.15 per call vs. the intended $0.03.
- **Good Example:** Budget: 2000 tokens total. Allocated: 500 system, 300 examples, 1000 user input, 200 output. Every proposed addition must justify removal of existing content.
- **Exceptions:** R&D agents where prompt exploration is the goal.
- **Consequences of Violation:** Uncontrolled cost growth; prompts become bloated with redundant or contradictory instructions; per-call costs significantly exceed estimates.

### R2: Always calculate output token limits based on task needs, not model defaults
- **Category:** Cost Management
- **Rule:** Set `max_tokens` per request to the minimum output length required for the task type, not the model's maximum (e.g., classification → 50, chat → 500, code generation → 2000); never leave `max_tokens` at the model default or unlimited.
- **Reason:** Output tokens cost the same as input tokens. Allowing 4096 output tokens for a yes/no classification wastes tokens when the model generates verbose explanations. It also increases latency.
- **Bad Example:** All requests using the default `max_tokens: 4096` — a classification request generates 4000 tokens of analysis when only "yes"/"no" is needed.
- **Good Example:** Classification: `max_tokens: 10`. Chat: `max_tokens: 500`. Code: `max_tokens: 2000`.
- **Exceptions:** Creative writing or exploratory tasks where output length is unpredictable.
- **Consequences of Violation:** Paying 4-10x more than necessary for output tokens; increased latency as the model generates unnecessary length; users receive verbose responses that obscure the actual answer.

### R3: Implement a token budget rebalancing mechanism that adjusts allocation based on response patterns
- **Category:** Optimization
- **Rule:** Collect per-agent token usage data and periodically rebalance budgets — increase allocation for components that measurably improve output quality, decrease for components that don't.
- **Reason:** Initial token budgets are guesses based on intuition. Data-driven rebalancing ensures budget is spent on what actually improves the output, not on what seems important.
- **Bad Example:** A 500-token "persona instruction" section that never changes and was never tested for its impact on quality — 25% of budget spent on something that may not matter.
- **Good Example:** A quarterly review where each prompt component's quality impact is measured; the persona section was found to add no measurable value and was cut to 100 tokens.
- **Exceptions:** Static agents with unchanging quality metrics.
- **Consequences of Violation:** Token budget persistently allocated to low-value components; quality improvements blocked because "there's no room in the budget" for valuable additions.
