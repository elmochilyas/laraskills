# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** prompt-engineering
**Knowledge Unit:** ab-testing-prompt-variants
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Baking Recipe Iteration
- [ ] Blind Wine Tasting
- [ ] Clinical Drug Trial
- [ ] Cohort-based assignment
- [ ] Cost-aware evaluation
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for A/B Testing Prompt Variants

---

# Architecture Checklist

- [ ] Embedding similarity vs. explicit scoring â†’ Both. Reason: Embedding similarity catches semantic drift that explicit scoring misses; explicit scoring catches quality differences that embeddings average out
- [ ] LLM
- [ ] Session
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Baking Recipe Iteration
- [ ] Blind Wine Tasting
- [ ] Clinical Drug Trial
- [ ] Cohort-based assignment
- [ ] Cost-aware evaluation
- [ ] Evaluation rubric
- [ ] Holdout set evaluation
- [ ] Human-in-the-loop review
- [ ] One-variable-at-a-time
- [ ] Rules for A/B Testing Prompt Variants

---

# Performance Checklist

- [ ] Embedding similarity comparison: ~$0.0001 per comparison â€” essentially free, use for broad screening before detailed evaluation
- [ ] Evaluation pipeline should be async (queued jobs) â€” never evaluate inline during user-facing requests
- [ ] Experiment assignment adds ~1ms per agent call (Redis lookup + deterministic hash) â€” negligible
- [ ] LLM-as-judge evaluation costs: ~$0.01-0.05 per evaluation query (Claude Opus / GPT-4o) â€” 1000 evaluations costs $10-50
- [ ] Statistical analysis: aggregate in-memory or in DB at experiment conclusion â€” real-time analysis creates unnecessary load

---

# Security Checklist

- [ ] Communicate experiment results transparently â€” share A/B test results with the team to build institutional knowledge about what prompt patterns work
- [ ] Implement minimum sample size â€” don't make rollout decisions on fewer than 100 responses per variant
- [ ] Log all experiment data immutably â€” regulatory compliance may require proving how a prompt version was validated
- [ ] Monitor experiment impact on user experience â€” a bad variant can degrade user satisfaction before the experiment ends
- [ ] Never A/B test unvalidated prompts on production traffic â€” test on staging with mirrored traffic first
- [ ] Set experiment auto-stop conditions â€” if variant quality score drops below threshold, automatically halt the experiment and fall back to control

---

# Reliability Checklist

- [ ] Changing multiple variables simultaneously â€” cannot determine which change caused the effect
- [ ] Ignoring cost differences â€” variant that's 15% better but 3x more expensive is not a clear win
- [ ] Not testing for regressions â€” variant improves on one dimension but degrades on another (e.g., more accurate but ruder tone)
- [ ] Running experiments without a holdout set â€” each variant tested on different queries makes comparison meaningless
- [ ] Stopping experiments too early â€” "looks better" after 20 responses is not statistically significant; minimum 100 per variant
- [ ] Using the same model for generation and evaluation â€” evaluation LLM has style bias toward its own outputs

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Performance implications are accounted for in the design.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.
- [ ] Security considerations are addressed.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No AB Testing â€” Prompt Changes Based on Gut Feel]
- [ ] [Testing Without Statistical Significance â€” Misleading Results]
- [ ] [Multiple Changes Tested at Once â€” Can't Attribute Improvement]
- [ ] [No Evaluation Dataset â€” Subjective Quality Assessment]
- [ ] [AB Test Not Isolated â€” Other Variables Change During Test]
- [ ] Evaluator bias
- [ ] Evaluator fatigue
- [ ] Selection bias
- [ ] Statistical fluke
- [ ] Variant contamination

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


