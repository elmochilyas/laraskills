# Skill: Design Single-Action Classes for Isolated Operations

## Purpose
Create invocable, single-action classes for isolated business operations that don't justify a full Service or Use Case class, with `__invoke()` as the single public method.

## When To Use
- Single, isolated operations (not multi-step orchestration)
- Operations with few dependencies
- Need self-contained, testable business operations without full Service/Use Case overhead
- Delegating from controllers when the operation doesn't need a full Service or Use Case

## When NOT To Use
- Multi-step orchestrations (use Service or Use Case instead)
- Operations requiring multiple related public methods
- Simple one-liner operations (inline closure suffices)
- Operations needing state between invocations

## Prerequisites
- Laravel's auto-discovery for invocable classes
- PHP 7.0+ (`__invoke()` support)
- Understanding of routing with `__invoke` controllers

## Inputs
- Identified isolated business operations
- Input data contract (DTO or primitives)
- Required dependencies

## Workflow
1. **Identify Action candidates.** Look for isolated operations in controllers that:
   - Perform a single business operation (not orchestration)
   - Have 2-5 dependencies
   - Don't require Service or Use Case complexity
   - Examples: `GenerateReceiptPdf`, `CalculateShippingCost`, `ValidateCouponCode`

2. **Create a single-action class with `__invoke()`.** Create a final class with one public method: `public function __invoke(InputDTO $input): OutputDTO`. All dependencies injected via constructor.

3. **Route directly to the Action.** Use `Route::post('/coupon/validate', ValidateCouponAction::class)` in routes. Laravel resolves the Action class from the container and calls `__invoke()`.

4. **Inject dependencies in constructor.** Type-hint required services, repositories, and gateways in the constructor. Keep constructor arguments few (ideally 1-3).

5. **Keep action stateless.** All state comes from `__invoke()` arguments and injected services. The action class itself should have no mutable state.

6. **Write focused unit tests.** Test the `__invoke()` method with various inputs. Mock dependencies. Test success and failure paths. Keep tests small and specific.

7. **Consider extracting to Use Case when complexity grows.** If the action starts accumulating helper methods or multiple dependencies, extract to a full Use Case class.

## Validation Checklist
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

## Common Failures
- **Too many dependencies.** Action with 8+ constructor parameters — consider if it should be a Service or Use Case.
- **Stateful actions.** Property-assigning values for later use — actions must be stateless.
- **Actions that are too simple.** Action that just calls one method on one dependency — consider using an inline closure or direct delegation.
- **Actions that are too complex.** Accumulating helper methods — extract to Use Case or Service.
- **Missing return value.** Not returning a result — actions should return a meaningful result or DTO.

## Decision Points
- **Action vs Service vs Use Case?** Action for isolated operations (single `__invoke`), Service for related methods on a topic, Use Case for multi-step orchestration.
- **__invoke vs other method name?** `__invoke` is idiomatic for single-action classes and enables direct route binding.
- **single action per file vs multiple actions?** Always one action per file for clarity and autoloading.

## Performance Considerations
- Action class dispatch is negligible — `__invoke` call overhead is one PHP method call.
- Use singletons for stateless actions in CI (container resolves once).
- Octane compatibility: actions must be stateless (satisfied by design).

## Security Considerations
- Authorization should be handled at route level (middleware) or called from within the action via injected authorization service.
- Actions should not handle authentication — they receive already-authenticated context.
- Input validation should be done before the action (Form Request or validation of DTO).

## Related Rules
- Rule: Action Has Single Public Method (LAP-15/05-rules.md)
- Rule: Action Is Stateless (LAP-15/05-rules.md)
- Rule: Route Directly to Action (LAP-15/05-rules.md)
- Rule: Keep Action Constructor Lean (LAP-15/05-rules.md)
- Rule: Extract to Use Case When Complex (LAP-15/05-rules.md)
- Rule: Action Is Final (LAP-15/05-rules.md)
- Rule: Action Returns Meaningful Result (LAP-15/05-rules.md)

## Related Skills
- Design Use Case Classes (LAP-11/06-skills.md)
- Design Service Classes (SLP-01/06-skills.md)
- Implement Three-Layer Architecture (LAP-01/06-skills.md)

## Success Criteria
- Each action class has exactly one public method (`__invoke`) and is declared `final`.
- Action is stateless, with all dependencies injected via constructor.
- Routes directly reference action classes via `__invoke` routing.
- Action is testable without HTTP bootstrap.
