# ECC Standardized Knowledge — Idempotency Keys for API Write Operations

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | resilience-patterns |
| Knowledge Unit ID | ku-40 |
| Knowledge Unit | Idempotency Keys for API Write Operations |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K006, K008, K009, K011 |

## Overview (Engineering Value)
Idempotency keys allow safe retries of write operations by ensuring the same operation is only processed once. The client generates a unique key for each operation and sends it with the request; the server deduplicates requests with the same key. This is critical for payment processing, order creation, and any operation with side effects.

## Core Concepts
- **Idempotency Key**: UUID or unique string generated per operation by the client
- **Key Storage**: Server stores completed operation result keyed by idempotency key
- **Key Lifecycle**: Generated → sent → stored → returned on duplicate → expired
- **Duplicate Detection**: Server checks key before processing
- **Key Scope**: Per-user or per-client? Shared or isolated key namespace
- **TTL**: Time after which key can be reused (typically 24h)

## When To Use
- Payment processing (charge once, prevent double-charge)
- Order/booking creation
- Any write operation retried on network failure
- Webhook processing with at-least-once delivery

## When NOT To Use
- Read-only operations (GET requests)
- Operations where duplicates are acceptable (analytics events)
- Non-critical operations where occasional duplicates are fine

## Best Practices
- Generate keys as UUID v4 on the client side
- Store completed operation with key, including response
- Return 409 Conflict for duplicate key with same request body
- Return 422 for duplicate key with different request body (key misuse)
- Use unique index on key column for concurrency safety
- Implement TTL-based key expiration (24-72 hours)

## Architecture Guidelines
- Idempotency key storage separate from business data
- Indexed database column for fast duplicate lookup
- Middleware-based idempotency check for consistent enforcement
- Key generation in service class or client SDK
- Response cache from first request returned on duplicate key

## Performance Considerations
- Database lookup per request (indexed, ~1ms)
- Storage proportional to number of unique operations
- TTL cleanup requires maintenance (cron or scheduled job)
- Indexed lookup faster than application-level deduplication

## Common Mistakes
- Client generating keys inside retry loop (same key per attempt, not per operation)
- No unique constraint on key column (race condition on concurrent requests)
- Too-short TTL (keys expire before retry window ends)
- Different request body with same key (indicates key collision)
- Not returning cached first response on duplicate (processing twice)

## Related Topics
- **Prerequisites**: HTTP methods (PUT vs POST), UUIDs
- **Closely Related**: Idempotency Keys (nested directory), optimistic locking
- **Advanced**: Distributed idempotency, exactly-once semantics
- **Cross-Domain**: Data integrity, distributed systems

## Verification
- [ ] Unique constraint on idempotency key column
- [ ] Key generated once per operation (outside retry loop)
- [ ] TTL aligned with maximum retry window (24h+)
- [ ] First response returned on duplicate key
- [ ] Different body with same key returns error
- [ ] Key cleanup strategy implemented
