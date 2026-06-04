# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** Three-layer architecture: Presentation, Business, Data
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Fat Controller prevented
- [ ] Layer Bypass prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Extract Service classes when controllers exceed 200 lines.** Move business logic and orchestration from controllers into service classes. Controllers should only validate input (via Form Requests), call services, and return responses.
- [ ] Workflow step completed: **Use Form Requests for validation boundaries.** Create dedicated Form Request classes for every endpoint with 3+ validation rules. Encapsulate validation logic in self-contained, testable classes.
- [ ] Workflow step completed: **Never pass Request objects to Service methods.** Extract needed data in the Controller and pass primitives or DTOs. `Illuminate\Http\Request` leaked into the Business layer makes services untestable without HTTP mocks.
- [ ] Workflow step completed: **Never call Eloquent from Controllers.** Always delegate through a Service class. Direct `Model::find()` in controllers bypasses the Business layer, making business rules optional.
- [ ] Workflow step completed: **Design the Business layer for unit testing without Laravel bootstrap.** Use dependency injection and avoid facades. Services should be testable by constructing them with mocked dependencies.

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

- [ ] Failure addressed: Leaky Presentation layer:
- [ ] Failure addressed: Anemic Business layer:
- [ ] Failure addressed: Cross-layer shortcuts:
- [ ] Failure addressed: Layer bypass under pressure:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Controllers contain zero business logic (only HTTP delegation)
- [ ] Services contain business logic; do not simply wrap CRUD
- [ ] No `Request` objects passed to Service methods
- [ ] No Model calls from Controllers (use Services)
- [ ] Architecture tests enforce layer boundaries in CI
- [ ] Services are testable without Laravel HTTP bootstrap

### Success Criteria
- [ ] Controllers contain zero business logic Ã¢â‚¬â€ only HTTP orchestration.
- [ ] Services encapsulate meaningful business rules, not just CRUD wrappers.
- [ ] Architecture tests prevent layer violations in CI.
- [ ] Business logic is testable without HTTP or database bootstrap.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Fat Controller
- [ ] Anti-pattern prevented: Layer Bypass
- [ ] Anti-pattern prevented: Leaky Presentation Layer

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Leaky Presentation layer:
- [ ] Failure scenario handled: Anemic Business layer:
- [ ] Failure scenario handled: Cross-layer shortcuts:

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
