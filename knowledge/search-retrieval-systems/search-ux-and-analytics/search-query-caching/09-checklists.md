# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 09-search-ux-and-analytics
**Knowledge Unit:** Search Query Caching
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Search Query Caching implementation follows 09-search-ux-and-analytics patterns
- [ ] All edge cases handled for Search Query Caching
- [ ] Full test coverage for Search Query Caching
- [ ] Security review completed for Search Query Caching
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Search Query Caching

---

# Architecture Checklist

- [ ] Use Laravel's Cache facade with Redis for distributed caching.
- [ ] Cache key: `search:{model}:{md5(query+filters+page)}`.
- [ ] Tag with model name: `Cache::tags(['search_products'])->put($key, $results, $ttl)`.
- [ ] Invalidate on model save: `Cache::tags(['search_products'])->flush()`.
- [ ] For Scout: wrap `search()` call in cache check + store.
- [ ] Evaluate: Search UX Pattern Selection
- [ ] Evaluate: Faceted Search Implementation Strategy
- [ ] Evaluate: Search Analytics and Monitoring Approach

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Search Query Caching following 09-search-ux-and-analytics patterns
- [ ] Configure all required settings for Search Query Caching
- [ ] Register route/middleware/service for Search Query Caching
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Redis cache hit: <1ms vs search engine query: 20-200ms.
- [ ] Serialization overhead for large result sets (consider caching only IDs).
- [ ] Cache invalidation frequency: if data changes every second, caching is counterproductive.
- [ ] Memory usage: cache size = number of unique queries Ã— average result size.

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

- [ ] Search query caching implemented
- [ ] Cache key normalization in place
- [ ] Tag-based invalidation configured
- [ ] Appropriate TTL set for search type
- [ ] Cache hit ratio monitored
- [ ] Cache invalidation works on model saves
- [ ] Write feature tests for happy path of Search Query Caching
- [ ] Write feature tests for validation failure of Search Query Caching
- [ ] Write feature tests for authentication failure of Search Query Caching
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
- K012 (Scout paginate)
- K065 (Search performance benchmarking)
- K011 (Scout where clauses)



