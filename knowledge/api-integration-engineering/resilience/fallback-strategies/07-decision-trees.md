# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 04-resilience
**Knowledge Unit:** fallback-strategies
**Generated:** 2026-06-03

---

# Decision Inventory

1. Fallback Strategy Selection (Stale Cache vs Failover vs Default)
2. Fallback Response Strategy (Transparent vs Indicated)
3. Write Operation Fallback Strategy

---

# Architecture-Level Decision Trees

---

## Fallback Strategy Selection

---

## Decision Context

Choosing the appropriate fallback when primary API call fails.

---

## Decision Criteria

* reliability
* architectural

---

## Decision Tree

Is the operation read-only (GET)?
↓
YES → Use stale cache fallback (serve expired cached data)
  ↓
  Is stale cache available?
  ↓
  YES → Serve stale cache with warning header
  NO → Return default/empty response; clearly indicate unavailability
NO → Is the operation a write (POST/PUT/DELETE)?
  ↓
  YES → Queue for later retry (don't lose data; don't serve stale)
  NO → Does a secondary provider exist for this data?
    ↓
    YES → Use provider failover strategy with fallback provider
    NO → Return degraded response with clear error communication
  ↓
  Circuit breaker is open?
  ↓
  YES → Skip primary; go directly to fallback (fail-fast)
  NO → Attempt primary; fallback on failure after retries exhausted

---

## Rationale

Read operations can safely serve stale data when fresh data is unavailable. Write operations should be queued for later retry rather than silently dropped. Provider failover works when a secondary provider offers equivalent data.

---

## Recommended Default

**Default:** Stale cache for reads; queue for writes; degraded response as last resort
**Reason:** Maximum availability for reads; no data loss for writes; graceful failure

---

## Risks Of Wrong Choice

Serving stale data for writes causes data inconsistency. No fallback for reads causes error pages for recoverable failures. Silent fallback without logging makes debugging impossible.

---

## Related Rules

Never Fallback Silently, Always Log the Fallback Event

---

## Related Skills

Cache External API Responses to Reduce Latency and Costs

---

## Fallback Response Strategy

---

## Decision Context

Determining whether to indicate fallback data to the consumer.

---

## Decision Criteria

* maintainability
* user experience

---

## Decision Tree

Is the fallback data potentially stale?
↓
YES → Add X-Fallback: true and X-Data-Age headers to response
  ↓
  Is the consumer a user-facing UI?
  ↓
  YES → Show freshness indicator (banner, badge, timestamp)
  NO → Headers are sufficient for API consumers
NO → Is the fallback a default value (zero, empty, placeholder)?
  ↓
  YES → Clearly indicate data is unavailable, not actually zero
  NO → Fallback is transparent; no indicators needed
  ↓
  Need to track fallback frequency for monitoring?
  ↓
  YES → Log every fallback event with service, endpoint, and timestamp
  NO → Log errors only; fallback events are routine

---

## Rationale

Transparent fallback indicators allow consumers to adjust behavior based on data freshness. API consumers can read headers; UI consumers need visible indicators.

---

## Recommended Default

**Default:** X-Fallback header on all fallback responses; UI banner for stale data
**Reason:** Transparent data quality communication; consumer can make informed decisions

---

## Risks Of Wrong Choice

No indicators cause consumers to trust stale data as fresh. Excessive indicators cause alert fatigue and are ignored.

---

## Related Rules

Design Fallbacks That Maintain Data Consistency

---

## Related Skills

Cache External API Responses to Reduce Latency and Costs

---

## Write Operation Fallback Strategy

---

## Decision Context

Handling write operations when the upstream service is unavailable.

---

## Decision Criteria

* reliability
* data consistency

---

## Decision Tree

Is the write operation idempotent?
↓
YES → Queue for later retry; safe to replay
  ↓
  Does order of queued operations matter?
  ↓
  YES → Use sequential queue; preserve operation order
  NO → Queue independently; parallel processing is safe
NO → Is there a compensating action for partial failure?
  ↓
  YES → Queue with compensating rollback on permanent failure
  NO → Fail immediately; do not queue non-idempotent writes
  ↓
  Need to notify user of queued operation?
  ↓
  YES → Show "pending" status with expected completion time
  NO → Process silently; user sees success on eventual completion

---

## Rationale

Idempotent writes can be safely queued and retried. Non-idempotent writes without compensating actions must fail immediately to prevent data corruption. User notification manages expectations for pending operations.

---

## Recommended Default

**Default:** Queue idempotent writes for retry; fail non-idempotent writes immediately
**Reason:** Safe retry for idempotent operations; data corruption prevention for non-idempotent

---

## Risks Of Wrong Choice

Queueing non-idempotent writes causes duplicate side effects on retry. Failing idempotent writes unnecessarily rejects operations that could succeed on retry.

---

## Related Rules

Test Fallback Paths as Rigorously as Primary Paths

---

## Related Skills

Implement Retry and Circuit Breaker
