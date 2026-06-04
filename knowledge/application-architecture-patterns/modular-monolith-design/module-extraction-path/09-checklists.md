# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Module extraction path: from module to independent service
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Big bang extraction prevented
- [ ] Extraction without rollback plan prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Verify extraction triggers are met.** Confirm measurable resource divergence, team independence requirement, or technology divergence. Document triggers in an ADR.
- [ ] Workflow step completed: **Harden and freeze module contracts.** Ensure all contracts are stable (no changes in 4+ weeks), documented, versioned, and have comprehensive contract tests. Freeze contracts for extraction duration.
- [ ] Workflow step completed: **Extract database schema first.** Move the module's tables to their own database connection while the code is still in the monolith. Verify everything works. This is the hardest step Ã¢â‚¬â€ do it first with easy rollback.
- [ ] Workflow step completed: **Create the independent service.** Set up a new Laravel application with its own database. Copy the module code. Replace in-process contract calls with HTTP/queue calls. Add authentication/authorization.
- [ ] Workflow step completed: **Implement parallel run.** Run both the monolith module and new service simultaneously for the same requests. Compare outputs. Fix discrepancies before cutting over.

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

- [ ] Failure addressed: Extracting too early.
- [ ] Failure addressed: Extracting too late.
- [ ] Failure addressed: Big bang extraction.
- [ ] Failure addressed: Forgetting shared database.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Extraction triggers are documented and verified
- [ ] Module contracts are stable, versioned, and tested
- [ ] Database schema is separated before code extraction
- [ ] New service has its own database
- [ ] Parallel run mode detects discrepancies before cutover
- [ ] Feature flag controls cutover with instant rollback
- [ ] Extraction follows Strangler Fig pattern (gradual, not big bang)
- [ ] New service has its own auth/authorization
- [ ] Rollback plan exists and is tested

### Success Criteria
- [ ] Module is successfully running as an independent microservice with its own database.
- [ ] All consumers have been migrated from monolith module to new service.
- [ ] The monolith module code has been removed.
- [ ] Rollback is possible via feature flags during the transition period.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Big bang extraction
- [ ] Anti-pattern prevented: Extraction without rollback plan

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Extracting too early.
- [ ] Failure scenario handled: Extracting too late.
- [ ] Failure scenario handled: Big bang extraction.

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
