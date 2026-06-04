# Metadata

**Domain:** Data Engineering & Analytics
**Subdomain:** Read Models & CQRS for Analytics
**Knowledge Unit:** CQRS Read Model / Projector Pattern for Analytics
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Synchronous vs Queued Projectors

---

## Decision Context

Choosing between synchronous (in-request) and queued (async) projectors for read model updates.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Is the projector updating a read model for the analytics dashboard?
↓
YES → Always queue the projector — analytics should never degrade the primary application experience
        ↓
        Does the projector need to reflect data immediately (sub-second consistency)?
        YES → Queue with a fast, low-latency queue connection (Redis) — 10-50ms latency is acceptable for eventual consistency
                ↓
                Can the application tolerate a brief delay between event and read model update?
                YES → Queued projector is fine — the delay is milliseconds for fast queues
                NO → Re-evaluate whether eventual consistency is acceptable — CQRS is eventually consistent by design
        NO → Queue with default connection — 1-5 second delay is acceptable for most analytics use cases
NO → Is the projector a non-critical, fast operation (< 5ms)?
        YES → Synchronous projection may be acceptable — but queue as default, sync only for edge cases
        NO → Always queue — analytics projections are never critical enough to block the HTTP response

---

## Rationale

A slow or failing analytics write in the HTTP request path causes the response to fail. Failed analytics should never result in a 500 error for the customer. Queuing ensures the primary application experience is decoupled from analytics processing.

---

## Recommended Default

**Default:** All projectors dispatch to a queue — never update read models synchronously
**Reason:** Analytics degradation should never affect the primary application; queue isolation ensures this

---

## Risks Of Wrong Choice

Synchronous projector: slow analytics query blocks HTTP response; analytics error causes 500 error for customer; no queue backpressure handling: queue fills up during load spike, potentially losing events

---

## Related Rules

K008: Always Dispatch Event Handling to Queue, K008: Updating Read Models Synchronously is a Mistake

---

## Related Skills

Implement CQRS Read Model Projector

---

## One Projector Per Read Model vs Monolithic Projector

---

## Decision Context

Determining the granularity of projector classes — one per read model or a single projector for all models.

---

## Decision Criteria

* maintainability
* testability

---

## Decision Tree

Does the application have more than 3 read models?
↓
YES → Create one projector class per read model — each is independent, testable, and replayable
        ↓
        Do multiple read models share the same event source?
        YES → One projector per model still applies — each model has independent logic; shared event subscription is fine
                ↓
                Are the projectors idempotent?
                YES → Independent projectors can replay separately without affecting each other
                NO → Add idempotency (upsert/updateOrCreate) — one projector's replay should not depend on another's state
        NO → One per model keeps things simple and focused
NO → Single projector is acceptable for 1-2 simple read models
        ↓
        Is the team expected to add more read models?
        YES → Split into separate projectors proactively — easier to refactor now than later
        NO → Single projector is fine — minimal overhead for a small number of models

---

## Rationale

A single projector updating 15 tables is tightly coupled. Changing any read model logic requires modifying the same file. Replaying all models requires running one projector, which takes hours. One projector per read model keeps things independent and fast.

---

## Recommended Default

**Default:** One projector class per read model; each implements ShouldQueue and uses idempotent upsert
**Reason:** Independent, testable, replayable — the projector pattern is only beneficial when projectors are decoupled

---

## Risks Of Wrong Choice

Fat projector: any read model change affects all models; replay takes hours; single test failure blocks all models; per-model projectors with no idempotency: replay creates duplicates

---

## Related Rules

K008: One Projector Class Per Read Model, K008: Make Every Projector Idempotent

---

## Related Skills

Implement CQRS Read Model Projector

---

## Event-Driven Projectors vs Scheduled (Cron) Aggregation

---

## Decision Context

Choosing between event-by-event projectors (queue-based) and scheduled batch aggregation for read model updates.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Does the read model require continuous, up-to-date data (< 5 minute delay)?
↓
YES → Use event-driven projectors — each event triggers an incremental update
        ↓
        Is the event volume very high (> 10K events/minute)?
        YES → Batch events before upsert — process in 100-row chunks to avoid database contention
                ↓
                Is the per-event update complex (multi-table aggregation)?
                YES → Consider scheduled batch aggregation instead — complex per-event updates do not scale to high volume
                NO → Chunked event-driven updates work well
        NO → Standard event-by-event projector is fine — one upsert per event
NO → Use scheduled (cron) projectors — batch compute the read model on a schedule (hourly, daily)
        ↓
        Is the computation expensive (cohort analysis, retention, funnels)?
        YES → Scheduled is the only viable approach — these computations require full data scans and cannot be done incrementally per event
        NO → Scheduled is simpler but introduces data staleness — acceptable for daily reports

---

## Rationale

Event-driven projectors provide up-to-date read models at the cost of per-event database operations. Scheduled batch aggregation is simpler and more efficient for complex computations but introduces data staleness.

---

## Recommended Default

**Default:** Event-driven projectors for incremental metrics (counts, sums); scheduled batch for complex analytics (cohorts, funnels)
**Reason:** Each approach matches the computational pattern — incremental for simple updates, batch for complex

---

## Risks Of Wrong Choice

Event-driven for complex aggregation: per-event cohort recomputation is O(N²) and does not scale; scheduled for real-time: dashboard data is always 1-hour stale

---

## Related Rules

K008: Scheduled Projectors for Complex Aggregations

---

## Related Skills

Implement CQRS Read Model Projector, Build Scheduled Analytics Jobs
