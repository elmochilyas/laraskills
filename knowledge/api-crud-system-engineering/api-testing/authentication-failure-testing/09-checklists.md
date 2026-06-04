# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Authentication Failure Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Authentication Failure Testing implementation follows api-testing patterns
- [ ] All edge cases handled for Authentication Failure Testing
- [ ] Full test coverage for Authentication Failure Testing
- [ ] Security review completed for Authentication Failure Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Authentication Failure Testing

---

# Architecture Checklist

- [ ] 401 = "I don't know you" â€” identity verification failure. Separate from 403 (authorization).
- [ ] Feature-level auth tests verify middleware-to-controller pipeline, not just Guard logic.
- [ ] Architecture tests enforce: every route in authenticated API must have an auth-failure test.
- [ ] In production, monitor 401 rates as security signal (spike may indicate token theft or brute-force).

---

# Implementation Checklist

- [ ] Every protected endpoint has at least one 401 test
- [ ] Missing-token, invalid-token, expired-token, revoked-token scenarios tested
- [ ] Error body asserted alongside 401 status code
- [ ] Wrong-guard scenario tested if applicable
- [ ] `withoutMiddleware` not used in auth tests
- [ ] Parameterized tests cover all protected endpoints
- [ ] Implement Authentication Failure Testing following api-testing patterns
- [ ] Configure all required settings for Authentication Failure Testing
- [ ] Register route/middleware/service for Authentication Failure Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Auth-failure tests are lightweight â€” rejected at middleware before controller.
- [ ] Use PestPHP's `beforeEach` to seed one authenticated user for all tests.
- [ ] Batch auth-failure tests with `@dataProvider` to reduce kernel boots.

---

# Security Checklist

- [ ] 401 responses must never expose user details or valid token hints.
- [ ] Log auth failures with request metadata (IP, User-Agent) but never expose in response.
- [ ] Auth-failure tests verify that error responses don't leak information.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Authentication Failure Testing
- [ ] Write feature tests for validation failure of Authentication Failure Testing
- [ ] Write feature tests for authentication failure of Authentication Failure Testing
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
- Test Every Authenticated Endpoint For 401
- Assert Error Body, Not Just Status
- Separate Missing-Token From Invalid-Token Tests
- Parameterize Protected Endpoints
- Never Use WithoutMiddleware On Auth Tests

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



