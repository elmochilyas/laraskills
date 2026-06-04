# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Cursor Based Pagination
**Generated:** 2026-06-03
**Note:** Based on partial input - some source files missing or empty

---

# Quick Checklist

- [ ] Cursor Based Pagination implementation follows pagination-strategies patterns
- [ ] All edge cases handled for Cursor Based Pagination
- [ ] Full test coverage for Cursor Based Pagination
- [ ] Security review completed for Cursor Based Pagination
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Cursor Based Pagination

---

# Architecture Checklist

- [ ] Define clear boundaries and responsibilities for Cursor Based Pagination
- [ ] Document architectural decisions (ADR) for Cursor Based Pagination
- [ ] Follow layer isolation rules - no skipping layers
- [ ] Ensure separation of concerns between controller/service/repository
- [ ] Validate architectural consistency with pagination-strategies standards

---

# Implementation Checklist

- [ ] `cursorPaginate()` used instead of `paginate()`
- [ ] `cursor` parameter accepted as query input
- [ ] `next_cursor`, `prev_cursor`, `has_more` in response metadata
- [ ] `has_more` accurately indicates additional pages
- [ ] Composite index on `(sort_field, id)`
- [ ] Default sort with `id` tiebreaker
- [ ] Malformed cursor returns 422
- [ ] Cursor values are opaque
- [ ] Cursor usage documented
- [ ] Works with filtering and sorting parameters
- [ ] Implement Cursor Based Pagination following pagination-strategies patterns
- [ ] Configure all required settings for Cursor Based Pagination
- [ ] Register route/middleware/service for Cursor Based Pagination
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Measure response time before and after implementation
- [ ] Add query count monitoring - N+1 detection
- [ ] Use eager loading for all relationships
- [ ] Add caching where appropriate for read-heavy endpoints
- [ ] Profile memory usage for large payloads

---

# Security Checklist

- [ ] Validate all input - never trust client data
- [ ] Apply authorization checks for every operation
- [ ] Sanitize output to prevent injection attacks
- [ ] Rate limit exposed endpoints
- [ ] Log security-relevant events

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Cursor Based Pagination
- [ ] Write feature tests for validation failure of Cursor Based Pagination
- [ ] Write feature tests for authentication failure of Cursor Based Pagination
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



