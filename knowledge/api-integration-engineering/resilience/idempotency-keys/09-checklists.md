# Idempotency Keys — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Idempotency
- **Knowledge Unit:** Idempotency Keys
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand HTTP methods idempotency, UUID generation
- [ ] Familiarity with distributed locking concepts
- [ ] Knowledge of response caching patterns

## Implementation Checklist
- [ ] Idempotency keys generated as UUID v4
- [ ] First request processes and caches; duplicate returns cached response
- [ ] Concurrent requests with same key are serialized via distributed lock
- [ ] Same key with different payload returns 409 Conflict
- [ ] Failure responses cached to prevent re-execution
- [ ] TTL matches maximum retry horizon (24h typical)
- [ ] Full response (status code, headers, body) stored for exact replay
- [ ] `Idempotency-Key` and `Idempotency-Status` response headers included

## Verification Checklist
- [ ] Idempotency key collision/conflict rates within acceptable range
- [ ] Lock acquired before response is cached (no gap window)
- [ ] Return 409 Conflict for duplicate key with same request body

## Security Checklist
- [ ] Key format validated (UUID pattern, length limits)
- [ ] Internal key storage structure not exposed in error messages
- [ ] Separate key namespace per tenant in multi-tenant systems
- [ ] Key collision/conflict rates monitored as attack indicator

## Performance Checklist
- [ ] First request: ~5-15ms (cache check + lock + store)
- [ ] Subsequent identical requests: ~1-5ms (cache hit)
- [ ] Lock acquisition: 10-50ms worst case under contention

## Production Readiness Checklist
- [ ] Implement as HTTP middleware so controllers remain unaware
- [ ] Redis for cache-backed idempotency stores (atomic operations, TTL)
- [ ] Include `Idempotency-Key` and `Idempotency-Status` response headers

## Common Mistakes to Avoid
- [ ] Avoid not including user/tenant scope in cache key (different users collide)
- [ ] Avoid using sequential IDs or timestamps as keys (predictable)
- [ ] Avoid not using distributed locking (concurrent requests execute in parallel)
- [ ] Avoid caching only success responses (retrying failed ops re-executes)
- [ ] Avoid releasing lock before response is cached (gap window)
