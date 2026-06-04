# Skill: Implement Idempotency Key Design

## Purpose
Implement idempotency support for POST/PATCH endpoints using `Idempotency-Key` header with in-flight locking, idempotency key storage, response caching, and replay detection.

## When To Use
- POST endpoints for resource creation
- Payment or order endpoints where duplicate requests cause issues
- PATCH endpoints where retry safety is critical
- Any non-idempotent endpoint where clients may retry

## When NOT To Use
- GET/DELETE endpoints — already idempotent by HTTP semantics
- Idempotency not needed — simple POST with low retry probability

## Prerequisites
- HTTP method semantics
- Cache/database storage for idempotency keys

## Inputs
- Endpoint list requiring idempotency
- Idempotency key format specification

## Workflow
1. Create `IdempotencyMiddleware` checking `Idempotency-Key` header on POST/PATCH
2. Generate UUID v4 key on client side — server accepts but doesn't generate
3. Verify key format — UUID v4, reject non-conforming with 422
4. Check key existence in storage (Redis/cache): if exists and completed, return cached response
5. If key exists and in-flight (no response cached), return 409 Conflict — indicates concurrent request
6. If key doesn't exist, process request and store response keyed by idempotency key
7. Cache response for key expiry duration — 24 hours by default
8. Return idempotent response with same status and body as original
9. Include `Idempotent-Replayed: true` header on replayed requests
10. Purge expired keys regularly with TTL-based cleanup

## Validation Checklist
- [ ] Idempotency key middleware on POST/PATCH endpoints
- [ ] UUID v4 format required — invalid returns 422
- [ ] In-flight detection returns 409 Locked
- [ ] Completed key returns cached response
- [ ] Idempotent-Replayed header on replayed responses
- [ ] Response cached for key expiry duration
- [ ] Key storage uses TTL-based expiry and cleanup
- [ ] Idempotency for POST create endpoints
- [ ] Idempotency for PATCH update endpoints
- [ ] Tests cover first request, replay, in-flight, and invalid key scenarios

## Common Failures
- No in-flight locking — two simultaneous requests with same key both process
- Idempotency key too short — collisions possible with short/locally-generated keys
- Response cache too short — replay after expiry processes as new request
- Cache includes changing data — timestamps in cached response show original time
- Key validation too permissive — non-UUID keys collide or overflow storage
- Idempotency on GET — unnecessary, GET is already idempotent

## Decision Points
- Storage backend — Redis for production, cache for single-server, database for audit
- Key expiry — 24 hours default, 7 days for payment-related endpoints
- In-flight timeout — 30 seconds default, return 409 after timeout

## Performance Considerations
- Redis key check adds ~0.5ms per request
- Response caching adds memory overhead per unique key
- Key expiry prevents unbounded storage growth
- In-flight locking via atomic SET NX with TTL

## Security Considerations
- Idempotency keys must not expose internal state or request hashes
- Key validation prevents injection in key lookup queries
- In-flight detection prevents race-condition exploits
- Replayed responses must not leak data from different users — key scoped to user/API key
- Key collision across users prevented by namespacing: `idempotency:{user_id}:{key}`

## Related Rules
- Validate Idempotency Key UUID v4 Format
- Implement In-Flight Detection With 409 Conflict
- Cache First Response For Key Duration
- Return Idempotent-Replayed Header On Replay
- Use TTL-Based Key Expiry
- Never Apply Idempotency To GET Requests

## Related Skills
- HTTP Method Semantics — for method idempotency semantics
- Rate Limiter Definitions — for complementary rate limiting
- Response Caching Middleware — for cached response patterns

## Success Criteria
- Same idempotency key returns same response without processing duplicate
- In-flight concurrent requests return 409
- Invalid key format returns 422
- Replayed responses include `Idempotent-Replayed: true`
- Keys expire and are cleaned up automatically
- Idempotency scoped per user — no cross-user key collisions
