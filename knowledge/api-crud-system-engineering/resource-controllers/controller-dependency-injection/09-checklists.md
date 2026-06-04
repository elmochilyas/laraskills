# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Controller Dependency Injection
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Controller Dependency Injection implementation follows resource-controllers patterns
- [ ] All edge cases handled for Controller Dependency Injection
- [ ] Full test coverage for Controller Dependency Injection
- [ ] Security review completed for Controller Dependency Injection
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Controller Dependency Injection
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Controller constructors are the dependency manifest â€” what the controller needs is visible at a glance.
- [ ] Use interfaces in constructor signatures for testability and contextual binding.
- [ ] Register contextual bindings in `AppServiceProvider` using `app()->when(C::class)->needs(I::class)->give(...)`.
- [ ] Test every route to catch missing container bindings before deployment.
- [ ] Use `scoped()` bindings (Laravel 11+) for request-scoped singletons.
- [ ] Evaluate: Constructor vs Method Injection Decision

---

# Implementation Checklist

- [ ] Constructor injection for shared deps
- [ ] Method injection for per-action deps
- [ ] Interface type-hinting for DI
- [ ] Under 3 constructor deps
- [ ] Register bindings in service provider
- [ ] Tested with mocked dependencies
- [ ] Implement Controller Dependency Injection following resource-controllers patterns
- [ ] Configure all required settings for Controller Dependency Injection
- [ ] Register route/middleware/service for Controller Dependency Injection
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Reflection-based resolution has a one-time cost per class; the container caches the parameter list.
- [ ] Constructor injection has zero per-request overhead beyond normal PHP object construction.
- [ ] Using `app()->make()` inside methods bypasses caching and forces re-resolution.

---

# Security Checklist

- [ ] Unresolved bindings throw `BindingResolutionException` at runtime â€” catch and handle appropriately.
- [ ] Circular dependencies in constructor graphs cause infinite loops or nesting limit errors.
- [ ] Singleton bindings retain state across requests â€” use `scoped()` for request-scoped state.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] No `Request` objects injected in constructors
- [ ] Constructor has â‰¤4 injected dependencies
- [ ] All interface bindings are registered in a service provider
- [ ] No `app()->make()` calls in controller methods
- [ ] Missing bindings are caught by feature tests for every route
- [ ] Circular dependencies are detected and resolved
- [ ] Write feature tests for happy path of Controller Dependency Injection
- [ ] Write feature tests for validation failure of Controller Dependency Injection
- [ ] Write feature tests for authentication failure of Controller Dependency Injection
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

- [ ] Avoid: Too Many Constructor Dependencies
- [ ] Avoid: Resolving Dependencies Inside Method
- [ ] Avoid: Injecting HTTP-Specific Dependencies
- [ ] Avoid: Excessive Method Injection Parameters
- [ ] Avoid: Mixing Constructor and Method Injection

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
- Limit Constructor Dependencies To Four
- Never Inject Request In Constructor
- Use Constructor Promotion For Injections
- Never Use app()->make() In Controller Methods
- Register Interface Bindings In One Service Provider
- Use Contextual Binding For Different Controller Needs

### Decisions
- Constructor vs Method Injection Decision

### Anti-Patterns
- Too Many Constructor Dependencies
- Resolving Dependencies Inside Method
- Injecting HTTP-Specific Dependencies
- Excessive Method Injection Parameters
- Mixing Constructor and Method Injection

## Related Knowledge
- Controller Method Injection â€” Per-action dependency injection
- Controller Form Request Integration â€” Form request resolution via method injection
- Controller Action Delegation â€” Injecting action classes instead of repositories



