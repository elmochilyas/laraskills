# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** Hexagonal/Ports and Adapters architecture concept
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Adapter Explosion prevented
- [ ] Framework Leak prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Identify external dependencies in current code.** Use grep for `DB::`, `Http::`, `Mail::`, `Queue::`, `Storage::`, and `new Client()` in business logic. Each external interaction is a candidate for a port interface.
- [ ] Workflow step completed: **Define ports in the Application/Domain boundary layer.** Create interface definitions for each external concern (e.g., `InvoiceRepositoryInterface`, `PaymentGatewayInterface`). Ports are contracts declared by the core, owned by the core.
- [ ] Workflow step completed: **Implement adapters in Infrastructure.** Build concrete adapter classes that implement each port interface using Laravel's implementation (Eloquent for repositories, Guzzle for HTTP APIs, etc.).
- [ ] Workflow step completed: **Inject ports, not implementations.** Use constructor injection with interface type hints throughout business logic. Never reference concrete adapter classes in core code.
- [ ] Workflow step completed: **Bind ports to adapters in Service Providers.** Register `Port::class => Adapter::class` bindings in a dedicated InfrastructureServiceProvider. This is the composition root.

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

- [ ] Failure addressed: Ports defined in Infrastructure.
- [ ] Failure addressed: Leaking adapter concerns into ports.
- [ ] Failure addressed: Bypassing ports for convenience.
- [ ] Failure addressed: Anemic ports.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Every external/IO operation has a corresponding port interface
- [ ] Business logic never references concrete adapter classes
- [ ] Adapter classes exist only in Infrastructure namespace
- [ ] Port interfaces are defined in/alongside Application or Domain
- [ ] Service Providers are the only place binding occurs
- [ ] Ports are logically owned by the core (not defined in Infrastructure)
- [ ] Core logic is testable with mocked adapters

### Success Criteria
- [ ] All external dependencies are accessed through port interfaces defined in the core.
- [ ] No concrete adapter classes are imported in Application or Domain code.
- [ ] Architecture tests fail if any core code bypasses a port.
- [ ] Business logic is fully testable with mocked adapters without Laravel bootstrap.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Adapter Explosion
- [ ] Anti-pattern prevented: Framework Leak
- [ ] Anti-pattern prevented: Fat Ports

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Ports defined in Infrastructure.
- [ ] Failure scenario handled: Leaking adapter concerns into ports.
- [ ] Failure scenario handled: Bypassing ports for convenience.

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
