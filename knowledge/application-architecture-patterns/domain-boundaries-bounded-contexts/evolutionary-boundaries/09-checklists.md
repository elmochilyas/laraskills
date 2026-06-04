# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 05-domain-boundaries-bounded-contexts
**Knowledge Unit:** Evolutionary boundaries: splitting a monolithic model
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Analysis paralysis prevented
- [ ] Split and abandon prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Split incrementally, not via big-bang rewrite.** Extract one concept at a time. Each extraction is independently deployable and reversible. Never attempt a full split in a single effort.
- [ ] Workflow step completed: **Use parallel implementation during migration.** Build the new context alongside the old monolithic model. Both coexist until all consumers are migrated. No downtime.
- [ ] Workflow step completed: **Keep the old model as a facade during migration.** Convert the old monolithic model into a facade that delegates to the new context(s). Existing consumers keep working without changes.
- [ ] Workflow step completed: **Split based on concrete pain, not theoretical purity.** Only split when there is measurable pain Ã¢â‚¬â€ frequent bugs, team coordination overhead, conflicting change requests.
- [ ] Workflow step completed: **Extract the most independent concept first.** Concepts with fewest dependencies are easiest to extract and validate. Early success builds confidence.

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

- [ ] Failure addressed: Big-bang split.
- [ ] Failure addressed: Splitting without concrete pain.
- [ ] Failure addressed: Old code not removed.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Split is incremental, not big-bang
- [ ] Split guided by concrete pain (not theory)
- [ ] Old and new coexist during migration
- [ ] Consumers migrated one by one
- [ ] Old code removed after full migration
- [ ] Most independent concept extracted first
- [ ] Boundaries treated as hypotheses, adjusted as needed
- [ ] Strangler Fig pattern used for feature extraction

### Success Criteria
- [ ] Monolithic model is split one concept at a time, each deployment independently verifiable.
- [ ] Old model operates as a facade during migration; consumers migrate one by one.
- [ ] Splitting decisions are justified by concrete pain metrics, not theoretical purity.
- [ ] Old code and facade are removed after all consumers migrate.
- [ ] Schema migration plan includes dual-write or migration path strategies.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Analysis paralysis
- [ ] Anti-pattern prevented: Split and abandon

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Big-bang split.
- [ ] Failure scenario handled: Splitting without concrete pain.
- [ ] Failure scenario handled: Old code not removed.

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
