# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Pagination Metadata Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pagination Metadata Design implementation follows response-structures patterns
- [ ] All edge cases handled for Pagination Metadata Design
- [ ] Full test coverage for Pagination Metadata Design
- [ ] Security review completed for Pagination Metadata Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Pagination Metadata Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use `paginationInformation()` to customize field names if the default keys don't match the API's naming convention.
- [ ] For very large tables (>1M rows), prefer cursor pagination or omit `total` to skip the count query.
- [ ] `from` and `to` fields are cheap to compute but add bytes â€” consider omitting for machine-to-machine APIs.
- [ ] Cap `page` parameter to `last_page` to prevent extreme database load from out-of-range page numbers.
- [ ] When filters change between pages, `total` fluctuates â€” document this behavior for clients.
- [ ] Evaluate: Paginator Type Selection
- [ ] Evaluate: `total` Field Inclusion Strategy
- [ ] Evaluate: Field Name Standardization

---

# Implementation Checklist

- [ ] All paginated endpoints return the same `meta` keys
- [ ] All paginated endpoints return the same `links` keys
- [ ] Naming convention is consistent (snake_case, camelCase, or kebab-case)
- [ ] For cursor pagination, cursor fields are added but offset fields are still present (or adapted)
- [ ] `from` and `to` reflect the range of items in the current page
- [ ] `total` is present for offset pagination; optional for cursor
- [ ] `links` URLs are absolute (not relative)
- [ ] `null` values are used for unavailable links (prev on first page)
- [ ] Pagination metadata is tested with a pagination metadata test suite
- [ ] Implement Pagination Metadata Design following response-structures patterns
- [ ] Configure all required settings for Pagination Metadata Design
- [ ] Register route/middleware/service for Pagination Metadata Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] `COUNT(*)` on large InnoDB tables requires a full index scan â€” the dominant cost in paginated responses.
- [ ] Cursor pagination has constant query cost regardless of position â€” no deep-page slowdown.
- [ ] `from`/`to` are derived from the page's sliced collection â€” no separate query cost.
- [ ] Pagination metadata is typically <200 bytes â€” transport cost is negligible compared to compute cost.

---

# Security Checklist

- [ ] `total` exposes the size of the filtered dataset â€” may be sensitive for some queries.
- [ ] Unbounded `per_page` can be used for denial-of-service â€” always enforce a maximum.
- [ ] Page numbers can be used to enumerate resources â€” ensure authorization filters apply before pagination.
- [ ] Cursor values should be opaque â€” never expose raw database IDs as cursors.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Paginated responses include `meta` with pagination fields and `links` with navigation URLs.
- [ ] `total` is present only when `LengthAwarePaginator` is used.
- [ ] `per_page` is capped at the configured maximum.
- [ ] `page` parameter is capped to `last_page` to prevent out-of-range queries.
- [ ] Integration tests verify pagination metadata shape and navigation links correctness.
- [ ] Write feature tests for happy path of Pagination Metadata Design
- [ ] Write feature tests for validation failure of Pagination Metadata Design
- [ ] Write feature tests for authentication failure of Pagination Metadata Design
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

- [ ] Avoid: Returning Total for Cursor Pagination
- [ ] Avoid: Missing has_more for Cursor
- [ ] Avoid: Including All Fields (current_page, last_page) for Cursor
- [ ] Avoid: Inconsistent Metadata Across Pagination Methods
- [ ] Avoid: Metadata That Duplicates HTTP Headers

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
- Rule 1: Match Paginator Type to Use Case
- Rule 2: Always Enforce a Maximum `per_page`
- Rule 3: Never Expose Raw Paginator Output Directly
- Rule 4: Always Include Standardized Pagination Fields in `meta`
- Rule 5: Standardize Pagination Field Names Across All Endpoints
- Rule 6: Document Whether `total` Is Available
- Rule 7: Include Navigation Links in Paginated Responses

### Decisions
- Paginator Type Selection
- `total` Field Inclusion Strategy
- Field Name Standardization

### Anti-Patterns
- Returning Total for Cursor Pagination
- Missing has_more for Cursor
- Including All Fields (current_page, last_page) for Cursor
- Inconsistent Metadata Across Pagination Methods
- Metadata That Duplicates HTTP Headers

## Related Knowledge
- Prerequisites
- Related
- Advanced



