# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 05-olap-modeling
**Knowledge Unit:** cqrs-read-model-projector
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Read model pattern understood — analytics data as projection of domain events
- [ ] Projector class created for each analytics read model
- [ ] Domain events dispatched from operational code, consumed by projectors
- [ ] Queue-backed projectors configured for reliable async processing (K002)
- [ ] Eventual consistency window defined and communicated to stakeholders
- [ ] Replaying mechanism for rebuilding read models from event history

---

# Architecture Checklist

- [ ] Read model table in analytics schema (K019) — denormalized, query-optimized
- [ ] Projector class listens to domain event, projects into read model
- [ ] Domain event is the source of truth — read model is a derived projection
- [ ] Queue (K002) decouples event dispatch from projector processing
- [ ] Star schema (K006) pattern for read model table design
- [ ] Projector idempotent — replaying same event does not duplicate read model row

---

# Implementation Checklist

- [ ] Domain event class created (App\Events\OrderCompleted) with necessary data
- [ ] Projector class created (App\Projectors\OrderProjector) implementing ShouldQueue
- [ ] Read model table created via migration with analytics schema prefix
- [ ] Event dispatched from operational code: OrderCompleted::dispatch($order)
- [ ] Projector handles event: reads event data, upserts into read model table
- [ ] Replay command: truncate read model, re-dispatch all events, verify row count

---

# Performance Checklist

- [ ] Read model query returns sub-100ms responses (pre-joined, pre-aggregated)
- [ ] Projector processing not on critical request path — async queue (K002)
- [ ] Read model index optimized for dashboard query access patterns
- [ ] Replaying does not affect production performance — separate queue or maintenance window
- [ ] Idempotency check O(1) — unique key for event deduplication
- [ ] Read model storage growth monitored (denormalized data duplicates source)

---

# Security Checklist

- [ ] Read model contains only fields needed for dashboard — no extra PII projected
- [ ] Domain event payload sanitized before projection (sensitive data stripped)
- [ ] Read model table permissions read-only for dashboard access
- [ ] Projector queue connection uses restricted permissions
- [ ] Replay command restricted to admin-only CLI invocation

---

# Reliability Checklist

- [ ] Projector failure does not lose event — queue retries with backoff (K002)
- [ ] Eventual consistency window measured and monitored (dispatch-to-projector latency)
- [ ] Projector idempotent via unique constraint — same event id cannot double-insert
- [ ] Replay reader ensures read model is eventually consistent with event history
- [ ] Projector order maintained if events must be processed in sequence

---

# Testing Checklist

- [ ] Test projector creates correct read model row when event is handled
- [ ] Test projector idempotent — handling same event twice does not duplicate
- [ ] Test read model query returns current projected data
- [ ] Test replay rebuilds read model from all events
- [ ] Test eventual consistency — event dispatched, read model updated within SLA
- [ ] Test projector failure triggers queue retry and eventually succeeds

---

# Maintainability Checklist

- [ ] Projector classes in App\Projectors\ directory, one per read model
- [ ] Domain events in App\Events\ directory with descriptive names
- [ ] Read model naming: rm_{domain}_{purpose} (e.g., rm_orders_daily_summary)
- [ ] Event-to-read-model mapping documented in data dictionary
- [ ] Replay command scripted and documented for non-engineering team members

---

# Anti-Pattern Prevention Checklist

- [ ] Do not treat read model as source of truth — domain event is the source
- [ ] Do not use projectors synchronously — defeats decoupling purpose
- [ ] Do not project all event fields into read model — project only what dashboards need
- [ ] Do not skip idempotency — queue retries will produce duplicate rows
- [ ] Do not forget event ordering — projectors must handle out-of-order events

---

# Production Readiness Checklist

- [ ] Prometheus metrics for projector processing time, read model query latency, event-to-read lag
- [ ] Logged warning when projector queue backlog exceeds threshold
- [ ] Alert if eventual consistency window exceeds SLA
- [ ] Read model storage growth tracked monthly
- [ ] Deploy checklist includes projector registration in service provider
- [ ] Replay procedure documented and tested in staging

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: projector/read model separation, async queue, star schema design
- [ ] Security requirements satisfied: minimal projected fields, sanitized event data, read-only dashboards
- [ ] Performance requirements satisfied: sub-100ms queries, async offloading, index optimization
- [ ] Testing requirements satisfied: projection correctness, idempotency, replay, eventual consistency, retry
- [ ] Anti-pattern checks passed: event as source of truth, async projectors, minimal fields, idempotent
- [ ] Production readiness verified: projector latency metrics, queue backlog alerts, consistency SLA, replay runbook

---

# Related References

- K002 (Queue Dispatching): Queue-backed projectors depend on reliable queue infrastructure
- K019 (Analytic Schema Separation): The analytics schema as the read model storage
- K029 (Temporal Queries): Point-in-time state reconstruction from event streams
- K006 (Star Schema): Read models often implement star schema for query performance
