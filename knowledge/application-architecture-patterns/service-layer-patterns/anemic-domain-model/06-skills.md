# Skill: Avoid Anemic Domain Model in Service-Layer Architectures

## Purpose
Prevent the anemic domain model anti-pattern by putting behavior on models first, keeping service methods thin, having models protect their own invariants, eliminating mass assignment for rich models, and avoiding logic duplication between model and service.

## When To Use
- Always — avoid the anemic anti-pattern by default

## When NOT To Use
- Pure CRUD applications with no business rules (admin panels, simple data entry)

## Prerequisites
- Understanding of domain logic vs orchestration
- Knowledge of model invariants and state transitions

## Inputs
- Service methods containing business logic
- Models with only property accessors (no behavior methods)

## Workflow
1. **Add behavior to models first.** When implementing a new feature, add the behavior method to the model first. The service calls the model method. Only extract to domain services if behavior spans multiple models.

2. **Keep service methods thin.** A service method calling 3 model methods and dispatching 2 events is fine. A service method with 30 lines of `if` statements checking model state signals an anemic model.

3. **Models must protect their own invariants.** `Order::cancel()` should throw if the order can't be cancelled. The service should not check conditions before calling the model method — that duplicates logic and allows bypass.

4. **Eliminate `$fillable` with all attributes for rich models.** Mass assignment via `Model::create($request->all())` bypasses model behavior methods. Use `$guarded = ['*']` for models that enforce invariants, and use explicit named constructors.

5. **Services must call model methods, not set attributes directly.** Setting `$model->status = 'active'` directly bypasses the model's invariant enforcement. Call `$model->activate()` instead.

6. **Avoid logic duplication between model and service.** If the model checks `$this->status !== 'pending'`, the service must not also check it. The model is the single source of truth for invariants.

## Validation Checklist
- [ ] Models have behavior methods, not just property accessors
- [ ] Service methods call model methods, don't check model state with ifs
- [ ] No duplicate validation (model + service both checking same rules)
- [ ] Models protect invariants (throw on invalid state transitions)
- [ ] No `$fillable` with all attributes (or disabled for rich models)
- [ ] Services orchestrate; models enforce

## Common Failures
- **All logic in services.** Every business rule in `UserService::method()` with `$user->update(['status' => ...])` — models don't protect themselves.
- **Rich models + service still checking state.** Model has `activate()` but service still checks `if ($user->canBeActivated())` first — duplicate logic.
- **Mass assignment bypass.** `Model::create($request->all())` sets `is_admin` without invariant checks.

## Decision Points
- **Model method vs Service method?** Model method for behavior that operates on model state. Service method for orchestration crossing multiple models.

## Performance Considerations
- Rich domain models have no performance cost. Method calls on models are the same as on services.

## Security Considerations
- Rich models that enforce state invariants prevent invalid state transitions — security benefit.
- No mass assignment vulnerability when using explicit named constructors.

## Related Rules
- Rule: Add Behavior To Models First (SLP-18/05-rules.md)
- Rule: Keep Service Methods Thin (SLP-18/05-rules.md)
- Rule: Models Must Protect Their Own Invariants (SLP-18/05-rules.md)
- Rule: Eliminate $fillable With All Attributes (SLP-18/05-rules.md)
- Rule: Service Calls Model Methods, Not Set Attributes Directly (SLP-18/05-rules.md)
- Rule: Avoid Logic Duplication Between Model And Service (SLP-18/05-rules.md)

## Related Skills
- Design Service Classes (SLP-01/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)
- Implement Domain Entities (LAP-10/06-skills.md)
- Design Value Objects (LAP-07/06-skills.md)
- Design Domain Services (LAP-09/06-skills.md)

## Success Criteria
- Models have behavior methods that enforce invariants; services orchestrate without duplicating checks.
- No `$fillable` with all attributes on rich models — mass assignment is disabled or limited.
- Services call model methods (`$order->cancel()`) rather than setting attributes directly (`$order->update(['status' => 'cancelled'])`).
- No duplicate invariant checks between model and service.
