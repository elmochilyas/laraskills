# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** Presentation layer: controllers, requests, resources, routes
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Fat Controller prevented
- [ ] Inline validation prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: Define routes grouped by concern (`web`, `api`, `admin`) with middleware at group level Ã¢â‚¬â€ never scatter route definitions
- [ ] Workflow step completed: Create invokable controller per distinct operation: single `__invoke()` method with injected use case and Form Request
- [ ] Workflow step completed: Create Form Request for each endpoint with 3+ validation rules: `rules()` method returns validation rules, `authorize()` method checks permissions via Policy/Gate
- [ ] Workflow step completed: Extract validated data in controller: call `$request->toDto()` or pass relevant fields to use case DTO
- [ ] Workflow step completed: Call use case: `$result = $this->useCase->execute(CreateInvoiceDto::fromRequest($request))` Ã¢â‚¬â€ never call Eloquent from controller

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

- [ ] Failure addressed: Business logic in controllers:
- [ ] Failure addressed: Direct Eloquent calls:
- [ ] Failure addressed: Inline validation:
- [ ] Failure addressed: Model exposure in responses:
- [ ] Failure addressed: Constructor bloat:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Controllers contain zero business logic (no `if` statements about business rules)
- [ ] Controllers call zero Eloquent methods directly
- [ ] All validation with 3+ rules uses Form Request classes (not `$request->validate()`)
- [ ] Form Request `authorize()` method checks permissions
- [ ] Dependencies injected via constructor/injection (no `app()`, no Facades)
- [ ] Invokable controllers for distinct dependencies; resource controllers for standard CRUD
- [ ] API Resources control response serialization (no Eloquent models returned directly)
- [ ] Routes grouped by concern with middleware at group level
- [ ] API Resources never expose internal model attributes
- [ ] Controllers can be unit-tested with mocked use cases

### Success Criteria
- [ ] All controllers contain zero business logic (verified by architecture tests)
- [ ] Zero Eloquent import/usage in any Presentation layer class
- [ ] All endpoints with 3+ validation rules have dedicated Form Request classes
- [ ] API responses use Resources that expose only intended fields
- [ ] Controllers delegate to use cases and can be tested with constructor mocks

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Fat Controller
- [ ] Anti-pattern prevented: Inline validation
- [ ] Anti-pattern prevented: Model exposure

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Business logic in controllers:
- [ ] Failure scenario handled: Direct Eloquent calls:
- [ ] Failure scenario handled: Inline validation:

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
