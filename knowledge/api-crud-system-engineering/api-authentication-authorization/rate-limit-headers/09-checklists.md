# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-authentication-authorization
**Knowledge Unit:** Rate Limit Headers
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Rate Limit Headers implementation follows api-authentication-authorization patterns
- [ ] All edge cases handled for Rate Limit Headers
- [ ] Full test coverage for Rate Limit Headers
- [ ] Security review completed for Rate Limit Headers
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Rate Limit Headers

---

# Architecture Checklist

- [ ] Laravel's `ThrottleRequests` middleware automatically sets `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`.
- [ ] For multi-bucket limits, Laravel sends headers for the most restrictive bucket. Use custom middleware for per-bucket transparency.
- [ ] NTP-sync all servers to ensure Reset values are consistent across instances.
- [ ] For Octane, use `ThrottleRequestsWithRedis` for Redis-optimized atomic operations.
- [ ] Evaluate: Header Naming Convention â€” X-RateLimit-* vs RateLimit-*
- [ ] Evaluate: Reset Timestamp Format â€” Unix Epoch vs ISO 8601
- [ ] Evaluate: Multi-Bucket Header Computation Strategy

---

# Implementation Checklist

- [ ] `X-RateLimit-Limit` on all rate-limited responses
- [ ] `X-RateLimit-Remaining` on all rate-limited responses
- [ ] `X-RateLimit-Reset` Unix timestamp on all rate-limited responses
- [ ] `Retry-After` on 429 responses
- [ ] Headers on success responses, not just 429
- [ ] Header values accurate (limit, remaining, reset match config)
- [ ] Rate limiter response callback configured
- [ ] Tests verify header values and decrement behavior
- [ ] Header consistency across different limiters
- [ ] Retry-After computed correctly from remaining time
- [ ] Implement Rate Limit Headers following api-authentication-authorization patterns
- [ ] Configure all required settings for Rate Limit Headers
- [ ] Register route/middleware/service for Rate Limit Headers
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Setting headers on an already-built response object has zero measurable cost.
- [ ] Calculating Reset is a single `time() + availableIn` call â€” negligible.
- [ ] Multi-bucket limits compute the minimum `availableIn` across buckets â€” O(n) for n buckets.

---

# Security Checklist

- [ ] Clock skew causes Reset timestamps in the past. Clamp to `time() + 1` minimum.
- [ ] Stripped by reverse proxies (Nginx, Cloudflare). Configure pass-through or use standard `RateLimit-*` headers.
- [ ] Headers reveal rate limit capacity. Acceptable for public APIs but consider hiding for internal APIs.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Rate Limit Headers
- [ ] Write feature tests for validation failure of Rate Limit Headers
- [ ] Write feature tests for authentication failure of Rate Limit Headers
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

- [ ] Avoid tight coupling between layers
- [ ] Avoid business logic in controllers
- [ ] Avoid skipping validation layers

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
- Always Return Rate Limit Headers on Every Rate-Limited Endpoint
- Use Absolute Unix Timestamps for X-RateLimit-Reset
- Always Include Retry-After on 429 Responses
- Expose Rate Limit Headers via CORS for Browser Clients
- Include X-RateLimit-Remaining: 0 in 429 Responses
- Never Strip Rate Limit Headers at Reverse Proxy
- Support Both X-RateLimit-* and RateLimit-* (RFC 9213) Headers
- Use 64-Bit PHP to Prevent 2038 Integer Overflow

### Decisions
- Header Naming Convention â€” X-RateLimit-* vs RateLimit-*
- Reset Timestamp Format â€” Unix Epoch vs ISO 8601
- Multi-Bucket Header Computation Strategy

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced
- Cross-Domain



