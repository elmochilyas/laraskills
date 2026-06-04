# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Avoiding anemic domain model in service-layer architectures
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Logic duplication prevented
- [ ] Inconsistent enforcement prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Add behavior to models first.** When implementing a new feature, add the behavior method to the model first. The service calls the model method. Only extract to domain services if behavior spans multiple models.
- [ ] Workflow step completed: **Keep service methods thin.** A service method calling 3 model methods and dispatching 2 events is fine. A service method with 30 lines of `if` statements checking model state signals an anemic model.
- [ ] Workflow step completed: **Models must protect their own invariants.** `Order::cancel()` should throw if the order can't be cancelled. The service should not check conditions before calling the model method Ã¢â‚¬â€ that duplicates logic and allows bypass.
- [ ] Workflow step completed: **Eliminate `$fillable` with all attributes for rich models.** Mass assignment via `Model::create($request->all())` bypasses model behavior methods. Use `$guarded = ['*']` for models that enforce invariants, and use explicit named constructors.
- [ ] Workflow step completed: **Services must call model methods, not set attributes directly.** Setting `$model->status = 'active'` directly bypasses the model's invariant enforcement. Call `$model->activate()` instead.

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

- [ ] Failure addressed: All logic in services.
- [ ] Failure addressed: Rich models + service still checking state.
- [ ] Failure addressed: Mass assignment bypass.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Models have behavior methods, not just property accessors
- [ ] Service methods call model methods, don't check model state with ifs
- [ ] No duplicate validation (model + service both checking same rules)
- [ ] Models protect invariants (throw on invalid state transitions)
- [ ] No `$fillable` with all attributes (or disabled for rich models)
- [ ] Services orchestrate; models enforce

### Success Criteria
- [ ] Models have behavior methods that enforce invariants; services orchestrate without duplicating checks.
- [ ] No `$fillable` with all attributes on rich models Ã¢â‚¬â€ mass assignment is disabled or limited.
- [ ] Services call model methods (`$order->cancel()`) rather than setting attributes directly (`$order->update(['status' => 'cancelled'])`).
- [ ] No duplicate invariant checks between model and service.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Logic duplication
- [ ] Anti-pattern prevented: Inconsistent enforcement

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: All logic in services.
- [ ] Failure scenario handled: Rich models + service still checking state.
- [ ] Failure scenario handled: Mass assignment bypass.

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
