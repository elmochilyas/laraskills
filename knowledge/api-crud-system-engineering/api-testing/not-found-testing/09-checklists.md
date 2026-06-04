# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Not Found Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Not Found Testing implementation follows api-testing patterns
- [ ] All edge cases handled for Not Found Testing
- [ ] Full test coverage for Not Found Testing
- [ ] Security review completed for Not Found Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Not Found Testing

---

# Architecture Checklist

- [ ] 404 tests validate both the binding mechanism and error response format in one assertion.
- [ ] Every resource-member route must have a 404 test â€” enforce via architecture tests.
- [ ] Consistent 404 error shape across API is critical. Customize globally in exception handler.
- [ ] Test soft-delete behavior: deleted resource IDs exist in DB but are excluded by default scope.

---

# Implementation Checklist

- [ ] Every member route (show, update, destroy, restore) tested for 404
- [ ] Error body asserted alongside 404 status
- [ ] Invalid ID shapes tested (string, negative, zero)
- [ ] Soft-deleted resource access returns 404
- [ ] No DB mutation on update/destroy with non-existent ID
- [ ] Consistent 404 error shape across all endpoints
- [ ] Implement Not Found Testing following api-testing patterns
- [ ] Configure all required settings for Not Found Testing
- [ ] Register route/middleware/service for Not Found Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] 404 tests are among the cheapest feature tests â€” no seed data needed, fail early in middleware chain.
- [ ] Maximize coverage by testing 404 with a single PestPHP dataset iterating all resource endpoints.

---

# Security Checklist

- [ ] 404 responses must not reveal whether a resource ID once existed or was never created.
- [ ] Use consistent 404 messages for both missing and soft-deleted resources.
- [ ] Don't leak table-specific information in 404 messages.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Not Found Testing
- [ ] Write feature tests for validation failure of Not Found Testing
- [ ] Write feature tests for authentication failure of Not Found Testing
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
- Test Every Member Route For 404
- Assert Error Body On 404
- Test Invalid ID Shapes
- Test Soft-Deleted Resource Access
- Verify No DB Mutation On Non-Existent Resource Updates

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



