# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** Domain layer: entities, value objects, domain services
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Framework-infected domain prevented
- [ ] Inconsistent domain language prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: Identify Entities: objects with identity that persist across state changes (Invoice, User, Order) Ã¢â‚¬â€ identity field (`InvoiceId`, `UserId`), behavior methods (`markAsPaid()`, `cancel()`)
- [ ] Workflow step completed: Implement Entity invariants: each state-changing method enforces business rules before mutation Ã¢â‚¬â€ `markAsPaid()` checks `status !== InvoiceStatus::PENDING` and throws `InvoiceNotPendingException` otherwise
- [ ] Workflow step completed: Identify Value Objects: objects defined by attributes, not identity (Money, Email, DateRange, Address) Ã¢â‚¬â€ immutable, `readonly` properties, validation in constructor, `add()` returns new instance
- [ ] Workflow step completed: Implement Value Object validation: constructor throws `\InvalidArgumentException` on invalid state Ã¢â‚¬â€ `new Money(-50, 'USD')` throws, `new Email('not-an-email')` throws
- [ ] Workflow step completed: Identify Domain Services: stateless operations spanning multiple entities/value objects (PricingService, ShippingService, FraudDetectionService) Ã¢â‚¬â€ named after business concept, not technical pattern

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

- [ ] Failure addressed: Anemic domain model:
- [ ] Failure addressed: Framework imports in domain:
- [ ] Failure addressed: Giant entities:
- [ ] Failure addressed: Missing invariants:
- [ ] Failure addressed: Value objects without validation:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Zero `use Illuminate\*` imports in any Domain class
- [ ] Entities have behavior methods (not just getters/setters)
- [ ] Entity invariants enforced in behavior methods, not in callers
- [ ] Value objects immutable with `readonly` properties
- [ ] Value objects validate on construction and throw on invalid state
- [ ] Domain services are stateless (no mutable properties)
- [ ] Repository interfaces defined in Domain (implementations in Infrastructure)
- [ ] Domain events are pure PHP objects (no framework traits)
- [ ] Architecture tests enforce Domain layer purity
- [ ] Unit tests run without Laravel bootstrap (pure PHPUnit)

### Success Criteria
- [ ] Domain classes contain zero framework imports (verified by architecture tests)
- [ ] All business invariants enforced by entity behavior methods, not by callers
- [ ] Value objects guarantee validity Ã¢â‚¬â€ invalid state cannot be instantiated
- [ ] Domain unit tests run in <50ms without Laravel bootstrap
- [ ] Architecture tests fail CI on any `Illuminate\*` import in Domain namespace

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Framework-infected domain
- [ ] Anti-pattern prevented: Inconsistent domain language
- [ ] Anti-pattern prevented: Domain as data layer

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Anemic domain model:
- [ ] Failure scenario handled: Framework imports in domain:
- [ ] Failure scenario handled: Giant entities:

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
