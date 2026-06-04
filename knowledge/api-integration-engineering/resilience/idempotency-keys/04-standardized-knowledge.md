# ECC Standardized Knowledge — Idempotency Keys

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | idempotency-data-consistency |
| Knowledge Unit ID | ku-01 |
| Knowledge Unit | Idempotency Keys |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K006, K015 |

## Overview (Engineering Value)
The idempotency key pattern enables safe retries of non-idempotent API operations by allowing clients to pass a unique key (typically UUID v4) identifying each operation. The server deduplicates requests with the same key, ensuring at-most-once execution semantics. Popularized by Stripe's API design, this pattern prevents duplicate charges, double processing, and other side effects from retrying API calls. In Laravel, packages like square1-io/laravel-idempotency and infinitypaul/idempotency-laravel implement middleware-driven idempotency with distributed locking and response caching.

## Core Concepts
- **Idempotency-Key Header**: HTTP header carrying a unique identifier for the operation
- **UUID v4**: Standard key format (128-bit random UUID) with negligible collision probability
- **Response Caching**: First response stored per key; subsequent identical requests return cached response
- **Distributed Locking**: Prevents concurrent requests with the same key from executing in parallel
- **TTL**: Duration the key record persists (typically 24 hours, matching Stripe's window)
- **At-Most-Once Semantics**: Guarantee of zero or one execution, never more

## When To Use
- Mutating API endpoints (POST, PUT, PATCH, DELETE) from client side
- Payment processing where duplicates cause financial errors
- Webhook receiving where deduplication prevents double processing
- Any retry-enabled operation with side effects

## When NOT To Use
- Idempotent-by-definition operations (GET, HEAD, OPTIONS)
- Read-only endpoints with no side effects
- Internal operations behind a single-threaded consumer

## Best Practices
- Use UUID v4 for keys (128-bit random, non-sequential, unpredictable)
- Set TTL to 24 hours to cover maximum retry horizon
- Use distributed locking (`Cache::lock()`) for concurrent request safety
- Cache both success and failure responses (prevent re-execution of failed operations)
- Validate: same key with different payload returns 409 Conflict

## Architecture Guidelines
- Implement as HTTP middleware so controllers remain unaware
- Use Redis for cache-backed idempotency stores (atomic operations, TTL, distributed)
- Store full response (status code, headers, body) for exact replay
- Include `Idempotency-Key` and `Idempotency-Status` (Original/Repeated) response headers

## Performance Considerations
- First request: ~5-15ms (cache check + lock + store)
- Subsequent identical requests: ~1-5ms (cache hit)
- Lock acquisition: 10-50ms worst case under contention
- Key namespace collision negligible with UUID v4

## Security Considerations
- Monitor idempotency key collision/conflict rates as attack indicator
- Validate key format (UUID pattern, length limits) to prevent injection
- Never expose internal key storage structure in error messages
- Use separate key namespace per tenant in multi-tenant systems

## Common Mistakes
- Not including user/tenant scope in cache key (different users with same key collide)
- Using sequential IDs or timestamps as keys (predictable, collision risk)
- Not using distributed locking (concurrent requests execute in parallel)
- Caching only success responses (retrying failed operations re-executes)
- Releasing lock before response is cached (gap window)

## Related Topics
- **Prerequisites**: HTTP methods idempotency, UUID generation
- **Closely Related**: Optimistic locking (ku-02), consistency guarantees (ku-03)
- **Advanced**: Distributed locking with Redis, idempotency for idempotent operations
- **Cross-Domain**: Payment systems, webhook deduplication

## Verification
- [ ] Idempotency keys generated as UUID v4
- [ ] First request processes and caches; duplicate returns cached response
- [ ] Concurrent requests with same key are serialized via distributed lock
- [ ] Same key with different payload returns 409 Conflict
- [ ] Failure responses cached to prevent re-execution
- [ ] TTL matches maximum retry horizon (24h typical)
