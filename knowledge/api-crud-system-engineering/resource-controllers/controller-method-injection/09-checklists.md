# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Controller Method Injection
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Controller Method Injection implementation follows resource-controllers patterns
- [ ] All edge cases handled for Controller Method Injection
- [ ] Full test coverage for Controller Method Injection
- [ ] Security review completed for Controller Method Injection
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Controller Method Injection
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Prefer constructor injection for dependencies used in 3+ methods; method injection for 1-2 method dependencies.
- [ ] Document the distinction between route parameters and injected services in team conventions.
- [ ] Use PHP 8 attributes (`#[RouteParameter]`) for clarity if available.
- [ ] Avoid method injection of request-scoped singletons that maintain mutable state across calls.
- [ ] Evaluate: Injection Strategy Decision

---

# Implementation Checklist

- [ ] Dependency is used only in the method where it's injected â€” not reused
- [ ] Constructor injection is preferred for shared dependencies
- [ ] Interface bindings are registered in a ServiceProvider
- [ ] Method injection does not create confusion about the dependency's scope
- [ ] Tests can mock the injected dependency by passing a mock in the method call
- [ ] Action classes injected via method injection follow single-responsibility
- [ ] Implement Controller Method Injection following resource-controllers patterns
- [ ] Configure all required settings for Controller Method Injection
- [ ] Register route/middleware/service for Controller Method Injection
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Container `call()` uses reflection once per route, then caches the result.
- [ ] Method injection overhead: ~0.1-0.3ms per call for simple services.
- [ ] Form request validation adds its own overhead (1-5ms depending on rules).
- [ ] Route model binding (database query) dominates performance, not the injection mechanism.

---

# Security Checklist

- [ ] Route parameter name vs service type-hint collisions: a route param `{logger}` can conflict with `LoggerInterface $logger`.
- [ ] Always type-hint injectable parameters; untyped parameters receive route values.
- [ ] Form request's `authorize()` returns 403 silently if authorization fails.

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
- [ ] Shared dependencies (3+ methods) use constructor injection
- [ ] Action-specific dependencies use method injection
- [ ] All injectable parameters have type-hints
- [ ] Route parameter names don't collide with service type-hints
- [ ] Method injection works correctly with route caching enabled
- [ ] Write feature tests for happy path of Controller Method Injection
- [ ] Write feature tests for validation failure of Controller Method Injection
- [ ] Write feature tests for authentication failure of Controller Method Injection
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

- [ ] Avoid: Overuse of Method Injection for Services
- [ ] Avoid: Method Injection Without Route Model Binding
- [ ] Avoid: Excessive Method Injection Parameters
- [ ] Avoid: Mixing Service and Data Parameters
- [ ] Avoid: Method Injection When Constructor Is Appropriate

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
- Use Constructor Injection For Shared Dependencies
- Never Inject Request In Constructor
- Maintain Consistent Parameter Order
- Type-Hint All Injectable Parameters
- Use Method Injection For Single-Use Services

### Decisions
- Injection Strategy Decision

### Anti-Patterns
- Overuse of Method Injection for Services
- Method Injection Without Route Model Binding
- Excessive Method Injection Parameters
- Mixing Service and Data Parameters
- Method Injection When Constructor Is Appropriate

## Related Knowledge
- Controller Dependency Injection â€” Constructor injection for shared dependencies
- Controller Form Request Integration â€” Form request resolution via method injection
- Route Model Binding â€” How route parameters resolve to models



