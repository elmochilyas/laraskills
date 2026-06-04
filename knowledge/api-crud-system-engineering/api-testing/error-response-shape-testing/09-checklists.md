# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Error Response Shape Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Error Response Shape Testing implementation follows api-testing patterns
- [ ] All edge cases handled for Error Response Shape Testing
- [ ] Full test coverage for Error Response Shape Testing
- [ ] Security review completed for Error Response Shape Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Error Response Shape Testing

---

# Architecture Checklist

- [ ] Error shape consistency is enforced by a single file (Exception Handler) â€” test the handler, not per-endpoint.
- [ ] Custom error shapes (adding `code`, `trace_id`, `status`) must be applied consistently in the handler, tested, and documented.
- [ ] Error shapes should be versioned â€” v1 and v2 may differ, but all endpoints within a version must be consistent.
- [ ] Publish the error shape as part of API documentation for client SDK generation.

---

# Implementation Checklist

- [ ] Handler-level tests not per-endpoint
- [ ] Each error status (401, 403, 404, 422, 429, 500) has a dedicated shape test
- [ ] Both debug and production error shapes tested
- [ ] Sensitive data absent in production error responses (stack traces, SQL queries)
- [ ] Custom error fields consistent across all error types
- [ ] 422 shape includes `errors` key
- [ ] Implement Error Response Shape Testing following api-testing patterns
- [ ] Configure all required settings for Error Response Shape Testing
- [ ] Register route/middleware/service for Error Response Shape Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Error response shape tests are cheap â€” trigger errors with malformed requests.
- [ ] Run them in a dedicated test suite that validates the exception handler globally, not per-endpoint.
- [ ] No complex setup required; these are fast validation tests.

---

# Security Checklist

- [ ] Never include stack traces, SQL queries, or internal IDs in production error messages.
- [ ] `APP_DEBUG=false` must strip all debug information from error responses.
- [ ] Test that sensitive data (user emails, tokens, internal IDs) does not appear in error messages.
- [ ] Log full exception details server-side but return only the safe subset to the client.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Each error status (401, 403, 404, 422, 429, 500) has a dedicated shape test
- [ ] Production error shapes exclude stack traces and debug information
- [ ] Custom error shapes are applied consistently across all endpoints
- [ ] Error shape is documented in the OpenAPI spec for all error responses
- [ ] All endpoints within a version return the same error shape structure
- [ ] Write feature tests for happy path of Error Response Shape Testing
- [ ] Write feature tests for validation failure of Error Response Shape Testing
- [ ] Write feature tests for authentication failure of Error Response Shape Testing
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
- Test Handler-Level Consistency, Not Per-Endpoint
- Test Each Error Status Code Shape
- Test Both Debug And Production Error Shapes
- Assert Absence Of Sensitive Data
- Test Custom Error Fields Are Always Present

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



