# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Multi-Column Cursor Pagination
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Multi-Column Cursor Pagination implementation follows pagination-strategies patterns
- [ ] All edge cases handled for Multi-Column Cursor Pagination
- [ ] Full test coverage for Multi-Column Cursor Pagination
- [ ] Security review completed for Multi-Column Cursor Pagination
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Multi-Column Cursor Pagination
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Laravel's `cursorPaginate()` handles multi-column ORDER BY automatically â€” prefer it over manual WHERE construction.
- [ ] For manual implementations, build a reusable `CursorBuilder` class that constructs the nested OR WHERE chain from a column list.
- [ ] The composite index leading column should be the most selective equality filter.
- [ ] When nullable columns are used in the sort, define explicit NULLS FIRST/LAST in the ORDER BY and handle accordingly in cursor construction.
- [ ] Monitor composite index size and query performance; rebuild indexes periodically to prevent bloat.
- [ ] Evaluate: Multi-Column Cursor Necessity
- [ ] Evaluate: Row Constructor vs Nested OR Strategy

---

# Implementation Checklist

- [ ] Composite index `(sort_col, tiebreaker)` exists and matches the ORDER BY
- [ ] Cursor encodes both sort value and tiebreaker value
- [ ] WHERE clause correctly handles sort_col > val (strictly after) and sort_col = val AND tiebreaker > val (same value, after tiebreaker)
- [ ] Sorting direction is applied consistently to both columns
- [ ] `EXPLAIN` shows index usage for the composite cursor query
- [ ] Duplicate sort values don't cause missing or duplicate records between pages
- [ ] Tiebreaker column is unique and monotonic (auto-increment ID)
- [ ] Implement Multi-Column Cursor Pagination following pagination-strategies patterns
- [ ] Configure all required settings for Multi-Column Cursor Pagination
- [ ] Register route/middleware/service for Multi-Column Cursor Pagination
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] A composite index on 3-4 columns for 1M rows adds approximately 60-100MB disk space and 20-40MB buffer pool pressure.
- [ ] Each additional index column slows INSERT/UPDATE/DELETE due to index maintenance.
- [ ] B-tree depth increases slightly with more composite key bytes, but impact is negligible.
- [ ] Row constructor syntax is optimized for composite index range scans in PostgreSQL and MySQL 8.0.28+.
- [ ] Verify the execution plan shows Index Range Scan, not Seq Scan or Index Scan with filter.

---

# Security Checklist

- [ ] Multi-column cursors encode multiple sort column values; ensure none of the exposed columns contain sensitive data.
- [ ] The nested OR chain in the WHERE clause is complex; test thoroughly to ensure no SQL injection points.
- [ ] Cursor manipulation by clients increases with more columns â€” consider signing/encrypting multi-column cursors.
- [ ] Column type collisions (string vs datetime) in cursor comparisons can produce incorrect results; validate types.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Composite index created matching ORDER BY columns and directions
- [ ] EXPLAIN shows Index Range Scan (not Seq Scan) for multi-column cursor queries
- [ ] Tiebreaker column (PK) is always the final ORDER BY column
- [ ] NULL handling is explicit (NULLS FIRST/LAST) for nullable sort columns
- [ ] Cursor contains 4 or fewer columns
- [ ] Row constructor syntax used where database supports it
- [ ] Manual OR chain construction (if used) is tested with edge cases
- [ ] Index size is monitored for excessive bloat from too many columns
- [ ] Write feature tests for happy path of Multi-Column Cursor Pagination
- [ ] Write feature tests for validation failure of Multi-Column Cursor Pagination
- [ ] Write feature tests for authentication failure of Multi-Column Cursor Pagination
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

- [ ] Avoid: 5+ Columns in Cursor
- [ ] Avoid: Dynamic Client-Specified Sort
- [ ] Avoid: Ignoring NULL Handling
- [ ] Avoid: Manual WHERE Construction Without Testing
- [ ] Avoid: Using Multi-Column Cursor Without Composite Index

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
- Always Include the Primary Key as the Final Tiebreaker Column
- Place Equality-Filter Columns Before Range/Sort Columns in the Index
- Keep Composite Indexes to 3-4 Columns Maximum
- Use Row Constructor Syntax When Available
- Handle NULLs Explicitly With NULLS FIRST/LAST
- Never Support Dynamic Client-Specified Sort With Cursor Pagination
- Prefer Laravel's cursorPaginate() for Multi-Column Sorts
- Verify Composite Index Usage With EXPLAIN ANALYZE
- Build a Reusable CursorBuilder for Manual Implementations

### Decisions
- Multi-Column Cursor Necessity
- Row Constructor vs Nested OR Strategy

### Anti-Patterns
- 5+ Columns in Cursor
- Dynamic Client-Specified Sort
- Ignoring NULL Handling
- Manual WHERE Construction Without Testing
- Using Multi-Column Cursor Without Composite Index

## Related Knowledge
- Cursor Pagination Design â€” Basic cursor mechanics
- Cursor Encoding Strategies â€” Encoding composite cursor values
- Keyset Pagination Design â€” SQL-only equivalent of multi-column cursors
- Pagination with Complex Filters â€” Combining filters with multi-column sort
- Composite Index Design â€” Optimizing indexes for multi-column sort



