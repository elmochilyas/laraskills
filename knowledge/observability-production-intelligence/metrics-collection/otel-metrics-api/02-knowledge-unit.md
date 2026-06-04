# OpenTelemetry Metrics API

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 05-metrics-collection
- **Knowledge Unit:** otel-metrics-api
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

The OpenTelemetry Metrics API provides standard instruments for recording numerical measurements — Counter (monotonic sum), UpDownCounter (non-monotonic sum), Histogram (distribution), and Observable instruments for externally-measured values. Metrics provide the "what" (error rate is 5%) while logs provide the "why" — both are needed, but metrics are cheaper to store and faster to query.

---

## Core Concepts

- **Counter:** Monotonic, cumulative instrument that only increases — request count, bytes served, orders created
- **UpDownCounter:** Non-monotonic instrument that can increase or decrease — queue depth, active connections, concurrent users
- **Histogram:** Records distribution statistics in configurable buckets — request latency, payload size, query duration (enables p50/p95/p99)
- **ObservableGauge:** Reports externally-measured values — memory usage, CPU load, disk space (non-cumulative)
- **Meter:** Instrument creator (analogous to Tracer for traces) — organize by domain: `orders`, `users`, `cache`, `http`
- **Cardinality:** Number of unique attribute combinations per metric — high cardinality (>1000) causes storage and performance issues

---

## Mental Models

- **Dashboard vs Log Model:** Metrics are the dashboard gauges (what), logs are the mechanic's notes (why). Both are needed but serve different purposes
- **Odometer vs Speedometer Model:** Counter is an odometer (total distance traveled), Gauge is a speedometer (current speed). Choose the right instrument for the measurement type
- **Storage Cost Model:** One metric time series per unique attribute combination = one database row. 10,000 unique user_id values = 10,000 rows per metric. Choose attributes carefully

---

## Internal Mechanics

Metric data flows through a pipeline: application code creates values via instruments (Counter, Histogram) → MeterProvider aggregates in memory → MetricReader (periodic or pull-based) collects aggregated data → MetricExporter sends to backend. Aggregation temporality (Delta vs Cumulative) significantly affects memory usage and query semantics. Counter values monotonically increase until process restart; UpDownCounter can go both directions; Histogram maintains bucketed counts.

---

## Patterns

- **Instrument Type Matching:** Match instrument to metric behavior — monotonic → Counter, up/down → UpDownCounter, distribution → Histogram, external → ObservableGauge. Benefit: correct semantics for backends. Tradeoff: wrong type produces meaningless data.
- **Domain-Scoped Meters:** Create separate Meter instances per business domain (commerce, users, cache). Benefit: organizes metrics, prevents naming collisions. Tradeoff: more boilerplate setup.
- **Low-Cardinality Attribution:** Use attributes with <100 unique values — tenant, service, endpoint, status code. Avoid user IDs, emails, session IDs. Benefit: manageable time series count. Tradeoff: loses per-user granularity (use logs for that).

---

## Architectural Decisions

**Match instrument type to metric behavior.** Counter for monotonically increasing values, UpDownCounter for values that go up and down, Histogram for distributions, ObservableGauge for external measurements. Wrong type creates meaningless data.

**Keep cardinality low.** Metric attributes should have <100 unique values each. Tenants, services, endpoints, and status codes are good attributes. User IDs, email addresses, and session IDs are not.

**Use Delta temporality for Prometheus-compatible rate queries.** Delta reports values since last export, enabling rate calculations. Cumulative requires handling resets.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Metrics are cheaper to store than logs | Cannot answer "why" for individual events | Use metrics for dashboards, logs for debugging |
| Histogram enables p50/p95/p99 calculations | More histogram buckets = more memory | Default 10-15 buckets is sufficient |
| High-cardinality attributes enable fine-grained queries | Storage and query performance collapse over 1000 combinations | Monitor cardinality growth |

---

## Performance Considerations

Recording overhead is typically <10μs per metric recording — negligible impact on request latency. Aggregation memory is ~1KB per unique time series. Default export interval is 60s — shorter intervals increase CPU and network but provide granular data. Histogram with 10-15 buckets provides sufficient precision for most use cases.

---

## Production Considerations

Metric attributes are visible in dashboards and backends — do not include PII or secrets. Revenue and user growth metrics may be sensitive — restrict dashboard access. Metrics exported via OTLP should use TLS. If users can trigger unique attribute combinations, they can cause cardinality explosion — validate and limit attribute values.

---

## Common Mistakes

**Wrong instrument type** — using Counter for values that can decrease (queue depth, active users). Counter assumes monotonic increase; decreases create negative values that are ignored.

**High cardinality attributes** — adding `user_id` as a metric attribute creates 10,000 time series for 10,000 users — storage and query performance collapse.

**No aggregation temporality consideration** — using Delta when expecting cumulative totals or Cumulative when expecting rates.

**Histogram with too many buckets** — 100+ histogram buckets increase storage without meaningful precision. 10-20 is sufficient.

---

## Failure Modes

**Cardinality explosion:** A new attribute value (new tenant, new endpoint) creates thousands of new time series. Detection: metric storage grows rapidly; queries slow down. Mitigation: set cardinality limits; monitor time series count; use logs for high-cardinality data.

**Instrument type mismatch:** Counter records negative values (ignored by backend), missing metric data. Detection: queue depth metric shows only increases, never decreases. Mitigation: use UpDownCounter for non-monotonic values.

**MeterProvider initialization failure:** SDK fails to initialize MeterProvider. Detection: no metrics appear in dashboards. Mitigation: ensure graceful initialization with fallback to no-op instruments.

---

## Ecosystem Usage

The OTel Metrics API is stable in PHP since v1.0 (2026). Laravel applications use it for business metrics (orders, revenue) and system metrics (request duration, queue depth). Prometheus and compatible backends consume OTel metrics. Laravel Pulse provides first-party metrics but is not a replacement for OTel metrics infrastructure.

---

## Related Knowledge Units

### Prerequisites
- OpenTelemetry PHP SDK (MeterProvider setup)

### Related Topics
- Prometheus Integration (Prometheus exposition format)
- Laravel Pulse (first-party metrics dashboard)

### Advanced Follow-up Topics
- Grafana Dashboard Design (visualizing OTel metrics)

---

## Research Notes

OTel Metrics API is stable in PHP since v1.0. Counter for monotonic, UpDownCounter for non-monotonic, Histogram for distributions. Keep cardinality low — each unique attribute combination creates a time series. Use semantic convention naming: `{domain}.{metric}.{unit}`. Delta temporality for Prometheus. Never use user IDs or session tokens as metric attributes.
