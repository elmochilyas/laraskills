# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Keyset Pagination Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Keyset Pagination Design implementation follows pagination-strategies patterns
- [ ] All edge cases handled for Keyset Pagination Design
- [ ] Full test coverage for Keyset Pagination Design
- [ ] Security review completed for Keyset Pagination Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Keyset Pagination Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use `forPageAfterId()` for simple primary-key-based keyset pagination in Laravel.
- [ ] For multi-column keysets, implement manually or use `cursorPaginate()` (which handles encoding automatically).
- [ ] Generate fresh keyset values from the current query's results â€” reusing keysets across different filter contexts produces incorrect results.
- [ ] Define a default sort order when no `after_*` parameters are provided (start from the beginning).
- [ ] Document the keyset parameters clearly in the API reference, including which columns are exposed.
- [ ] Evaluate: Keyset vs Cursor Pagination Selection
- [ ] Evaluate: Parameter Design Decision

---

# Implementation Checklist

- [ ] WHERE clause uses indexed sequential column
- [ ] First request (no cursor) returns correct first page
- [ ] Keys are sequential with index â€” query time is constant
- [ ] Sort direction is consistent between pages
- [ ] Last-page detection uses `per_page + 1` or checks row count < per_page
- [ ] Gaps in keys do not affect correctness (WHERE > value handles gaps)
- [ ] API returns `next_id` or equivalent for the next request
- [ ] Implement Keyset Pagination Design following pagination-strategies patterns
- [ ] Configure all required settings for Keyset Pagination Design
- [ ] Register route/middleware/service for Keyset Pagination Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Keyset pagination has identical O(1) performance to cursor pagination â€” both use index range scans.
- [ ] Row constructor syntax `(a, b) > (x, y)` is optimized in PostgreSQL and MySQL 8.0+ for single index range scans.
- [ ] Boolean expressions (`a > x OR (a = x AND b > y)`) may be less optimized in some databases; prefer row constructor syntax.
- [ ] LIMIT+1 for has-more detection adds negligible cost.
- [ ] The WHERE clause must match the ORDER BY index exactly for optimal performance.

---

# Security Checklist

- [ ] Keyset parameters are used directly in SQL WHERE clauses â€” always use parameterized queries, never raw string interpolation.
- [ ] Exposing sort column values may leak internal record ordering, sequential IDs, or temporal patterns.
- [ ] Clients can manipulate keyset parameters to attempt to access records outside their authorization scope â€” validate authorization independently.
- [ ] Keyset values reveal whether IDs are sequential or UUID-based â€” document this as a design consideration.
- [ ] Logging keyset parameters exposes sort column values; sanitize logs if values are sensitive.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Keyset WHERE clause uses parameterized queries (Eloquent) â€” no string interpolation
- [ ] Tiebreaker column (primary key) is always included as final sort column
- [ ] Forward (`after_*`) and backward (`before_*`) parameters are mutually exclusive
- [ ] Parameter types are validated before query execution
- [ ] Execution plan shows Index Range Scan for keyset queries
- [ ] Default sort order defined for requests without keyset parameters
- [ ] Keyset values generated fresh from query results, not reused across filter contexts
- [ ] API documentation clearly states which columns are exposed via keyset parameters
- [ ] sensitive sort columns are not exposed (use cursor pagination instead if they are)
- [ ] Write feature tests for happy path of Keyset Pagination Design
- [ ] Write feature tests for validation failure of Keyset Pagination Design
- [ ] Write feature tests for authentication failure of Keyset Pagination Design
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

- [ ] Avoid: Using Keyset for Public APIs Without Security Review
- [ ] Avoid: Relying on Client to Send Correct Keyset Values
- [ ] Avoid: Implementing Keyset Without Default Sort
- [ ] Avoid: Forging Keyset Values Across User Contexts
- [ ] Avoid: Using Keyset With Dynamically Generated Sort Columns

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
- Always Include a Tiebreaker Column in Keyset Queries
- Use Parameterized Queries, Never Raw Interpolation
- Use Consistent after_ / before_ Parameter Naming
- Require Direction Parameter for Bidirectional Navigation
- Validate Keyset Parameter Types Server-Side
- Generate Fresh Keyset Values From Current Query Results
- Prefer cursorPaginate() Over Manual Keyset for Multi-Column Sorts
- Define a Default Sort for Requests Without Keyset Parameters
- Validate Authorization Independently of Keyset Parameters
- Sanitize Keyset Values in Logs

### Decisions
- Keyset vs Cursor Pagination Selection
- Parameter Design Decision

### Anti-Patterns
- Using Keyset for Public APIs Without Security Review
- Relying on Client to Send Correct Keyset Values
- Implementing Keyset Without Default Sort
- Forging Keyset Values Across User Contexts
- Using Keyset With Dynamically Generated Sort Columns

## Related Knowledge
- Cursor Pagination Design â€” Conceptual equivalent with opaque tokens
- Multi-Column Cursor Pagination â€” Advanced keyset with many sort columns
- Pagination Strategy Selection â€” Keyset vs offset vs cursor comparison
- Offset-to-Cursor Migration â€” Moving from offset to keyset pagination



