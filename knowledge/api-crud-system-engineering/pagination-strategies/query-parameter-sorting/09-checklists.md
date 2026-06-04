# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Query Parameter Sorting
**Generated:** 2026-06-03
**Note:** Based on partial input - some source files missing or empty

---

# Quick Checklist

- [ ] Query Parameter Sorting implementation follows pagination-strategies patterns
- [ ] All edge cases handled for Query Parameter Sorting
- [ ] Full test coverage for Query Parameter Sorting
- [ ] Security review completed for Query Parameter Sorting
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Query Parameter Sorting

---

# Architecture Checklist

- [ ] Define clear boundaries and responsibilities for Query Parameter Sorting
- [ ] Document architectural decisions (ADR) for Query Parameter Sorting
- [ ] Follow layer isolation rules - no skipping layers
- [ ] Ensure separation of concerns between controller/service/repository
- [ ] Validate architectural consistency with pagination-strategies standards

---

# Implementation Checklist

- [ ] Sortable fields whitelisted â€” unmatched fields return 422
- [ ] Multi-field sort supported with comma separation
- [ ] `+` prefix for ascending, `-` prefix for descending
- [ ] Primary key used as tiebreaker for stable pagination
- [ ] 422 for unrecognized sort fields with available list
- [ ] Default sort documented and applied when sort param missing
- [ ] Sorting direction respects `+`/`-` convention
- [ ] Excessive sort field counts logged
- [ ] Sort applied in client-specified order (first field = primary)
- [ ] Implement Query Parameter Sorting following pagination-strategies patterns
- [ ] Configure all required settings for Query Parameter Sorting
- [ ] Register route/middleware/service for Query Parameter Sorting
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

- [ ] Write feature tests for happy path of Query Parameter Sorting
- [ ] Write feature tests for validation failure of Query Parameter Sorting
- [ ] Write feature tests for authentication failure of Query Parameter Sorting
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



