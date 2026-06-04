# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** prompt-engineering
**Knowledge Unit:** ku-05
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Automate regression testing in CI.
- [ ] Build a diverse test set.
- [ ] Establish a prompt review process.
- [ ] Monitor prompt metrics in production.
- [ ] Use multiple evaluation methods.
- [ ] Automated checks validate format, keywords, length, and safety properties.
- [ ] LLM-as-Judge evaluation is validated for accuracy (not used blindly).
- [ ] Prompt quality metrics are monitored in production (format failure rate, user feedback).
- [ ] Rules for Output Format Control
- [ ] Automated checks validate format, keywords, length, and safety properties
- [ ] LLM-as-Judge evaluation is validated for accuracy (not used blindly)
- [ ] Prompt quality metrics are monitored in production (format failure rate, user feedback)
- [ ] **Build test case registry**: Store test cases with metadata: input text, expected characteristics (format, keywords, length range, safety), priority (critical, high, medium, low), and category.
- [ ] **Create regression test suite**: Select a subset of high-priority test cases for CI/CD. Run on every prompt change. Block deployment if any critical test fails.
- [ ] **Define test categories**: Create test cases for: happy path (normal inputs), edge cases (empty, very long, special characters), adversarial inputs (injection attempts, role play), safety scenarios (harmful requests, PII exposure), and format compliance.
- [ ] All critical tests must pass before prompt change is deployed
- [ ] CI/CD pipeline runs regression test suite in <10 minutes with prompt change
- [ ] LLM-as-Judge evaluation validated against human judgments with >80% agreement

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Automate regression testing in CI.
- [ ] Build a diverse test set.
- [ ] Establish a prompt review process.
- [ ] Monitor prompt metrics in production.
- [ ] Use multiple evaluation methods.
- [ ] Version prompts with semantic versions.
- [ ] **Build test case registry**: Store test cases with metadata: input text, expected characteristics (format, keywords, length range, safety), priority (critical, high, medium, low), and category.
- [ ] **Create regression test suite**: Select a subset of high-priority test cases for CI/CD. Run on every prompt change. Block deployment if any critical test fails.
- [ ] **Define test categories**: Create test cases for: happy path (normal inputs), edge cases (empty, very long, special characters), adversarial inputs (injection attempts, role play), safety scenarios (harmful requests, PII exposure), and format compliance.
- [ ] **Detect prompt drift**: Periodically re-run the full test suite against production prompts to detect drift (the underlying model may change over time). Compare against the original baseline.
- [ ] **Implement automated checks**: Create check functions for: format validation (JSON, XML, markdown), keyword presence, length ranges, sentiment analysis, and safety content detection. Each check returns pass/fail.
- [ ] **Integrate with CI/CD**: Add prompt evaluation as a CI pipeline step. Compare results against the baseline prompt version. Fail the build if quality metrics degrade beyond threshold.

---

# Performance Checklist

- [ ] Cache evaluation results for unchanged prompts â€” don't re-evaluate prompts that haven't changed.
- [ ] LLM-as-Judge evaluation adds cost per test case (cheaper model, but 2x LLM calls per test).
- [ ] Regression suite should be a subset of the full test suite (fast, high-priority tests for CI; full suite for nightly).
- [ ] Running a full prompt evaluation suite takes 1-10 minutes (depends on test count and model).
- [ ] Test parallelization: run independent test cases concurrently to reduce suite execution time.
- [ ] Cache evaluation results for unchanged prompts (re-evaluate only changed prompts)
- [ ] Production monitoring overhead: <1ms per request (log metrics, no LLM calls)
- [ ] Test parallelization: run independent test cases concurrently

---

# Security Checklist

- [ ] Adversarial test cases:
- [ ] Evaluation model security:
- [ ] Regression detection:
- [ ] Test data confidentiality:
- [ ] Test data poisoning:
- [ ] Include adversarial test cases (prompt injection attempts) to verify safety guardrails
- [ ] Test cases may contain sensitive data or PII â€” use synthetic data where possible

---

# Reliability Checklist

- [ ] Not updating test cases as the application evolves â€” stale tests don't catch regressions.
- [ ] Only testing the happy path â€” edge cases reveal prompt weaknesses.
- [ ] Testing prompts in isolation without considering the full message chain (system + context + history).
- [ ] Treating prompt evaluation as a one-time activity â€” continuous monitoring is required.
- [ ] Using LLM-as-Judge without validating the judge's accuracy â€” the judge may have biases or blind spots.

---

# Testing Checklist

- [ ] All critical tests must pass before prompt change is deployed
- [ ] Automated checks validate format, keywords, length, and safety properties
- [ ] Automated checks validate format, keywords, length, and safety properties.
- [ ] CI/CD pipeline runs regression test suite in <10 minutes with prompt change
- [ ] LLM-as-Judge evaluation is validated for accuracy (not used blindly)
- [ ] LLM-as-Judge evaluation is validated for accuracy (not used blindly).
- [ ] LLM-as-Judge evaluation validated against human judgments with >80% agreement
- [ ] Production metrics tagged by prompt version show format failure rate <5%
- [ ] Prompt drift detection re-runs full suite quarterly and alerts on quality degradation
- [ ] Prompt quality metrics are monitored in production (format failure rate, user feedback)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Long Prompts for Time-Sensitive Responses]
- [ ] [No Prompt Caching â€” Same Prompt Rebuilt Every Request]
- [ ] [Detailed Instructions for Simple Tasks]
- [ ] [No Temperature Tuning for Task Type]
- [ ] [Same Prompt Structure for Sync and Async]
- [ ] No Baseline:
- [ ] Prompt Changes Without Tests:
- [ ] Stale Golden Dataset:
- [ ] Subjective-Only Evaluation:
- [ ] Test Suite as Safety Theater:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Production monitoring overhead: <1ms per request (log metrics, no LLM calls)
- [ ] Production quality alerts should not leak sensitive data in notification channels
- [ ] Safety regression failures must be blocking (critical) â€” deployment stops

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


