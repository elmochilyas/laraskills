# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Single-Action Invokable Controllers
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Single-Action Invokable Controllers implementation follows resource-controllers patterns
- [ ] All edge cases handled for Single-Action Invokable Controllers
- [ ] Full test coverage for Single-Action Invokable Controllers
- [ ] Security review completed for Single-Action Invokable Controllers
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Single-Action Invokable Controllers
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Place invokable controllers in a dedicated directory per context: `Controllers/Api/V1/Search/`.
- [ ] File-per-action is acceptable â€” do not fight the single-responsibility pattern to save files.
- [ ] Invokable controllers belong in the controller layer: they receive HTTP input and return HTTP responses.
- [ ] Do not confuse invokable controllers with action classes â€” actions return domain objects, controllers return HTTP responses.
- [ ] Register invokable controllers with HTTP-verb-prefixed routes: `Route::get()`, `Route::post()`, etc.
- [ ] Evaluate: Invokable vs Resource Controller Decision

---

# Implementation Checklist

- [ ] `__invoke()` method defined
- [ ] Route points to class, not method
- [ ] Form Request injected for validation
- [ ] Business logic delegated to action
- [ ] API Resource returned
- [ ] Controller name matches action
- [ ] `__invoke()` < 15 lines
- [ ] Tested via route integration test
- [ ] Implement Single-Action Invokable Controllers following resource-controllers patterns
- [ ] Configure all required settings for Single-Action Invokable Controllers
- [ ] Register route/middleware/service for Single-Action Invokable Controllers
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Performance is identical to named-method controllers â€” the `__invoke` fallback resolves once and caches.
- [ ] Route caching works identically: `php artisan route:cache` serializes the FQCN.
- [ ] No reflection overhead after first request â€” Laravel caches controller method resolution.
- [ ] Invokable controllers are fully opcode-cacheable, unlike closures.

---

# Security Checklist

- [ ] Constructor dependencies in invokable controllers must not be request-aware â€” request-scoped bindings may resolve incorrectly with cached routes.
- [ ] Authorization must be applied via middleware, policies, or form request `authorize()`.
- [ ] Avoid passing the full `Request` object to delegated services â€” pass validated data only.
- [ ] Ensure `__invoke` exists before deployment â€” missing method causes 500 at dispatch time.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Invokable controller has ONLY `__invoke` method (no other public methods)
- [ ] Route registered without `@method` suffix: `Route::get('/url', Controller::class)`
- [ ] `__invoke` method exists and is callable (tested with HTTP request)
- [ ] Controller stays under 20-30 lines; delegates business logic
- [ ] Constructor dependencies are NOT request-aware (safe for route caching)
- [ ] `php artisan route:cache` works without errors
- [ ] Write feature tests for happy path of Single-Action Invokable Controllers
- [ ] Write feature tests for validation failure of Single-Action Invokable Controllers
- [ ] Write feature tests for authentication failure of Single-Action Invokable Controllers
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

- [ ] Avoid: Overusing Single-Action Controllers
- [ ] Avoid: Inconsistent Controller Pattern
- [ ] Avoid: Single-Action Does Too Much
- [ ] Avoid: Naming Convention Confusion
- [ ] Avoid: Route Registration Clarity

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
- Use Invokable Controllers For Single Actions
- Keep Invokable Controllers Under 30 Lines
- Never Add A Second Public Method
- Use Descriptive Verb-First Naming
- Use Route Caching With Invokable Controllers

### Decisions
- Invokable vs Resource Controller Decision

### Anti-Patterns
- Overusing Single-Action Controllers
- Inconsistent Controller Pattern
- Single-Action Does Too Much
- Naming Convention Confusion
- Route Registration Clarity

## Related Knowledge
- Controller Action Delegation â€” Delegating from invokable controllers to action/services
- Controller Dependency Injection â€” Constructor and method injection in invokable controllers
- Partial Resource Routes â€” Complementing resource routes with invokable custom actions
- Controller Testing Strategies â€” Testing invokable controllers via HTTP tests



