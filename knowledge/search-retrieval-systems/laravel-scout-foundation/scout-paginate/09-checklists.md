# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 01-laravel-scout-foundation
**Knowledge Unit:** Scout Paginate
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Scout Paginate implementation follows 01-laravel-scout-foundation patterns
- [ ] All edge cases handled for Scout Paginate
- [ ] Full test coverage for Scout Paginate
- [ ] Security review completed for Scout Paginate
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Scout Paginate

---

# Architecture Checklist

- [ ] Use `Product::search($q)->paginate($perPage)` for standard paginated search endpoints.
- [ ] For API responses, consider `simplePaginate()` to avoid total count overhead.
- [ ] Transform paginator in API resources: `ProductResource::collection($paginator)`.
- [ ] Default per-page is typically set in controller or request validation.
- [ ] Evaluate: Searchable Trait Implementation Strategy
- [ ] Evaluate: Indexing Strategy Selection
- [ ] Evaluate: Queue vs Synchronous Indexing Mode

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Scout Paginate following 01-laravel-scout-foundation patterns
- [ ] Configure all required settings for Scout Paginate
- [ ] Register route/middleware/service for Scout Paginate
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Each page request is a new search engine API call â€” more pages = more cost.
- [ ] `paginate()` calls `getTotalCount()` which may be expensive on some engines.
- [ ] `simplePaginate()` avoids total count â€” significantly faster for large indexes.
- [ ] Caching frequently accessed pages (especially page 1) reduces engine load.

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

- [ ] paginate() returns correct total and page counts
- [ ] Pagination depth limitations understood for your engine
- [ ] Caching in place for high-traffic pages
- [ ] simplePaginate() used where total count unnecessary
- [ ] Write feature tests for happy path of Scout Paginate
- [ ] Write feature tests for validation failure of Scout Paginate
- [ ] Write feature tests for authentication failure of Scout Paginate
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
- Prefer simplePaginate Over paginate for Performance
- Limit Pagination Depth
- Cache Paginated Search Results

### Decisions
- Searchable Trait Implementation Strategy
- Indexing Strategy Selection
- Queue vs Synchronous Indexing Mode

## Related Knowledge
- K011 (Scout where clauses)
- K063 (Search query caching)
- K001 (Searchable trait)



