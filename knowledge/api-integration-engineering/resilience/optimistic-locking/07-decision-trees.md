# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 04-resilience
**Knowledge Unit:** optimistic-locking
**Generated:** 2026-06-03

---

# Decision Inventory

1. Locking Strategy (Optimistic vs Pessimistic)
2. Version Field Selection (Integer vs Timestamp)
3. Conflict Resolution Strategy (Retry vs Fail)

---

# Architecture-Level Decision Trees

---

## Locking Strategy

---

## Decision Context

Choosing between optimistic and pessimistic locking for concurrency control.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Are conflicts expected to be rare (<5% of writes)?
↓
YES → Use optimistic locking (version-based, lock-free reads)
  ↓
  Can the operation tolerate retry on conflict?
  ↓
  YES → Optimistic locking with retry is the right choice
  NO → Pessimistic locking needed; conflicts must not cause retries
NO → Are conflicts expected to be frequent (>5% of writes)?
  ↓
  YES → Use pessimistic locking (database row locks) for predictable latency
  NO → Optimistic locking is still preferred for read-heavy workloads
  ↓
  Need to hold locks for long-running operations?
  ↓
  YES → Optimistic locking is better (no long-held DB locks)
  NO → Pessimistic locking is acceptable for short operations

---

## Rationale

Optimistic locking performs best when conflicts are rare — reads have zero overhead, writes only fail on actual conflicts. Pessimistic locking is better for high-conflict scenarios where retries would be frequent.

---

## Recommended Default

**Default:** Optimistic locking for webhook and queue job concurrency (rare conflicts)
**Reason:** Zero read overhead; no held locks; retry handles rare conflicts

---

## Risks Of Wrong Choice

Optimistic locking under high conflict rates causes excessive retries. Pessimistic locking under low conflict rates holds unnecessary locks and reduces throughput.

---

## Related Rules

Use Integer Version Fields, Not Timestamps

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie

---

## Version Field Selection

---

## Decision Context

Choosing between integer and timestamp version fields.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Is the write rate potentially >1 per second per record?
↓
YES → Use integer version field (incremented atomically)
  ↓
  Need to detect out-of-order events?
  ↓
  YES → Add sequence number alongside version for event ordering
  NO → Simple integer version is sufficient
NO → Is the application using timestamps on all models?
  ↓
  YES → Use updated_at as version; ensure <1s writes are rare
  NO → Integer version field is cleaner and more reliable
  ↓
  Need to merge concurrently updated copies?
  ↓
  YES → Integer version supports deterministic conflict detection
  NO → Timestamp is acceptable with millisecond precision

---

## Rationale

Integer versions are monotonically increasing and never collide. Timestamps can have duplicate values from clock skew or rapid writes, causing incorrect conflict detection.

---

## Recommended Default

**Default:** Integer version column (default: 1, increment on update)
**Reason:** No collision risk; deterministic ordering; widely supported

---

## Risks Of Wrong Choice

Timestamp versions can have duplicates from rapid writes or clock skew, causing silent overwrites. Integer version without initial value allows updates from null state.

---

## Related Rules

Always Check Version in the WHERE Clause of UPDATE Statements

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie

---

## Conflict Resolution Strategy

---

## Decision Context

Determining behavior when optimistic locking detects a conflict.

---

## Decision Criteria

* reliability
* user experience

---

## Decision Tree

Has the version changed since the last read?
↓
YES → Conflict detected; determine resolution strategy
  ↓
  Is the operation idempotent with the same data?
  ↓
  YES → Retry automatically: re-read fresh data, re-apply operation
  NO → Is the consumer a queue job or webhook?
    ↓
    YES → Release job with backoff delay; retry after re-reading
    NO → Return 409 Conflict to client; client must re-fetch and retry
NO → No conflict; proceed with update and version increment
  ↓
  Need to track conflict frequency?
  ↓
  YES → Log conflicts with resource type and attempt count for tuning
  NO → Silent retry; no conflict monitoring

---

## Rationale

Idempotent operations can retry automatically. Queue jobs should release with backoff. API clients should receive 409 for manual retry. Conflict logging enables tuning.

---

## Recommended Default

**Default:** Release queue jobs with backoff on conflict; return 409 to API clients
**Reason:** Automatic retry for async work; clear signal for synchronous clients

---

## Risks Of Wrong Choice

Automatic retry without backoff on queue jobs causes immediate re-conflict. Returning 200 on conflict silently overwrites data. No conflict logging prevents tuning of retry strategy.

---

## Related Rules

Implement Exponential Backoff Retry on Conflict Failure

---

## Related Skills

Implement Exponential Backoff for Webhook Delivery Retries
