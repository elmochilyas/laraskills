# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Conditional Aggregate Inclusion
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Conditional Aggregate Inclusion implementation follows response-structures patterns
- [ ] All edge cases handled for Conditional Aggregate Inclusion
- [ ] Full test coverage for Conditional Aggregate Inclusion
- [ ] Security review completed for Conditional Aggregate Inclusion
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Conditional Aggregate Inclusion
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Aggregate inclusion belongs in Resources, not controllers â€” controllers load, resources decide presentation.
- [ ] Decide whether per-resource aggregates belong in the main response or a separate `/stats` endpoint.
- [ ] For monetary values with `withSum()`, consider precision handling â€” format in the resource or return raw values.
- [ ] Caching aggregate-heavy responses requires careful cache invalidation when related data changes.
- [ ] Evaluate: Aggregate Inclusion Strategy
- [ ] Evaluate: Aggregate Loading Layer Separation
- [ ] Evaluate: Aggregate vs Separate Stats Endpoint

---

# Implementation Checklist

- [ ] Aggregate parameters are validated against a server-side whitelist
- [ ] `withCount()` / `loadCount()` is used before serialization â€” not in the resource
- [ ] Resource uses `when($this->comments_count)` to conditionally include
- [ ] Default response does NOT include aggregates (must be requested)
- [ ] Whitelist is tested â€” invalid aggregate names return 400 or are silently ignored
- [ ] Multiple aggregates are aggregated into one query (`withCount(['comments', 'likes'])`)
- [ ] Performance impact of each aggregate is documented
- [ ] Implement Conditional Aggregate Inclusion following response-structures patterns
- [ ] Configure all required settings for Conditional Aggregate Inclusion
- [ ] Register route/middleware/service for Conditional Aggregate Inclusion
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Each `withCount()`/`withSum()` adds a correlated subquery â€” multiple aggregates multiply query cost.
- [ ] Subqueries use `LEFT JOIN` â€” ensure appropriate indexes exist on the aggregate tables.
- [ ] Five `withCount()` calls add five subqueries â€” consider whether a single raw query with multiple aggregates is more efficient.
- [ ] Aggregate values themselves are small (integers, floats) â€” the cost is in subquery computation on the database server.

---

# Security Checklist

- [ ] Aggregate values may expose sensitive business metrics (total revenue, user counts) â€” gate by user role.
- [ ] `withExists()` reveals whether related records exist â€” can be used for user enumeration if not properly authorized.
- [ ] Custom aggregate aliases that leak internal naming conventions should be reviewed.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every aggregate field uses `whenAggregated()` or `whenCounted()`.
- [ ] No `withCount()` or `withSum()` call in the resource layer â€” only in controllers.
- [ ] Aggregate fields are absent from responses when the controller doesn't load them.
- [ ] Integration tests verify aggregate presence and correct values when loaded.
- [ ] Aggregate subquery performance is monitored via query log in development.
- [ ] Write feature tests for happy path of Conditional Aggregate Inclusion
- [ ] Write feature tests for validation failure of Conditional Aggregate Inclusion
- [ ] Write feature tests for authentication failure of Conditional Aggregate Inclusion
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

- [ ] Avoid: Always Loading All Aggregates
- [ ] Avoid: N+1 Aggregate Queries
- [ ] Avoid: Inefficient Conditional Load Implementation
- [ ] Avoid: Missing Index for Aggregate Queries
- [ ] Avoid: Aggregate Loading Without Client Protocol

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
- Rule 1: Always Gate Aggregate Fields with `whenAggregated()` or `whenCounted()`
- Rule 2: Load Aggregates in Controllers Only
- Rule 3: Match Aggregate Aliases Exactly Between Loading and Display
- Rule 4: Provide Default Values for Nullable Aggregates
- Rule 5: Restrict Aggregate Count to at Most Five per Resource
- Rule 6: Combine Aggregate Inclusion with Authorization Conditions

### Decisions
- Aggregate Inclusion Strategy
- Aggregate Loading Layer Separation
- Aggregate vs Separate Stats Endpoint

### Anti-Patterns
- Always Loading All Aggregates
- N+1 Aggregate Queries
- Inefficient Conditional Load Implementation
- Missing Index for Aggregate Queries
- Aggregate Loading Without Client Protocol

## Related Knowledge
- Prerequisites
- Related
- Advanced



