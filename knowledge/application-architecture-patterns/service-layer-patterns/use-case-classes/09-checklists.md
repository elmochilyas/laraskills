# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Use Case classes with DTO contracts
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Use case proliferation prevented
- [ ] Use case calling use case prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Create one use case per business intent.** Each use class has a single `execute(InputDto): OutputDto` method. Name after the business operation: `RegisterUserUseCase`, `ProcessCheckoutUseCase`.
- [ ] Workflow step completed: **Keep business logic in domain entities, not use cases.** Use cases orchestrate Ã¢â‚¬â€ they coordinate domain objects, call repository interfaces, and manage side effects. Domain rules belong in entities or domain services.
- [ ] Workflow step completed: **Manage transaction boundaries in the use case.** Wrap multi-write operations in `DB::transaction()`. The use case defines the unit of work boundary.
- [ ] Workflow step completed: **Use case must not call other use cases.** If two use cases share logic, extract to a domain service or shared action. This keeps each use case independently executable and testable.
- [ ] Workflow step completed: **Use cases must have no framework imports.** No `Illuminate\Http\Request`, `Facades\DB`, `Facades\Auth`. Depend only on repository interfaces and DTOs.

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

- [ ] Failure addressed: Business logic in use cases.
- [ ] Failure addressed: Framework coupling in use case.
- [ ] Failure addressed: Giant use cases.
- [ ] Failure addressed: Use case calling use case.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Each use case has single business intent
- [ ] Use case has input and output DTOs
- [ ] No framework imports in use case
- [ ] No business logic in use case (only orchestration)
- [ ] Use case doesn't call other use cases
- [ ] Use case manages transaction boundaries
- [ ] Use case depends on repository interfaces, not Eloquent
- [ ] Use case execution is logged with timing

### Success Criteria
- [ ] Each use case represents one business intent with typed DTO contracts.
- [ ] Use cases orchestrate without containing business logic or framework imports.
- [ ] Use case execution is logged with timing for business observability.
- [ ] Use cases depend on repository interfaces, not on Eloquent.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Use case proliferation
- [ ] Anti-pattern prevented: Use case calling use case

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Business logic in use cases.
- [ ] Failure scenario handled: Framework coupling in use case.
- [ ] Failure scenario handled: Giant use cases.

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
