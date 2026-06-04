# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 05-domain-boundaries-bounded-contexts
**Knowledge Unit:** Cross-context queries without database JOINs
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Cross-context JOINs prevented
- [ ] N+1 cross-context queries prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Never JOIN across context boundaries.** A cross-context JOIN couples the schemas of both contexts. Use application-level aggregation instead (call each context's service separately and combine in application code).
- [ ] Workflow step completed: **Use application-level aggregation as the default pattern.** Call each context's service contract, combine results in application code. This maintains full context independence and is the simplest pattern.
- [ ] Workflow step completed: **Use local projections for frequent queries.** Maintain a local copy of cross-context data updated via event listeners. Enables fast local queries without cross-context service calls.
- [ ] Workflow step completed: **Use batch endpoints to avoid N+1 across contexts.** Never call a cross-context service in a loop. Provide batch endpoints that accept multiple IDs in a single request.
- [ ] Workflow step completed: **Use CQRS read models for complex cross-context queries.** For queries combining data from multiple contexts with filtering/sorting across fields, build a dedicated denormalized read model maintained by event listeners.

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

- [ ] Failure addressed: Direct JOIN anyway.
- [ ] Failure addressed: N+1 across contexts.
- [ ] Failure addressed: Stale local projections.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] No cross-context JOINs exist
- [ ] Cross-context data obtained via contracts or events
- [ ] N+1 patterns addressed with batch endpoints
- [ ] Local projections invalidated on source changes
- [ ] Application-level aggregation default for real-time data
- [ ] No cross-context eager loading
- [ ] No direct table reads across contexts

### Success Criteria
- [ ] No SQL JOINs or Eloquent relationships span bounded context boundaries.
- [ ] Application-level aggregation is the default pattern for real-time cross-context reads.
- [ ] Frequent cross-context queries use local projections invalidated by event listeners.
- [ ] No N+1 patterns exist across contexts (batch endpoints are used).
- [ ] Complex cross-context queries use CQRS read models for performance and code clarity.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Cross-context JOINs
- [ ] Anti-pattern prevented: N+1 cross-context queries

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Direct JOIN anyway.
- [ ] Failure scenario handled: N+1 across contexts.
- [ ] Failure scenario handled: Stale local projections.

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
