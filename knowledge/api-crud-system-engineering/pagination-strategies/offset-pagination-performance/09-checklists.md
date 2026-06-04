# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Offset Pagination Performance
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Offset Pagination Performance implementation follows pagination-strategies patterns
- [ ] All edge cases handled for Offset Pagination Performance
- [ ] Full test coverage for Offset Pagination Performance
- [ ] Security review completed for Offset Pagination Performance
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Offset Pagination Performance
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Design a maximum offset guard that returns a clear error message suggesting cursor pagination for deeper access.
- [ ] Consider an automatic strategy switch: offset for shallow pages (page < 100), cursor for deeper pages.
- [ ] For large tables, cache the total count with a short TTL (60-300 seconds) instead of computing it on every request.
- [ ] Implement query timeouts (5000ms) to prevent deep-offset queries from consuming resources indefinitely.
- [ ] Use read replicas for COUNT(*) queries to reduce load on the primary database.
- [ ] Evaluate: Deep Offset Mitigation Strategy
- [ ] Evaluate: COUNT(*) Optimization Decision

---

# Implementation Checklist

- [ ] ORDER BY column is indexed with matching direction
- [ ] `EXPLAIN` on deep page scan shows fewer rows after indexing
- [ ] Maximum page depth is enforced (configurable, with clear error message)
- [ ] `OFFSET` is not used on tables expected to exceed 100k records (consider cursor)
- [ ] Composite indexes exist for filtered pagination queries
- [ ] Monitoring alerts exist for pagination queries exceeding 200ms
- [ ] Alternative pagination strategy is documented for large datasets
- [ ] Implement Offset Pagination Performance following pagination-strategies patterns
- [ ] Configure all required settings for Offset Pagination Performance
- [ ] Register route/middleware/service for Offset Pagination Performance
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] At 100K rows, offset 90000 is 10-100x slower than offset 0.
- [ ] At 10M rows, offset 9990000 will likely time out.
- [ ] Specific database differences:
- [ ] MySQL InnoDB: No row count cache; must scan an index for COUNT(*).
- [ ] PostgreSQL: MVCC visibility checks on every row make counts expensive.
- [ ] SQLite: Stores approximate count in table header (fast but approximate).
- [ ] MyISAM: Stores exact row count (instant, but deprecated engine).
- [ ] Indexes do NOT reduce the O(N) traversal cost of OFFSET â€” they only help with the ORDER BY sorting and the final row lookups.

---

# Security Checklist

- [ ] Malicious clients can set `offset=999999999` to trigger catastrophic database load (DoS vector).
- [ ] Monitor and rate-limit requests with extreme offset values.
- [ ] Set maximum offset limits to prevent resource exhaustion attacks.
- [ ] The deep-offset pattern can be used for data enumeration; cursor pagination is more resistant.
- [ ] Statement timeouts prevent runaway queries but may produce 500 errors that leak information if not handled gracefully.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Maximum offset/page limit is enforced (e.g., offset < 10000 or page < 100)
- [ ] Execution plan verified for offset queries at various depths
- [ ] COUNT(*) query benchmarked separately from data query
- [ ] simplePaginate() evaluated as an alternative
- [ ] Statement timeouts configured for pagination queries
- [ ] Monitoring in place for average offset depth per endpoint
- [ ] Cached or approximate count strategy evaluated for large tables
- [ ] Documented maximum acceptable offset for each paginated endpoint
- [ ] Write feature tests for happy path of Offset Pagination Performance
- [ ] Write feature tests for validation failure of Offset Pagination Performance
- [ ] Write feature tests for authentication failure of Offset Pagination Performance
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

- [ ] Avoid: No Maximum Offset Guard
- [ ] Avoid: Using paginate on Every Request for Large Tables
- [ ] Avoid: Not Monitoring Offset Depth
- [ ] Avoid: Assuming Small Datasets Stay Small
- [ ] Avoid: Using Offset as the Only Strategy

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
- Enforce a Maximum Offset Limit
- Benchmark COUNT(*) Separately From Data Query
- Use simplePaginate() When Total Count Is Not Required
- Use Covering Indexes for Data Queries
- Set Statement Timeouts on Pagination Queries
- Monitor Average Offset Depth Per Endpoint
- Cache Total Count With Short TTL for Large Tables
- Implement Hybrid Strategy When Datasets Grow Beyond Offset Threshold
- Use Read Replicas for COUNT(*) Queries

### Decisions
- Deep Offset Mitigation Strategy
- COUNT(*) Optimization Decision

### Anti-Patterns
- No Maximum Offset Guard
- Using paginate on Every Request for Large Tables
- Not Monitoring Offset Depth
- Assuming Small Datasets Stay Small
- Using Offset as the Only Strategy

## Related Knowledge
- Offset Pagination Design â€” The API surface enabled by this performance analysis
- Cursor Pagination Performance â€” Comparative performance characteristics
- Keyset Pagination Design â€” The performant deep-offset alternative
- Total Count Performance â€” Dedicated KU for count optimization
- Offset-to-Cursor Migration â€” When performance forces a strategy change



