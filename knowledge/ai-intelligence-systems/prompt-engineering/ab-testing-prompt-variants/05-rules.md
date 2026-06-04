---
id: KU-030 (Prompt Eng)
title: "A/B Testing Prompt Variants - Rules"
subdomain: "prompt-engineering"
ku-type: "optimization"
date-created: "2026-06-02"
---

## Rules for A/B Testing Prompt Variants

### R1: Never A/B test prompts without automated evaluation of outputs
- **Category:** Reliability
- **Rule:** Every prompt variant must be evaluated against an automated evaluation suite (exact match, semantic similarity, LLM-as-judge) before being analyzed; never rely on subjective human judgment alone.
- **Reason:** Without automated evaluation, decisions are based on anecdotal preferences or recency bias. A variant that "feels better" may actually produce worse factual accuracy.
- **Bad Example:** Choosing prompt variant B because "it sounds more natural" to the developer who reviewed 3 examples.
- **Good Example:** Variant B scored 4.8/5 on correctness (100-test eval) vs Variant A's 3.9/5; naturalness was a secondary metric.
- **Exceptions:** Creative tasks (story generation, branding) where output quality is inherently subjective.
- **Consequences of Violation:** Deploying subjectively preferred but objectively worse prompts; regressions in factual accuracy, safety, or task success rate.

### R2: Always use feature flags or prompt version metadata to route traffic between variants
- **Category:** Infrastructure
- **Rule:** Route prompt variants via feature flags (e.g., Split.io, Laravel Pennant) or a metadata field on the `AgentRequest`; never deploy separate code paths or endpoints for different variants.
- **Reason:** Separate code paths duplicate logic and increase maintenance burden. Feature flags allow dynamic percentage rollouts, instant rollbacks, and targeted exposure without redeployment.
- **Bad Example:** A `PromptsV2Controller` deployed alongside `PromptsController` — the V2 controller has subtle bugs that V1 doesn't.
- **Good Example:** Pennant feature `prompt:v2` routing 50% of traffic to `prompt_v2()` and 50% to `prompt_v1()`, adjustable without deploy.
- **Exceptions:** None — feature flags are strictly superior to code-path separation for A/B testing.
- **Consequences of Violation:** Code duplication, inconsistent behavior between variants, inability to roll back without deploy, and accidental exposure of experimental variants to all users.

### R3: Collect and compare cost metrics (input tokens and output tokens) alongside quality metrics
- **Category:** Cost Management
- **Rule:** For every prompt variant in an A/B test, record the token count per invocation and include cost-per-task in the comparison dashboard; never evaluate quality without cost context.
- **Reason:** A variant that improves quality by 5% but increases cost by 300% is rarely a net win. Cost-blind evaluation leads to deploying expensive prompts for marginal quality gains.
- **Bad Example:** Deploying a verbose prompt variant that adds "think step by step" + "provide authoritative sources" — quality improves 3%, but token cost doubles.
- **Good Example:** The evaluation scorecard shows: Variant B has 3% higher accuracy but 120% higher cost; team decides to use Variant B only for high-stakes requests.
- **Exceptions:** Quality-critical applications where cost is not a constraint.
- **Consequences of Violation:** AI costs increase disproportionately to quality improvements; budget consumed on costly prompt variants with minimal user-facing benefit.
