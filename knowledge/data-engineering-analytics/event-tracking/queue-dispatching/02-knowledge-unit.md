# Queue Dispatching

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 01-event-tracking
- **Knowledge Unit:** queue-dispatching
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary

Queue dispatching is the critical decoupling layer that moves analytics events from the HTTP request lifecycle into background processing, preventing analytics ingestion from degrading application performance. The key engineering challenge is architecting the queue topology — connection selection, queue naming, prioritization, batching, failure handling, and backpressure management — to handle analytics throughput without starving application jobs.

---

## Core Concepts

- **Connection Selection:** Redis (best for high-throughput, sub-millisecond latency, required for `ShouldBeUnique`), Database (development/low-volume only), SQS (AWS-native, infinite scalability, higher latency per dispatch)
- **Queue Topology:** Standard pattern: `analytics-events` (raw ingested from middleware), `analytics-enrichment` (needs enrichment), `analytics-storage` (ready for database write), `analytics-exports` (export jobs) — independent scaling per stage
- **Dispatch Latency:** Time from `dispatch()` to job's `handle()` — for real-time dashboards must be under 1 second, for batch analytics minutes acceptable
- **Job Payload Size:** Laravel serializes to JSON — large payloads (> 64KB) stress Redis memory and hit SQS limits — keep payloads lean
- **ShouldBeUnique:** Prevents duplicate jobs when middleware fires multiple times — configure uniqueness window carefully

---

## Mental Models

- **Queue as Shock Absorber:** The queue absorbs traffic spikes between the capture layer (middleware) and the processing layer (workers). Like a car's shock absorber, it smooths out bumps in event volume so the processing layer sees a steady, manageable flow.
- **Separate Lanes on Highway:** Analytics and application queues are separate lanes on a highway. If analytics and emails share the same lane, a 1M-event import blocks all password reset emails. Dedicated lanes ensure critical traffic flows regardless of analytics volume.

---

## Internal Mechanics

Middleware captures event data, extracts required fields into a payload/array, and calls `dispatch()`. The queue driver (Redis, database, SQS) serializes the job and pushes it to the configured queue. A queue worker (separate process) pops jobs from the queue, deserializes, and executes `handle()`. For analytics, a multi-stage pipeline is typical: middleware dispatches to `analytics-events`, enrichment worker consumes and dispatches to `analytics-storage`, storage worker writes to database. Each stage has independent retry policies and worker configurations. Backpressure mechanisms monitor queue depth and reduce dispatch rate when queues exceed thresholds.

---

## Patterns

- **Dedicated Analytics Queue Connection:** Always use a separate queue connection and queue names for analytics events — prevents analytics traffic from starving application jobs (emails, notifications)
- **Multi-Stage Pipeline with Retry Tiers:** Capture queue (low retries 3-5, re-delivery may be stale), Enrichment queue (moderate retries 5-10, external services may recover), Storage queue (high retries 10-15, database outages transient)
- **ShouldBeUnique with Payload Hash:** Use `ShouldBeUnique` with an event ID hash and 5-10 second window to prevent duplicate event processing from middleware re-execution

---

## Architectural Decisions

Choose Redis for production analytics queues — its sub-millisecond dispatch latency and atomic operations support `ShouldBeUnique` and rate limiting. Use separate queue names per environment (`staging-analytics-events`, `production-analytics-events`) to prevent cross-environment pollution. Keep job payloads lean by extracting only required fields in middleware rather than serializing the full request context.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Decouples capture from processing | Queue latency before events available | Eventual consistency for dashboards |
| Absorbs traffic spikes | Requires queue infrastructure (Redis/SQS) | Operational complexity and cost |
| Enables retry handling | Duplicate processing risk | Must use ShouldBeUnique and idempotent consumers |
| Stage-independent scaling | Pipeline topology complexity | Must monitor each queue depth |

---

## Performance Considerations

Redis dispatch is extremely fast (< 1ms) but Redis memory is finite — monitor `used_memory` for queue payloads. Large payloads increase Redis memory and serialization time. Queue worker concurrency should match database write capacity — more workers = more parallel writes, but too many overwhelm the database. Batch dispatching (`Batch::add()`) reduces Redis round trips but delays individual event availability.

---

## Production Considerations

Queue payloads may contain request data — never queue raw passwords, tokens, or full request bodies. Queue workers run in different process context — ensure tenant isolation is re-verified in the worker, not inherited from dispatch. Failed jobs may be retried — ensure retries are idempotent. Monitor for job injection attacks — validate all data before processing. Track queue depth, worker saturation, and failed job rates per queue.

---

## Common Mistakes

- **Sharing Queue with Application Jobs:** Analytics events on the default queue alongside email jobs — an analytics import delays all password reset emails by hours. Better: dedicated queue connection for analytics.
- **Overly Large Payloads:** Capturing the entire request object as serialized payload — each event is 100KB+, Redis runs out of memory. Better: extract and serialize only needed fields.
- **No Unique Job Protection:** Same event dispatched multiple times from middleware re-execution — duplicate events inflate analytics counts. Better: `ShouldBeUnique` with event ID hash and short window.

---

## Failure Modes

- **Synchronous Fallback Without Warning:** Queue connection fails and code silently falls back to synchronous processing — request is blocked, no one knows the queue is down. Mitigation: log warning when fallback triggers, monitor queue health.
- **Infinite Retry on Validation Errors:** Jobs that fail due to data validation errors are retried indefinitely — consuming worker time. Mitigation: distinguish transient (retry) from permanent (fail immediately) failures.
- **Backpressure Collapse:** Ingestion rate exceeds processing capacity, queue depth grows unbounded, Redis runs out of memory. Mitigation: monitor queue depth, implement sampling-based backpressure.

---

## Ecosystem Usage

Laravel's queue system is the backbone of analytics event processing. The `ShouldQueue` interface and `dispatch()` helper are used in every analytics middleware. Queue connections are configured in `config/queue.php` with analytics-specific Redis connections. Horizon provides monitoring and configuration for Redis-based analytics queues. Packages like `spatie/laravel-analytics` dispatch events to configurable queue connections.

---

## Related Knowledge Units

### Prerequisites
- Middleware Event Tracking — Source of queue dispatches

### Related Topics
- Multi-Tenancy Analytics — Queue per tenant isolation strategies
- Circuit Breaker — Protecting queue workers from failing external services

### Advanced Follow-up Topics
- CQRS Read Models — Queue projections update read models
- Reverb WebSocket — Queue-dispatch-then-broadcast pattern

---

## Research Notes

The multi-stage queue topology is a well-established pattern in event-driven architectures. The separation of capture, enrichment, and storage into independent queues with different retry policies originated from practical experience with analytics pipelines where each stage has different failure characteristics. Redis-based queues are the standard for Laravel analytics due to their speed and atomic operations, but SQS is increasingly used for burst-prone analytics traffic in AWS-native deployments.
