# Skill: Implement Single Action Invokable Controllers

## Purpose
Create single-action invokable controllers for non-CRUD endpoints using `__invoke()` with route registration via `Route::post('/orders/{order}/cancel', CancelOrderController::class)`.

## When To Use
- Action endpoints (cancel, export, approve, resend)
- Non-CRUD operations
- Simple read-only endpoints (dashboard, stats)

## When NOT To Use
- CRUD resource endpoints — use resource controllers
- Complex multi-action endpoints

## Prerequisites
- Invokable controller pattern
- Route registration

## Inputs
- Action endpoint specifications

## Workflow
1. Create invokable controller: `class CancelOrderController { public function __invoke(CancelOrderRequest $request, Order $order) { ... } }`
2. Implement `__invoke()` method with typed parameters
3. Register route pointing to invokable class: `Route::post('/orders/{order}/cancel', CancelOrderController::class)`
4. Inject Form Request for validation
5. Inject action class for business logic
6. Return API Resource response
7. Use descriptive controller name matching the action
8. Keep `__invoke()` under 15 lines
9. Test invokable controller via route test
10. Document action endpoint and controller

## Validation Checklist
- [ ] `__invoke()` method defined
- [ ] Route points to class, not method
- [ ] Form Request injected for validation
- [ ] Business logic delegated to action
- [ ] API Resource returned
- [ ] Controller name matches action
- [ ] `__invoke()` < 15 lines
- [ ] Tested via route integration test

## Related Skills
- Resource vs Action Orientation
- Action Class Design
- Controller Action Delegation
