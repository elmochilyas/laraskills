# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-lifecycle-governance
**Knowledge Unit:** Rate Limit Tier Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Rate Limit Tier Design implementation follows api-lifecycle-governance patterns
- [ ] All edge cases handled for Rate Limit Tier Design
- [ ] Full test coverage for Rate Limit Tier Design
- [ ] Security review completed for Rate Limit Tier Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Rate Limit Tier Design

---

# Architecture Checklist

- [ ] Redis backend for atomic rate limit operations (INCR + EXPIRE or Lua scripts for token bucket).
- [ ] Burst = 2x sustained rate for max 10 seconds.
- [ ] Quota resets per billing cycle. Stagger resets by consumer ID hash to avoid thundering herd.
- [ ] Tier override for testing/incident response by admin.
- [ ] Circuit breaker: fall back to local in-memory limiting if Redis unavailable.
- [ ] Global tier limit + per-endpoint sub-limits.

---

# Implementation Checklist

- [ ] Minimum three consumer tiers defined (Free/Pro/Enterprise)
- [ ] Hybrid sliding window + token bucket algorithm
- [ ] Rate limit headers on all responses (not just 429)
- [ ] Retry-After header on every 429 response
- [ ] Per-endpoint sub-limits configured
- [ ] Quota resets staggered by consumer ID hash
- [ ] Redis circuit breaker with local in-memory fallback
- [ ] Implement Rate Limit Tier Design following api-lifecycle-governance patterns
- [ ] Configure all required settings for Rate Limit Tier Design
- [ ] Register route/middleware/service for Rate Limit Tier Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Redis rate limit check: ~2ms per request (INCR + EXPIRE).
- [ ] Sliding window log uses O(window size) memory per consumer.
- [ ] Token bucket requires periodic refill â€” use Redis Lua scripts for atomic refill + consumption.
- [ ] Rate limit header computation is negligible.

---

# Security Checklist

- [ ] Rate limits are a resource protection mechanism, not authentication. Authenticated consumers still need rate limiting.
- [ ] Free tier limits prevent abuse from malicious actors.
- [ ] Monitor 429 rates globally and per consumer for abuse patterns.
- [ ] Burst allowance can be abused â€” cap at reasonable multiplier.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Rate Limit Tier Design
- [ ] Write feature tests for validation failure of Rate Limit Tier Design
- [ ] Write feature tests for authentication failure of Rate Limit Tier Design
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
- Rule 1: Define Minimum Three Consumer Tiers
- Rule 2: Use Hybrid Sliding Window + Token Bucket
- Rule 3: Include Rate Limit Headers on All Responses
- Rule 4: Return Retry-After on Every 429 Response
- Rule 5: Implement Per-Endpoint Sub-Limits
- Rule 6: Stagger Quota Resets by Consumer Hash
- Rule 7: Implement Redis Circuit Breaker with Local Fallback

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



