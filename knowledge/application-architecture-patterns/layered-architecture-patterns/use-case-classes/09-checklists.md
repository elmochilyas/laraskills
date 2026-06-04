# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-11-use-case-classes
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

- [ ] Workflow step completed: **Identify use cases from business operations.** Work with domain experts to list every distinct end-to-end business operation. Name them in imperative business language (`CreateInvoice`, `CancelSubscription`).
- [ ] Workflow step completed: **Create a single-purpose Use Case class.** Each use case receives exactly one public method: `__invoke()`, `handle()`, or `execute()`. The method name should be generic; the class name describes the operation.
- [ ] Workflow step completed: **Accept DTO or primitives as input.** The public method accepts a DTO or primitive arguments. Never accept `Request` or other HTTP-specific objects. Convert input to Domain objects inside the use case.
- [ ] Workflow step completed: **Inject ports via constructor, not method.** All dependencies (repository interfaces, queue interfaces, gateways) are injected through the constructor. This makes dependencies explicit and testable.
- [ ] Workflow step completed: **Orchestrate, don't implement business rules.** The use case method creates Domain objects, calls their behavior methods, and uses port interfaces for persistence and side effects. Business rules stay IN the Domain objects.

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

- [ ] Failure addressed: Fat use case.
- [ ] Failure addressed: Request object in signature.
- [ ] Failure addressed: Returning Domain objects.
- [ ] Failure addressed: Use case as CRUD wrapper.
- [ ] Failure addressed: Missing validation.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Use case class name describes the business operation
- [ ] Single public method exists (execute, handle, __invoke)
- [ ] Method accepts DTO or primitives, not HTTP Request
- [ ] Port interfaces injected via constructor
- [ ] Use case orchestrates, does not implement business rules
- [ ] Transaction management is explicit
- [ ] Return type is DTO or void
- [ ] No HTTP-specific imports (Request, Response, Redirect)
- [ ] Use case is testable without Laravel HTTP bootstrap
- [ ] Tests cover happy path, validation failure, and domain exception

### Success Criteria
- [ ] Each business operation has a dedicated Use Case class with one public method.
- [ ] Use case orchestrates Domain objects without containing business rules.
- [ ] Use case is testable without HTTP or database bootstrap.
- [ ] Use case returns DTO or void, never Domain objects or HTTP-specific types.

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
- [ ] Failure scenario handled: Fat use case.
- [ ] Failure scenario handled: Request object in signature.
- [ ] Failure scenario handled: Returning Domain objects.

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
