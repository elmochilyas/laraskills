# Knowledge Unit: A/B Testing Prompt Variants

## Metadata

- **ID:** KU-034 (Prompt Engineering)
- **Subdomain:** Prompt Engineering Systems
- **Slug:** ab-testing-prompt-variants
- **Version:** 1.0.0
- **Maturity:** Emerging (evolving practice)
- **Status:** Published

## Executive Summary

A/B testing prompt variants is the practice of systematically comparing different prompt versions across dimensions like response quality, adherence to format, cost, latency, and user satisfaction. Unlike traditional A/B testing (measuring click-through rates), prompt A/B testing requires LLM-as-judge evaluations, embedding similarity metrics, and human-in-the-loop review cycles. It is essential for objectively determining which prompt version produces the best outcomes before full production rollout.

## Core Concepts

- **Prompt variant**: A specific version of a system prompt or few-shot example set, differing from the control in exactly one dimension (tone, instructions, examples, constraints)
- **Control group**: The current production prompt — baseline for comparing alternatives
- **Evaluation dimensions**: Quality, format compliance, cost per response, latency, refusal rate, hallucination rate, user satisfaction score
- **LLM-as-judge**: Use a strong LLM (Claude Opus, GPT-4o) to evaluate response quality — faster and cheaper than human evaluation, but has bias toward its own style
- **Embedding similarity**: Compare response embeddings to measure semantic drift between variants — high drift + high quality = significant improvement
- **Statistical significance**: Use chi-square or t-tests on evaluation scores to determine if variant truly outperforms control
- **Holdout set**: A fixed set of 50-200 test queries used across all variant evaluations — ensures consistent comparison

## Mental Models

- **Clinical Drug Trial**: The control group gets the current drug (production prompt), the test group gets the new drug (variant). Both groups are monitored for outcomes (quality, side effects). Only if the new drug shows statistically significant improvement does it replace the standard treatment.
- **Blind Wine Tasting**: Two wines (prompt variants) are served without labels. Tasters (evaluators) rate them on multiple criteria without knowing which is which. The blind tasting eliminates bias toward the familiar wine.
- **Baking Recipe Iteration**: You bake the same cake with two variations — more sugar (expressive prompts) vs. more vanilla (structured prompts). Tasters rate both on flavor, texture, appearance. The recipe with the highest composite score becomes the new standard.

## Internal Mechanics

A prompt A/B test system in Laravel involves several components:

1. **Experiment router**: Intercepts agent calls to route a percentage of traffic to variant prompts
2. **Variant storage**: Stores prompt variants in database (see Prompt Versioning) with metadata about which experiment they belong to
3. **Evaluation pipeline**: Collects responses from both control and variant groups, sends them to an evaluation LLM, and records scores
4. **Analytics aggregation**: Computes statistical metrics — mean quality score, variance, confidence intervals, p-values
5. **Rollout decision**: If variant is statistically significantly better at p < 0.05, promote to production

```php
class PromptExperimentRouter
{
    public function resolve(string $promptName, User $user): PromptVariant
    {
        $experiment = Experiment::activeFor($promptName);

        if (! $experiment) {
            return Prompt::resolve($promptName);
        }

        // Deterministic assignment based on user ID for consistent experience
        $assignment = $experiment->assign($user->id);

        $prompt = PromptVariant::forExperiment($experiment, $assignment);

        // Log the assignment for later analysis
        ExperimentAssignment::create([
            'experiment_id' => $experiment->id,
            'user_id' => $user->id,
            'variant' => $assignment,
            'prompt_version' => $prompt->version,
        ]);

        return $prompt;
    }
}
```

For LLM-as-judge evaluation:

```php
$judge = new Agent(provider: 'anthropic', model: 'claude-opus-4-20250514');

$evaluation = $judge->call(
    "Evaluate the following AI response on a scale of 1-10 for:
     - Accuracy: Does the response correctly answer the query?
     - Completeness: Does it cover all aspects?
     - Conciseness: Is it appropriately brief?
     - Format: Does it follow the requested format?

     Query: {$query}
     Response A (control): {$controlResponse}
     Response B (variant): {$variantResponse}

     Return scores in JSON format.",
    schema: EvaluationScore::schema()
);
```

## Patterns

- **One-variable-at-a-time**: Change exactly one dimension per experiment (tone OR detail level OR constraints) — changing multiple things obscures which change caused the effect
- **Cohort-based assignment**: Assign users to variants deterministically (user_id hash) — consistent experience within a session
- **Holdout set evaluation**: Use the same 100 test queries for every variant — enables apples-to-apples comparison across experiment rounds
- **Evaluation rubric**: Define precise scoring criteria before running the experiment — prevents moving goalposts
- **Cost-aware evaluation**: Track tokens consumed per variant — a variant that's 5% better but 2x more expensive may not be worth deploying
- **Human-in-the-loop review**: For safety-critical applications, have human reviewers score a random sample (100 responses per variant) rather than relying solely on LLM judge

## Architectural Decisions

- **Decision**: LLM-as-judge vs. human evaluation → Automated (LLM) for throughput, human for spot-checks. Reason: Human evaluation doesn't scale — a team evaluating 10 variants × 100 queries needs 1000 human reviews. LLM evaluation is 100x faster and costs cents.
- **Decision**: Embedding similarity vs. explicit scoring → Both. Reason: Embedding similarity catches semantic drift that explicit scoring misses; explicit scoring catches quality differences that embeddings average out.
- **Decision**: Session-consistent vs. random assignment → Session-consistent (user hash). Reason: Random assignment per request creates a confusing experience for users who see different AI quality across requests.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| LLM-as-judge | Fast, cheap, scalable | Biased toward judge model's own style |
| Human evaluation | Gold standard quality assessment | Slow, expensive ($5-20 per 100 evaluations) |
| Session-consistent assignment | Consistent user experience | Slower statistical convergence (fewer independent samples) |

## Performance Considerations

- LLM-as-judge evaluation costs: ~$0.01-0.05 per evaluation query (Claude Opus / GPT-4o) — 1000 evaluations costs $10-50
- Embedding similarity comparison: ~$0.0001 per comparison — essentially free, use for broad screening before detailed evaluation
- Experiment assignment adds ~1ms per agent call (Redis lookup + deterministic hash) — negligible
- Evaluation pipeline should be async (queued jobs) — never evaluate inline during user-facing requests
- Statistical analysis: aggregate in-memory or in DB at experiment conclusion — real-time analysis creates unnecessary load

## Production Considerations

- Never A/B test unvalidated prompts on production traffic — test on staging with mirrored traffic first
- Implement minimum sample size — don't make rollout decisions on fewer than 100 responses per variant
- Monitor experiment impact on user experience — a bad variant can degrade user satisfaction before the experiment ends
- Set experiment auto-stop conditions — if variant quality score drops below threshold, automatically halt the experiment and fall back to control
- Log all experiment data immutably — regulatory compliance may require proving how a prompt version was validated
- Communicate experiment results transparently — share A/B test results with the team to build institutional knowledge about what prompt patterns work

## Common Mistakes

- Running experiments without a holdout set — each variant tested on different queries makes comparison meaningless
- Changing multiple variables simultaneously — cannot determine which change caused the effect
- Stopping experiments too early — "looks better" after 20 responses is not statistically significant; minimum 100 per variant
- Using the same model for generation and evaluation — evaluation LLM has style bias toward its own outputs
- Ignoring cost differences — variant that's 15% better but 3x more expensive is not a clear win
- Not testing for regressions — variant improves on one dimension but degrades on another (e.g., more accurate but ruder tone)

## Failure Modes

- **Evaluator bias**: LLM judge consistently prefers responses matching its own style — use a different model for evaluation than for generation (e.g., generate with Claude, evaluate with GPT-4o)
- **Statistical fluke**: Random variation produces a false positive — run experiment longer or use Bayesian statistics with prior
- **Selection bias**: Test set doesn't represent production queries — curate holdout set from actual production logs
- **Evaluator fatigue**: LLM judge produces lower-quality evaluations after long sequences — shuffle evaluation order, limit batch size to 50
- **Variant contamination**: Variant A's responses leak into Variant B's evaluation — ensure strict isolation between experiment groups in the evaluation pipeline

## Ecosystem Usage

- **Laravel Pennant**: Feature flags for experiment assignment — assign users to prompt variants using Pennant's percentage-based rollout
- **`dewaldhugo/laravel-ai-governor`**: Prompt versioning and variant storage — base infrastructure for A/B testing
- **Laravel AI SDK `FakeAi`**: Testing fakes used in automated experiment evaluation pipelines
- **Laravel Queue**: Async evaluation pipeline — queue evaluation jobs to avoid blocking user requests
- **Custom packages**: No dedicated prompt A/B testing package exists yet — build on Pennant + Governor + evaluation pipeline

## Related Knowledge Units

- KU-003: Prompt Versioning (managing variants as versioned prompts)
- KU-001: System Prompt Design (what you're testing — the prompt itself)
- KU-002: Few-Shot Chain-of-Thought (variant: different few-shot examples)
- KU-004: Structured Output Schemas (variant: different output schemas)
- KU-013: Token Tracking & Cost Estimation (measuring cost per variant)

## Research Notes

- Source: Domain analysis — A/B testing for prompt variants identified as a "Low Gap" (risk level Low, improvement opportunity)
- Source: Laravel Pennant documentation — feature flag-based experimentation
- Source: General A/B testing methodology adapted for LLM evaluation (emerging practice, no established Laravel package as of mid-2026)
- As of 2026, there is no dedicated Laravel package for prompt A/B testing — teams implement custom solutions using Pennant + evaluation pipelines
- LLM-as-judge evaluation has ~85-90% agreement with human evaluators for well-defined rubrics — sufficient for most prompt optimization
- Embedding similarity is a good screening tool: compute similarity between control and variant responses; high similarity + high quality score = safe improvement; low similarity + high quality score = fundamental change that needs careful review
- Future direction: automated prompt optimization — A/B test thousands of variants using evolutionary algorithms, evaluate with LLM judge, deploy the winning variant automatically
