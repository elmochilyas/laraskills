# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** CORS Behavior Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] CORS Behavior Testing implementation follows api-testing patterns
- [ ] All edge cases handled for CORS Behavior Testing
- [ ] Full test coverage for CORS Behavior Testing
- [ ] Security review completed for CORS Behavior Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for CORS Behavior Testing

---

# Architecture Checklist

- [ ] CORS is enforced at the browser level â€” server-side tests validate header correctness, not browser behavior.
- [ ] Use dedicated CORS test suites that send requests with various `Origin` headers and assert response headers.
- [ ] CORS configuration must match API documentation exactly â€” a misconfigured `allowed_origins` breaks the entire application for all users.
- [ ] Wildcard `*` origins cannot be used with `supports_credentials: true` â€” browser restriction.

---

# Implementation Checklist

- [ ] Preflight OPTIONS request returns correct CORS headers for allowed origins
- [ ] Actual requests from allowed origins include CORS headers
- [ ] Disallowed origins get no CORS headers
- [ ] Credentialed requests work when `supports_credentials: true`
- [ ] CORS headers present on error responses (4xx, 5xx)
- [ ] `Access-Control-Expose-Headers` includes all custom response headers
- [ ] `Access-Control-Max-Age` asserted on preflight
- [ ] Implement CORS Behavior Testing following api-testing patterns
- [ ] Configure all required settings for CORS Behavior Testing
- [ ] Register route/middleware/service for CORS Behavior Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] CORS tests are lightweight â€” OPTIONS or GET requests with custom `Origin` headers.
- [ ] Test all allowed origins in a dataset to minimize kernel boots.
- [ ] Batch CORS preflight and CORS actual-request tests in the same class.

---

# Security Checklist

- [ ] A missing `Access-Control-Allow-Origin` is a silent failure â€” browser blocks without clear error.
- [ ] Test that CORS headers are present on error responses too â€” otherwise browser can't read the error.
- [ ] Never use wildcard `*` origins with `supports_credentials: true` â€” this is a browser security restriction.
- [ ] Ensure `Access-Control-Expose-Headers` includes all custom headers (e.g., `X-RateLimit-*`) that browser JS needs to read.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Preflight OPTIONS request returns correct CORS headers for allowed origins
- [ ] Actual requests from allowed origins include CORS headers
- [ ] Disallowed origins get no CORS headers (browser will block)
- [ ] Credentialed requests work when `supports_credentials: true`
- [ ] CORS headers are present on error responses (4xx, 5xx)
- [ ] `Access-Control-Expose-Headers` includes all custom response headers
- [ ] Write feature tests for happy path of CORS Behavior Testing
- [ ] Write feature tests for validation failure of CORS Behavior Testing
- [ ] Write feature tests for authentication failure of CORS Behavior Testing
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

- [ ] Avoid tight coupling between layers
- [ ] Avoid business logic in controllers
- [ ] Avoid skipping validation layers

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
- Test Preflight OPTIONS Request
- Test Both Allowed And Disallowed Origins
- Test CORS Headers On Error Responses
- Test Access-Control-Expose-Headers
- Test Credentialed Requests

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



