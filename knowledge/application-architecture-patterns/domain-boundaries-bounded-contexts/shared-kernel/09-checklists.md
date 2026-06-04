# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 05-domain-boundaries-bounded-contexts
**Knowledge Unit:** Shared kernel design: minimal shared code
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Shared kernel as dumping ground prevented
- [ ] Mutable shared state prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Never place business logic in the shared kernel.** Business logic evolves differently per context over time. Each context owns its own domain logic, even if initially identical.
- [ ] Workflow step completed: **Never place Eloquent models in the shared kernel.** Each Eloquent model belongs to exactly one bounded context. Shared models couple all contexts to the same schema.
- [ ] Workflow step completed: **Extract to shared kernel only when a third context needs it.** Default to duplicating code between contexts. When a third context independently needs the same stable concept, extraction is justified.
- [ ] Workflow step completed: **Keep the shared kernel small Ã¢â‚¬â€ fewer than 20 classes.** A large shared kernel signals wrong context boundaries or a dumping ground for "common" code.
- [ ] Workflow step completed: **Share only value objects and foundation interfaces.** Immutable value objects (Money, Email) are low-risk to share. Foundation interfaces (EventBus, Logger) define contracts without locking implementation.

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

- [ ] Failure addressed: Business logic in shared kernel.
- [ ] Failure addressed: Model classes in shared kernel.
- [ ] Failure addressed: Large shared kernel.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Shared kernel contains only stable, cross-cutting code
- [ ] No business logic in shared kernel
- [ ] No Eloquent models in shared kernel
- [ ] Shared kernel is small (<20 classes)
- [ ] Content is extracted from duplication (3+ consumers)
- [ ] No mutable state in shared kernel
- [ ] No cross-context DTOs in shared kernel
- [ ] Contracts are versioned explicitly

### Success Criteria
- [ ] Shared kernel contains fewer than 20 classes, all of which are immutable value objects, foundation interfaces, or stable enums.
- [ ] No business logic or Eloquent models exist in shared kernel.
- [ ] Every shared kernel item is extracted from duplication (3+ consumers), not from upfront design.
- [ ] No mutable shared state exists; all contracts are versioned.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Shared kernel as dumping ground
- [ ] Anti-pattern prevented: Mutable shared state

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Business logic in shared kernel.
- [ ] Failure scenario handled: Model classes in shared kernel.
- [ ] Failure scenario handled: Large shared kernel.

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
