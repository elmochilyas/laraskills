# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Response Status Code Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Response Status Code Testing implementation follows api-testing patterns
- [ ] All edge cases handled for Response Status Code Testing
- [ ] Full test coverage for Response Status Code Testing
- [ ] Security review completed for Response Status Code Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Response Status Code Testing

---

# Architecture Checklist

- [ ] Status codes must be consistent across API versions â€” v1 returning 201 and v2 returning 200 for store is a breaking change.
- [ ] Feature-level status code testing validates controller + middleware + exception handler pipeline.
- [ ] Monitor 5xx rates in production â€” spike indicates unhandled exceptions.
- [ ] 204 response for delete is often forgotten â€” verify in tests.

---

# Implementation Checklist

- [ ] Status is the first assertion in every test chain
- [ ] Convenience methods used over `assertStatus($code)` for readability
- [ ] Canonical CRUD codes used: GET=200, POST=201, PUT/PATCH=200, DELETE=204
- [ ] 401/403 correctly distinguished
- [ ] 204 asserted for delete endpoints
- [ ] Every endpoint condition maps to expected status code
- [ ] Edge status codes tested (201 store, 204 delete)
- [ ] Implement Response Status Code Testing following api-testing patterns
- [ ] Configure all required settings for Response Status Code Testing
- [ ] Register route/middleware/service for Response Status Code Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Status code assertions are the cheapest assertion type â€” single integer check.
- [ ] Always assert status first; if wrong, further assertions are skipped.
- [ ] Group status assertions by endpoint to minimize kernel boots.

---

# Security Checklist

- [ ] 5xx responses must not expose stack traces or internal details (APP_DEBUG=false).
- [ ] 4xx responses must use standardized codes to prevent information leakage.
- [ ] Wrong status codes (500 instead of 404) may expose unhandled exceptions.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Response Status Code Testing
- [ ] Write feature tests for validation failure of Response Status Code Testing
- [ ] Write feature tests for authentication failure of Response Status Code Testing
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
- Assert Status First In Every Test Chain
- Use Canonical CRUD Status Codes
- Don't Confuse 401 With 403
- Map Every Condition To Expected Status
- Assert 204 For Delete

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



