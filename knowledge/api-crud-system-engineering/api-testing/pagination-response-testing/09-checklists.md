# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Pagination Response Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pagination Response Testing implementation follows api-testing patterns
- [ ] All edge cases handled for Pagination Response Testing
- [ ] Full test coverage for Pagination Response Testing
- [ ] Security review completed for Pagination Response Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Pagination Response Testing

---

# Architecture Checklist

- [ ] Pagination response shape must be documented in OpenAPI spec.
- [ ] Changes to pagination structure are breaking changes for most API clients.
- [ ] Test raw paginator output and API Resource wrapped output separately.
- [ ] For large tables, consider cursor pagination â€” total count is expensive.

---

# Implementation Checklist

- [ ] `data` count matches requested `per_page` (except final page)
- [ ] `meta` contains `current_page`, `last_page`, `per_page`, `total`
- [ ] `links` contains `first`, `last`, `prev`, `next`
- [ ] First page asserts `prev` is `null`
- [ ] Last page asserts `next` is `null`
- [ ] Single-page result asserts `prev` and `next` are both `null`
- [ ] Zero results assert `total == 0` and `data` is `[]`
- [ ] Missing page (beyond `last_page`) returns 404
- [ ] Implement Pagination Response Testing following api-testing patterns
- [ ] Configure all required settings for Pagination Response Testing
- [ ] Register route/middleware/service for Pagination Response Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Pagination tests require at minimum `per_page + 1` seeded records.
- [ ] Use factories with `count(N)` to batch-create records for pagination tests.
- [ ] Avoid seeding thousands of records â€” `per_page + 2` is sufficient.

---

# Security Checklist

- [ ] Never expose raw database row counts beyond the `total` value in meta.
- [ ] Ensure pagination doesn't allow scanning of all records via large per_page.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Pagination Response Testing
- [ ] Write feature tests for validation failure of Pagination Response Testing
- [ ] Write feature tests for authentication failure of Pagination Response Testing
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
- Seed Data For Multi-Page Scenarios
- Assert Full Pagination Shape
- Test Boundary Pages
- Test Per_Page Boundary
- Test Empty Collection
- Test Cursor Pagination Separately

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



