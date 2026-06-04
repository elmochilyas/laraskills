# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-authentication-authorization
**Knowledge Unit:** Rate Limiting by Auth Tier
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Rate Limiting by Auth Tier implementation follows api-authentication-authorization patterns
- [ ] All edge cases handled for Rate Limiting by Auth Tier
- [ ] Full test coverage for Rate Limiting by Auth Tier
- [ ] Security review completed for Rate Limiting by Auth Tier
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Rate Limiting by Auth Tier

---

# Architecture Checklist

- [ ] Define separate named limiters per tier or a single limiter with dynamic limits based on tier.
- [ ] Rate limiting middleware runs before controllers â€” rejected requests never hit business logic.
- [ ] For multi-bucket tier limits, the most restrictive bucket governs.
- [ ] Use Redis-backed rate limiting for atomic INCR + EXPIRE across tiers.
- [ ] Override limits per customer via database lookup for enterprise clients.
- [ ] Evaluate: Tier Detection Layer â€” Middleware vs Controller
- [ ] Evaluate: Identifier Strategy per Tier â€” IP vs User ID
- [ ] Evaluate: Single Dynamic Limiter vs Separate Named Limiters per Tier

---

# Implementation Checklist

- [ ] Named limiters per tier defined
- [ ] Guest limiter uses IP identifier
- [ ] Authenticated limiter uses user ID identifier
- [ ] Premium limiter with higher limit defined
- [ ] Dynamic limiter selection based on auth+tier
- [ ] Authenticated users matched to their tier, not guest
- [ ] 429 response with `Retry-After` and `X-RateLimit-Tier` headers
- [ ] Rate limit events logged per tier
- [ ] Tests verify rate limits per tier
- [ ] Tier identification logic documented
- [ ] Implement Rate Limiting by Auth Tier following api-authentication-authorization patterns
- [ ] Configure all required settings for Rate Limiting by Auth Tier
- [ ] Register route/middleware/service for Rate Limiting by Auth Tier
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Each rate-limited request performs one Redis INCR operation â€” sub-millisecond.
- [ ] Multi-bucket limits generate separate cache calls per bucket. Use Redis pipelining.
- [ ] Rate limit keys should include timestamp component to prevent unbounded Redis key growth.
- [ ] Redis TTL auto-expires old keys. Set TTL = window duration + 1 minute.

---

# Security Checklist

- [ ] Rate limit health check endpoints (should always respond â€” exempt from limits).
- [ ] Tier misclassification due to token validation failure defaults to guest, not bypass.
- [ ] Key collision risk: prefix keys with type (`guest:`, `user:`, `service:`, `premium:`).
- [ ] Cache outage causes fail-open (unlimited requests). Implement circuit breaker.
- [ ] Shared IP abuse: corporate NAT users blocked indiscriminately at guest tier. Encourage authentication.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Rate Limiting by Auth Tier
- [ ] Write feature tests for validation failure of Rate Limiting by Auth Tier
- [ ] Write feature tests for authentication failure of Rate Limiting by Auth Tier
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
- Detect Tier in Middleware, Not Controllers
- Use IP for Guests, User ID for Authenticated
- Always Include X-RateLimit-Tier in Response Headers
- Fall Back to Guest Tier on Authentication Failure
- Exempt Health Check and Monitoring Endpoints
- Publish Exact Tier Limits in API Documentation
- Prefix Rate Limit Keys with Tier to Prevent Collision
- Provide Graceful 429 Response with Upgrade Path
- Allow Per-Customer Override for Enterprise Clients

### Decisions
- Tier Detection Layer â€” Middleware vs Controller
- Identifier Strategy per Tier â€” IP vs User ID
- Single Dynamic Limiter vs Separate Named Limiters per Tier

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced
- Cross-Domain



