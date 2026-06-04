# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Total Count Performance
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Total Count Performance implementation follows pagination-strategies patterns
- [ ] All edge cases handled for Total Count Performance
- [ ] Full test coverage for Total Count Performance
- [ ] Security review completed for Total Count Performance
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Total Count Performance
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Default to `paginate()` for admin panels (need exact totals), `cursorPaginate()` for public endpoints (no totals needed).
- [ ] For tables > 100K rows, implement a count optimization strategy: covering index, cached count, or approximate count.
- [ ] Use `simplePaginate()` as a middle ground when next/prev navigation is sufficient but cursor pagination is not desired.
- [ ] For complex filtered counts, consider caching the count per filter combination with appropriate keys.
- [ ] Create a dedicated small secondary index (e.g., on a boolean column) for COUNT(*) without WHERE.
- [ ] Evaluate: Count Strategy Selection
- [ ] Evaluate: Covering Index Decision

---

# Implementation Checklist

- [ ] `COUNT(*)` query is profiled â€” `rows` scanned is acceptable
- [ ] Filtered counts have covering indexes for the WHERE clause
- [ ] Approximate counts are documented as approximate in API docs
- [ ] Cached counts have appropriate TTL and invalidation strategy
- [ ] Dashboard count refresh is decoupled from API response (async refresh)
- [ ] API response documents whether `total` is exact or approximate
- [ ] Fallback to exact count is available when precision is required
- [ ] Implement Total Count Performance following pagination-strategies patterns
- [ ] Configure all required settings for Total Count Performance
- [ ] Register route/middleware/service for Total Count Performance
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] COUNT(*) without WHERE on a 10K table: <1ms; on 10M table: 100ms.
- [ ] COUNT(*) with WHERE (indexed) on 10K: 1ms; on 10M: 500ms.
- [ ] COUNT(*) with WHERE (no index) on 10K: 10ms; on 10M: 15s+.
- [ ] In MySQL InnoDB, COUNT(*) without WHERE uses the smallest secondary index (fastest).
- [ ] In PostgreSQL, COUNT(*) with WHERE must check MVCC visibility for every matching row.
- [ ] The count query duration scales with the number of matching rows, not the table size.

---

# Security Checklist

- [ ] The `total` count can leak business information (number of users, orders, revenue records).
- [ ] Cached or approximate counts may not reflect deleted records, potentially exposing deleted data counts.
- [ ] Rate limit COUNT(*) queries indirectly by limiting page request frequency.
- [ ] Ensure that count queries respect the same authorization scope as data queries.
- [ ] Monitor for unusual COUNT(*) frequency that may indicate data scraping.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] COUNT(*) query duration is benchmarked with production-scale data
- [ ] Covering index exists for common count query WHERE clauses
- [ ] Cached or approximate count strategy is implemented for tables > 100K rows
- [ ] simplePaginate() or cursorPaginate() is used where total count is not required
- [ ] COUNT(*) duration is monitored; alert threshold configured (>500ms)
- [ ] The count strategy (exact/approximate/cached) is documented per endpoint
- [ ] Materialized count table (if used) is kept in sync with data mutations
- [ ] Total count values are labeled as estimates when using approximate/cached strategies
- [ ] Write feature tests for happy path of Total Count Performance
- [ ] Write feature tests for validation failure of Total Count Performance
- [ ] Write feature tests for authentication failure of Total Count Performance
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

- [ ] Avoid: COUNT on Every Paginated Request
- [ ] Avoid: COUNT on Filtered Large Datasets
- [ ] Avoid: COUNT for Infinite Scroll Endpoints
- [ ] Avoid: COUNT in Read-Heavy Real-Time Feeds
- [ ] Avoid: No COUNT Caching Strategy

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
- Benchmark COUNT(*) Separately From the Data Query
- Use simplePaginate() When Total Count Is Not Required
- Create Covering Indexes for Common Count Queries
- Cache Total Count With Short TTL for Large Tables
- Use cursorPaginate() to Eliminate the Count Requirement Entirely
- Monitor COUNT(*) Duration and Alert on Threshold Exceeded
- Document the Count Strategy Per Endpoint
- Use Approximate Counts for Large Tables
- Ensure Count Queries Respect Authorization Scope

### Decisions
- Count Strategy Selection
- Covering Index Decision

### Anti-Patterns
- COUNT on Every Paginated Request
- COUNT on Filtered Large Datasets
- COUNT for Infinite Scroll Endpoints
- COUNT in Read-Heavy Real-Time Feeds
- No COUNT Caching Strategy

## Related Knowledge
- Offset Pagination Design â€” Where total count is used
- Pagination Strategy Selection â€” When to include/exclude total count
- Cursor Pagination Design â€” Eliminating the count requirement
- Database Index Optimization â€” Covering indexes for counts
- Materialized Views â€” Pre-computed counts for complex queries



