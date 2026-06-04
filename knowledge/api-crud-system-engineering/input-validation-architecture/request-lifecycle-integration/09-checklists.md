# Request Lifecycle Integration — Checklists

## Lifecycle Design
- [ ] FormRequest created for every state-changing endpoint
- [ ] Middleware used only for cross-cutting validation concerns
- [ ] Auth middleware positioned correctly relative to FormRequest
- [ ] Throttle middleware positioned after auth for user-dependent limits
- [ ] FormRequest methods used according to their lifecycle position

## Implementation
- [ ] `authorize()` contains only policy/gate checks
- [ ] `prepareForValidation()` handles input transformation only
- [ ] `rules()` is declarative — no inline conditional logic
- [ ] `withValidator()` used for cross-field after-hooks
- [ ] `failedValidation()` customizes response only when needed
- [ ] No validation logic in controllers
- [ ] No business logic in `authorize()`

## Consistency
- [ ] All FormRequests extend a common base class
- [ ] Error response format is consistent across all endpoints
- [ ] Authorization failures return consistent HTTP status codes
- [ ] Validation failures return consistent error structure

## Testing
- [ ] Test validation runs with user context when auth-dependent
- [ ] Test validation fails gracefully when auth is not available
- [ ] Test middleware order produces expected behavior
- [ ] Test that `authorize()` does not perform expensive operations
- [ ] Test that FormRequest lifecycle hooks execute in correct order
