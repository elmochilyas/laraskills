# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Partial Resource Routes
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Partial Resource Routes implementation follows resource-controllers patterns
- [ ] All edge cases handled for Partial Resource Routes
- [ ] Full test coverage for Partial Resource Routes
- [ ] Security review completed for Partial Resource Routes
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Partial Resource Routes
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Place custom routes in a clearly demarcated section above the resource declaration with an ordering comment.
- [ ] Use `apiResource()` as the base and `only()` to further restrict â€” this is the standard API pattern.
- [ ] Every action in `only()` must have a corresponding controller method; dead methods should be removed.
- [ ] For forward-compatibility, prefer `only()` over `except()` â€” a Laravel upgrade adding new default methods would not leak unintended routes.
- [ ] Consider a CI lint rule: "All resource declarations must use `only()`." This enforces explicit action whitelisting.
- [ ] Evaluate: Action Whitelisting Decision

---

# Implementation Checklist

- [ ] `only()` or `except()` is used when less than 7 actions are needed
- [ ] Excluded actions are not implemented in the controller (no dead methods)
- [ ] `php artisan route:list` shows only the intended routes
- [ ] Non-standard actions use explicit route definitions outside the resource group
- [ ] Route naming is consistent with Laravel conventions for registered actions
- [ ] API documentation matches the registered routes (not the full RESTful set)
- [ ] Implement Partial Resource Routes following resource-controllers patterns
- [ ] Configure all required settings for Partial Resource Routes
- [ ] Register route/middleware/service for Partial Resource Routes
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Route caching works identically for partial and full resource routes â€” no difference.
- [ ] Fewer routes mean marginally faster matching, though negligible below ~500 routes.
- [ ] Each custom route adds one entry to the compiled dictionary with the same cost as any manual route.
- [ ] `only()` and `except()` are evaluated at route registration time, not request time.

---

# Security Checklist

- [ ] `except(['destroy'])` is NOT a security measure â€” authorization policies must control deletion access.
- [ ] Custom routes registered after the resource route silently fail (404) â€” verify ordering in CI.
- [ ] Ensure custom action names do not collide with resource action names (e.g., `show` vs `search`).
- [ ] Authorization for custom actions must be handled separately from resource authorization.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] `Route::apiResource()->only()` used instead of `Route::resource()->except()`
- [ ] Custom routes registered before the resource route declaration
- [ ] No dead controller methods â€” every method in the controller has a corresponding route
- [ ] Route names for custom actions follow the `resource.action` naming convention
- [ ] `php artisan route:list` confirms custom routes appear before wildcard resource routes
- [ ] Write feature tests for happy path of Partial Resource Routes
- [ ] Write feature tests for validation failure of Partial Resource Routes
- [ ] Write feature tests for authentication failure of Partial Resource Routes
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

- [ ] Avoid: Full Resource When Partial Needed
- [ ] Avoid: Manual Routes Instead of Resource
- [ ] Avoid: Inconsistent Method Selection
- [ ] Avoid: Overly Restrictive Partial Routes
- [ ] Avoid: Registering Web Methods for API

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
- Prefer only() Over except() For Route Filtering
- Register Custom Routes Before Resource Routes
- Remove Controller Methods Excluded By only()
- Use Route::apiResource()->only() For APIs
- Use ->name() For Custom Route Naming

### Decisions
- Action Whitelisting Decision

### Anti-Patterns
- Full Resource When Partial Needed
- Manual Routes Instead of Resource
- Inconsistent Method Selection
- Overly Restrictive Partial Routes
- Registering Web Methods for API

## Related Knowledge
- Resource Controller Pattern â€” Base pattern that partial routes filter
- API Resource Controllers â€” Simplified resource registration for APIs
- Single-Action Invokable Controllers â€” Alternative for endpoints that don't fit resource pattern
- Controller Code Limits â€” Keeping partial-action controllers within size limits
- Thin Controller Enforcement â€” Automated rules for controller structure



