# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 01-event-tracking
**Knowledge Unit:** queue-dispatching
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Queue topology designed — connection selection, queue naming, and prioritization for analytics events
- [ ] Dispatch latency budget defined and measured (time from terminate() to queue enqueue)
- [ ] Job payload size optimized — serialized event payload within acceptable limits
- [ ] ShouldBeUnique trait evaluated to prevent duplicate event processing
- [ ] Batch dispatching implemented for high-volume event types
- [ ] Queue per tenant isolation strategy designed (K018 integration)

---

# Architecture Checklist

- [ ] Analytics events use dedicated queue connection separate from application job queue
- [ ] Queue named per event type (page_views, clicks, custom_events) for granular worker scaling
- [ ] Job prioritization implemented so critical analytics events processed before bulk events
- [ ] Batch dispatching used for non-time-sensitive events to reduce queue throughput
- [ ] Queue dispatch is the only side effect in tracking middleware — no direct DB writes
- [ ] Queue worker count and concurrency tuned per analytics event type

---

# Implementation Checklist

- [ ] Job class created per analytics event type implementing ShouldQueue
- [ ] ShouldBeUnique evaluated to deduplicate rapid-fire identical events
- [ ] Batch dispatching via Bus::batch() for events collected during request lifecycle
- [ ] Job middleware (rate-limited, throttle) applied to prevent queue worker overload
- [ ] Event payload serialized to array before dispatch (no Eloquent models, no request objects)
- [ ] Queue connection config in config/queue.php with separate analytics section

---

# Performance Checklist

- [ ] Queue backend chosen for analytics throughput (Redis recommended, database avoided)
- [ ] Job payload size minimized — no unnecessary context fields serialized
- [ ] Dispatch latency benchmarked at 99th percentile under peak load
- [ ] Batch dispatching reduces queue write operations by grouping events
- [ ] Queue worker count and timeout configured per event batch size
- [ ] ShouldBeUnique evaluated for performance impact (uniqueness check overhead)

---

# Security Checklist

- [ ] Queue payload inspected for sensitive data before dispatch — PII stripped
- [ ] Queue connection credentials stored in environment config, not hardcoded
- [ ] Queue jobs cannot be manipulated by tenant — payload validated at job start
- [ ] Queue failed_jobs table protected from unauthorized read access
- [ ] Encrypted queue connections for analytics events crossing network boundaries

---

# Reliability Checklist

- [ ] Queue failure handled by job retry with exponential backoff and max attempts
- [ ] Failed analytics jobs routed to dedicated failed_jobs for replay, not lost
- [ ] Queue backlog alert configured when analytics queue exceeds threshold
- [ ] Dispatch failure (connection down) caught in middleware and logged, not crashed
- [ ] Idempotent job processing — re-processing same event does not duplicate
- [ ] Queue supervisor configured to restart workers on memory threshold

---

# Testing Checklist

- [ ] Test job dispatched with correct payload and queue name from middleware
- [ ] Test ShouldBeUnique prevents duplicate event within uniqueness window
- [ ] Test batch dispatching processes all events in batch successfully
- [ ] Test queue failure retry mechanism (exponential backoff, max attempts)
- [ ] Test job idempotency — re-running job does not double-count event
- [ ] Test dispatch from terminated middleware does not block response

---

# Maintainability Checklist

- [ ] Job classes organized in app/Jobs/Analytics/ directory per event type
- [ ] Queue naming convention documented (analytics.{event_type}.{priority})
- [ ] ShouldBeUnique key generation logic documented and reviewed
- [ ] Batch dispatching logic extracted into dedicated dispatch service class
- [ ] Queue topology diagram maintained in operations documentation

---

# Anti-Pattern Prevention Checklist

- [ ] Do not dispatch Eloquent models to queue — dispatch array of IDs
- [ ] Do not mix analytics jobs with application jobs on same queue connection
- [ ] Do not use synchronous queue for analytics in production
- [ ] Do not set unlimited max attempts — cap with dead-letter routing
- [ ] Do not dispatch per-element — batch or queue per request, not per event

---

# Production Readiness Checklist

- [ ] Prometheus metrics for queue dispatch rate, job processing time, and backlog per queue
- [ ] Logged warning when analytics queue backlog exceeds configurable threshold
- [ ] Alert when job failure rate exceeds 5% for any analytics queue
- [ ] Queue worker count scaled per event type importance
- [ ] Deploy checklist includes queue:restart after job class changes
- [ ] Staging load test validates analytics queue throughput under peak load

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: dedicated connection, per-event queues, batch dispatch, prioritization
- [ ] Security requirements satisfied: payload PII stripped, credentials env-only, payload validation
- [ ] Performance requirements satisfied: Redis backend, minified payload, batch dispatch, unique evaluation
- [ ] Testing requirements satisfied: dispatch correctness, ShouldBeUnique, batch processing, idempotency, backoff
- [ ] Anti-pattern checks passed: no model dispatch, separated connections, no sync queue, capped attempts, batched
- [ ] Production readiness verified: queue metrics, backlog alerts, failure alerts, worker scaling, deploy checklist

---

# Related References

- K001 (Middleware Event Tracking): Source of queue dispatches
- K008 (CQRS Read Models): Queue projections update read models
- K010 (Reverb WebSocket): Queue-dispatch-then-broadcast pattern
- K018 (Multi-Tenancy): Queue per tenant isolation strategies
