# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Lifecycle & Governance
**Knowledge Unit:** Idempotency Key Design
**Generated:** 2026-06-03

---

# Decision Inventory

* Idempotency scope (per-operation vs per-session)
* Storage backend (Redis vs database)
* Concurrent request handling (first-wins vs last-wins)

---

# Architecture-Level Decision Trees

## Idempotency Scope — Per-Operation vs Per-Session

## Decision Context
Should idempotency be per individual operation or per consumer session? Arises when designing the idempotency key strategy.

## Decision Criteria
* granularity — per-operation keys enable per-request retry
* consumer convenience — per-session keys are simpler for consumers
* replay risk — per-session keys allow any replayed operation
* collision — per-session keys are more likely to collide

## Decision Tree
Does the consumer need to retry individual operations independently?
↓
YES → Per-operation idempotency keys (one key per request)
NO → Session-level retry allowed?
    YES → Per-session idempotency (simpler, riskier)
    NO → Per-operation (safe default)

## Recommended Default
**Default:** Per-operation idempotency keys
**Reason:** Fine-grained retry control, lower collision risk, standard industry practice.

## Risks Of Wrong Choice
Per-session: one replayed operation can cause unintended duplicate for a different operation.

## Storage Backend — Redis vs Database

## Decision Context
Where should idempotency keys and their response caches be stored?

## Decision Tree
Is sub-millisecond lookup latency required?
↓
YES → Redis (atomic SET NX EX, automatic TTL, sub-millisecond)
NO → Low-traffic API with simple needs?
    YES → Database table (acceptable for <100 req/s)
    NO → Redis (always preferred for idempotency)

## Recommended Default
**Default:** Redis with SET NX EX for atomic lock + TTL
**Reason:** Atomic lock prevents concurrent duplicates; TTL handles cleanup; sub-millisecond latency.

## Risks Of Wrong Choice
Database: higher latency, no automatic TTL cleanup, race conditions under concurrent requests.

## Concurrent Request Handling — First-Wins vs Last-Wins

## Decision Context
How should concurrent requests with the same idempotency key be handled?

## Decision Tree
Should the first request win and subsequent requests get the stored response?
↓
YES → First-wins with Redis lock (SET NX EX → process → store response → release lock)
NO → Process each concurrently → Last-wins (dangerous — both may execute)

## Recommended Default
**Default:** First-wins with distributed lock
**Reason:** Guarantees exactly-once semantics. Last-wins allows double execution.

## Risks Of Wrong Choice
Last-wins: both concurrent requests execute, defeating idempotency.
