# Skill: Test and Evaluate Prompt Quality

## Purpose
Build a systematic prompt test suite with automated checks (format, keywords, length, safety), LLM-as-Judge evaluation, regression testing in CI/CD, and production monitoring to detect prompt regressions and drift.

## When To Use
- Any prompt that goes to production — testing is not optional
- Prompts that are modified frequently — regression testing catches unintended changes
- Multi-model deployments — the same prompt may behave differently on different models
- Applications where output quality directly impacts user satisfaction or safety

## When NOT To Use
- One-off, non-production prompts used for debugging or exploration
- When the LLM output is always reviewed by a human (still recommended, but lower priority)

## Prerequisites
- KU-01 (Prompt Engineering Fundamentals) — understanding of prompt structure and behavior
- Prompt registry with versioned prompts
- Test infrastructure (CI/CD pipeline, test runner)
- Access to target LLM models for evaluation
- LLM-as-Judge evaluation model (cheaper model like GPT-4o-mini or Claude Haiku)

## Inputs
- Prompt templates to be tested (system + user)
- Test cases with expected characteristics (format, keywords, safety, length)
- Golden dataset of ideal input-output pairs
- Quality criteria and thresholds
- Production monitoring metrics (format failure rate, user feedback)

## Workflow
1. **Define test categories**: Create test cases for: happy path (normal inputs), edge cases (empty, very long, special characters), adversarial inputs (injection attempts, role play), safety scenarios (harmful requests, PII exposure), and format compliance.
2. **Build test case registry**: Store test cases with metadata: input text, expected characteristics (format, keywords, length range, safety), priority (critical, high, medium, low), and category.
3. **Implement automated checks**: Create check functions for: format validation (JSON, XML, markdown), keyword presence, length ranges, sentiment analysis, and safety content detection. Each check returns pass/fail.
4. **Set up LLM-as-Judge evaluation**: For subjective quality criteria (helpfulness, relevance, tone), use a second LLM (cheaper model) to evaluate the primary model's output. Define scoring criteria and pass thresholds.
5. **Create regression test suite**: Select a subset of high-priority test cases for CI/CD. Run on every prompt change. Block deployment if any critical test fails.
6. **Integrate with CI/CD**: Add prompt evaluation as a CI pipeline step. Compare results against the baseline prompt version. Fail the build if quality metrics degrade beyond threshold.
7. **Stage prompt deployments**: Test prompts in a staging environment against recorded production traffic before deploying to production. Compare output distributions between old and new prompts.
8. **Monitor prompt quality in production**: Track format failure rate, output length distribution, user feedback (thumbs up/down), and safety events per prompt version. Set alerts for degradation.
9. **Detect prompt drift**: Periodically re-run the full test suite against production prompts to detect drift (the underlying model may change over time). Compare against the original baseline.
10. **Review and update test cases**: Update test cases as the application evolves. Remove stale cases. Add new edge cases discovered in production. Review quarterly.

## Validation Checklist
- [ ] Test suite includes happy path, edge cases, adversarial inputs, and safety scenarios
- [ ] Automated checks validate format, keywords, length, and safety properties
- [ ] Regression tests run in CI before every prompt change is deployed
- [ ] LLM-as-Judge evaluation is validated for accuracy (not used blindly)
- [ ] Prompt quality metrics are monitored in production (format failure rate, user feedback)
- [ ] Prompts are versioned with semantic versions and staged deployment
- [ ] Test cases are reviewed and updated as the application evolves

## Common Failures
- **Tests always pass**: Test suite doesn't catch real regressions because checks are too lenient. Fix: tighten thresholds, add more specific checks, include adversarial cases.
- **LLM-as-Judge bias**: Judge model consistently overrates or underrates output quality. Fix: validate judge against human evaluations. Use multiple judges if budget allows.
- **Stale test cases**: Tests from 6 months ago don't cover current use cases. Fix: quarterly review, add cases from production incidents, retire obsolete cases.
- **CI runs too slowly**: Full test suite takes 30+ minutes. Fix: use a fast regression subset for CI (5-10 minutes). Run full suite nightly.
- **Production monitoring disconnected from prompt versions**: Metrics not tagged by prompt version, can't correlate quality changes to prompt changes. Fix: tag all production metrics with prompt version.

## Decision Points
- **Automated checks vs. LLM-as-Judge**: Automated checks for objective criteria (format, keywords, length). LLM-as-Judge for subjective criteria (helpfulness, relevance, tone). Use both.
- **Regression suite vs. full suite**: Regression suite (critical + high priority tests, 10-20 cases) for CI. Full suite (all tests, 50-100+ cases) for nightly or pre-release.
- **LLM-as-Judge model**: Use a cheaper/faster model (GPT-4o-mini, Claude Haiku) for cost efficiency. Validate against a sample judged by the production model or humans.

## Performance Considerations
- Full prompt evaluation suite: 1-10 minutes (depends on test count and model)
- LLM-as-Judge: 2x LLM calls per test case (main model + judge)
- CI regression suite: aim for 5-10 minutes max
- Test parallelization: run independent test cases concurrently
- Cache evaluation results for unchanged prompts (re-evaluate only changed prompts)
- Production monitoring overhead: <1ms per request (log metrics, no LLM calls)

## Security Considerations
- Test cases may contain sensitive data or PII — use synthetic data where possible
- Include adversarial test cases (prompt injection attempts) to verify safety guardrails
- If using LLM-as-Judge, ensure the evaluation model runs in a trusted environment
- Ensure test data hasn't been manipulated (data poisoning for evaluation gaming)
- Safety regression failures must be blocking (critical) — deployment stops
- Production quality alerts should not leak sensitive data in notification channels

## Related Rules
- Define explicit token budgets per agent and per request type before writing prompts
- Always calculate output token limits based on task needs, not model defaults
- Implement a token budget rebalancing mechanism that adjusts allocation based on response patterns

## Related Skills
- Skill: Design and Manage Production Prompts (ku-01)
- Skill: Design System Prompts for Agents (ku-02)
- Skill: Optimize Prompt Token Usage and Quality (ku-03)
- Skill: Produce Structured Output from LLMs (ku-04)

## Success Criteria
- Test suite covers happy path, edge cases, adversarial inputs, and safety scenarios
- CI/CD pipeline runs regression test suite in <10 minutes with prompt change
- All critical tests must pass before prompt change is deployed
- LLM-as-Judge evaluation validated against human judgments with >80% agreement
- Production metrics tagged by prompt version show format failure rate <5%
- Prompt drift detection re-runs full suite quarterly and alerts on quality degradation
- Safety regressions immediately block deployment and notify the team