# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Controller Middleware Assignment
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Controller Middleware Assignment implementation follows resource-controllers patterns
- [ ] All edge cases handled for Controller Middleware Assignment
- [ ] Full test coverage for Controller Middleware Assignment
- [ ] Security review completed for Controller Middleware Assignment
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Controller Middleware Assignment
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] For API controllers, apply `auth:sanctum` at the route group level â€” all routes inherit it.
- [ ] Use `only(['store', 'update', 'destroy'])` for write-only auth when read endpoints are public.
- [ ] Audit middleware with `php artisan route:list -v` to see the full middleware stack per route.
- [ ] Document middleware requirements in the controller class docblock.
- [ ] Migrate from constructor-based middleware to static middleware in Laravel 11+.
- [ ] Evaluate: Middleware Assignment Location

---

# Implementation Checklist

- [ ] Middleware assigned in route definitions
- [ ] auth middleware at group level
- [ ] rate limit at action level
- [ ] Not in controller constructor
- [ ] only()/except() for per-action control
- [ ] Tested per action
- [ ] Implement Controller Middleware Assignment following resource-controllers patterns
- [ ] Configure all required settings for Controller Middleware Assignment
- [ ] Register route/middleware/service for Controller Middleware Assignment
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Middleware assignment method has negligible impact â€” the stack is compiled during dispatch.
- [ ] Static middleware (Laravel 11+) allows resolving middleware without instantiating the controller.
- [ ] Route caching includes both route-level and controller-level middleware.

---

# Security Checklist

- [ ] Middleware order matters: authentication before authorization, throttle before auth.
- [ ] Forgetting middleware on a new controller method can expose unauthenticated endpoints.
- [ ] Route-level middleware at the group level catches newly added routes; constructor-level does not.
- [ ] Using `except(['destroy'])` as a security measure is insufficient â€” use authorization policies.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] No middleware is duplicated at route and controller level
- [ ] Route-level middleware is preferred for broad middleware (auth, throttle)
- [ ] Controller-level middleware uses `only()`/`except()` for per-method targeting
- [ ] Middleware order is correct: throttle before auth
- [ ] Laravel 11+ uses static `middleware()` method (not constructor-based)
- [ ] `php artisan route:list -v` confirms the expected middleware stack per route
- [ ] Write feature tests for happy path of Controller Middleware Assignment
- [ ] Write feature tests for validation failure of Controller Middleware Assignment
- [ ] Write feature tests for authentication failure of Controller Middleware Assignment
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

- [ ] Avoid: Middleware in Routes Instead of Controller
- [ ] Avoid: Middleware in Controller Constructor
- [ ] Avoid: Inconsistent Middleware Assignment
- [ ] Avoid: Missing Route-Specific Exclusions
- [ ] Avoid: Duplicate Middleware in Route and Controller
- [ ] Avoid: Duplicate Middleware

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
- Prefer Route-Level Middleware For Broad Auth
- Use Static middleware() Method In Laravel 11+
- Never Duplicate Middleware At Both Levels
- Order Middleware Correctly
- Use only() For Per-Method Middleware Targeting

### Decisions
- Middleware Assignment Location

### Anti-Patterns
- Middleware in Routes Instead of Controller
- Middleware in Controller Constructor
- Inconsistent Middleware Assignment
- Missing Route-Specific Exclusions
- Duplicate Middleware in Route and Controller
- Duplicate Middleware

## Related Knowledge
- Controller Dependency Injection â€” Injecting middleware classes
- Controller Organization by Version â€” Version-specific middleware assignment
- Controller Testing Strategies â€” Testing middleware behavior in HTTP tests



