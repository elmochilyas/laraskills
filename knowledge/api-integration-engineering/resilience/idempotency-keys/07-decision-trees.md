# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 04-resilience
**Knowledge Unit:** idempotency-keys
**Generated:** 2026-06-03

---

# Decision Inventory

1. Key Generation Strategy (Client vs Server)
2. Key Storage Strategy (Cache vs Database)
3. Concurrent Request Handling Strategy (Lock vs Unique Constraint)

---

# Architecture-Level Decision Trees

---

## Key Generation Strategy

---

## Decision Context

Choosing between client and server idempotency key generation.

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

Can the client reliably generate and retry with the same key?
↓
YES → Client generates UUID v4 key and sends in Idempotency-Key header
  ↓
  Does the client retry on failure?
  ↓
  YES → Client generation is ideal; key persists across retries
  NO → Server generation may be needed; client includes key on retry attempt
NO → Server generates key from request fingerprint (payload hash + timestamp)
  ↓
  Can the server guarantee unique key per unique operation?
  ↓
  YES → Server-side key generation is acceptable
  NO → Client generation is mandatory for reliable idempotency
  ↓
  Need to return cached first response on duplicate key?
  ↓
  YES → Response caching requires both key generation and storage
  NO → Basic deduplication without response caching

---

## Rationale

Client-generated keys ensure the same key is used across retries. Server-generated keys work only when requests are truly identical. Client generation is the industry standard (Stripe).

---

## Recommended Default

**Default:** Client-generated UUID v4 in Idempotency-Key header
**Reason:** Industry standard; survives client retries; collision-resistant

---

## Risks Of Wrong Choice

Client generation without UUID risks collision. Server generation from payload hash can't distinguish intentional identical requests from accidental duplicates.

---

## Related Rules

Use UUID v4 for Keys, Use Distributed Locking for Concurrent Requests

---

## Related Skills

Cache SaloonPHP Requests with the Cache Plugin

---

## Key Storage Strategy

---

## Decision Context

Choosing the storage backend for idempotency keys.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is the request throughput high (>1000 requests/second)?
↓
YES → Use Redis-backed key store (sub-millisecond lookup)
  ↓
  Need key durability across Redis restart?
  ↓
  YES → Redis + database unique constraint for durability
  NO → Redis-only with TTL is sufficient
NO → Is moderate throughput with strong durability needed?
  ↓
  YES → Database-backed key store with unique index
  NO → Cache-backed store for development/simple deployments
  ↓
  Need TTL-based key expiration?
  ↓
  YES → Redis auto-expires keys via TTL (24h default)
  NO → Database store requires scheduled cleanup job

---

## Rationale

Redis provides fast key lookups with automatic TTL expiry. Database unique constraints provide durability guarantees. Combined, they offer speed + durability.

---

## Recommended Default

**Default:** Redis key store with 24h TTL; database unique constraint for durability
**Reason:** Performance of Redis; durability of database; auto-expiry via TTL

---

## Risks Of Wrong Choice

Redis-only loses deduplication state on restart. Database-only key store requires cleanup jobs and is slower. No TTL causes unbounded key storage growth.

---

## Related Rules

Set TTL to 24 Hours, Cache Both Success and Failure Responses

---

## Related Skills

Cache SaloonPHP Requests with the Cache Plugin

---

## Concurrent Request Handling Strategy

---

## Decision Context

Preventing duplicate processing when identical requests arrive concurrently.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Are concurrent requests with the same key expected?
↓
YES → Implement distributed lock around idempotency check + processing
  ↓
  Lock acquisition timeout?
  ↓
  YES → Use Cache::lock()->block(10) to wait for lock (queue-style)
  NO → Use Cache::lock()->get() with immediate fail on contention
NO → Is the application single-threaded (queue processed sequentially)?
  ↓
  YES → Unique database constraint on key is sufficient
  NO → Distributed lock is needed for concurrent worker safety
  ↓
  Need to cache and return first response on duplicate?
  ↓
  YES → Store response under key after processing; return on duplicate
  NO → Simple boolean flag per key; no response replay

---

## Rationale

Distributed locking prevents the race where two concurrent requests both see "key not found" and both process. Response caching enables immediate reply to duplicates without re-execution.

---

## Recommended Default

**Default:** Cache::lock() with 10s timeout + idempotency check + response caching
**Reason:** Prevents concurrent execution; returns first response on retry

---

## Risks Of Wrong Choice

No locking allows concurrent processing of the same key (both see "key not found"). Lock timeout too short releases lock before processing completes. No response cache requires re-execution on duplicate.

---

## Related Rules

Use Distributed Locking and Unique Index, Implement TTL-Based Key Expiration

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie
