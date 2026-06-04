# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Inter-module synchronous communication via contracts
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Contract drift prevented
- [ ] Direct implementation import prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Define the contract interface in the providing module's Contracts/ directory.** The provider owns the interface and controls its evolution. Name after the service capability (`InvoiceContract`).
- [ ] Workflow step completed: **Use DTOs, not Eloquent models, in contract method signatures.** Create readonly DTO classes for method parameters and return types. This decouples the consumer from the provider's database schema.
- [ ] Workflow step completed: **Implement the contract in the providing module's Services/ or internal directory.** Create a concrete class implementing the contract interface. Keep the implementation class in internal namespaces (not Contracts/).
- [ ] Workflow step completed: **Bind the contract to implementation in the providing module's service provider.** Use `$this->app->bind(InvoiceContract::class, InvoiceService::class)`. This makes the contract resolvable by the container.
- [ ] Workflow step completed: **Inject the contract interface in the consumer's constructor.** The consumer type-hints the contract interface, not the concrete implementation. Laravel's container resolves the bound implementation automatically.

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

- [ ] Failure addressed: Implementation in contract namespace.
- [ ] Failure addressed: Domain entities in contracts.
- [ ] Failure addressed: Circular contract dependency.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Contract interface in providing module's Contracts/ directory
- [ ] DTOs used in method signatures (not Eloquent models)
- [ ] Implementation class not in Contracts/ directory
- [ ] Contract bound to implementation in service provider
- [ ] Consumer injects contract interface (not implementation)
- [ ] No circular contract dependencies exist
- [ ] Contract tests verify implementation matches interface

### Success Criteria
- [ ] All synchronous cross-module communication goes through contract interfaces.
- [ ] Contract interviews use DTOs, not Eloquent models.
- [ ] No circular contract dependencies exist.
- [ ] Contract tests verify behavioral and type alignment between interface and implementation.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Contract drift
- [ ] Anti-pattern prevented: Direct implementation import

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Implementation in contract namespace.
- [ ] Failure scenario handled: Domain entities in contracts.
- [ ] Failure scenario handled: Circular contract dependency.

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
