# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 01-laravel-scout-foundation
**Knowledge Unit:** Scout Where Clauses
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Scout Where Clauses implementation follows 01-laravel-scout-foundation patterns
- [ ] All edge cases handled for Scout Where Clauses
- [ ] Full test coverage for Scout Where Clauses
- [ ] Security review completed for Scout Where Clauses
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Scout Where Clauses

---

# Architecture Checklist

- [ ] Use where clauses for structured metadata filtering (category, status, price range).
- [ ] Use search queries for text/full-text matching.
- [ ] For engine-specific filter features, use the callback API instead.
- [ ] Combine with `paginate()` for filtered, paginated results.
- [ ] Evaluate: Searchable Trait Implementation Strategy
- [ ] Evaluate: Indexing Strategy Selection
- [ ] Evaluate: Queue vs Synchronous Indexing Mode

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Scout Where Clauses following 01-laravel-scout-foundation patterns
- [ ] Configure all required settings for Scout Where Clauses
- [ ] Register route/middleware/service for Scout Where Clauses
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Engine-level filtering is faster than post-query collection filtering.
- [ ] Using too many filter clauses may impact query performance on large indexes.
- [ ] whereIn performs better than multiple chained OR where clauses.
- [ ] Filters on low-cardinality fields (status, boolean) are very efficient.

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

- [ ] Filtered attributes are included in toSearchableArray
- [ ] where, whereIn, whereNotIn work as expected
- [ ] Engine-level filtering verified (not post-query)
- [ ] Filter performance acceptable for dataset size
- [ ] Write feature tests for happy path of Scout Where Clauses
- [ ] Write feature tests for validation failure of Scout Where Clauses
- [ ] Write feature tests for authentication failure of Scout Where Clauses
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
- Only Filter Indexed Fields in where Clauses
- Prefer whereIn Over Chained OR where Clauses
- Include Filter Fields in toSearchableArray Even If Not Displayed

### Decisions
- Searchable Trait Implementation Strategy
- Indexing Strategy Selection
- Queue vs Synchronous Indexing Mode

## Related Knowledge
- K001 (Searchable trait)
- K012 (Scout paginate)
- K013 (Customizing engine searches)
- K005 (toSearchableArray)



