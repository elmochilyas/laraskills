# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Error Response Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Error Response Testing implementation follows error-handling-design patterns
- [ ] All edge cases handled for Error Response Testing
- [ ] Full test coverage for Error Response Testing
- [ ] Security review completed for Error Response Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Error Response Testing
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Create an `AssertErrorResponse` trait with methods like `assertErrorShape()`, `assertErrorCode()`, `assertNoSensitiveData()`.
- [ ] Use data providers that iterate all endpoints and their error modes.
- [ ] Write integration tests (HTTP), not unit tests for the handler â€” catches middleware and serialisation issues.
- [ ] Use snapshot testing (`spatie/phpunit-snapshot-assertions`) for stable, infrequently-changing error shapes.
- [ ] Write a dedicated production-mode test suite with `APP_DEBUG=false`.
- [ ] Test each error scenario: missing auth, invalid auth, forbidden, not found, validation failure, conflict, rate limited, server error.

---

# Implementation Checklist

- [ ] Test case per error scenario
- [ ] HTTP status code asserted per test
- [ ] Error code asserted against taxonomy
- [ ] Response envelope structure verified
- [ ] Error-specific headers asserted
- [ ] No sensitive data in response
- [ ] Tests pass in both debug and production mode
- [ ] Error response tests in CI
- [ ] Implement Error Response Testing following error-handling-design patterns
- [ ] Configure all required settings for Error Response Testing
- [ ] Register route/middleware/service for Error Response Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Error response tests are slower than success-case tests (exception handling overhead).
- [ ] Use `RefreshDatabase` only when needed â€” most error tests don't need DB.
- [ ] Group error tests into a separate suite for CI parallelism.
- [ ] Avoid `dd()` in error responses during tests â€” captures output, breaks assertions.
- [ ] Mock rate limiters to avoid timing-dependent test delays.

---

# Security Checklist

- [ ] Error tests with `APP_DEBUG=false` must assert absence of stack traces, file paths, and SQL.
- [ ] Test that sensitive data (passwords, tokens) is never included in error responses.
- [ ] Verify error codes do not leak internal system structure.
- [ ] Ensure dev-mode tests don't accidentally pass in production-mode CI.
- [ ] Snapshot files for error shapes should not contain sensitive data.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every endpoint has error tests for all documented error modes
- [ ] Error shape assertions use `assertJsonStructure()` for the full envelope
- [ ] Error code assertions use `assertJson()` for specific codes
- [ ] Production-mode test suite runs with `APP_DEBUG=false`
- [ ] No sensitive data (stack traces, file paths) appears in production-mode tests
- [ ] Headers (WWW-Authenticate, Retry-After, Content-Type) are tested
- [ ] CI gating requires error test coverage for new endpoints
- [ ] Error test matrix covers all endpoints and their failure modes
- [ ] Write feature tests for happy path of Error Response Testing
- [ ] Write feature tests for validation failure of Error Response Testing
- [ ] Write feature tests for authentication failure of Error Response Testing
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

- [ ] Avoid: Only Testing Happy Path
- [ ] Avoid: Asserting Status Only, Not Shape
- [ ] Avoid: Tests Pass with APP_DEBUG=true, Fail in Production
- [ ] Avoid: Snapshot Testing Dynamic Values
- [ ] Avoid: Flaky Tests Due to Rate Limiting
- [ ] Avoid: No Production-Mode Testing

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
- Test Error Shapes as API Contracts
- Always Test with APP_DEBUG=false for Production Mode
- Use Shared Assertion Traits to Avoid Duplication
- Test All Documented Error Modes per Endpoint
- Assert Headers in Error Response Tests
- Use Data Providers for Error Scenario Matrices
- Use Snapshot Testing for Stable Error Shapes
- Include Error Test Coverage in CI Gating
- Test with Integration Tests, Not Unit Tests for Handler

### Anti-Patterns
- Only Testing Happy Path
- Asserting Status Only, Not Shape
- Tests Pass with APP_DEBUG=true, Fail in Production
- Snapshot Testing Dynamic Values
- Flaky Tests Due to Rate Limiting
- No Production-Mode Testing

## Related Knowledge
- Standardized Error Envelope (the shape being tested)
- Domain-Specific Error Codes (the codes being asserted in tests)
- Authentication/Authorization/NotFound/Conflict/RateLimit Error Responses (specific shapes to test)
- Production vs Dev Error Detail (testing both environments)
- Integration/Feature Testing patterns in Laravel



