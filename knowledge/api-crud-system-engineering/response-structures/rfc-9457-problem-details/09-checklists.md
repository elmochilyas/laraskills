# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Rfc 9457 Problem Details
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Rfc 9457 Problem Details implementation follows response-structures patterns
- [ ] All edge cases handled for Rfc 9457 Problem Details
- [ ] Full test coverage for Rfc 9457 Problem Details
- [ ] Security review completed for Rfc 9457 Problem Details
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Rfc 9457 Problem Details
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Implement Problem Details via custom exception handling in `App\Exceptions\Handler` â€” map each exception type to a Problem Details response.
- [ ] Use `application/problem+json` content type for all error responses â€” set via middleware or exception handler.
- [ ] Maintain an error type registry mapping exception classes to `type` URIs, status codes, and titles.
- [ ] Extension members (like validation errors) should be consistent across all error types that include them.
- [ ] Version error type URLs to allow documentation evolution: `/errors/v1/validation-error`.
- [ ] Evaluate: Error Format Selection: RFC 9457 vs Custom Error Format
- [ ] Evaluate: Error Type Registry Design
- [ ] Evaluate: Security and Correlation in Error Responses

---

# Implementation Checklist

- [ ] Problem type URIs defined per error category
- [ ] `type`, `title`, `status` required fields present
- [ ] `detail` and `instance` optional fields included
- [ ] `type` absolute URL with documentation
- [ ] Consistent `title` per error type
- [ ] `Content-Type: application/problem+json`
- [ ] Application-specific extension members
- [ ] Tested for all error types
- [ ] Implement Rfc 9457 Problem Details following response-structures patterns
- [ ] Configure all required settings for Rfc 9457 Problem Details
- [ ] Register route/middleware/service for Rfc 9457 Problem Details
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Problem Details responses are typically small (< 1KB) â€” error conditions themselves dominate response time.
- [ ] `Content-Type` negotiation for `application/problem+json` adds negligible branching cost.
- [ ] Error type registry lookups should be cached â€” use a config array, not database queries.
- [ ] Serialization of Problem Details bodies is extremely fast (~0.001ms) â€” simple flat objects.

---

# Security Checklist

- [ ] Never include stack traces, debug output, or SQL queries in `detail` for production responses.
- [ ] `instance` (correlation ID) should not encode sensitive information like user IDs.
- [ ] Extension members like `validation_errors` can leak schema information â€” review what field names reveal.
- [ ] `type` URLs should not expose internal infrastructure details in the URL path.
- [ ] Use `instance` for internal log correlation, not for exposing internal identifiers to clients.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every 4xx/5xx response has `type`, `title`, `status`, `detail`, and `instance` fields.
- [ ] `status` in the body matches the HTTP response status code.
- [ ] `Content-Type: application/problem+json` is set on all error responses.
- [ ] `type` URLs resolve to documentation pages.
- [ ] Validation errors include `invalid_params` extension with field-level details.
- [ ] Write feature tests for happy path of Rfc 9457 Problem Details
- [ ] Write feature tests for validation failure of Rfc 9457 Problem Details
- [ ] Write feature tests for authentication failure of Rfc 9457 Problem Details
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

- [ ] Avoid: Non-Standard Error Response Format
- [ ] Avoid: Missing Required Problem Details Fields
- [ ] Avoid: Including Stack Traces in Problem Details
- [ ] Avoid: Generic Problem Type URIs
- [ ] Avoid: No Extension Members for Domain Errors

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
- Rule 1: Include All Required Fields in Every Error Response
- Rule 2: Make `type` URLs Resolve to Documentation
- Rule 3: Register Distinct Error Types per Error Category
- Rule 4: Include `instance` as a Correlation ID for Log Tracing
- Rule 5: Never Include Stack Traces or Debug Info in `detail`
- Rule 6: Match `status` in the Body to the HTTP Response Status
- Rule 7: Set `Content-Type: application/problem+json` on All Error Responses

### Decisions
- Error Format Selection: RFC 9457 vs Custom Error Format
- Error Type Registry Design
- Security and Correlation in Error Responses

### Anti-Patterns
- Non-Standard Error Response Format
- Missing Required Problem Details Fields
- Including Stack Traces in Problem Details
- Generic Problem Type URIs
- No Extension Members for Domain Errors

## Related Knowledge
- Prerequisites
- Related
- Advanced



