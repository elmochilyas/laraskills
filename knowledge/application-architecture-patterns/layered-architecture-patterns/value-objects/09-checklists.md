# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-07-value-objects
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

- [ ] Workflow step completed: **Identify Value Object candidates.** Look for primitives validated in multiple places Ã¢â‚¬â€ email, slug, price, currency, phone. Use grep for repeated validation patterns (regex for email, amount > 0 checks).
- [ ] Workflow step completed: **Create a readonly class in Domain.** Use `readonly class` with `public function __construct(private string $value)`. Mark class as `readonly` to ensure immutability.
- [ ] Workflow step completed: **Validate on construction.** Check all invariants in the constructor before assignment. Throw `\InvalidArgumentException` with descriptive message on invalid input. Check for empty values, format, range, and business rules.
- [ ] Workflow step completed: **Expose value via named method.** Use `->value()` or domain-meaningful getter (`->email()`, `->amount()`). Named methods are more expressive than generic `__toString()`.
- [ ] Workflow step completed: **Implement equality comparison.** Override `equals(MyValueObject $other): bool` comparing all properties. Reuse this in tests and collection operations.

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

- [ ] Failure addressed: Mutable Value Objects.
- [ ] Failure addressed: Missing validation.
- [ ] Failure addressed: Too much behavior.
- [ ] Failure addressed: Anemic Value Objects.
- [ ] Failure addressed: Value Objects as Entities.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Class is declared `readonly`
- [ ] Constructor validates all invariants before assignment
- [ ] Invalid inputs throw `\InvalidArgumentException`
- [ ] Equality method exists and compares correctly
- [ ] Immutability is enforced (no setters, readonly properties)
- [ ] Value Object is used in type hints throughout codebase
- [ ] Tests cover valid creation, invalid creation, and equality
- [ ] No side effects or IO in Value Object methods

### Success Criteria
- [ ] Every Value Object is readonly and validates on construction.
- [ ] Invalid data cannot exist in Value Object form Ã¢â‚¬â€ constructor guarantees validity.
- [ ] Codebase uses Value Object type hints instead of primitives where business meaning exists.
- [ ] Equality comparison works correctly for all Value Object instances.

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
- [ ] Failure scenario handled: Mutable Value Objects.
- [ ] Failure scenario handled: Missing validation.
- [ ] Failure scenario handled: Too much behavior.

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
