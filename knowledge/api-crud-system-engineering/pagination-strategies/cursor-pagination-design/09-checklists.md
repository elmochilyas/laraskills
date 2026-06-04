# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Cursor Pagination Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Cursor Pagination Design implementation follows pagination-strategies patterns
- [ ] All edge cases handled for Cursor Pagination Design
- [ ] Full test coverage for Cursor Pagination Design
- [ ] Security review completed for Cursor Pagination Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Cursor Pagination Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Design the composite index before implementing cursor pagination â€” the index must match the ORDER BY clause exactly.
- [ ] Use Laravel's `cursorPaginate()` for automatic cursor encoding, WHERE clause construction, and has_more detection.
- [ ] Keep cursor content to the minimum: only the sort column values needed for the WHERE clause.
- [ ] For public APIs, consider signing or encrypting cursors to prevent tampering and enumeration.
- [ ] Document that cursor pagination has no `last_page` and no random access â€” clients must paginate sequentially.
- [ ] Evaluate: Cursor vs Offset Decision
- [ ] Evaluate: Tiebreaker Column Decision

---

# Implementation Checklist

- [ ] Cursor is decoded, validated, and authorized against allowed columns
- [ ] WHERE clause uses indexed column for fast lookup
- [ ] `per_page + 1` strategy detects next page without COUNT query
- [ ] NULL sort values are handled (cursor pagination works poorly with nulls)
- [ ] Direction is consistently applied to both WHERE and ORDER BY
- [ ] Cursor refreshes with each page (not tied to a fixed snapshot)
- [ ] API returns `next_cursor` and optionally `prev_cursor`
- [ ] Implement Cursor Pagination Design following pagination-strategies patterns
- [ ] Configure all required settings for Cursor Pagination Design
- [ ] Register route/middleware/service for Cursor Pagination Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Cursor pagination delivers O(1) performance at any depth because it uses index range scans, not scan-and-discard.
- [ ] The key requirement is a composite index matching the ORDER BY columns; without it, cursor queries fall back to full table scans.
- [ ] LIMIT+1 overhead is negligible (one additional index leaf-page read, ~0.01ms).
- [ ] Cursor decode cost (base64 + JSON) is sub-millisecond and not a performance concern.
- [ ] Cursor pagination benefits from sequential read-ahead in the buffer pool, unlike offset pagination's scattered reads.

---

# Security Checklist

- [ ] Plain base64 cursors can be decoded by clients â€” do not include sensitive data (user IDs, roles, email addresses).
- [ ] If the cursor encodes data the client should not control (e.g., authorization scope), sign or encrypt the cursor.
- [ ] Sequential or predictable cursors enable record enumeration; use opaque tokens with multiple fields.
- [ ] Always validate cursor format on decode; return 400 for malformed or tampered cursors.
- [ ] Cursor pointing to deleted records should return `data: [], has_more: false`, not an error.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Composite index on ORDER BY columns exists before deploying cursor pagination
- [ ] Execution plan shows Index Range Scan (not Seq Scan) for cursor queries
- [ ] Tiebreaker column (primary key) is included in ORDER BY and cursor WHERE clause
- [ ] LIMIT+1 pattern correctly detects has_more (fetch, count, exclude extra, return)
- [ ] Malformed or tampered cursors return HTTP 400 with clear error message
- [ ] Cursor pointing to deleted records returns `data: [], has_more: false` (not 404 or error)
- [ ] Bidirectional pagination works correctly (prev_cursor returns expected results)
- [ ] No `page` or `offset` parameters are exposed when using cursor pagination
- [ ] All paginated endpoints using cursor strategy return consistent response structure
- [ ] Write feature tests for happy path of Cursor Pagination Design
- [ ] Write feature tests for validation failure of Cursor Pagination Design
- [ ] Write feature tests for authentication failure of Cursor Pagination Design
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

- [ ] Avoid: Exposing Both page and cursor Parameters
- [ ] Avoid: Including Sensitive Data in Plaintext Cursors
- [ ] Avoid: Changing Sort Order Without Invalidating Cursors
- [ ] Avoid: Using Cursor Pagination Without Supporting Index
- [ ] Avoid: No Tiebreaker Column in Sort

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
- Always Include a Tiebreaker Column
- Use cursorPaginate() Over Manual Cursor Construction
- Expose Only Cursor Parameters, Not Page Numbers
- Return Both next_cursor and prev_cursor in Responses
- Use has_more Boolean Instead of Total Count
- Validate Cursor Format on Every Request
- Design Index Before Implementing Cursor Pagination
- Handle Cursor Pointing to Deleted Records Gracefully
- Keep Cursor Content Minimal

### Decisions
- Cursor vs Offset Decision
- Tiebreaker Column Decision

### Anti-Patterns
- Exposing Both page and cursor Parameters
- Including Sensitive Data in Plaintext Cursors
- Changing Sort Order Without Invalidating Cursors
- Using Cursor Pagination Without Supporting Index
- No Tiebreaker Column in Sort

## Related Knowledge
- Offset Pagination Design â€” Understanding the problems cursor pagination solves
- Cursor Encoding Strategies â€” Security and format choices for cursors
- Keyset Pagination Design â€” SQL-only equivalent of cursor pagination
- Multi-Column Cursor Pagination â€” Handling complex sort orders with composite cursors



