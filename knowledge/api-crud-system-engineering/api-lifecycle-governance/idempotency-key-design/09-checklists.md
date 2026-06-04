# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-lifecycle-governance
**Knowledge Unit:** Idempotency Key Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Idempotency Key Design implementation follows api-lifecycle-governance patterns
- [ ] All edge cases handled for Idempotency Key Design
- [ ] Full test coverage for Idempotency Key Design
- [ ] Security review completed for Idempotency Key Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Idempotency Key Design

---

# Architecture Checklist

- [ ] Implement as Laravel middleware using Redis cache store.
- [ ] Keys scoped to consumer + endpoint path (not version) to allow retries across upgrades.
- [ ] Store backend: Redis with RDB persistence (snapshots every 5 min).
- [ ] Concurrent key handling: First wins with Redis distributed lock.
- [ ] Circuit breaker: If Redis is unavailable, fall back to "process anyway" with warning log.
- [ ] Evaluate: Idempotency Scope â€” Per-Operation vs Per-Session
- [ ] Evaluate: Storage Backend â€” Redis vs Database
- [ ] Evaluate: Concurrent Request Handling â€” First-Wins vs Last-Wins

---

# Implementation Checklist

- [ ] Idempotency key middleware on POST/PATCH endpoints
- [ ] UUID v4 format required â€” invalid returns 422
- [ ] In-flight detection returns 409 Locked
- [ ] Completed key returns cached response
- [ ] Idempotent-Replayed header on replayed responses
- [ ] Response cached for key expiry duration
- [ ] Key storage uses TTL-based expiry and cleanup
- [ ] Idempotency for POST create endpoints
- [ ] Idempotency for PATCH update endpoints
- [ ] Tests cover first request, replay, in-flight, and invalid key scenarios
- [ ] Implement Idempotency Key Design following api-lifecycle-governance patterns
- [ ] Configure all required settings for Idempotency Key Design
- [ ] Register route/middleware/service for Idempotency Key Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Redis read/write per check: < 5ms (network latency dominant).
- [ ] Response payload stored in compressed format for large responses.
- [ ] TTL-based cleanup handled natively by Redis EXPIRE.
- [ ] Concurrent lock contention negligible at normal traffic levels.

---

# Security Checklist

- [ ] Keys must not be used as correlation IDs (PII-adjacent â€” can track consumer activity).
- [ ] Do not include sensitive data in idempotency keys.
- [ ] Key prefix with consumer ID prevents enumeration attacks.
- [ ] Idempotency store may contain sensitive response data â€” encrypt at rest.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Idempotency Key Design
- [ ] Write feature tests for validation failure of Idempotency Key Design
- [ ] Write feature tests for authentication failure of Idempotency Key Design
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
- Rule 1: Require Idempotency-Key Header for All Mutating Endpoints
- Rule 2: Store Full Response for Exact Replay
- Rule 3: Use Redis `SET NX EX` for Atomic Lock
- Rule 4: Prefix Keys with Consumer ID
- Rule 5: Include Idempotency-Key-Status Header in Responses
- Rule 6: Implement Circuit Breaker for Redis Unavailability
- Rule 7: Enforce at Middleware Level

### Decisions
- Idempotency Scope â€” Per-Operation vs Per-Session
- Storage Backend â€” Redis vs Database
- Concurrent Request Handling â€” First-Wins vs Last-Wins

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



