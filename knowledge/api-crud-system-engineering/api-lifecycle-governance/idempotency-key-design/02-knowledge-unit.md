# Idempotency Key Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
Idempotency key design defines how API consumers can safely retry requests without causing duplicate side effects. Using an `Idempotency-Key` header, the API detects and rejects duplicate requests, ensuring exactly-once semantics for mutating operations. This is critical for payment processing, order creation, and any operation with irreversible side effects.

## Core Concepts
- **Idempotency-Key Header:** A unique string provided by the consumer for each request to enable duplicate detection.
- **Idempotency Store:** A persistent key-value store that maps keys to responses for a defined window.
- **Replay Detection:** The server checks the store before processing; if the key exists, the stored response is returned.
- **Idempotency Window:** The duration for which an idempotency key is considered valid (typically 24 hours).
- **Exactly-Once Semantics:** The promise that a request with a unique key will produce exactly one side effect regardless of how many times it is sent.
- **Safe vs Idempotent:** GET/HEAD/PUT/DELETE are idempotent by HTTP spec; POST requires explicit idempotency support.

## Mental Models
- **Post Office Receipt:** When you send a registered letter, you get a receipt with a tracking number. If you lose the letter, you can show the receipt and the post office knows it was already sent — no duplicate delivery.
- **Vending Machine:** Pressing the button twice quickly should only dispense one soda. The machine "remembers" (idempotency key) that the button was already pressed.

## Internal Mechanics
1. **Key Extraction:** The API gateway or middleware extracts the `Idempotency-Key` header from the request.
2. **Key Lookup:** The idempotency store is queried for the key (compound key = `{consumer_id}:{idempotency_key}`).
3. **Cache Hit (Replay):** If the key exists and the response is cached, return the cached response (including original status code and body).
4. **Cache Miss (New Request):** If the key does not exist, proceed with normal processing.
5. **Key Storage:** After successful processing, store the response mapped to the key with a TTL.
6. **Lock Contention:** On concurrent requests with the same key, one succeeds and the rest wait or return `409 Conflict`.

## Patterns
- **Consumer-Prefixed Keys:** Encourage consumers to prefix keys with their consumer ID (`acct_123:order_456`) to avoid collisions.
- **Response Caching:** Store the full response (status, headers, body) so replay returns identical output.
- **Lock on First Request:** Use a distributed lock (Redis redlock) to handle concurrent duplicate requests.
- **Key Expiration:** Keys expire after the idempotency window; expired keys are treated as new requests.
- **Idempotency-Key-Reset Header:** Allow consumers to reset an idempotency key for testing or error recovery.

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| Key format | UUID / Consumer-generated / Opaque | Consumer-generated (string) | Consumer knows their domain; we validate uniqueness |
| Store backend | Redis / PostgreSQL / DynamoDB | Redis with RDB persistence | Fast reads/writes, built-in TTL, distributed locking |
| TTL (idempotency window) | 1h / 24h / 7d | 24 hours | Covers most retry scenarios; manageable storage size |
| Concurrent key handling | First wins / Last wins / Lock | First wins with lock | Prevents double-processing from race conditions |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| Short vs long TTL | Short TTL saves storage but may expire before retry completes; long TTL uses more storage |
| Response caching vs recomputation | Cached response is fast but may be stale; recomputation is accurate but may produce different results |
| Loose vs strict key validation | Loose (accept any string) is flexible; strict (UUID format only) prevents injection |

## Performance Considerations
- Redis read/write per idempotency check: < 5ms (network latency dominant).
- Response payload size impacts storage: store in compressed format for large responses.
- TTL-based key cleanup: Redis handles this natively with `EXPIRE`; no additional cleanup needed.
- Concurrent lock contention: negligible at normal traffic; plan for 99th percentile retry-spikes.

## Production Considerations
- **Monitoring:** Track idempotency key hit/miss ratio; alert if replay ratio exceeds 5% (may indicate consumer retry storms).
- **Logging:** Log idempotency key lookups (no PII) for debugging replay issues.
- **Backup:** Redis persistence (RDB snapshots every 5 min) prevents total data loss.
- **Rollback:** If a bug is deployed, clearing idempotency keys via prefix pattern allows consumer retries.
- **Testing:** Fuzz test with concurrent requests using the same idempotency key; verify exactly-one processing.

## Common Mistakes
- Using idempotency keys only for POST and forgetting PUT/DELETE endpoints.
- Not handling concurrent requests with the same key (race condition → double processing).
- Storing idempotency keys in-memory without persistence (lost on restart → double processing).
- Returning `200 OK` for replays when the original response was `201 Created` (must match original status).
- Using the consumer's authentication token as part of the key (tied to auth, not operation).

## Failure Modes
- **Redis Outage:** Idempotency store is unavailable. Mitigation: circuit breaker falls back to "process anyway" with warning log.
- **Key Collision:** Two consumers use the same key. Mitigation: prefix keys with consumer ID to guarantee uniqueness.
- **TTL Too Short:** Consumer's retry arrives after TTL expires → duplicate processing. Mitigation: 24-hour TTL covers most cases; extend for high-latency consumers.
- **Partial Failure During Storage:** Request processed but response not stored → consumer retries → double processing. Mitigation: write-ahead log or two-phase approach.

## Ecosystem Usage
- **Stripe:** Idempotency keys are required for all POST requests; keys expire after 24 hours.
- **Twilio:** Uses idempotency keys for message sending to prevent duplicate SMS.
- **Shopify:** Supports `X-Shopify-Idempotency-Key` header for mutations.

## Related Knowledge Units

### Prerequisites
- [Idempotency Key TTL Expiration](ku-11-idempotency-key-ttl-expiration)
- [Idempotency Key Error Handling](ku-12-idempotency-key-error-handling)

### Related Topics
- [Bulk Operation Design](ku-09-bulk-operation-design)
- [Backward Compatibility Policy](ku-04-backward-compatibility-policy)

### Advanced Follow-up Topics
- Distributed idempotency across microservices
- Idempotency for async/event-driven operations
- Consumer idempotency key best practices documentation

## Research Notes

### Source Analysis
Stripe's idempotency implementation is the industry reference. Their approach of storing the full response including status code and body for replay is critical for correct exactly-once semantics.

### Key Insight
The hardest problem in idempotency is not the key lookup — it's **handling concurrent duplicate requests**. Without a distributed lock, two concurrent requests with the same key can both miss in the store and both process. A Redis-based lock on the key before processing solves this.

### Version-Specific Notes
- Laravel 11.x: No built-in idempotency middleware; implement custom middleware using Redis cache store.
- PHP 8.4: `ext-redis` with `Redis::set()` using NX + EX flags provides atomic lock + TTL in one call.
