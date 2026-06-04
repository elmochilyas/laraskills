# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Cross-module data access: query patterns without JOINs
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Inconsistent projections prevented
- [ ] Cross-module N+1 prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Identify cross-module data needs.** Scan the codebase for queries referencing tables, models, or data owned by other modules. Each such need is a candidate for a contract or event pattern.
- [ ] Workflow step completed: **Use service contracts for real-time data.** When the consumer must have current data, define a contract method in the providing module. Call the contract and accept the latency of the in-process call.
- [ ] Workflow step completed: **Use event projections for frequent reads.** When a module reads another module's data frequently (list views, dashboards), build a local projection table/Redis cache. Update it via the providing module's events.
- [ ] Workflow step completed: **Assemble cross-module results in application code.** Never use SQL JOINs across module tables. Fetch each module's data through its contract and assemble in an orchestrator or query object.
- [ ] Workflow step completed: **Never define Eloquent relationships across module boundaries.** Do not use `belongsTo`, `hasMany`, etc. referencing models in other modules. Store foreign IDs directly and resolve via contract calls.

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

- [ ] Failure addressed: Direct JOINs.
- [ ] Failure addressed: Shared database user.
- [ ] Failure addressed: Eloquent relationships across modules.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] No cross-module SQL JOINs exist in the codebase
- [ ] No Eloquent relationships reference other module's tables
- [ ] Real-time cross-module data uses service contracts
- [ ] Frequent reads use event projections
- [ ] Cross-module results assembled in application code
- [ ] Database-level permissions restrict per-module table access
- [ ] Projection freshness is monitored with alerts

### Success Criteria
- [ ] No cross-module SQL JOINs or Eloquent relationships exist.
- [ ] All cross-module data access uses contracts, events, or projections.
- [ ] Database-level permissions enforce table ownership.
- [ ] Projection freshness is monitored with alerts.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Inconsistent projections
- [ ] Anti-pattern prevented: Cross-module N+1

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Direct JOINs.
- [ ] Failure scenario handled: Shared database user.
- [ ] Failure scenario handled: Eloquent relationships across modules.

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
