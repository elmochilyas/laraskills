# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Cursor Pagination Metadata
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Cursor Pagination Metadata implementation follows response-structures patterns
- [ ] All edge cases handled for Cursor Pagination Metadata
- [ ] Full test coverage for Cursor Pagination Metadata
- [ ] Security review completed for Cursor Pagination Metadata
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Cursor Pagination Metadata
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Cursor column must be unique and monotonically increasing/decreasing â€” `id` is the safest choice, `created_at` requires a primary key tiebreaker.
- [ ] For composite sorting, encode all sort column values in the cursor so the paginator can reconstruct the WHERE clause.
- [ ] Decide cursor expiration policy â€” time-limited cursors prevent stale pagination; indefinitely valid cursors simplify client logic.
- [ ] For bidirectional pagination, implement both `next_cursor` and `prev_cursor`. Clients must store the cursor from the previous request.
- [ ] Handle deleted cursor references gracefully â€” find the nearest remaining record rather than returning an empty page or 404.
- [ ] Evaluate: Cursor Metadata Field Selection
- [ ] Evaluate: Cursor Encoding and Security Strategy
- [ ] Evaluate: Sort Column Uniqueness and Tiebreaker Selection

---

# Implementation Checklist

- [ ] `next_cursor` is present (opaque string or null)
- [ ] `prev_cursor` is present (opaque string or null on first page)
- [ ] `per_page` in meta matches the request or default
- [ ] `total` is included only if calculated and documented as approximate
- [ ] `data` is an array (empty array for no results)
- [ ] `links.next` URL includes the encoded cursor
- [ ] `links.prev` is null on first page
- [ ] `next_cursor` is null on last page
- [ ] Cursor format is consistent across all pages
- [ ] Response structure matches offset pagination envelope for client consistency
- [ ] Implement Cursor Pagination Metadata following response-structures patterns
- [ ] Configure all required settings for Cursor Pagination Metadata
- [ ] Register route/middleware/service for Cursor Pagination Metadata
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Constant query cost regardless of position â€” no offset drift that makes deep pages expensive.
- [ ] Index utilization is ideal: `WHERE id > ? ORDER BY id LIMIT ?` uses the primary key or sort index efficiently.
- [ ] Eliminates `SELECT COUNT(*)`, the dominant cost in page-based pagination for large tables.
- [ ] Extra-record detection (`per_page + 1`) adds minimal overhead â€” the extra record is discarded but counted toward query result size.
- [ ] Cursor encoding/decoding adds ~50 bytes per navigation URL and negligible CPU time.

---

# Security Checklist

- [ ] Never expose raw database IDs as cursors â€” always encode (base64, encrypted, or HMAC-signed).
- [ ] Invalid/tampered cursors should return 422 Unprocessable Entity, not 500 Internal Server Error.
- [ ] Encrypt or HMAC-sign cursors containing sensitive sort column values to prevent client tampering.
- [ ] Without total counts, clients cannot estimate how many requests are needed to consume all results â€” rate limiting protects against runaway pagination.
- [ ] Document that cursor values are opaque strings; clients must not construct or interpret cursors.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every cursor-paginated response includes `next_cursor`, `prev_cursor`, `path`, `per_page`, and `has_more` in the meta object.
- [ ] Cursor values are opaque base64-encoded strings, never raw database IDs.
- [ ] Pagination queries use `WHERE sort_column > ? ORDER BY sort_column LIMIT ?` â€” verified via query log.
- [ ] Passing a valid cursor returns the correct next/previous page of data without duplicates or gaps.
- [ ] Invalid cursors return 422 Unprocessable Entity.
- [ ] Admin/navigation endpoints that need page numbers use offset pagination instead.
- [ ] Write feature tests for happy path of Cursor Pagination Metadata
- [ ] Write feature tests for validation failure of Cursor Pagination Metadata
- [ ] Write feature tests for authentication failure of Cursor Pagination Metadata
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

- [ ] Avoid: Including Total in Cursor Responses
- [ ] Avoid: Missing has_more Flag
- [ ] Avoid: Exposing Raw Cursor Values
- [ ] Avoid: Inconsistent Cursor Metadata Keys
- [ ] Avoid: No Next Page URL

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
- Rule 1: Always Encode Cursors as Opaque Base64 Strings
- Rule 2: Use a Unique Sort Column with a Tiebreaker
- Rule 3: Always Include `has_more` in Every Cursor-Paginated Response
- Rule 4: Validate and Sanitize Incoming Cursors
- Rule 5: Never Rely on Total Count with Cursor Pagination
- Rule 6: Omit `prev_cursor` in Forward-Only Infinite Scroll UIs
- Rule 7: Include Sort Direction in the Cursor Payload

### Decisions
- Cursor Metadata Field Selection
- Cursor Encoding and Security Strategy
- Sort Column Uniqueness and Tiebreaker Selection

### Anti-Patterns
- Including Total in Cursor Responses
- Missing has_more Flag
- Exposing Raw Cursor Values
- Inconsistent Cursor Metadata Keys
- No Next Page URL

## Related Knowledge
- Prerequisites
- Related
- Advanced



