# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Rate Limit Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Rate Limit Testing implementation follows api-testing patterns
- [ ] All edge cases handled for Rate Limit Testing
- [ ] Full test coverage for Rate Limit Testing
- [ ] Security review completed for Rate Limit Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Rate Limit Testing

---

# Architecture Checklist

- [ ] Rate limit testing is inherently stateful â€” the test must exhaust a limit, and the cache must persist.
- [ ] Isolate rate limit tests into dedicated test classes (not mixed with happy-path tests).
- [ ] Use a dedicated cache driver for rate limiting that can be flushed between test classes.
- [ ] Test with a low limit configuration (`throttle:5,1`) to minimize requests per test.

---

# Implementation Checklist

- [ ] Rate limit tests isolated in dedicated test class
- [ ] Low test limits used to minimize request count
- [ ] Persistent cache driver configured (`file` or `redis`)
- [ ] `Cache::flush()` in `setUp()` or `beforeEach()`
- [ ] Exhaustion test: `limit + 1` requests, last returns 429
- [ ] Rate limit headers asserted on 429
- [ ] Authenticated and unauthenticated limits tested separately
- [ ] `withoutMiddleware(ThrottleRequests::class)` used for non-rate-limit tests
- [ ] Implement Rate Limit Testing following api-testing patterns
- [ ] Configure all required settings for Rate Limit Testing
- [ ] Register route/middleware/service for Rate Limit Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Rate limit tests are slow â€” they send `limit + 1` sequential requests.
- [ ] For a limit of 60/minute, a single test sends 61 requests.
- [ ] Mitigate by testing with a low limit configuration (`throttle:5,1`).
- [ ] Use `Cache::flush()` between tests to avoid spillover.
- [ ] Dedicate a separate test class for rate limits so they don't slow down the main suite.

---

# Security Checklist

- [ ] Test that 429 error responses don't expose internal details (cache keys, user IPs).
- [ ] Monitor 429 rates in production â€” high rates indicate abusive clients or misconfigured limits.
- [ ] Ensure rate limits apply to unauthenticated endpoints to prevent IP-based DoS attacks.
- [ ] `Retry-After` header enables client-side exponential backoff â€” verify it's present and accurate.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Each rate-limited endpoint has an exhaustion test
- [ ] Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`) are verified
- [ ] Authenticated and unauthenticated limits are tested separately
- [ ] Cache driver is properly configured for test persistence
- [ ] Rate limit tests are isolated in a dedicated test class
- [ ] Low test limits are used to minimize request count
- [ ] Write feature tests for happy path of Rate Limit Testing
- [ ] Write feature tests for validation failure of Rate Limit Testing
- [ ] Write feature tests for authentication failure of Rate Limit Testing
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
- Isolate Rate Limit Tests In Dedicated Classes
- Use Low Test Limits To Minimize Requests
- Assert Rate Limit Headers On Every Response
- Use Persistent Cache Driver
- Test Authenticated And Unauthenticated Limits Separately
- Flush Cache Between Test Classes

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



