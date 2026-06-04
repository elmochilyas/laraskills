# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** queue-async-processing
**Generated:** 2026-06-03

---

# Decision Inventory

1. Job Dispatch Strategy (Synchronous vs Async, Dispatch Timing)
2. Job Deduplication Approach (Unique vs Idempotent vs Batching)
3. Queue Isolation Strategy (Shared vs Per-Service vs Per-Priority)

---

# Architecture-Level Decision Trees

---

## Job Dispatch Strategy

---

## Decision Context

Determining when and how to dispatch webhook processing jobs.

---

## Decision Criteria

* processing complexity
* transaction safety
* response time budget
* provider timeout tolerance

---

## Decision Tree

Is the webhook processing non-trivial (>100ms, external calls, DB writes)?
↓
YES → Dispatch job from controller, return 200 immediately (queue-first)
  ↓
  Does the processing involve database writes?
  ↓
  YES → Dispatch after DB commit using `dispatchIfCommitted()`
    ↓
    Transaction may roll back after job dispatch?
    ↓
    YES → dispatchIfCommitted() ensures job only fires on successful commit
    NO → Standard dispatch — transaction outcome guaranteed
  NO → Dispatch immediately — no transaction safety concern
NO → Is processing simple and fast (<100ms, idempotent)?
  ↓
  YES → Synchronous processing may be acceptable
    ↓
    Provider has tight timeout (<5s)?
    ↓
    YES → Queue anyway — don't risk timeout even for fast operations
    NO → Synchronous processing acceptable for lightweight operations
  NO → Queue-first processing always — never block HTTP response
↓
  Job payload size?
  ↓
  Small (<1KB) → Include payload directly in job data
  Large (>1KB) → Store in DB/Redis, pass reference ID to job
  ↓
  Payload contains sensitive data?
  ↓
  YES → Use `ShouldBeEncrypted` trait on job; decrypt only during processing
  NO → Standard job serialization
↓
  Dispatch in batch for fan-out operations?
  ↓
  YES → Use `Bus::batch()` with progress callback for coordination
  NO → Single job dispatch per webhook event

---

## Rationale

Queue-first with dispatchIfCommitted() prevents processing uncommitted data and avoids provider timeouts. Large payloads go through storage reference to avoid Redis/DB serialization limits. Encrypted jobs protect sensitive webhook data at rest in queue.

---

## Recommended Default

**Default:** Queue-first dispatch with dispatchIfCommitted() after DB writes; store raw payload reference for large events; ShouldBeEncrypted for sensitive data
**Reason:** Prevents data loss, respects provider timeouts, handles large payloads, protects sensitive data

---

## Risks Of Wrong Choice

Sync processing causes provider timeout and duplicate delivery. dispatch before commit processes phantom data on transaction rollback. Large payloads in job data exceed Redis/laravel queue limits.

---

## Related Rules/Skills

* 03-webhooks: incoming/receiving-endpoints (controller → job dispatch pattern)
* 04-resilience: retry-strategies (job retry on failure)

---

---

## Job Deduplication Approach

---

## Decision Context

Preventing duplicate processing of the same webhook event.

---

## Decision Criteria

* event idempotency
* processing cost
* provider redelivery behavior
* side effect criticality

---

## Decision Tree

Does the provider send a unique event ID?
↓
YES → Use `ShouldBeUnique` trait with event ID as unique key
  ↓
  Should still allow same event after cache expiry?
  ↓
  YES → Set uniqueFor to match provider's retry window (e.g., 24h)
  ↓
    Use Cache::lock() for concurrent processing prevention
    Release lock after job completes or fails
  NO → Unique forever — risk of permanent dedup if ID collides
NO → Implement idempotency via event fingerprint
  ↓
  Fingerprint composition:
  Event type + resource ID + timestamp truncated to dedup window
  ↓
  Store processed event IDs with TTL matching retry window
  Check before processing — skip if already processed
↓
  Concurrent processing risk (same event dispatched twice)?
  ↓
  YES → Use `Cache::lock()` around the processing logic
  ↓
  Lock release on failure?
  ↓
  YES → Release lock on failure to allow retry
  NO → Lock held until expiry — no retry possible
  NO → Risk of duplicate processing from concurrent workers
↓
  Batching related events for atomic processing?
  ↓
  YES → Use job batching to group related events; dedup at batch level
  NO → Dedup each event independently

---

## Rationale

ShouldBeUnique is simplest when provider guarantees unique event IDs. Cache::lock() prevents concurrent processing of the same event. Fingerprint-based dedup handles providers without unique event IDs. TTL matching retry window prevents permanent dedup of legitimate re-deliveries.

---

## Recommended Default

**Default:** ShouldBeUnique with event ID + Cache::lock() for concurrent protection; TTL matching provider's retry window
**Reason:** Maximizes dedup reliability across concurrent workers while allowing legitimate re-delivery within retry window

---

## Risks Of Wrong Choice

No dedup causes duplicate charges/state changes on provider retries. Permanent dedup based on non-unique ID permanently blocks legitimate events. No concurrent lock allows duplicate processing from parallel workers.

---

## Related Rules/Skills

* 03-webhooks: replay-attack-prevention (idempotency as replay defense)
* 04-resilience: idempotency (idempotency key patterns)

---

---

## Queue Isolation Strategy

---

## Decision Context

Organizing webhook processing queues for isolation, priority, and monitoring.

---

## Decision Criteria

* number of providers
* throughput per provider
* failure tolerance
* monitoring granularity

---

## Decision Tree

Multiple providers sending webhooks?
↓
YES → Evaluate queue isolation level
  ↓
  Provider throughput differs significantly?
  ↓
  YES → Per-provider queue isolation (stripe-webhooks, github-webhooks)
    ↓
  Failure isolation critical?
  ↓
  YES → Dedicated queue per provider — one provider's failure doesn't block others
    ↓
    High-priority vs low-priority providers?
    ↓
    YES → Priority queues per provider (stripe-high, stripe-default, stripe-low)
    NO → Single queue per provider with default priority
  NO → Shared webhook queue for all providers
NO → Single webhook provider → Single queue dedicated to webhook processing
  ↓
  Separate webhook queue from application job queue?
  ↓
  YES → `webhooks` queue prevents webhook processing from blocking app jobs
  NO → Shared default queue — app jobs compete with webhooks
↓
  Queue connection isolation?
  ↓
  High-volume webhooks → Dedicated Redis instance for queue
  Standard volume → Separate Redis database (db 0: app, db 1: webhooks)
  Low volume → Same Redis, different queue name

---

## Rationale

Per-provider queues isolate failures — a stuck Stripe queue doesn't block GitHub processing. Priority sub-queues ensure critical events process before batch. Separate webhook queue prevents webhook congestion from blocking application background jobs.

---

## Recommended Default

**Default:** Dedicated `webhooks` queue; per-provider sub-queues for high-traffic services; same Redis instance, separate queue names for low-medium volume
**Reason:** Isolates webhook processing from app jobs without Redis instance overhead; per-provider queues scale as volume grows

---

## Risks Of Wrong Choice

Shared queue with app jobs allows webhook congestion to block critical app processing. Single queue for all providers means one provider's retry storm blocks all others. No queue isolation makes per-provider monitoring impossible.

---

## Related Rules/Skills

* 07-observability: horizon-monitoring (Horizon queue monitoring per queue)
* 04-resilience: degraded-mode (graceful degradation during queue backlog)
