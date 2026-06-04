# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Response Compression
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Response Compression implementation follows response-structures patterns
- [ ] All edge cases handled for Response Compression
- [ ] Full test coverage for Response Compression
- [ ] Security review completed for Response Compression
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Response Compression
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Prefer server-level compression (Nginx, Caddy, HAProxy) â€” it offloads compression from PHP, keeps code simple, and prevents double-compression.
- [ ] If using application-level compression, use middleware that checks `Accept-Encoding` and applies compression selectively.
- [ ] Generate ETags on the uncompressed body, then compress â€” compressed bytes differ from uncompressed bytes, and ETags should represent content identity, not wire format.
- [ ] Cache the compressed response body rather than compressing on every cache hit â€” eliminates repeated compression CPU cost.
- [ ] In CDN architectures (Cloudflare, Fastly), send uncompressed content from origin and let the CDN handle compression at the edge.
- [ ] For Laravel Vapor (Lambda + API Gateway), compression is handled by API Gateway or CloudFront automatically â€” no application code changes needed.
- [ ] Evaluate: Compression Layer: Server vs Application
- [ ] Evaluate: Compression Algorithm and Level Selection
- [ ] Evaluate: BREACH Attack Mitigation

---

# Implementation Checklist

- [ ] `Content-Encoding` header is set on compressed responses
- [ ] `Vary: Accept-Encoding` header is set for cache correctness
- [ ] Responses under threshold (1KB) are not compressed
- [ ] SSE and streaming endpoints are excluded from compression
- [ ] Nginx/apache compression is enabled with sensible buffer sizes
- [ ] Brotli is preferred over gzip when both are supported
- [ ] Compression ratio is monitored (expect 5-10x for JSON)
- [ ] No double compression (application + web server both compressing)
- [ ] Implement Response Compression following response-structures patterns
- [ ] Configure all required settings for Response Compression
- [ ] Register route/middleware/service for Response Compression
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Compression reduces bandwidth by 70-90% but increases CPU usage by 5-10% for gzip level 5.
- [ ] A 10KB response compresses in ~0.5ms; a 1MB response compresses in ~50ms at gzip level 5.
- [ ] gzip uses ~256KB memory per compression stream. At 256 concurrent requests, that's 64MB for compression buffers.
- [ ] Client decompression is 2-5x faster than compression â€” the time saved from downloading less data usually outweighs decompression time.
- [ ] Cached compressed responses avoid re-compression entirely â€” CPU cost is eliminated on cache hits.

---

# Security Checklist

- [ ] **BREACH attack**: Compression combined with user-controlled input in responses enables BREACH attacks. Disable compression for endpoints that include user secrets in the response body (CSRF tokens, session IDs).
- [ ] Double compression wastes CPU and can corrupt payloads â€” ensure only one layer handles compression.
- [ ] Legacy HTTP clients may not handle `Content-Encoding` â€” check `Accept-Encoding` before compressing and skip if unsupported.
- [ ] Monitor compression ratios per endpoint â€” a dropping ratio may indicate content-type changes or misconfiguration.
- [ ] During development, use `Accept-Encoding: identity` to inspect uncompressed response bodies.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] `Content-Encoding: gzip` or `Content-Encoding: br` is present in response headers when `Accept-Encoding` includes the algorithm.
- [ ] `Content-Encoding: identity` (or absent) for responses under 1KB.
- [ ] No double compression â€” response can be decompressed correctly once.
- [ ] JSON content types (`application/json`, `application/vnd.api+json`, `application/problem+json`) are compressed.
- [ ] Compression ratio is 70-90% for typical JSON responses.
- [ ] Endpoints with streaming responses (SSE, WebSocket) are not compressed.
- [ ] BREACH-vulnerable endpoints (user input + secrets in response) have compression disabled.
- [ ] Write feature tests for happy path of Response Compression
- [ ] Write feature tests for validation failure of Response Compression
- [ ] Write feature tests for authentication failure of Response Compression
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

- [ ] Avoid: No Compression on Large Responses
- [ ] Avoid: Compressing Already-Compressed Data
- [ ] Avoid: Compression Without Content-Type Check
- [ ] Avoid: Missing Accept-Encoding Handling
- [ ] Avoid: Compression Level Too High

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
- Rule 1: Compress at the Server Level, Not Application Level
- Rule 2: Add JSON Content Types to Compression Configuration
- Rule 3: Set a Compression Threshold of at Least 1KB
- Rule 4: Use gzip Compression Level 5-6
- Rule 5: Generate ETags on Uncompressed Content
- Rule 6: Disable Compression on BREACH-Vulnerable Endpoints
- Rule 7: Verify Compression with curl Before Deploying

### Decisions
- Compression Layer: Server vs Application
- Compression Algorithm and Level Selection
- BREACH Attack Mitigation

### Anti-Patterns
- No Compression on Large Responses
- Compressing Already-Compressed Data
- Compression Without Content-Type Check
- Missing Accept-Encoding Handling
- Compression Level Too High

## Related Knowledge
- Prerequisites
- Related
- Advanced



