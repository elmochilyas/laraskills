# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-15-action-classes
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

- [ ] Workflow step completed: **Identify Action candidates.** Look for isolated operations in controllers that:
- [ ] Workflow step completed: **Create a single-action class with `__invoke()`.** Create a final class with one public method: `public function __invoke(InputDTO $input): OutputDTO`. All dependencies injected via constructor.
- [ ] Workflow step completed: **Route directly to the Action.** Use `Route::post('/coupon/validate', ValidateCouponAction::class)` in routes. Laravel resolves the Action class from the container and calls `__invoke()`.
- [ ] Workflow step completed: **Inject dependencies in constructor.** Type-hint required services, repositories, and gateways in the constructor. Keep constructor arguments few (ideally 1-3).
- [ ] Workflow step completed: **Keep action stateless.** All state comes from `__invoke()` arguments and injected services. The action class itself should have no mutable state.

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

- [ ] Failure addressed: Too many dependencies.
- [ ] Failure addressed: Stateful actions.
- [ ] Failure addressed: Actions that are too simple.
- [ ] Failure addressed: Actions that are too complex.
- [ ] Failure addressed: Missing return value.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Class is `final` (no subclassing)
- [ ] Only one public method: `__invoke()`
- [ ] All dependencies injected via constructor
- [ ] Class is stateless (no mutable properties)
- [ ] Action performs a single business operation
- [ ] `__invoke()` accepts DTO or primitives
- [ ] `__invoke()` returns DTO or appropriate result
- [ ] Action is testable without HTTP bootstrap
- [ ] Tests cover success and failure paths
- [ ] No routing logic in Action class

### Success Criteria
- [ ] Each action class has exactly one public method (`__invoke`) and is declared `final`.
- [ ] Action is stateless, with all dependencies injected via constructor.
- [ ] Routes directly reference action classes via `__invoke` routing.
- [ ] Action is testable without HTTP bootstrap.

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
- [ ] Failure scenario handled: Too many dependencies.
- [ ] Failure scenario handled: Stateful actions.
- [ ] Failure scenario handled: Actions that are too simple.

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
