# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Response Header Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Response Header Testing implementation follows api-testing patterns
- [ ] All edge cases handled for Response Header Testing
- [ ] Full test coverage for Response Header Testing
- [ ] Security review completed for Response Header Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Response Header Testing

---

# Architecture Checklist

- [ ] Feature-level header tests validate both controller and middleware pipeline.
- [ ] Security headers are production requirements â€” enforce with header tests that fail CI build.
- [ ] Debug headers (X-Debug-Bar) must be stripped in production â€” test in production-like env.
- [ ] CORS headers must match allowed origins configuration â€” test with both allowed and disallowed origins.

---

# Implementation Checklist

- [ ] Content-Type asserted on every endpoint
- [ ] Location header asserted on created resources
- [ ] Security headers tested in dedicated parameterized suite
- [ ] Debug headers asserted missing in production-like environment
- [ ] Header absence asserted on error responses (no Location on 422)
- [ ] CORS headers tested with allowed and disallowed origins
- [ ] Common headers asserted via `beforeEach`
- [ ] Implement Response Header Testing following api-testing patterns
- [ ] Configure all required settings for Response Header Testing
- [ ] Register route/middleware/service for Response Header Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Header assertions are cheap â€” read from response object without JSON parsing.
- [ ] Bundle header assertions into same test method as status/shape assertions.
- [ ] Use `beforeEach` to assert common headers for all endpoints.

---

# Security Checklist

- [ ] Security headers (CSP, HSTS, X-Content-Type-Options) must be tested explicitly.
- [ ] Debug headers must be stripped in production â€” `assertHeaderMissing` validates this.
- [ ] Location header must not expose internal URLs in production.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Response Header Testing
- [ ] Write feature tests for validation failure of Response Header Testing
- [ ] Write feature tests for authentication failure of Response Header Testing
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
- Assert Content-Type On Every Endpoint
- Test Location Header On Created Resources
- Assert Security Headers In Dedicated Suite
- Assert Header Absence Where Expected
- Use BeforeEach For Common Header Assertions

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



