# Skills

## Skill 1: A/B test prompt variants with automated evaluation and feature flag routing

### Purpose
Systematically compare prompt variants using automated evaluation (LLM-as-judge, semantic similarity, statistical tests), routing traffic via feature flags, and measuring quality, cost, and latency dimensions before full production rollout.

### When To Use
- Use when you need to objectively determine which prompt version produces the best outcomes
- Use before rolling out any prompt change to production
- Use when optimizing for multiple dimensions (quality, cost, latency, format compliance)
- Use when deploying data-driven prompt improvements across a team
- Use when you need to measure statistical significance of prompt changes

### When NOT To Use
- Do NOT use without automated evaluation — subjective judgment alone is unreliable
- Do NOT use for creative tasks where output quality is inherently subjective
- Do NOT use when the prompt change is a critical security fix (deploy immediately)
- Do NOT use when testing on low-traffic features (<100 requests/day)

### Prerequisites
- Two or more prompt variants to compare (control + variant)
- Automated evaluation suite (LLM-as-judge, exact match, semantic similarity)
- Feature flags system (Split.io, Laravel Pennant)
- Logging infrastructure that records which variant was used per request
- Statistical analysis capability (chi-square, t-test, or Bayesian evaluation)
- Minimum traffic volume to achieve statistical significance

### Inputs
- Control prompt (current production version)
- Variant prompt(s) (new version with exactly one dimension changed)
- Automated evaluation criteria and scoring function
- Traffic allocation percentages (e.g., 50/50 split)
- Metadata fields for variant identification in logs

### Workflow
1. Define the hypothesis: "Changing the tone from formal to conversational improves user satisfaction by 10%."
2. Create prompt variants differing in exactly one dimension (tone, instructions, examples, constraints)
3. Set up automated evaluation suite:
   - LLM-as-judge using a strong model (Claude Opus, GPT-4o)
   - Semantic similarity via embedding comparison
   - Exact match / format compliance checks
   - Cost and latency measurement
4. Configure feature flag routing to split traffic between control and variant:
   ```php
   Feature::define('prompt:chat-v2', fn (User $user) => match (true) {
       $user->id % 2 === 0 => true,   // 50% to variant
       default => false,               // 50% to control
   });
   ```
5. Log which variant was used with every LLM request and response
6. Run the experiment until statistically significant (minimum 100 samples per variant for LLM-as-judge)
7. Analyze results: quality scores, cost per response, latency, refusal rates
8. Use statistical tests (chi-square for categorical, t-test for continuous) to determine significance
9. Deploy the winning variant, or iterate and retest if inconclusive

### Validation Checklist
- [ ] Control and variant differ in exactly one dimension
- [ ] Automated evaluation suite is defined and validated
- [ ] Feature flags route traffic correctly between variants
- [ ] Variant identity is logged with every LLM request
- [ ] Minimum sample size is defined per evaluation dimension
- [ ] Statistical significance is computed before declaring a winner
- [ ] Cost and latency differences are measured alongside quality
- [ ] Experiment duration is sufficient for reliable results
- [ ] Rollback plan exists if winning variant causes production issues

### Common Failures
- **Subjective evaluation**: "Feels better" without data — always use automated evaluation
- **Multiple changes at once**: Can't tell which change caused the effect — test one dimension at a time
- **Low sample size**: 10 examples per variant is not statistically significant — collect 100+ per variant
- **LLM-as-judge bias**: Judge model prefers its own style — use a different model as judge
- **No cost measurement**: Variant improves quality but costs 5x more — must measure all dimensions
- **Feature flag misconfiguration**: All traffic goes to variant due to routing bug — verify with test

### Decision Points
- **Evaluation method**: LLM-as-judge (fast, cheaper) vs. human evaluation (accurate, expensive) — use both
- **Statistical threshold**: p < 0.05 for significant improvement, p < 0.10 for directional signals
- **Traffic percentage**: 50/50 for clear decisions, smaller variant % for risky changes
- **Experiment duration**: Fixed sample count (N=500) vs. fixed duration (2 weeks)

### Performance Considerations
- LLM-as-judge adds evaluation cost (0.5-5% of main LLM cost depending on sample rate)
- Feature flag check adds <1ms per request
- Logging variant identity adds minimal storage overhead
- Evaluation can run asynchronously (not in the request path)
- Statistical analysis should be automated and run after data collection

### Security Considerations
- A/B testing may expose some users to lower-quality prompts — monitor for safety regressions
- Feature flag values should not be user-controlled
- Variant logs may contain sensitive user data — redact before analysis
- Winning prompt should still pass adversarial testing before full rollout
- Rollback mechanism must work instantly if variant causes harmful outputs

### Related Rules
- R1: Never A/B test prompts without automated evaluation of outputs
- R2: Always use feature flags or prompt version metadata to route traffic between variants

### Related Skills
- Implement prompt versioning with version-controlled prompt files
- Design system prompts with persona and guardrails
- Design few-shot examples and chain-of-thought prompts
- Design structured output schemas for agent responses

### Success Criteria
- Every prompt change is A/B tested before full production rollout
- Automated evaluation objectively determines the winning variant
- Feature flags route traffic correctly with clear variant attribution in logs
- Statistical significance is achieved before deployment decisions
- Both quality and cost/latency metrics are considered in the decision
- Rollback to control is instant if the variant causes issues
