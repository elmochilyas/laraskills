# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Response Caching Headers
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Response Caching Headers implementation follows response-structures patterns
- [ ] All edge cases handled for Response Caching Headers
- [ ] Full test coverage for Response Caching Headers
- [ ] Security review completed for Response Caching Headers
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Response Caching Headers
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Apply cache headers via middleware, not per-controller. Cache-related middleware runs after authentication (to determine public vs. private) but before compression.
- [ ] Different resource types need different caching â€” reference data gets long `max-age`, user data gets `private, no-cache`.
- [ ] For endpoints supporting content negotiation, include `Vary: Accept` to prevent serving wrong content types from cache.
- [ ] Use `no-cache` for semantically correct freshness control â€” it means "always check with the server" not "don't cache."
- [ ] Collections where insertions shift content change ETag even if individual items haven't changed â€” factor collection volatility into caching strategy.
- [ ] Test in production that authenticated responses have `Cache-Control: private` and `Vary: Authorization`.
- [ ] Evaluate: Cache-Control Directive Selection
- [ ] Evaluate: ETag Generation Strategy
- [ ] Evaluate: Vary Header Strategy

---

# Implementation Checklist

- [ ] Cache-Control on all GET responses
- [ ] Public vs private scope correct
- [ ] max-age matches resource volatility
- [ ] Expires header present
- [ ] Vary header includes Accept and Authorization
- [ ] 4xx/5xx not cached
- [ ] Write endpoints excluded from cache
- [ ] Cache behavior documented
- [ ] Implement Response Caching Headers following response-structures patterns
- [ ] Configure all required settings for Response Caching Headers
- [ ] Register route/middleware/service for Response Caching Headers
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] ETag computation via model timestamp costs ~0.01ms â€” negligible compared to full serialization.
- [ ] 304 responses save 99% of response bandwidth compared to 200 with full payload.
- [ ] Proper `Cache-Control` directives increase cache hit ratios from 0% to 60-90% for read-heavy endpoints.
- [ ] Cache-control middleware adds ~0.01ms per request; ETag middleware adds ~0.05ms for hashing.
- [ ] Too many `Vary` headers fragment the cache into unusably small segments â€” keep `Vary` minimal.

---

# Security Checklist

- [ ] Authenticated responses must include `Cache-Control: private` to prevent shared cache contamination.
- [ ] Always include `Vary: Authorization` to prevent CDNs from serving authenticated responses to other users.
- [ ] Error responses (4xx/5xx) must not be cached â€” use `no-store` on error responses to prevent cache poisoning.
- [ ] ETag does not need to be cryptographically secure â€” it is a cache validator, not an integrity check.
- [ ] BREACH attack: If responses include user input alongside secrets (CSRF tokens), disable compression and consider cache implications.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every GET response includes an explicit `Cache-Control` header.
- [ ] Authenticated responses use `Cache-Control: private` and `Vary: Authorization`.
- [ ] ETags are set on GET/HEAD responses only â€” not on POST, PUT, PATCH, DELETE.
- [ ] 304 Not Modified responses are returned when `If-None-Match` matches the current ETag.
- [ ] Error responses (4xx/5xx) have `Cache-Control: no-store` or equivalent.
- [ ] Reference data endpoints have longer `max-age` than user-specific or frequently changing data.
- [ ] Write feature tests for happy path of Response Caching Headers
- [ ] Write feature tests for validation failure of Response Caching Headers
- [ ] Write feature tests for authentication failure of Response Caching Headers
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

- [ ] Avoid: Missing Cache Headers
- [ ] Avoid: Always Setting No-Cache
- [ ] Avoid: Stale ETag Implementation
- [ ] Avoid: Missing Conditional Request Support
- [ ] Avoid: Cache Headers for Sensitive Data

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
- Rule 1: Always Set Explicit `Cache-Control` on Every GET Response
- Rule 2: Use `Cache-Control: private` for Authenticated Responses
- Rule 3: Generate ETags from Model Timestamps, Not Full Content Hashes
- Rule 4: Set `Vary: Accept` on Content-Negotiated Endpoints
- Rule 5: Never Cache Error Responses
- Rule 6: Use Weak ETags for Responses with Dynamic Metadata
- Rule 7: Match `max-age` to Data Change Frequency

### Decisions
- Cache-Control Directive Selection
- ETag Generation Strategy
- Vary Header Strategy

### Anti-Patterns
- Missing Cache Headers
- Always Setting No-Cache
- Stale ETag Implementation
- Missing Conditional Request Support
- Cache Headers for Sensitive Data

## Related Knowledge
- Prerequisites
- Related
- Advanced



