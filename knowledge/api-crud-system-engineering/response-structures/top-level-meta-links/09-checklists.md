# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Top Level Meta Links
**Generated:** 2026-06-03
**Note:** Based on partial input - some source files missing or empty

---

# Quick Checklist

- [ ] Top Level Meta Links implementation follows response-structures patterns
- [ ] All edge cases handled for Top Level Meta Links
- [ ] Full test coverage for Top Level Meta Links
- [ ] Security review completed for Top Level Meta Links
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Top Level Meta Links

---

# Architecture Checklist

- [ ] Define clear boundaries and responsibilities for Top Level Meta Links
- [ ] Document architectural decisions (ADR) for Top Level Meta Links
- [ ] Follow layer isolation rules - no skipping layers
- [ ] Ensure separation of concerns between controller/service/repository
- [ ] Validate architectural consistency with response-structures standards

---

# Implementation Checklist

- [ ] Top-level `links` with `self` on all resource responses
- [ ] Pagination links on list responses (first, last, prev, next)
- [ ] `related` links in relationship sections
- [ ] `meta` with request_id, timestamp, api_version
- [ ] Pagination metadata in `meta` on list responses
- [ ] Links generated with `route()` helper
- [ ] Absolute URLs for all links
- [ ] `meta` and `links` at top-level, not in `data`
- [ ] 204 responses exclude `meta` and `links`
- [ ] Links tested for correctness in integration tests
- [ ] Implement Top Level Meta Links following response-structures patterns
- [ ] Configure all required settings for Top Level Meta Links
- [ ] Register route/middleware/service for Top Level Meta Links
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

- [ ] Write feature tests for happy path of Top Level Meta Links
- [ ] Write feature tests for validation failure of Top Level Meta Links
- [ ] Write feature tests for authentication failure of Top Level Meta Links
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



