# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Rate Limit Error Responses
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Rate Limit Error Responses implementation follows error-handling-design patterns
- [ ] All edge cases handled for Rate Limit Error Responses
- [ ] Full test coverage for Rate Limit Error Responses
- [ ] Security review completed for Rate Limit Error Responses
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Rate Limit Error Responses
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Map `ThrottleRequestsException` in the handler with retry-after from exception headers.
- [ ] Include `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` in 429 responses.
- [ ] Include `X-RateLimit-Remaining` on every successful response via middleware.
- [ ] Use distinct error codes for different rate limiters (login, general API, premium).
- [ ] Always return Retry-After as integer seconds, never HTTP-date.
- [ ] Ensure Retry-After never exceeds a reasonable bound (max 3600 seconds).
- [ ] Reset rate-limit counters on deploy to avoid immediate post-deploy throttling.

---

# Implementation Checklist

- [ ] 429 returned for rate limit exceeded
- [ ] `Retry-After` header present with seconds
- [ ] Rate limit headers on all responses (limit, remaining, reset)
- [ ] Error code per rate limit tier
- [ ] Retry guidance in detail
- [ ] Rate limit hits logged for capacity planning
- [ ] Rate limit tested per tier
- [ ] Implement Rate Limit Error Responses following error-handling-design patterns
- [ ] Configure all required settings for Rate Limit Error Responses
- [ ] Register route/middleware/service for Rate Limit Error Responses
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Rate-limit check (cache hit) is O(1) â€” sub-millisecond with Redis.
- [ ] 429 response generation is identical to any other error response.
- [ ] The cache backend (Redis/Memcached) adds sub-millisecond latency.
- [ ] Header attachment on successful responses adds no measurable overhead.

---

# Security Checklist

- [ ] Never reveal exact rate limit window start/end in ways that time-shift attacks.
- [ ] Use different limiters for login and general API to prevent login brute force from blocking legitimate traffic.
- [ ] Log rate-limit hits with user ID, IP, and endpoint for abuse analysis.
- [ ] Monitor 429 rates: sustained high rates indicate misconfigured clients or DoS.
- [ ] Cache stampede: Use atomic increment (Redis INCR), not read-then-write.
- [ ] Distributed rate limiting requires a shared Redis backend.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All 429 responses include `Retry-After` header (integer seconds)
- [ ] All responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers
- [ ] Distinct rate limiters exist for login, general API, and premium endpoints
- [ ] Rate limiting is applied before authentication middleware
- [ ] Rate limits are configured per tier (guest, authenticated, premium)
- [ ] Shared Redis backend is used for distributed rate limiting
- [ ] Integration tests verify 429 shape and headers for rate-limited scenarios
- [ ] Write feature tests for happy path of Rate Limit Error Responses
- [ ] Write feature tests for validation failure of Rate Limit Error Responses
- [ ] Write feature tests for authentication failure of Rate Limit Error Responses
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

- [ ] Avoid: Returning 429 Without Retry-After
- [ ] Avoid: No X-RateLimit on Success Responses
- [ ] Avoid: Same Limiter for Login and API
- [ ] Avoid: Rate Limit After Auth
- [ ] Avoid: Header Name Inconsistency

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
- Always Include Retry-After Header as Integer Seconds in 429
- Include X-RateLimit Headers on ALL Responses, Not Just 429
- Use Distinct Rate Limiters for Login and General API
- Apply Rate Limiting Before Authentication Middleware
- Map ThrottleRequestsException to Distinct Error Codes per Limiter
- Mirror Retry Info in Response Body for Header-Restricted Clients
- Use Atomic Cache Operations for Rate Limit Counters
- Log Rate Limit Hits for Abuse Analysis
- Reset Rate Limit Counters on Deploy

### Anti-Patterns
- Returning 429 Without Retry-After
- No X-RateLimit on Success Responses
- Same Limiter for Login and API
- Rate Limit After Auth
- Header Name Inconsistency

## Related Knowledge
- Standardized Error Envelope
- Rate Limiting by Authentication Tier
- Rate Limiter Definition
- Rate Limit Headers
- Exception-to-Code Mapping (mapping ThrottleRequestsException)



