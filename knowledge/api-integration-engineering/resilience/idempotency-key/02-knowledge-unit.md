# Metadata
Domain: API Integration Engineering
Subdomain: Idempotency & Data Consistency
Knowledge Unit: Idempotency Key Pattern (Idempotency-Key Header, UUID v4)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
The idempotency key pattern enables safe retries of non-idempotent API operations by allowing clients to pass a unique key (typically UUID v4) identifying each operation. The server deduplicates requests with the same key, ensuring at-most-once execution semantics. Popularized by Stripe's API design, the pattern is implemented in Laravel via middleware-driven packages (square1-io/laravel-idempotency, infinitypaul/idempotency-laravel) that cache responses per key with distributed locking for concurrency control.

## Core Concepts
- **Idempotency-Key Header**: HTTP header carrying a unique identifier for the operation
- **UUID v4**: Standard key format (128-bit random UUID) providing sufficient entropy to avoid collisions
- **Response Caching**: Server stores the first response for a key and returns it on subsequent identical requests
- **Distributed Locking**: Prevents concurrent requests with the same key from executing in parallel
- **TTL (Time-To-Live)**: Duration the idempotency key record persists (typically 24 hours)
- **At-Most-Once Semantics**: Guarantee that an operation executes zero or one times, never more

## Mental Models
- **Receipt System**: Each operation gets a unique receipt ID; presenting the same receipt returns the stored result instead of re-executing
- **One-Way Valve**: The key opens the valve once; subsequent attempts with the same key see the valve already open
- **Stripe's Innovation**: Stripe popularized the pattern for payment APIs where retrying a failed charge could cause double charges

## Internal Mechanics
- Client generates UUID v4, sends as `Idempotency-Key: <uuid>` header on mutating requests (POST, PUT, PATCH)
- Server checks cache for existing result: if found, return cached response (including status code and body)
- If not found, acquire distributed lock: `Cache::lock("idempotency:$key", 10)` to prevent race conditions
- Execute the operation, store the response in cache with TTL, release the lock
- Subsequent requests with same key before TTL expiry return cached response
- After TTL expiry, the key becomes available for future operations (key cleanup)
- Payload validation: if same key used with different payload, return 409 Conflict

## Patterns
- **Middleware-Driven Idempotency**: Implement as HTTP middleware layer so controllers remain unaware
- **Distributed Lock Guard**: Use `Cache::lock()` around the critical section to prevent concurrent execution
- **Idempotency-Response Headers**: Return `Idempotency-Key` and `Idempotency-Status` (Original/Repeated) headers
- **Payload Validation**: Detect and reject same key with different payload (409 Conflict)
- **Storage Backend Selection**: Redis for cache storage (TTL, atomic operations); database for durable storage
- **Telemetry Integration**: Track idempotency hit rates and conflict rates for monitoring

## Architectural Decisions
- Use UUID v4 for key generation (128-bit random, negligible collision probability)
- Set TTL to 24 hours (matches Stripe's expiration window, covers most retry horizons)
- Use Redis cache over database for faster lookups and built-in TTL
- Apply idempotency to all mutating endpoints (POST, PUT, PATCH, DELETE) via route middleware
- Use distributed locking for concurrent request safety; single-server apps can use simpler locking
- Store full response (status code, headers, body) to exactly reproduce successful responses

## Tradeoffs
- Idempotency adds ~5-15ms per request (cache check + lock + store) for the first request; subsequent requests are cache hits (~1-5ms)
- 24-hour TTL covers most retry windows but long-lived retries (webhooks retried over 3 days) may see key expiration
- Caching full responses increases memory usage; very large responses may need size limits
- Distributed locking adds complexity; single-server apps can use simpler mutex patterns
- Payload validation catches misuse but adds overhead of payload hashing

## Performance Considerations
- Cache lookup: 1-5ms with Redis, sub-millisecond with in-memory cache
- Distributed lock acquisition: 10-50ms worst case if contention
- Response storage: payload size varies; set max cache size (e.g., 10MB) to prevent memory issues
- TTL-based cleanup is automatic in Redis; database cleanup needs scheduled pruning
- Key namespace collision is negligible with UUID v4 but monitor collision rate in high-volume systems

## Production Considerations
- Use Redis for cache-backed idempotency stores in production (atomic operations, TTL, distributed)
- Monitor idempotency key collision/conflict rates as a potential attack indicator
- Set up alerting on high conflict rates (possible idempotency key reuse attack)
- Log idempotency key usage for audit (without storing the full response)
- Implement key validation (UUID format, length limits) to prevent injection
- Plan key cleanup strategy: Redis TTL handles this automatically; database stores need Artisan commands

## Common Mistakes
- Not including idempotency key in the cache key scope (different users with same key collide)
- Using sequential IDs or timestamps as idempotency keys (predictable, collision risk)
- Not implementing distributed locking, allowing concurrent requests to execute in parallel
- Caching only success responses (failed responses should also be cached to prevent re-execution)
- Setting TTL too short (key expires before retry horizon, allowing duplicate execution)
- Releasing the lock before the response is cached (gap window allows concurrent execution)

## Failure Modes
- Lock acquisition timeout: two concurrent requests with same key both fail to get lock; neither executes
- Cache failure: idempotency store unavailable; either reject all (safe) or allow all (unsafe)
- Key collision: UUID v4 collision is astronomically unlikely but possible with broken random generators
- TTL mismatch: key expires but operation hasn't completed; next retry sees no key and re-executes
- Response corruption: cached response becomes corrupted; returns error on subsequent identical requests

## Ecosystem Usage
- Stripe API popularized the pattern; all POST requests accept `Idempotency-Key` header
- square1-io/laravel-idempotency: middleware-driven, cache-backed, lock-based concurrency control
- infinitypaul/idempotency-laravel: robust cache, distributed locks, telemetry, payload validation, alert system
- IETF draft standardizes the `Idempotency-Key` header for HTTP APIs
- Many payment and financial APIs (Stripe, Adyen, Braintree) require idempotency keys
- Standard Webhooks spec uses `webhook-id` as an idempotency key for webhook delivery deduplication

## Related Knowledge Units
- K015: Response Caching Strategies (idempotency as a form of response caching)
- K018: Webhook Payload Storage (idempotency key for webhook deduplication)
- K005: Retry Strategies (idempotency enables safe retry)
- K022: Replay Attack Prevention (idempotency key as nonce for replay prevention)
- K006: Idempotency Key Pattern (this document)

## Research Notes
- Stripe's idempotency implementation: cache responses for 24 hours, replay exact result including 500 errors
- Paul Conroy's "Idempotency - what is it, and how can it help our Laravel APIs?" provides Laravel-specific guidance
- IETF draft "Idempotency-Key HTTP Header Field" defines the standard header format
- The infinitypaul package adds telemetry via Inspector for monitoring idempotency metrics
- square1-io package provides lock-backed concurrency control with configurable lock timeout
