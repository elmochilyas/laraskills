# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Shared kernel: what belongs in shared vs. modules
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Shared Eloquent model prevented
- [ ] Mutable shared state prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Identify candidates using the rule of three.** Wait until the third module needs the same concept before extracting to shared. Premature extraction creates wrong abstractions.
- [ ] Workflow step completed: **Place only stable, cross-cutting types in Shared/.** Examples: base value objects (Money, Email), foundation types (AggregateRoot, Entity, ValueObject), enums (Currency, Status), cross-cutting interfaces (EventBus, Logger). Never business logic.
- [ ] Workflow step completed: **Keep the shared kernel free of Laravel facades and helpers.** Use pure PHP. No `\DB`, `\Cache`, `\Event`, `collect()`, `optional()`. Framework contracts (interfaces only) are acceptable as type hints.
- [ ] Workflow step completed: **Never place Eloquent models in the shared kernel.** A shared Eloquent model creates implicit coupling between all modules. Each module should own its model representation or access data through contracts.
- [ ] Workflow step completed: **Assign clear ownership for the shared kernel.** Designate an owner (architecture team, senior devs) who reviews all shared kernel changes. Shared changes affect all modules Ã¢â‚¬â€ they need broader review.

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

- [ ] Failure addressed: Shared kernel as dumping ground.
- [ ] Failure addressed: Business logic in shared kernel.
- [ ] Failure addressed: Framework imports in shared.
- [ ] Failure addressed: Shared Eloquent model.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Shared kernel follows the rule of three (3+ modules use it)
- [ ] No business logic in shared kernel
- [ ] No Laravel facades or helpers imported in shared kernel
- [ ] No Eloquent models in shared kernel
- [ ] Shared kernel has designated owner(s)
- [ ] Shared kernel is kept minimal (< 10 files for most projects)
- [ ] Shared kernel has comprehensive tests
- [ ] Shared/ is treated as a special module with no dependencies

### Success Criteria
- [ ] Shared kernel contains only stable, cross-cutting code used by 3+ modules.
- [ ] No business logic, Eloquent models, or Laravel facades exist in shared kernel.
- [ ] Shared kernel is minimal (< 10 files for most projects).
- [ ] Shared kernel has designated owners and comprehensive tests.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Shared Eloquent model
- [ ] Anti-pattern prevented: Mutable shared state

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Shared kernel as dumping ground.
- [ ] Failure scenario handled: Business logic in shared kernel.
- [ ] Failure scenario handled: Framework imports in shared.

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
