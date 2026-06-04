# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** rest-api-design
**Knowledge Unit:** Idempotency Semantics
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Idempotency Semantics implementation follows rest-api-design patterns
- [ ] All edge cases handled for Idempotency Semantics
- [ ] Full test coverage for Idempotency Semantics
- [ ] Security review completed for Idempotency Semantics
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Idempotency Semantics
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Implement idempotency as middleware â€” it's orthogonal to controller logic and applies across endpoints.
- [ ] Use Redis for idempotency key storage (fast, TTL-based expiry). Use the database for audit trails after processing.
- [ ] Handle key collision: two different requests with the same key should fail with 409 Conflict if the request body differs.
- [ ] Accept `Idempotency-Key` header only on POST and PATCH endpoints â€” GET/PUT/DELETE are already idempotent.
- [ ] Document the idempotency key requirement in OpenAPI â€” clients need to know they must generate UUIDs.

---

# Implementation Checklist

- [ ] GET/HEAD/DELETE idempotent â€” tested
- [ ] PUT idempotent â€” tested
- [ ] POST non-idempotent unless Idempotency-Key used
- [ ] Idempotency-Key on POST where needed
- [ ] Idempotency properties documented per endpoint
- [ ] Implement Idempotency Semantics following rest-api-design patterns
- [ ] Configure all required settings for Idempotency Semantics
- [ ] Register route/middleware/service for Idempotency Semantics
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Each idempotency-protected request requires a cache lookup â€” ~1-5ms with Redis. Consider in-memory cache for hot keys.
- [ ] TTL-based expiry prevents unbounded storage growth. 24-hour TTL keeps storage proportional to 24-hour request volume.
- [ ] Payload hashing for server-generated keys adds CPU overhead proportional to body size â€” use streaming hashes for large payloads.
- [ ] `Cache::add()` atomic check is fast (~1ms) but requires Redis/Memcached support.

---

# Security Checklist

- [ ] Idempotency keys prevent duplicate processing but do not authenticate requests â€” implement auth separately.
- [ ] Key collision (same key, different request body) may indicate a buggy client or replay attack â€” log and monitor.
- [ ] If an idempotency key is reused with a different request body after the original request completed, return 409 Conflict.
- [ ] Never accept idempotency keys from unauthenticated requests â€” a malicious client could pre-seed keys to block legitimate requests.
- [ ] Monitor idempotency key collision rate â€” a spike indicates a buggy client or potential attack.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] POST endpoints that create billable/identity resources support `Idempotency-Key` header.
- [ ] First request with a key processes normally; second request with same key returns cached response.
- [ ] Race condition handling uses `Cache::add()` or `Cache::lock()` for atomic operations.
- [ ] All responses (including 4xx/5xx) are cached for idempotency key reuse.
- [ ] Keys expire after the configured TTL (default 24 hours).
- [ ] Same key with different request body returns 409 Conflict.
- [ ] Idempotency key storage uses Redis with TTL; audit trail stored in database.
- [ ] Write feature tests for happy path of Idempotency Semantics
- [ ] Write feature tests for validation failure of Idempotency Semantics
- [ ] Write feature tests for authentication failure of Idempotency Semantics
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

- [ ] Avoid: Idempotency on GET
- [ ] Avoid: Server-Generated Keys Only
- [ ] Avoid: Idempotency Without Expiry
- [ ] Avoid: Per-Controller Idempotency
- [ ] Avoid: Accepting Key but Ignoring It

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
- Implement Idempotency Keys For Critical POST Endpoints
- Use Atomic Cache Operations To Prevent Race Conditions
- Cache All Responses Including Errors
- Set TTL Based On Maximum Retry Window
- Return 409 For Key Collision With Different Request Body
- Implement Idempotency As Middleware
- Accept Idempotency-Key Only On POST And PATCH
- Never Accept Idempotency Keys From Unauthenticated Requests
- Monitor Idempotency Key Collision Rate

### Anti-Patterns
- Idempotency on GET
- Server-Generated Keys Only
- Idempotency Without Expiry
- Per-Controller Idempotency
- Accepting Key but Ignoring It

## Related Knowledge
- Prerequisites
- Related
- Advanced



