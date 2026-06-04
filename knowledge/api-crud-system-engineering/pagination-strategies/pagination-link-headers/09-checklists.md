# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Pagination Link Headers
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pagination Link Headers implementation follows pagination-strategies patterns
- [ ] All edge cases handled for Pagination Link Headers
- [ ] Full test coverage for Pagination Link Headers
- [ ] Security review completed for Pagination Link Headers
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Pagination Link Headers
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use `LengthAwarePaginator::toHeader()` in Laravel for automatic Link header generation with offset pagination.
- [ ] For cursor pagination, manually construct Link headers with only `prev` and `next`.
- [ ] Include link headers as a complement to body metadata, not a replacement.
- [ ] Test with target client libraries to ensure Link headers are parsed correctly.
- [ ] For APIs with long cursor values, consider body-only links to avoid header truncation.
- [ ] Evaluate: Link Header Inclusion Strategy
- [ ] Evaluate: Query Parameter Preservation Decision

---

# Implementation Checklist

- [ ] Link header with first, last, prev, next rel values
- [ ] RFC 5988 formatted URLs
- [ ] Absolute URLs
- [ ] Query parameters preserved
- [ ] Null rel values omitted
- [ ] Link header on all paginated responses
- [ ] Documented for consumer usage
- [ ] Implement Pagination Link Headers following pagination-strategies patterns
- [ ] Configure all required settings for Pagination Link Headers
- [ ] Register route/middleware/service for Pagination Link Headers
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Link header parsing is negligible â€” microseconds at most.
- [ ] Link headers add ~100-300 bytes to response headers; insignificant for most APIs.
- [ ] If the `Link` header changes between requests (new cursor values), ensure CDN cache keys include pagination parameters.
- [ ] For high-throughput microservices where every byte counts, consider body-only links.

---

# Security Checklist

- [ ] Link header URLs expose the API structure and parameter naming â€” ensure they don't leak sensitive information.
- [ ] Cursors in link header URLs may expose record ordering or timing data.
- [ ] Ensure link URLs use HTTPS to prevent man-in-the-middle manipulation of pagination navigation.
- [ ] Do not include session tokens, API keys, or authentication data in link header URLs.
- [ ] Validate incoming cursor/offset parameters from the request, even when clients follow link headers.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Link headers follow RFC 5988 format: `<URL>; rel="type"`
- [ ] All existing query parameters are preserved in link URLs
- [ ] Cursor pagination links omit `first` and `last`
- [ ] First page has no `prev` link; last page has no `next` link
- [ ] Special characters in URLs are percent-encoded
- [ ] Body metadata includes links as fallback (defensive pattern)
- [ ] Link headers are tested with target client libraries
- [ ] CDN/proxy stripping of Link headers has been accounted for
- [ ] URLs in Link headers use HTTPS
- [ ] Write feature tests for happy path of Pagination Link Headers
- [ ] Write feature tests for validation failure of Pagination Link Headers
- [ ] Write feature tests for authentication failure of Pagination Link Headers
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

- [ ] Avoid: Link Headers Only, No Body Fallback
- [ ] Avoid: Absolute URLs Mixed With Relative Paths
- [ ] Avoid: Not Encoding Special Characters in URLs
- [ ] Avoid: Including total in Headers Instead of Body
- [ ] Avoid: Generating Link Headers Without Base URL

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
- Include Links in Both Headers and Response Body
- Use RFC 5988 Format for Link Headers
- Preserve All Existing Query Parameters in Link URLs
- Omit first and last Links for Cursor Pagination
- Omit prev on First Page and next on Last Page
- Percent-Encode Special Characters in Link URLs
- Validate Link Header Format During Development
- Account for CDN/Proxy Stripping of Link Headers
- Ensure Link URLs Use HTTPS

### Decisions
- Link Header Inclusion Strategy
- Query Parameter Preservation Decision

### Anti-Patterns
- Link Headers Only, No Body Fallback
- Absolute URLs Mixed With Relative Paths
- Not Encoding Special Characters in URLs
- Including total in Headers Instead of Body
- Generating Link Headers Without Base URL

## Related Knowledge
- Offset Pagination Design â€” Page-based link structure
- Cursor Pagination Design â€” Cursor-based link structure
- HATEOAS and Hypermedia Controls â€” Link headers as hypermedia controls
- Response Structure and Metadata â€” Body-based pagination metadata



