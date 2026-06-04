# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 07-architecture-enforcement-governance
**Knowledge Unit:** CI enforcement of architecture rules
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] CI optional prevented
- [ ] No baseline prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Run architecture tests as a pre-merge gate in CI.** Configure CI to block merges on architecture test failures. No manual override of the failure.
- [ ] Workflow step completed: **Run architecture tests early in the CI pipeline.** Architecture tests are fast (1-5 seconds) and detect structural violations early. Run as one of the first jobs.
- [ ] Workflow step completed: **Run architecture tests in a separate parallel CI job.** Separate from unit/feature tests. A separate job completes faster and fails independently.
- [ ] Workflow step completed: **Baseline existing violations before introducing new strict rules.** Record existing violations as a baseline. Require new code to not introduce new violations above the baseline.
- [ ] Workflow step completed: **Document exemptions explicitly in a reviewed file.** Every architecture rule exemption goes in a dedicated file with reason, approver, and expiry date.

---

# Performance Checklist

- [ ] N+1 queries reviewed
- [ ] Caching strategy evaluated
- [ ] Expensive operations queued

---

# Security Checklist

- [ ] Authorization enforced
- [ ] Validation implemented
- [ ] Secrets protected

---

# Reliability Checklist

- [ ] Failure addressed: Architecture tests not in CI.
- [ ] Failure addressed: Ignoring CI failures.
- [ ] Failure addressed: No baseline for legacy code.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Architecture tests run in CI on every PR
- [ ] CI blocks merges on architecture test failure
- [ ] Architecture tests run early in CI pipeline (fail fast)
- [ ] Architecture tests run in separate parallel CI job
- [ ] Baseline exists for existing violations
- [ ] Exemptions are documented and reviewed
- [ ] PR comments include violation details on failure
- [ ] Baseline violation degradation is tracked and alerted

### Success Criteria
- [ ] Architecture tests run on every PR in CI as a required pre-merge gate Ã¢â‚¬â€ no merges past failures.
- [ ] Tests run early (first jobs) and in a separate parallel job from feature tests.
- [ ] Existing codebase has a recorded baseline; new code must not introduce violations above baseline.
- [ ] All exemptions are documented in a reviewed file with expiry dates.
- [ ] PR comments include specific violation details (file, type, line).
- [ ] CI fails if violation count exceeds the established baseline.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: CI optional
- [ ] Anti-pattern prevented: No baseline

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Architecture tests not in CI.
- [ ] Failure scenario handled: Ignoring CI failures.
- [ ] Failure scenario handled: No baseline for legacy code.

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
