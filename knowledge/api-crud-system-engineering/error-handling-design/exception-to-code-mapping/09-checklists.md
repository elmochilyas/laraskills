# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Exception To Code Mapping
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Exception To Code Mapping implementation follows error-handling-design patterns
- [ ] All edge cases handled for Exception To Code Mapping
- [ ] Full test coverage for Exception To Code Mapping
- [ ] Security review completed for Exception To Code Mapping
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Exception To Code Mapping
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Define mapping in `App\Exceptions\Handler` as an array or match expression.
- [ ] Register a fallback for `Throwable` as the last renderable callback with generic `SYSTEM.INTERNAL_ERROR`.
- [ ] Cover these Laravel exceptions explicitly: `AuthenticationException`, `AuthorizationException`, `ModelNotFoundException`, `ValidationException`, `ThrottleRequestsException`, `QueryException`.
- [ ] Use a service provider pattern for packages to register their own mappings.
- [ ] Pre-compile the map at boot into a flat structure for maximum speed.
- [ ] Tag Sentry/error tracking events with the resolved error code.

---

# Implementation Checklist

- [ ] Framework exceptions mapped to error codes
- [ ] Custom domain exceptions mapped
- [ ] Callbacks ordered most-specific first
- [ ] Error envelope returned from every callback
- [ ] Error code included in response
- [ ] Each mapping tested end-to-end
- [ ] Mapping registry maintained
- [ ] Implement Exception To Code Mapping following error-handling-design patterns
- [ ] Configure all required settings for Exception To Code Mapping
- [ ] Register route/middleware/service for Exception To Code Mapping
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Array key lookup O(1). `instanceof` chain O(n) but n < 20.
- [ ] Pre-compile the map into `SplObjectStorage` or flattened array at boot.
- [ ] Mapping resolution is not on the hot path (exceptions are rare) â€” performance impact is negligible.
- [ ] Boot-time compilation adds < 1ms to service provider boot.

---

# Security Checklist

- [ ] Never map generic `Exception` or `Throwable` as the first entry â€” it catches everything and defeats the purpose.
- [ ] The catch-all fallback must return a safe generic message with no internal detail.
- [ ] Ensure `QueryException` mapping does not expose SQL in the response.
- [ ] When mapping third-party exceptions, review what context they carry before exposing any detail.
- [ ] Keep the mapping table internal â€” do not expose mapping logic in API responses.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All Laravel framework exceptions have explicit mappings in the handler
- [ ] A catch-all `Throwable` fallback is registered as the last renderable callback
- [ ] All custom exception classes have corresponding entries in the mapping
- [ ] Third-party package exceptions are mapped in their respective service providers
- [ ] CI asserts that every known `ApiException` subclass has a mapping
- [ ] Unmapped exceptions trigger a WARNING-level log entry
- [ ] Each mapping produces a distinct, appropriate error code
- [ ] Write feature tests for happy path of Exception To Code Mapping
- [ ] Write feature tests for validation failure of Exception To Code Mapping
- [ ] Write feature tests for authentication failure of Exception To Code Mapping
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

- [ ] Avoid: Single Mapping Callable
- [ ] Avoid: Mapping via Exception Message Parsing
- [ ] Avoid: No Fallback Mapping
- [ ] Avoid: Mapping in Controllers Instead of Handler
- [ ] Avoid: Mapping by Exception Code Integer

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
- Use an Explicit Mapping Array, Not Conventions or Reflection
- Register a Catch-All Throwable Fallback as the Last Mapping
- Map All Framework Exceptions Explicitly
- Map Third-Party Package Exceptions in Their Service Providers
- Vary ModelNotFoundException Mapping by Model Class
- Vary AuthenticationException Mapping by Guard Name
- Log Unmapped Exceptions at WARNING Level
- Never Use Exception::class or Throwable::class as a Mapping Key for Specific Codes

### Anti-Patterns
- Single Mapping Callable
- Mapping via Exception Message Parsing
- No Fallback Mapping
- Mapping in Controllers Instead of Handler
- Mapping by Exception Code Integer

## Related Knowledge
- Domain-Specific Error Codes (the codes being mapped to)
- Error Code Namespace Design (hierarchical code structure)
- Custom Exception Classes (many implement `HasErrorCode` interface)
- Global Exception Handler Config (where the mapping lives)
- Error Logging Context (enriching logs with resolved error code)



