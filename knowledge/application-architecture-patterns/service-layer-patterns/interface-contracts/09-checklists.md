# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Interface contracts for services: when and why
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Interface/implementation drift prevented
- [ ] Interface pollution prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Add interfaces only at variation points.** If only one implementation exists and no alternative is planned, skip the interface. Add when the second implementation is actually needed (YAGNI).
- [ ] Workflow step completed: **Avoid interfaces that mirror implementation exactly.** Same methods and signatures provide no abstraction. Design the interface at a different abstraction level (e.g., `PaymentGateway::charge(Money $amount, PaymentSource $source)` instead of `StripeGateway::chargeStripe()`).
- [ ] Workflow step completed: **Be consistent as a team.** Either use interfaces for all infrastructure services or none. Inconsistency is worse than either choice. Document the rule.
- [ ] Workflow step completed: **Watch for interface pollution.** Keep interfaces focused (Interface Segregation Principle). An interface with 20+ methods covering every possible use case becomes a god interface. Split by client need.
- [ ] Workflow step completed: **Avoid interface-per-class syndrome.** Do not create an interface for every class in the codebase. Use interfaces only at architectural boundaries or real variation points.

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

- [ ] Failure addressed: Interface-per-class without reason.
- [ ] Failure addressed: Interface mirrors implementation exactly.
- [ ] Failure addressed: Interface pollution.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Interfaces exist only at variation points
- [ ] No interface-per-class syndrome
- [ ] Interface provides abstraction beyond mirroring implementation
- [ ] Interface-to-implementation bindings are registered in service provider
- [ ] No interface pollution (20+ methods covering every use case)
- [ ] Team convention is documented and consistent

### Success Criteria
- [ ] Interfaces exist only at real variation points Ã¢â‚¬â€ not for single-implementation business services.
- [ ] Each interface provides meaningful abstraction beyond mirroring implementation methods.
- [ ] Bindings are centralized in service providers, not scattered inline.
- [ ] No interface has 20+ methods (segregated by client need).

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Interface/implementation drift
- [ ] Anti-pattern prevented: Interface pollution

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Interface-per-class without reason.
- [ ] Failure scenario handled: Interface mirrors implementation exactly.
- [ ] Failure scenario handled: Interface pollution.

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
