# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 07-architecture-enforcement-governance
**Knowledge Unit:** Drift detection and architecture health
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] No measurement prevented
- [ ] Gaming the score prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Track architecture drift automatically on every commit.** Automated detection runs on every CI build and reports the health score. Catches drift the moment it is introduced.
- [ ] Workflow step completed: **Use health score (0-100) over absolute violation counts.** A normalized score accounts for codebase size changes. A score graph gives immediate feedback about whether architecture is improving or degrading.
- [ ] Workflow step completed: **Set threshold alerts that fail CI when drift exceeds budget.** Configure CI to fail when the drift score exceeds a configurable threshold. An alert that blocks the pipeline forces the team to address drift.
- [ ] Workflow step completed: **Baseline the initial drift score when starting monitoring.** Record the initial score. Require that the score does not decrease below the baseline. Prevents shock of strict thresholds on existing violations.
- [ ] Workflow step completed: **Attach specific violation details to the drift score.** Always report which violations caused the score. A score without details is not actionable.

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

- [ ] Failure addressed: No drift monitoring.
- [ ] Failure addressed: Perfect score obsession.
- [ ] Failure addressed: Drift score without context.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Automated drift detection runs on every commit
- [ ] Health score (0-100) is tracked over time
- [ ] Threshold alerts trigger CI failure when drift exceeds budget
- [ ] Violation details are reported alongside the score
- [ ] Drift reduction items exist in the backlog
- [ ] Baseline recorded at start of monitoring
- [ ] Score graph is visible to the team

### Success Criteria
- [ ] Automated drift detection runs on every CI build with a normalized health score (0-100).
- [ ] A baseline score is recorded; CI fails if drift exceeds the configured budget.
- [ ] Drift reports include specific violation details Ã¢â‚¬â€ not just a number.
- [ ] Drift reduction is tracked as specific backlog items with priority and estimation.
- [ ] High-impact violations (context isolation, circular deps) are fixed before low-impact items.
- [ ] Drift metrics are used for planning, not individual blame.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: No measurement
- [ ] Anti-pattern prevented: Gaming the score

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: No drift monitoring.
- [ ] Failure scenario handled: Perfect score obsession.
- [ ] Failure scenario handled: Drift score without context.

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
