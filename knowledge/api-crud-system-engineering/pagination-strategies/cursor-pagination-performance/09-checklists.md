# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Cursor Pagination Performance
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Cursor Pagination Performance implementation follows pagination-strategies patterns
- [ ] All edge cases handled for Cursor Pagination Performance
- [ ] Full test coverage for Cursor Pagination Performance
- [ ] Security review completed for Cursor Pagination Performance
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Cursor Pagination Performance
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Design the index before implementing cursor pagination â€” the index is the single critical success factor.
- [ ] For queries with WHERE filters, include the equality filter columns as the leading columns in the composite index.
- [ ] Keep composite indexes to 3-4 columns maximum to avoid excessive index size and write overhead.
- [ ] Monitor index usage via database statistics (`pg_stat_user_indexes` in PostgreSQL, `index_stats` in MySQL).
- [ ] Use dedicated staging environment with production-scale data for pagination performance testing.
- [ ] Evaluate: Index Strategy Selection
- [ ] Evaluate: Execution Plan Verification Decision

---

# Implementation Checklist

- [ ] Cursor column has a B-tree index
- [ ] WHERE clause uses the indexed column in a comparison (>, <, >=, <=)
- [ ] `EXPLAIN` shows `type: range` or `ref`, not `ALL`
- [ ] `rows` estimate is small (index scan, not table scan)
- [ ] SELECT columns are covered by the index (or minimal lookups)
- [ ] Query time at deep pages (< 100ms) matches first-page time
- [ ] Composite indexes exist for multi-column cursors with correct column order
- [ ] Implement Cursor Pagination Performance following pagination-strategies patterns
- [ ] Configure all required settings for Cursor Pagination Performance
- [ ] Register route/middleware/service for Cursor Pagination Performance
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] At 1M rows, cursor pagination maintains ~4ms response time at any depth; offset pagination degrades to 2-10s at deep pages.
- [ ] A composite index on (created_at, id) for 1M rows adds approximately 40-50MB of disk space.
- [ ] Covering indexes increase index size (disk and buffer pool) but eliminate table lookups entirely.
- [ ] B-tree depth increases slightly with more composite index columns, but the impact is negligible.
- [ ] DESC vs ASC: B-tree indexes are inherently bidirectional, but MySQL may need explicit DESC in index creation.
- [ ] Read-ahead and buffer pool benefit cursor pagination because range scans access consecutive index pages.

---

# Security Checklist

- [ ] Performance patterns can leak information â€” consistent response times at all depths reveal that cursor pagination is used, while variable times reveal offset pagination.
- [ ] Index metadata (index names, sizes) should not be exposed in responses or error messages.
- [ ] Very fast pagination can enable rapid data scraping; combine with rate limiting.
- [ ] Monitoring cursor query timing can help detect denial-of-service attacks that attempt deep-pagination exhaustion.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Composite index exists and matches ORDER BY columns and directions exactly
- [ ] EXPLAIN ANALYZE shows Index Range Scan (not Seq Scan) for cursor queries
- [ ] Response time at position 1 and position 1M differs by less than 20%
- [ ] Covering index considered for queries selecting a subset of columns
- [ ] Index maintenance schedule established (REINDEX/OPTIMIZE TABLE)
- [ ] Performance benchmarks conducted with production-scale data
- [ ] Query timeout configured for pagination endpoints (e.g., 5 seconds)
- [ ] Index size monitored and budgeted for disk and buffer pool
- [ ] Write feature tests for happy path of Cursor Pagination Performance
- [ ] Write feature tests for validation failure of Cursor Pagination Performance
- [ ] Write feature tests for authentication failure of Cursor Pagination Performance
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

- [ ] Avoid: Creating Indexes After Deploying Cursor Code
- [ ] Avoid: Using Cursor With Arbitrary Client-Specified Sort
- [ ] Avoid: Adding Too Many Columns to Composite Index
- [ ] Avoid: Not Testing With Production-Scale Data
- [ ] Avoid: Overlooking Covering Index Benefits

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
- Verify Execution Plan Shows Index Range Scan
- Match Composite Index Column Order to Query Column Order Exactly
- Use Covering Indexes for Frequently Queried Columns
- Create Index Before Deploying Cursor Pagination Code
- Set Query Timeouts for Pagination Endpoints
- Rebuild Indexes Periodically to Prevent Bloat
- Monitor Index Usage and Cursor Query Performance
- Benchmark with Production-Scale Data Before Signing Off

### Decisions
- Index Strategy Selection
- Execution Plan Verification Decision

### Anti-Patterns
- Creating Indexes After Deploying Cursor Code
- Using Cursor With Arbitrary Client-Specified Sort
- Adding Too Many Columns to Composite Index
- Not Testing With Production-Scale Data
- Overlooking Covering Index Benefits

## Related Knowledge
- Cursor Pagination Design â€” Understanding cursor mechanics
- Offset Pagination Performance â€” Comparative baseline
- Keyset Pagination Design â€” SQL-only equivalent with similar performance
- Multi-Column Cursor Pagination â€” Composite index design for complex sorts
- Query Plan Analysis â€” EXPLAIN and execution plan interpretation



