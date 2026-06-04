# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** rest-api-design
**Knowledge Unit:** Conditional Requests
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Conditional Requests implementation follows rest-api-design patterns
- [ ] All edge cases handled for Conditional Requests
- [ ] Full test coverage for Conditional Requests
- [ ] Security review completed for Conditional Requests
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Conditional Requests
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Cache validation (GET + If-None-Match â†’ 304) and optimistic concurrency (PUT + If-Match â†’ 412) are separate concerns with different implementations.
- [ ] `SetCacheHeaders` middleware handles GET ETag generation. For write endpoints, implement custom middleware or handle in the controller.
- [ ] Always `fresh()` the model before attaching ETag to write responses â€” otherwise the returned ETag matches the old state.
- [ ] Strong ETags change when response formatting changes (e.g., adding a field). This is correct â€” representation changed, so clients should re-fetch.
- [ ] In multi-datacenter deployments, prefer ETags over Last-Modified to avoid clock synchronization issues.
- [ ] Evaluate: ETag vs Last-Modified for Conditional Requests
- [ ] Evaluate: Optimistic Concurrency for Write Endpoints
- [ ] Evaluate: ETag Computation Strategy

---

# Implementation Checklist

- [ ] ETag header on cacheable GET responses
- [ ] Last-Modified header on cacheable GET responses
- [ ] 304 for matching If-None-Match
- [ ] 304 for matching If-Modified-Since
- [ ] 200 for non-matching conditions
- [ ] 304 has no body
- [ ] Conditional support for GET/HEAD only
- [ ] Cache-Control headers present
- [ ] Tests cover match and non-match
- [ ] Implement Conditional Requests following rest-api-design patterns
- [ ] Configure all required settings for Conditional Requests
- [ ] Register route/middleware/service for Conditional Requests
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] MD5 hash of full response body: ~1-5Âµs per KB. For 100KB responses, this adds measurable time.
- [ ] Model-timestamp ETag: ~0.01ms â€” negligible. Prefer this over full-content hashing.
- [ ] 304 responses save ~99% of response bandwidth when content is unchanged.
- [ ] ETags must be recomputed on every request â€” cache computed ETags in Redis for resources with expensive computation.

---

# Security Checklist

- [ ] Never trust client-supplied ETags for write operations without validation against current server state.
- [ ] Weak ETags can cause false positives in monitoring systems that check exact response equality.
- [ ] 412 responses should include the current ETag and resource state â€” never expose internal version identifiers or database state.
- [ ] ETag computation from user-controlled fields must be consistent â€” a field change must change the ETag regardless of authorization context.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every GET response includes `ETag` and/or `Last-Modified` headers.
- [ ] `If-None-Match` requests return 304 when resource is unchanged.
- [ ] PUT/PATCH/DELETE with `If-Match` return 412 when resource has been modified.
- [ ] 412 responses include the current ETag and resource state.
- [ ] ETag changes when resource representation changes.
- [ ] `Vary` header is set correctly for content-negotiated responses.
- [ ] Write feature tests for happy path of Conditional Requests
- [ ] Write feature tests for validation failure of Conditional Requests
- [ ] Write feature tests for authentication failure of Conditional Requests
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

- [ ] Avoid: ETag as Security Token
- [ ] Avoid: Stateless ETag Without Cache
- [ ] Avoid: Stale ETag After Write
- [ ] Avoid: If-Match on Every Endpoint
- [ ] Avoid: Ignoring If-None-Match for Conditional GET

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
- Compute ETags From Model Timestamps
- Return ETag and Last-Modified On Every GET Response
- Use If-Match For Write Endpoints With Concurrent Modification Risk
- Include Current ETag In 412 Response Body
- Refresh Model Before Setting ETag After Write
- Apply Conditional Logic To HEAD Requests
- Set Vary Header For Content-Negotiated Responses
- Avoid ETags On POST Endpoints
- Cache Computed ETags In Redis For Expensive Resources
- Use Weak ETags For JSON Responses

### Decisions
- ETag vs Last-Modified for Conditional Requests
- Optimistic Concurrency for Write Endpoints
- ETag Computation Strategy

### Anti-Patterns
- ETag as Security Token
- Stateless ETag Without Cache
- Stale ETag After Write
- If-Match on Every Endpoint
- Ignoring If-None-Match for Conditional GET

## Related Knowledge
- Prerequisites
- Related
- Advanced



