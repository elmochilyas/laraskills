# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Avoiding anemic domain model in service-layer architectures
Knowledge Unit ID: SLP-18
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Anemic Domain Model (Martin Fowler's anti-pattern) occurs when domain logic lives in service classes while model classes are property bags with getters and setters. The business logic is in `UserService`, not `User`. This is the natural tendency of service-layer architectures: developers put behavior in services because it's the designated "logic" place, creating anemic models that don't protect their own invariants.

---

# Core Concepts

- **Anemic model**: Model has only properties and relationships. All business rules in service.
- **Rich model**: Model has behavior methods that enforce invariants. Service orchestrates.
- **Service orchestrates, Model enforces**: Service decides workflow; model protects own state.
- **Tell, Don't Ask**: Instead of checking model state in service, tell the model to do something.

---

# When To Use

- Always — avoid the anemic anti-pattern. Put behavior on models, orchestration in services.

---

# When NOT To Use

- Pure CRUD applications with no business rules (admin panels, simple data entry). But even these benefit from rich models.

---

# Best Practices

- **Add behavior to models first.** WHY: When implementing a new feature, add the method to the model first. The service calls the model method. Only extract to domain services if behavior spans multiple models.
- **Keep service methods thin.** WHY: A service method calling 3 model methods and dispatching 2 events is fine. A service method with 30 lines of `if` statements checking model state signals an anemic model.
- **Models should protect their own invariants.** WHY: `User::activate()` should throw if already active. The service shouldn't check `if ($user->status !== 'pending')` — that's the model's job.
- **Eliminate `$fillable` or `$guarded` with all attributes.** WHY: Mass assignment bypasses model behavior. Use `$fillable` sparingly or disable it for rich domain models.

---

# Architecture Guidelines

- Signs of anemic model: models have `$fillable`/`$guarded` with all attributes, no methods beyond relationships/scopes, service methods contain `if` statements checking model state.
- Code review is the primary defense. Reviewers should flag service methods that contain `if` statements checking model state.
- Service: workflow orchestration. Model: domain logic and invariant enforcement.

---

# Performance Considerations

- Rich domain models have no performance cost. Method calls on models are the same as on services.

---

# Security Considerations

- Rich models that enforce state invariants prevent invalid state transitions — this has security benefits (can't bypass business rules).

---

# Common Mistakes

1. **All logic in services:** Every business rule in `UserService::method()` with `$user->update(['status' => ...])`. Cause: service-layer habit. Consequence: models don't protect themselves. Better: put behavior on models.

2. **Rich models + service still checking state:** Model has `activate()` but service still checks `if ($user->canBeActivated())` first. Cause: defensive programming. Consequence: duplicate logic and two sources of truth. Better: let the model enforce the rule.

3. **Anemic models + controller logic:** Business rules in controllers, anemic models, services as pass-through. Cause: complete architecture degradation. Consequence: untestable, unreusable logic. Better: rich models + thin services + thin controllers.

---

# Anti-Patterns

- **Logic duplication**: Model checks `status !== 'pending'`, service also checks it.
- **Inconsistent enforcement**: Some services call `$model->activate()`, others set `$model->status = 'active'` directly.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| SLP-01 Service classes | LAP-05 Domain layer | LAP-09 Framework independence |
| SLP-10 Decision criteria | LAP-10 Domain entity mapping | DBC-01 Bounded context |

---

# AI Agent Notes

- Generate model behavior methods alongside service methods.
- Service should call model methods, not set model attributes directly.
- Flag service code that checks model state with if statements.
- Prefer `$model->method()` over `$model->update([...])`.

---

# Verification

- [ ] Models have behavior methods, not just property accessors
- [ ] Service methods call model methods, don't check model state with ifs
- [ ] No duplicate validation (model + service both checking same rules)
- [ ] Models protect invariants (throw on invalid state transitions)
- [ ] No `$fillable` with all attributes (or disabled for rich models)
