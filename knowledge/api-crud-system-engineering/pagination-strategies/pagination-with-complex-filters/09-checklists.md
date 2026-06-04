# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Pagination with Complex Filters
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pagination with Complex Filters implementation follows pagination-strategies patterns
- [ ] All edge cases handled for Pagination with Complex Filters
- [ ] Full test coverage for Pagination with Complex Filters
- [ ] Security review completed for Pagination with Complex Filters
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Pagination with Complex Filters
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Keep filter logic in query scopes or repository methods â€” pagination should be a separate concern layered on top.
- [ ] Use a filter session hash to allow clients to maintain cursor context across requests with the same filters.
- [ ] For cursor pagination with filters, the composite index must include filter columns as the leading columns.
- [ ] Monitor common filter combinations and guide composite index creation based on actual usage patterns.
- [ ] Consider a dedicated search engine (Meilisearch, Algolia, Elasticsearch) for complex search + pagination scenarios.
- [ ] Evaluate: Filter Application Strategy
- [ ] Evaluate: Cursor Invalidation on Filter Change

---

# Implementation Checklist

- [ ] Filters are applied before pagination â€” never after
- [ ] Search terms are escaped or use parameterized queries (prevent SQL injection)
- [ ] Filter columns are validated against an allowed whitelist
- [ ] Date range filters have validated format and logical bounds (from <= to)
- [ ] Boolean/status filters use strict type comparison
- [ ] `per_page` has a cap to prevent massive filtered result sets
- [ ] Filtered pagination is tested with known data (correct filtering + correct pagination)
- [ ] Indexes exist on the most commonly filtered column combinations
- [ ] Implement Pagination with Complex Filters following pagination-strategies patterns
- [ ] Configure all required settings for Pagination with Complex Filters
- [ ] Register route/middleware/service for Pagination with Complex Filters
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] The worst-case filter combination (least selective, unindexed columns) must be tested for pagination performance.
- [ ] COUNT(*) with complex filters and unindexed columns can take seconds â€” consider simplePaginate() or approximate counts.
- [ ] `LIKE '%term%'` forces a full table scan and cannot be indexed; use `LIKE 'term%'` (prefix match) or full-text indexes.
- [ ] Boolean column filters (`WHERE is_published = true`) have low selectivity and rarely justify inclusion in a composite index.
- [ ] For high-selectivity filters (e.g., `user_id`), include them as the leading index column for optimal performance.

---

# Security Checklist

- [ ] Always validate filter values server-side before using them in queries â€” prevents injection and type confusion.
- [ ] Filter parameters should be validated against an allowlist of permitted operators and values.
- [ ] Changing filters mid-pagination could be used to probe data across different filter contexts â€” ensure cursor is scoped to filter session.
- [ ] If the search term is included in pagination URLs, it may expose search patterns in logs and analytics.
- [ ] Prevent clients from applying too many filters simultaneously (DoS vector through complex query generation).

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Composite index includes frequently-used equality filter columns as leading columns
- [ ] Filters are applied in the database query (before pagination), not in application code
- [ ] Cursor is invalidated/ignored when filter parameters change
- [ ] Filter session hash mechanism is implemented for cursor+filter consistency
- [ ] Number of simultaneous filters is limited (max 5)
- [ ] Filter values are validated before query execution (400 for invalid values)
- [ ] Search queries avoid `LIKE '%term%'` â€” use full-text index or prefix search
- [ ] Pagination links preserve all filter parameters
- [ ] Performance tested with worst-case filter combination
- [ ] Write feature tests for happy path of Pagination with Complex Filters
- [ ] Write feature tests for validation failure of Pagination with Complex Filters
- [ ] Write feature tests for authentication failure of Pagination with Complex Filters
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

- [ ] Avoid: Filtering After Pagination
- [ ] Avoid: Pagination-Unaware Filter Count
- [ ] Avoid: Cursor Pagination with Unstable Filters
- [ ] Avoid: Filter Logic Duplicated Across Methods
- [ ] Avoid: Ignoring Filter Impact on Cursor Index
- [ ] Avoid: Filter Logic Duplicated Across Pagination Methods

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
- Apply All Filters Before Pagination in the Database
- Index Equality-Filter Columns as Leading Index Columns
- Reset Pagination When Filters Change
- Validate Filter Values Before Query Execution
- Limit the Number of Simultaneous Filters
- Avoid LIKE '%term%' in Paginated Queries
- Keep Filter Logic in Query Scopes, Separate From Pagination
- Consider Dedicated Search Engine for Complex Search+Pagination

### Decisions
- Filter Application Strategy
- Cursor Invalidation on Filter Change

### Anti-Patterns
- Filtering After Pagination
- Pagination-Unaware Filter Count
- Cursor Pagination with Unstable Filters
- Filter Logic Duplicated Across Methods
- Ignoring Filter Impact on Cursor Index
- Filter Logic Duplicated Across Pagination Methods

## Related Knowledge
- Multi-Column Cursor Pagination â€” Composite indexes for filter+sort
- Total Count Performance â€” Count with complex WHERE clauses
- SQL Indexing for Filtering â€” Index strategies for filtered queries
- Query Filtering and Searching â€” Filter parameter design
- Full-Text Search Integration â€” Search + pagination patterns



