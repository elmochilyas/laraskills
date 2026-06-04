# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Validation Failure Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Validation Failure Testing implementation follows api-testing patterns
- [ ] All edge cases handled for Validation Failure Testing
- [ ] Full test coverage for Validation Failure Testing
- [ ] Security review completed for Validation Failure Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Validation Failure Testing

---

# Architecture Checklist

- [ ] Feature-level validation tests verify the middleware stack (TrimStrings, ConvertEmptyStringsToNull) is active.
- [ ] Every declared rule in every form request must have a failing test.
- [ ] Never expose debug-level `failed` key in production 422 responses.
- [ ] 422 error shape must be consistent across all endpoints.

---

# Implementation Checklist

- [ ] One test per validation rule per field (not grouped into single "fails validation" test)
- [ ] Boundary values tested (min-1, max+1, etc.)
- [ ] Valid defaults provided for non-target fields
- [ ] Datasets used for efficiency
- [ ] Both store and update form requests tested
- [ ] Middleware transformation effects tested (empty string, whitespace-only)
- [ ] Specific error messages asserted (not just 422 status)
- [ ] Implement Validation Failure Testing following api-testing patterns
- [ ] Configure all required settings for Validation Failure Testing
- [ ] Register route/middleware/service for Validation Failure Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Validation tests are input-heavy â€” use PestPHP datasets to group many cases into one test method.
- [ ] Batch independent field validations into a single `it()` block with dataset rows.
- [ ] Each test method with dataset reduces kernel boot overhead.

---

# Security Checklist

- [ ] Validation error messages must not leak internal implementation details.
- [ ] Debug `failed` key exposes rule internals â€” strip in production.
- [ ] Ensure validation doesn't reveal whether a record exists (for security-sensitive fields like email).

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Validation Failure Testing
- [ ] Write feature tests for validation failure of Validation Failure Testing
- [ ] Write feature tests for authentication failure of Validation Failure Testing
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
- One Test Per Validation Rule Per Field
- Set Valid Defaults For Non-Target Fields
- Use PestPHP Datasets For Rule Variations
- Test Both Store And Update Form Requests
- Test Middleware Transformations

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



