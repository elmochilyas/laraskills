# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 09-search-ux-and-analytics
**Knowledge Unit:** Algolia Geo Search
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Algolia Geo Search implementation follows 09-search-ux-and-analytics patterns
- [ ] All edge cases handled for Algolia Geo Search
- [ ] Full test coverage for Algolia Geo Search
- [ ] Security review completed for Algolia Geo Search
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Algolia Geo Search

---

# Architecture Checklist

- [ ] Store latitude and longitude in the model's database, include `_geoloc` in `toSearchableArray()`.
- [ ] Use Scout callback API to pass geo parameters: `aroundLatLng`, `aroundRadius`.
- [ ] Combine with standard `where()` for non-geo filters.
- [ ] Geo-ranking (distance-based scoring) is automatic when `aroundLatLng` is specified.
- [ ] Evaluate: Search UX Pattern Selection
- [ ] Evaluate: Faceted Search Implementation Strategy
- [ ] Evaluate: Search Analytics and Monitoring Approach

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Algolia Geo Search following 09-search-ux-and-analytics patterns
- [ ] Configure all required settings for Algolia Geo Search
- [ ] Register route/middleware/service for Algolia Geo Search
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Geo-search adds minimal overhead to Algolia queries.
- [ ] Radius filtering efficiently narrows the search space.
- [ ] Many geo-queries may benefit from query caching.

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

- [ ] _geoloc data included in toSearchableArray
- [ ] Geo-parameters configured in search queries
- [ ] Distance-based ranking working correctly
- [ ] Radius filtering returns expected results
- [ ] Combined with facet filters for richer queries
- [ ] Write feature tests for happy path of Algolia Geo Search
- [ ] Write feature tests for validation failure of Algolia Geo Search
- [ ] Write feature tests for authentication failure of Algolia Geo Search
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
- Rule Name

### Decisions
- Search UX Pattern Selection
- Faceted Search Implementation Strategy
- Search Analytics and Monitoring Approach

## Related Knowledge
- K018 (Algolia driver setup)
- K037 (Typesense geo-search)
- K066 (Faceted search implementation)



