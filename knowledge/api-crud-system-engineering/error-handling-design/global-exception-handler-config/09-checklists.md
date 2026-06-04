# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Global Exception Handler Config
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Global Exception Handler Config implementation follows error-handling-design patterns
- [ ] All edge cases handled for Global Exception Handler Config
- [ ] Full test coverage for Global Exception Handler Config
- [ ] Security review completed for Global Exception Handler Config
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Global Exception Handler Config
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] All renderable callbacks check `$request->expectsJson()` before returning JSON.
- [ ] Use dedicated handler methods per exception type (`handleAuthenticationError`, `handleValidationError`).
- [ ] Register framework exceptions explicitly: `AuthenticationException`, `AuthorizationException`, `ModelNotFoundException`, `ValidationException`, `ThrottleRequestsException`.
- [ ] Use `instanceof` in base exception type registration for hierarchy support.
- [ ] Register a final fallback `Throwable` renderable for all unhandled exceptions.
- [ ] Use `reportable()` callbacks for error tracking integration, separate from rendering.
- [ ] Keep the handler as the only file that changes when adding new exception types.

---

# Implementation Checklist

- [ ] `render()` overridden for JSON API responses
- [ ] Request JSON detection via `expectsJson()`
- [ ] Exception-to-status mapping defined
- [ ] Error envelope returned consistently
- [ ] `$dontReport` configured
- [ ] `register()` for custom reporting
- [ ] NotFoundHttpException handled with 404
- [ ] MethodNotAllowedHttpException handled with 405
- [ ] Unhandled exceptions logged
- [ ] All exception types tested
- [ ] Implement Global Exception Handler Config following error-handling-design patterns
- [ ] Configure all required settings for Global Exception Handler Config
- [ ] Register route/middleware/service for Global Exception Handler Config
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Callback registration is boot-time only â€” no runtime overhead.
- [ ] Each renderable adds a micro-benchmark `instanceof` check (< 20 = negligible).
- [ ] Handler registration is not a bottleneck â€” use cached routes and config.
- [ ] Pin Handler class in OPcache â€” it's loaded on every request.

---

# Security Checklist

- [ ] Guard all renderables with `$request->expectsJson()` to prevent HTML error exposure.
- [ ] Never log sensitive data in `context()` method.
- [ ] Ensure `$dontReport` does not silence critical errors.
- [ ] Test handler by simulating exception scenarios in deployment smoke tests.
- [ ] Add a health check endpoint that forces an exception to verify handler rendering.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All handler behaviour uses `register()` callbacks, not overridden `render()`
- [ ] Every renderable callback is guarded with `$request->expectsJson()`
- [ ] A `Throwable` fallback renderable is registered as the last callback
- [ ] All Laravel framework exceptions have explicit renderable callbacks
- [ ] `context()` method enriches all error logs without sensitive data
- [ ] `$dontReport` only excludes expected, non-actionable exceptions
- [ ] Renderable callbacks are wrapped in try/catch for error-during-error-handling protection
- [ ] Write feature tests for happy path of Global Exception Handler Config
- [ ] Write feature tests for validation failure of Global Exception Handler Config
- [ ] Write feature tests for authentication failure of Global Exception Handler Config
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

- [ ] Avoid: Single Monolithic render() Method
- [ ] Avoid: Missing expectsJson() Check
- [ ] Avoid: Handler Doing Business Logic
- [ ] Avoid: No Fallback Handler
- [ ] Avoid: Silent Failures

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
- Always Use register() Callbacks, Never Override render()
- Guard Every Renderable Callback with expectsJson()
- Register Specific Exceptions First, General Last
- Delegate Renderables to Dedicated Named Methods
- Keep $dontReport Minimal â€” Only Expected, High-Volume, Non-Actionable Exceptions
- Wrap Renderable Logic in Try/Catch to Prevent Error-During-Error-Handling
- Add Context via context() Method, Not in Each Callback
- Use reportable() Callbacks for Side Effects, Separate from Rendering
- Register Explicit Renderable Callbacks for Every Framework Exception

### Anti-Patterns
- Single Monolithic render() Method
- Missing expectsJson() Check
- Handler Doing Business Logic
- No Fallback Handler
- Silent Failures

## Related Knowledge
- Custom Exception Classes (what gets caught by the handler)
- Exception-to-Code Mapping (the mapping registry the handler uses)
- Server Error Responses (the catch-all fallback response)
- Production vs Dev Error Detail (environment-dependent rendering)
- Error Logging Context (context enrichment in handler)



