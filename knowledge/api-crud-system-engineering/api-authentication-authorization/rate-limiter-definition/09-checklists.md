# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-authentication-authorization
**Knowledge Unit:** Rate Limiter Definition
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Rate Limiter Definition implementation follows api-authentication-authorization patterns
- [ ] All edge cases handled for Rate Limiter Definition
- [ ] Full test coverage for Rate Limiter Definition
- [ ] Security review completed for Rate Limiter Definition
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Rate Limiter Definition

---

# Architecture Checklist

- [ ] Define limiters in `AppServiceProvider::boot()` or a dedicated `RateLimiterServiceProvider`.
- [ ] Apply via `throttle:limiter-name` middleware on route groups.
- [ ] Rate limiting runs early in the middleware stack â€” before controllers, auth, and DB queries.
- [ ] For Octane + Redis, use `ThrottleRequestsWithRedis` for optimized atomic operations.
- [ ] Evaluate: Named Limiters vs Inline Throttle Configuration
- [ ] Evaluate: Cache Backend Selection â€” Redis vs File/Database
- [ ] Evaluate: Single-Bucket vs Multi-Bucket Rate Limiting
- [ ] Evaluate: Consumer Key Strategy

---

# Implementation Checklist

- [ ] Rate limiters defined in `configureRateLimiting()`
- [ ] Different limits per auth tier (guest, authenticated, premium)
- [ ] `by()` uses unique identifier per consumer
- [ ] Per-endpoint limiters for sensitive operations
- [ ] Redis cache driver for distributed rate limiting
- [ ] Decay intervals configured per limiter
- [ ] 429 response with `Retry-After` header
- [ ] Rate limit hits logged for abuse detection
- [ ] Limiters applied to route groups via `throttle:` middleware
- [ ] Tests verify rate limit enforcement
- [ ] Implement Rate Limiter Definition following api-authentication-authorization patterns
- [ ] Configure all required settings for Rate Limiter Definition
- [ ] Register route/middleware/service for Rate Limiter Definition
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Redis INCR + EXPIRE is O(1) â€” handles 100K+ ops/second on modest hardware.
- [ ] Multi-bucket limits make N cache calls (N buckets). Use Redis pipelining for high throughput.
- [ ] Keys should auto-expire (TTL = decay window + 10% buffer) to prevent Redis memory exhaustion.
- [ ] Fixed window can allow 2X traffic at boundaries. For strict limits, implement sliding window with Redis sorted sets.

---

# Security Checklist

- [ ] Redis outage causes rate limiting to fail open (all requests pass). Implement circuit breaker or fail-closed fallback.
- [ ] Key collisions can cause cross-endpoint rate limiting. Include endpoint prefix in keys.
- [ ] `perMinute(0)` blocks all requests â€” use only for intentional blocking. Use `PHP_INT_MAX` for effectively unlimited.
- [ ] Cache stampede at window reset: all clients hit boundary simultaneously. Use sliding window or staggered TTLs.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Rate Limiter Definition
- [ ] Write feature tests for validation failure of Rate Limiter Definition
- [ ] Write feature tests for authentication failure of Rate Limiter Definition
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
- Use Named Limiters Instead of Inline throttle:60,1
- Always Include a Consumer Key in Every Limiter
- Define Limiters in Service Provider Boot Method
- Example
- Return New Limit Instances, Never Reuse
- Use Redis as Cache Backend, Never File
- Use Multi-Bucket Limits for Burst + Sustain Protection
- Never Use perMinute(0) â€” Use PHP_INT_MAX for Unlimited
- Use Composite Keys with Endpoint Prefix
- Implement Fail-Open Protection for Redis Outages
- Clear Rate Limit State Between Tests

### Decisions
- Named Limiters vs Inline Throttle Configuration
- Cache Backend Selection â€” Redis vs File/Database
- Single-Bucket vs Multi-Bucket Rate Limiting
- Consumer Key Strategy

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced
- Cross-Domain



