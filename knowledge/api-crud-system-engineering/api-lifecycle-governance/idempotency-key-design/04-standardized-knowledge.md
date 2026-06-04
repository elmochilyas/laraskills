# ECC Standardized Knowledge — Idempotency Key Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | Idempotency Key Design |
| Difficulty | Intermediate |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

Idempotency key design defines how API consumers can safely retry requests without causing duplicate side effects. Using an `Idempotency-Key` header, the API detects and rejects duplicate requests, ensuring exactly-once semantics for mutating operations. Keys are stored in Redis with 24-hour TTL, prefixed with consumer ID to prevent collisions, and protected against concurrent duplicates via distributed locks.

## Core Concepts

- **Idempotency-Key header**: Unique string provided by consumer for each request enabling duplicate detection.
- **Idempotency store**: Persistent key-value store (Redis) mapping keys to responses for the idempotency window.
- **Replay detection**: Server checks store before processing; if key exists, stored response is returned (same status code and body).
- **Idempotency window**: Duration key is considered valid (24 hours).
- **Exactly-once semantics**: Request with unique key produces exactly one side effect regardless of retries.
- **First-wins with lock**: On concurrent same-key requests, one processes and others wait or return 409.

## When To Use

- All POST/PATCH/DELETE endpoints with side effects
- Payment processing, order creation, and financial operations
- Any operation where duplicate execution would cause harm
- Retry-sensitive integrations with unreliable network consumers

## When NOT To Use

- GET/HEAD endpoints (idempotent by HTTP spec)
- Read-only operations with no side effects
- Operations where duplicates are harmless (append-only logs)
- Non-critical internal endpoints with single consumer

## Best Practices

- **Consumer-prefixed keys**: Encourage `{consumer_id}:{unique_id}` format to prevent cross-consumer collisions.
- **Full response caching**: Store complete status code, headers, and body for exact replay.
- **Distributed lock on first request**: Use Redis `SET NX EX` for atomic lock + TTL to handle concurrent duplicates.
- **Response header**: Include `Idempotency-Key-Status: new` or `Idempotency-Key-Status: replay` in responses.
- **Required for all mutations**: Enforce at middleware level; return 422 if missing on POST/PATCH/DELETE.
- **Idempotency-Key-Reset header**: Allow consumers to reset key for testing or error recovery.

## Architecture Guidelines

- Implement as Laravel middleware using Redis cache store.
- Keys scoped to consumer + endpoint path (not version) to allow retries across upgrades.
- Store backend: Redis with RDB persistence (snapshots every 5 min).
- Concurrent key handling: First wins with Redis distributed lock.
- Circuit breaker: If Redis is unavailable, fall back to "process anyway" with warning log.

## Performance Considerations

- Redis read/write per check: < 5ms (network latency dominant).
- Response payload stored in compressed format for large responses.
- TTL-based cleanup handled natively by Redis EXPIRE.
- Concurrent lock contention negligible at normal traffic levels.

## Security Considerations

- Keys must not be used as correlation IDs (PII-adjacent — can track consumer activity).
- Do not include sensitive data in idempotency keys.
- Key prefix with consumer ID prevents enumeration attacks.
- Idempotency store may contain sensitive response data — encrypt at rest.

## Common Mistakes

- Using idempotency keys only for POST, forgetting PUT/DELETE.
- Not handling concurrent same-key requests (race condition -> double processing).
- In-memory only storage without persistence (lost on restart -> double processing).
- Returning 200 for replays when original was 201 (must match original status).
- Using auth token as part of key (tied to authentication, not operation).

## Anti-Patterns

- **Per-request unique key without consumer prefix**: Risk of collision across consumers.
- **No concurrent request handling**: Two simultaneous requests with same key both process.
- **Storing only success/failure, not full response**: Replay returns different response than original.

## Examples

- Header: `Idempotency-Key: acct_123:order_create_456`.
- Response header: `Idempotency-Key-Status: replay`.
- Redis command: `SET acct_123:order_create_456 <response_json> NX EX 86400`.

## Related Topics

- **Prerequisites**: Idempotency Key TTL Expiration, Idempotency Key Error Handling
- **Closely Related**: Bulk Operation Design, Backward Compatibility Policy
- **Advanced**: Distributed idempotency across microservices, Idempotency for async/event-driven operations, Consumer idempotency key best practices documentation

## AI Agent Notes

When implementing idempotency keys: use Redis with NX+EX for atomic lock+TTL, prefix keys with consumer ID, store full response for exact replay, handle concurrent same-key requests with first-wins locking, require for all POST/PATCH/DELETE, include Idempotency-Key-Status header in responses, implement circuit breaker for Redis outages.

## Verification

Sources: Stripe idempotency implementation, Twilio usage, Shopify X-Shopify-Idempotency-Key, domain-analysis.md.
