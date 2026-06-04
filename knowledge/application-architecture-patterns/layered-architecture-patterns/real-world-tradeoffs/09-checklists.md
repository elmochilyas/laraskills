# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** Real-world tradeoffs: when Clean Architecture pays off
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Premature architecture prevented
- [ ] Architecture fashion prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: Assess ACTUAL (not anticipated) complexity: count business invariants, delivery mechanisms, expected lifespan, team size
- [ ] Workflow step completed: Quantify current pain: measure feature delivery time, bug rate in business logic, test suite runtime, onboarding time for new devs
- [ ] Workflow step completed: Estimate Clean Architecture costs: 2-4x more files per feature, 1.5-3x initial dev time, 2-4 week onboarding, ongoing maintenance overhead
- [ ] Workflow step completed: Document cost-benefit analysis in ADR: what problems does Clean Architecture solve? Does this application have those problems?
- [ ] Workflow step completed: If complexity justifies it: pilot Clean Architecture on ONE feature or bounded context Ã¢â‚¬â€ not the whole codebase

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

- [ ] Failure addressed: Clean Architecture for simple CRUD:
- [ ] Failure addressed: Not applying when needed:
- [ ] Failure addressed: Clean Architecture theater:
- [ ] Failure addressed: Piloting the wrong feature:
- [ ] Failure addressed: No reversion plan:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Current architecture pain points documented with metrics (not feelings)
- [ ] Clean Architecture costs quantified (files, dev time, onboarding, complexity)
- [ ] Complexity threshold matched to actual application complexity (not aspirational)
- [ ] Pilot feature selected for architecture evaluation
- [ ] Pilot results measured: delivery time, bugs, test speed, team satisfaction
- [ ] Architecture decision documented in ADR (Clean Architecture, Lite, or Service Layer)
- [ ] If pilot positive: architecture tests enforce the pattern codebase-wide
- [ ] If pilot negative: no Clean Architecture theater (directories Ã¢â€°Â  code)
- [ ] Team productivity impact tracked after adoption
- [ ] Decision reviewed within 6 months with updated metrics

### Success Criteria
- [ ] Architecture choice documented in ADR with quantified cost-benefit analysis
- [ ] Pilot feature proves (or disproves) Clean Architecture value for the specific application
- [ ] No Clean Architecture theater Ã¢â‚¬â€ directory structure matches actual code coupling
- [ ] Team productivity impact tracked: at minimum, feature delivery time and bug rate
- [ ] Architecture decision reviewed annually with updated metrics

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Premature architecture
- [ ] Anti-pattern prevented: Architecture fashion

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Clean Architecture for simple CRUD:
- [ ] Failure scenario handled: Not applying when needed:
- [ ] Failure scenario handled: Clean Architecture theater:

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
