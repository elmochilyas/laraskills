# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-06-domain-driven-design
**Generated:** 2026-06-03
**Based on:** 06
**Note:** Generated from partial input (missing: 04-standardized-knowledge.md, 05-rules.md, 07-decision-trees.md, 08-anti-patterns.md)

---

# Quick Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Production readiness verified

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Define the Ubiquitous Language glossary.** Document business terms with precise definitions. Use these terms in class names, method names, and variable names. Review with domain experts for accuracy.
- [ ] Workflow step completed: **Implement Entities with identity.** Create Entity classes with `equals()` method comparing by identity. Use constructor for required properties. Entities have thread of identity throughout lifecycle.
- [ ] Workflow step completed: **Implement Value Objects as immutable readonly classes.** Use PHP 8.1+ `readonly` classes. Include constructor validation to ensure the Value Object is always valid when instantiated. Implement `equals()` comparing by all properties.
- [ ] Workflow step completed: **Design Aggregates.** Group Entities and Value Objects under an Aggregate Root. Enforce all business invariants through the Aggregate Root. Design consistency boundaries Ã¢â‚¬â€ modify Aggregate internals only through the Root. Keep Aggregates small.
- [ ] Workflow step completed: **Implement Domain Events.** Create event classes for significant domain occurrences. Dispatch events inside Aggregate methods when state changes. Use past tense for event names (`InvoicePaid`, `OrderShipped`).

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

- [ ] Failure addressed: Anemic Domain Model.
- [ ] Failure addressed: Giant Aggregates.
- [ ] Failure addressed: Eloquent in Domain.
- [ ] Failure addressed: Value Objects with identity.
- [ ] Failure addressed: Commands disguised as events.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Ubiquitous Language glossary is documented and shared
- [ ] Value Objects are readonly, immutable, and validate on construction
- [ ] Entities have identity comparison via `equals()` method
- [ ] Aggregates enforce invariants through Aggregate Root
- [ ] Aggregates are accessed only through Repository interface
- [ ] Domain Events are dispatched inside Aggregate methods
- [ ] Repositories return Domain objects, not Eloquent models
- [ ] No Laravel framework dependencies in Domain classes

### Success Criteria
- [ ] Domain classes contain business behavior, not just data Ã¢â‚¬â€ they enforce invariants and protect consistency boundaries.
- [ ] Ubiquitous Language is consistently used across codebase, tests, and documentation.
- [ ] Aggregates have clear boundaries with Repository per Aggregate Root.
- [ ] Domain Events capture significant domain occurrences and are dispatched at the right time.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] No known anti-patterns for this KU

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Anemic Domain Model.
- [ ] Failure scenario handled: Giant Aggregates.
- [ ] Failure scenario handled: Eloquent in Domain.

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
