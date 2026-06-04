# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Offset Pagination Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Offset Pagination Design implementation follows pagination-strategies patterns
- [ ] All edge cases handled for Offset Pagination Design
- [ ] Full test coverage for Offset Pagination Design
- [ ] Security review completed for Offset Pagination Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Offset Pagination Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use `page`/`per_page` naming for public-facing REST APIs; `offset`/`limit` for internal/gRPC-like APIs.
- [ ] Keep default page size at 15-25 for general APIs; 10-15 for mobile; 25-50 for admin panels.
- [ ] Always return paginated responses with a consistent `meta`/`links` structure across all endpoints.
- [ ] Provide both body metadata and Link headers for maximum client compatibility.
- [ ] For large tables, cache the total count or use `simplePaginate()` to avoid repeated COUNT(*) queries.
- [ ] Evaluate: Parameter Naming Convention
- [ ] Evaluate: Simple vs Full Pagination Selection

---

# Implementation Checklist

- [ ] `page` defaults to 1; `per_page` defaults to configured value (15-25)
- [ ] `per_page` has a configured maximum (100 max recommended)
- [ ] ORDER BY column is indexed for consistent page ordering
- [ ] Offset calculation handles page=1 correctly (offset=0)
- [ ] `last_page` calculation uses `ceil(total / per_page)`
- [ ] Empty result set returns `total: 0`, `last_page: 1`, `data: []`
- [ ] Negative or zero page numbers return validation errors
- [ ] `prev` is null on first page; `next` is null on last page
- [ ] Deep pages (page > total_pages) return empty data or 404
- [ ] Implement Offset Pagination Design following pagination-strategies patterns
- [ ] Configure all required settings for Offset Pagination Design
- [ ] Register route/middleware/service for Offset Pagination Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Deep offsets cause O(N) performance: `OFFSET 10000` requires the database to scan 10015 rows and discard the first 10000.
- [ ] `COUNT(*)` on large tables (millions of rows) can take seconds, especially with WHERE clauses.
- [ ] Offset pagination queries use the ORDER BY index only for ordering, not for skipping â€” the index scan still reads and discards offset rows.
- [ ] At 1M rows, page 1 may be 2ms but page 100000 may be 2-10s or time out.
- [ ] Use covering indexes to reduce table lookup overhead for the data phase of offset queries.

---

# Security Checklist

- [ ] Validate `page` parameter to prevent excessively large offsets that could cause denial of service.
- [ ] Cap `per_page` to prevent memory exhaustion from large responses.
- [ ] Never return 404 for empty pages â€” this could be used by attackers to probe for data existence.
- [ ] The `total` count reflects the state at time of query; concurrent mutations can make it stale.
- [ ] Log and monitor requests with extreme page numbers or per_page values for abuse detection.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] per_page has a documented and enforced maximum (e.g., 100)
- [ ] page parameter is validated as integer >= 1
- [ ] Empty pages return 200 with `data: []` (not 404)
- [ ] Response includes consistent `meta` and `links` structure
- [ ] COUNT(*) query performance is benchmarked with realistic data size
- [ ] simplePaginate() considered when total count is not needed
- [ ] Default per_page is documented per endpoint
- [ ] Deep offset queries are monitored or limited
- [ ] Write feature tests for happy path of Offset Pagination Design
- [ ] Write feature tests for validation failure of Offset Pagination Design
- [ ] Write feature tests for authentication failure of Offset Pagination Design
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

- [ ] Avoid: Using Offset for Unbounded Datasets
- [ ] Avoid: Not Capping per_page
- [ ] Avoid: Mixing page/per_page and offset/limit
- [ ] Avoid: Running paginate on Views Without Checking Need
- [ ] Avoid: Relying on total Being Perfectly Accurate

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
- Enforce a Maximum per_page Limit
- Validate Page Number as Integer >= 1
- Return 200 With Empty Data for Out-of-Range Pages
- Use page/per_page Naming for Public APIs
- Use simplePaginate() When Total Count Is Not Required
- Document Default and Maximum per_page Per Endpoint
- Never Use Offset Pagination for Real-Time Feeds
- Keep Response Structure Consistent Across All Paginated Endpoints
- Never Rely on total Being Perfectly Accurate

### Decisions
- Parameter Naming Convention
- Simple vs Full Pagination Selection

### Anti-Patterns
- Using Offset for Unbounded Datasets
- Not Capping per_page
- Mixing page/per_page and offset/limit
- Running paginate on Views Without Checking Need
- Relying on total Being Perfectly Accurate

## Related Knowledge
- Cursor Pagination Design â€” Alternative strategy for real-time data
- Keyset Pagination Design â€” Alternative for deep-offset scenarios
- Pagination Link Headers â€” Link header format for pagination
- Total Count Performance â€” Optimizing COUNT(*) on large tables
- Offset-to-Cursor Migration â€” Transitioning strategies without breaking clients



