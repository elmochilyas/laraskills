# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-documentation
**Knowledge Unit:** Error Response Documentation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Error Response Documentation implementation follows api-documentation patterns
- [ ] All edge cases handled for Error Response Documentation
- [ ] Full test coverage for Error Response Documentation
- [ ] Security review completed for Error Response Documentation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Error Response Documentation

---

# Architecture Checklist

- [ ] Define base error schema in `components/schemas/ErrorResponse`.
- [ ] Define reusable response objects in `components/responses/` (Unauthorized, ValidationError, NotFound, etc.).
- [ ] Reference via `$ref` in each operation's `responses` section.
- [ ] For Scramble: error docs require manual post-processing (Scramble does not infer errors).
- [ ] For Scribe: use `@response status=422 scenario="validation error"` annotations.
- [ ] Validate error response schemas with contract tests covering error paths.
- [ ] Evaluate: Error Schema Organization â€” Inline vs Reusable Components
- [ ] Evaluate: Error Status Code Coverage â€” All vs Essential Only

---

# Implementation Checklist

- [ ] Reusable error response components defined in `components/responses/`
- [ ] Base `ErrorResponse` schema with message, code, errors properties
- [ ] Every endpoint documents minimum error status codes (401, 403, 404, 422, 429, 500)
- [ ] Machine-readable error code enum documented
- [ ] Multiple scenario-based examples per error status
- [ ] Retry-After header documented for 429 responses
- [ ] Error response schemas verified by contract tests
- [ ] Implement Error Response Documentation following api-documentation patterns
- [ ] Configure all required settings for Error Response Documentation
- [ ] Register route/middleware/service for Error Response Documentation
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Error documentation has no runtime impact.
- [ ] Spec size increases with error examples. Use `$ref` to keep spec manageable.

---

# Security Checklist

- [ ] Error messages in documentation must not leak internal details. Use generic examples.
- [ ] Debug/stack trace info shown only in development â€” document this behavior to prevent consumer dependency.
- [ ] Error code patterns should not reveal internal system structure.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Error Response Documentation
- [ ] Write feature tests for validation failure of Error Response Documentation
- [ ] Write feature tests for authentication failure of Error Response Documentation
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
- Define Reusable Error Response Components
- Document All Error Status Codes On Every Endpoint
- Include Machine-Readable Error Codes
- Provide Scenario-Based Error Examples
- Document Retry-After Header In Rate Limit Errors
- Validate Error Response Schemas With Contract Tests

### Decisions
- Error Schema Organization â€” Inline vs Reusable Components
- Error Status Code Coverage â€” All vs Essential Only

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



