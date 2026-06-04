# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Resource Controller Pattern
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Resource Controller Pattern implementation follows resource-controllers patterns
- [ ] All edge cases handled for Resource Controller Pattern
- [ ] Full test coverage for Resource Controller Pattern
- [ ] Security review completed for Resource Controller Pattern
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Resource Controller Pattern
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] One resource controller per domain resource (not one per database table).
- [ ] Resource controllers belong in `App\Http\Controllers\Api\{Version}\ResourceNameController`.
- [ ] Controller methods should be thin â€” delegate to form requests, action classes, and API resources.
- [ ] Use custom form request classes for store/update validation (never validate inline in the controller).
- [ ] Use route model binding in method signatures (type-hint the model, not the ID).
- [ ] Avoid adding constructor logic beyond dependency injection setup.
- [ ] Evaluate: Resource vs Manual Route Registration
- [ ] Evaluate: Web vs API Resource Controllers

---

# Implementation Checklist

- [ ] Controller methods follow the standard resource signature
- [ ] `create` and `edit` are excluded for API routes
- [ ] Route model binding is used for `{post}` parameters
- [ ] Each method returns the correct HTTP status code
- [ ] Methods are thin (<15 lines) â€” delegation is used
- [ ] No non-standard logic pollutes the resource methods
- [ ] Non-standard actions have dedicated routes and controllers
- [ ] `php artisan route:list` confirms correct URI â†’ method mapping
- [ ] Implement Resource Controller Pattern following resource-controllers patterns
- [ ] Configure all required settings for Resource Controller Pattern
- [ ] Register route/middleware/service for Resource Controller Pattern
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] `Route::resource()` registration is compile-time â€” no runtime overhead vs manual routes.
- [ ] Route caching (`php artisan route:cache`) serializes all resource routes; use in production deployments.
- [ ] Seven routes per resource have negligible impact on the radix-tree router, even at 500+ routes.
- [ ] Route model binding adds one Eloquent query per bound model â€” ensure foreign keys are indexed.

---

# Security Checklist

- [ ] Route model binding exposes the model-fetch behavior â€” ensure models use scoped bindings in nested contexts.
- [ ] Never rely on route exclusion alone for security; always pair with authorization policies.
- [ ] Form request `authorize()` methods gate controller execution before validation runs.
- [ ] Shallow nested routes require explicit parent-child ownership verification.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] `Route::resource()` or `Route::apiResource()` used instead of manual route registration
- [ ] Controller methods appear in the standard order (index â†’ create â†’ store â†’ show â†’ edit â†’ update â†’ destroy)
- [ ] Non-resource methods are NOT present in resource controller classes
- [ ] Route model binding used in `show`, `update`, `destroy` signatures
- [ ] `Route::apiResource()` used for JSON-only endpoints (not `Route::resource()`)
- [ ] `php artisan route:list` confirms expected URI structure
- [ ] Write feature tests for happy path of Resource Controller Pattern
- [ ] Write feature tests for validation failure of Resource Controller Pattern
- [ ] Write feature tests for authentication failure of Resource Controller Pattern
- [ ] Write unit tests for service/action/DTO classes
- [ ] Test edge cases: empty results, boundary values, null inputs

---

# Maintainability Checklist

- [ ] Follow PSR-12 coding standards
- [ ] Use type hints on all methods and properties
- [ ] Keep methods under 15 lines
- [ ] Use meaningful class and method names
- [ ] Add PHPDoc for public API methods

---

# Anti-Pattern Prevention Checklist

- [ ] Avoid: Breaking RESTful Method Signatures
- [ ] Avoid: Adding Non-Resourceful Methods
- [ ] Avoid: Resource Pattern for Non-Resource Ops
- [ ] Avoid: Inconsistent Method Implementation
- [ ] Avoid: Ignoring Single Responsibility
- [ ] Avoid: Resource Pattern for Non-Resource Operations

---

# Production Readiness Checklist

- [ ] Add structured logging for all operations
- [ ] Configure monitoring alerts for error rate spikes
- [ ] Implement health check endpoint
- [ ] Document rollback procedure
- [ ] Set up error tracking integration
- [ ] Configure proper CORS for production

---

# Final Approval Checklist

- [ ] Architecture checklist complete
- [ ] Security checklist complete
- [ ] Performance checklist complete
- [ ] Testing checklist complete
- [ ] Anti-pattern prevention checklist complete
- [ ] Production readiness checklist complete
- [ ] All items resolved before merge

---

# Related Knowledge

### Rules
- Always Use Route::resource() Over Manual Routes
- Keep Resource Methods In Standard Order
- Never Add Non-Resource Methods To Resource Controllers
- Use Route Model Binding In Method Signatures
- Use apiResource() For JSON Endpoints

### Decisions
- Resource vs Manual Route Registration
- Web vs API Resource Controllers

### Anti-Patterns
- Breaking RESTful Method Signatures
- Adding Non-Resourceful Methods
- Resource Pattern for Non-Resource Ops
- Inconsistent Method Implementation
- Ignoring Single Responsibility
- Resource Pattern for Non-Resource Operations

## Related Knowledge
- API Resource Controllers â€” Stripped-down resource controllers for JSON APIs
- Partial Resource Routes â€” Whitelisting/blacklisting specific actions
- Nested Resources & Shallow Nesting â€” Parent-child resource routing
- Singleton Resource Controllers â€” One-to-one resource routing without ID parameters
- Controller Action Delegation â€” Keeping resource controller methods thin



