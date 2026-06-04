# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Zero-Result Pagination
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Zero-Result Pagination implementation follows pagination-strategies patterns
- [ ] All edge cases handled for Zero-Result Pagination
- [ ] Full test coverage for Zero-Result Pagination
- [ ] Security review completed for Zero-Result Pagination
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Zero-Result Pagination
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Ensure all pagination methods (paginate, simplePaginate, cursorPaginate) return consistent empty structures.
- [ ] Use Laravel's built-in behavior â€” these methods already return `data: []` on empty results.
- [ ] For custom pagination implementations, always return `data: []` (not null, not omitted).
- [ ] If distinguishing empty states matters for clients, include a `meta.reason` field (`"no_results"`, `"page_exceeds_total"`, `"cursor_depleted"`).
- [ ] Consider a pre-emptive existence check for expensive queries: `if (! Post::exists()) { return $this->emptyResponse(); }`.
- [ ] Evaluate: Empty Response Structure Decision
- [ ] Evaluate: Client Termination Strategy

---

# Implementation Checklist

- [ ] `data` is `[]` (empty array), not `null` or absent
- [ ] `total` is `0`
- [ ] `last_page` is `1` (not `0`)
- [ ] `current_page` matches requested page
- [ ] `per_page` matches requested per_page
- [ ] `prev` link is `null`
- [ ] `next` link is `null`
- [ ] `first` and `last` both point to page 1
- [ ] HTTP status is 200
- [ ] Cursor pagination: `next_cursor` is `null`
- [ ] Implement Zero-Result Pagination following pagination-strategies patterns
- [ ] Configure all required settings for Zero-Result Pagination
- [ ] Register route/middleware/service for Zero-Result Pagination
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Empty result queries still execute database queries â€” for offset pagination, this includes COUNT(*); for cursor, includes the data query.
- [ ] An out-of-range page (e.g., page 999999) with offset pagination still executes the expensive OFFSET query â€” validate page numbers.
- [ ] For genuinely empty datasets, consider caching the "empty" state to avoid repeated queries.
- [ ] Cursor pagination's has_more detection (LIMIT+1) still fetches rows even when the cursor points to the last record.

---

# Security Checklist

- [ ] Empty pages should never be distinguishable from "resource exists but restricted" â€” return the same structure for unauthorized empty results.
- [ ] Repeated out-of-range page requests may indicate scraping â€” log and rate-limit.
- [ ] The `total` count in empty page metadata can leak information â€” consider omitting for sensitive endpoints.
- [ ] Ensure empty responses don't expose internal state (e.g., "no records because deleted cursor" vs "no records ever existed").
- [ ] Consistent empty responses prevent attackers from probing data existence through pagination.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All paginated endpoints return `data: []` (not null, not omitted) for empty results
- [ ] HTTP status is 200 for empty pages (never 404, never 204)
- [ ] Empty offset pages include accurate meta (total, last_page, per_page)
- [ ] Empty cursor pages include `has_more: false` and `next_cursor: null`
- [ ] Client-side pagination loop checks `data.length === 0` or `has_more === false` to terminate
- [ ] meta.reason (if used) provides meaningful values for each empty type
- [ ] Out-of-range page requests are logged for monitoring
- [ ] Page number validation prevents excessively large offsets on empty pages
- [ ] Empty response structure is consistent across all endpoints
- [ ] Write feature tests for happy path of Zero-Result Pagination
- [ ] Write feature tests for validation failure of Zero-Result Pagination
- [ ] Write feature tests for authentication failure of Zero-Result Pagination
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

- [ ] Avoid: Empty Array Treated as Paginator
- [ ] Avoid: Inconsistent Empty Response Shape
- [ ] Avoid: Missing Meta on Empty Results
- [ ] Avoid: 404 Instead of Empty Paginator
- [ ] Avoid: Ignoring Empty State in Tests

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
- Always Return HTTP 200 With data: [] for Empty Pages
- Return Empty Array for data, Never Null or Omitted
- Include Accurate Metadata in Empty Responses
- Check has_more in Addition to Empty Data Array
- Document Empty-Page Behavior in API Reference
- Log Excessive Out-of-Range Page Requests
- Never Distinguish Empty Types With Different Status Codes
- Ensure Empty Cursor Responses Include has_more: false
- Consider Pre-emptive Existence Check for Expensive Queries

### Decisions
- Empty Response Structure Decision
- Client Termination Strategy

### Anti-Patterns
- Empty Array Treated as Paginator
- Inconsistent Empty Response Shape
- Missing Meta on Empty Results
- 404 Instead of Empty Paginator
- Ignoring Empty State in Tests

## Related Knowledge
- Offset Pagination Design â€” Page-based empty handling
- Cursor Pagination Design â€” Cursor-based empty handling
- API Error Handling â€” Distinguishing empty from error responses
- Per-Page Parameter Design â€” Page validation and empty page prevention
- Client-Side Pagination State Management â€” Handling empty states in frontend



