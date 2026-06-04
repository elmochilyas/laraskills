# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 05-metrics-collection
**Knowledge Unit:** otel-metrics-api
**Difficulty:** Advanced
**Category:** Metrics Instrumentation
**Last Updated:** 2026-06-03

# Overview

The OpenTelemetry Metrics API provides standard instruments for recording numerical measurements: Counter (monotonic sum), UpDownCounter (non-monotonic sum), Histogram (distribution), and Observable instruments (Gauge, Counter, UpDownCounter) for externally-measured values. The API is stable in PHP as of 2026.

Laravel applications can instrument business metrics (orders processed, revenue, active users) alongside system metrics (request duration, queue depth, cache hit ratio). Unlike logging, which captures individual events with context, metrics capture aggregated numerical data at regular intervals. This makes metrics ideal for dashboards, alerting, and trend analysis.

Engineers should care because metrics provide the "what" (error rate is 5%) while logs provide the "why" (which specific request caused the error). Both are needed, but metrics are cheaper to store and faster to query than logs.

# Core Concepts

**Counter:** A monotonic, cumulative instrument that only increases (request count, bytes served, orders created). Resets on process restart.

**UpDownCounter:** A non-monotonic instrument that can increase or decrease (queue depth, active connections, concurrent users).

**Histogram:** Records distribution statistics — counts values in configurable buckets (request latency, payload size, query duration). Enables p50/p95/p99 calculations.

**ObservableGauge:** Reports a value that is externally measured (memory usage, CPU load, disk space). Non-cumulative — represents the value at the observation time.

**Meter:** The instrument creator, analogous to Tracer for traces. Created by MeterProvider. Organize meters by domain: `orders`, `users`, `cache`, `http`.

**Aggregation Temporality:** How metrics are aggregated over time. Delta — report values since last export. Cumulative — report total values since process start. Delta preferred for rate-based queries, cumulative for totals.

**Cardinality:** The number of unique attribute combinations for a metric. Each unique combination creates a separate time series. High cardinality (>1000 combinations) causes storage and performance issues.

# When To Use

- **Business metrics tracking** — orders, revenue, signups, churn
- **System health monitoring** — request rate, error rate, latency percentiles
- **Capacity planning** — resource utilization trends over time
- **SLA monitoring** — uptime percentage, response time compliance

# When NOT To Use

- **Debugging individual requests** — use logging or tracing for per-request detail
- **One-off measurements** — if a metric is observed once and never again, it does not need instrumentation
- **High-cardinality data** — user-level metrics (per-user counts) are better served by application databases

# Best Practices

**Match instrument type to metric behavior.** Monotonically increasing values → Counter. Values that go up and down → UpDownCounter. Distribution measurements → Histogram. External measurements → ObservableGauge.

**Keep cardinality low.** Metric dimensions (attributes) should have <100 unique values each. Tenants, services, endpoints, and status codes are good attributes. User IDs, email addresses, and session IDs are not.

**Use Delta temporality for rate queries.** Prometheus-style rate calculations (requests/second) work best with Delta temporality. Cumulative temporality requires handling resets.

**Name metrics consistently.** Follow OpenTelemetry semantic conventions: `{namespace}.{domain}.{unit}`. Examples: `http.server.request.duration`, `db.client.queries.count`.

**Add meter per domain.** Create separate Meter instances for different business domains. This organizes metrics and prevents naming collisions.

# Architecture Guidelines

Metric data flow:
1. Application code creates metric values via instruments (Counter, Histogram, etc.)
2. MeterProvider aggregates metric values in memory
3. MetricReader (periodic or pull-based) collects aggregated data
4. MetricExporter sends to backend (Prometheus, OTLP Collector, etc.)

The aggregation temporality and export interval significantly affect memory usage and query semantics. Configure based on query requirements: short intervals for alerting, longer intervals for trend analysis.

# Performance Considerations

- **Recording overhead:** Typically < 10μs per metric recording. Negligible impact on request latency
- **Memory usage:** Aggregation in memory before export. ~1KB per unique time series (metric name + attributes)
- **Export interval:** Default 60s. Shorter intervals increase CPU and network but provide granular data
- **Histogram buckets:** More buckets = more memory and CPU. Default 10-15 buckets per histogram is sufficient

# Security Considerations

- **Metric attribute sanitization:** Metric attributes are visible in dashboards and backends. Do not include PII or secrets
- **Business metric access:** Revenue, order counts, and user growth metrics may be sensitive. Restrict dashboard access
- **Export encryption:** Metrics exported via OTLP should use TLS. Prometheus scrape endpoints should be internal
- **Cardinality explosion attacks:** If users can trigger unique attribute combinations, they can cause metric storage explosion. Validate and limit attribute values

# Common Mistakes

**Wrong instrument type.** Using Counter for values that can decrease (queue depth, active users). Counter assumes monotonic increase; decreases create negative values that are ignored.

**High cardinality attributes.** Adding `user_id` as a metric attribute. Each unique user creates a separate time series. With 10,000 users, this creates 10,000 time series for a single metric — storage and query performance collapse.

**No aggregation temporality consideration.** Using Delta temporality when the query expects cumulative (counter total since process start). Or using Cumulative when the query expects rate (requests per second).

**Histogram with too many buckets.** Defining 100+ histogram buckets. Most backends optimize for 10-20 buckets. More buckets increase storage without adding meaningful precision.

# Anti-Patterns

**Metrics as a debugging tool:** Adding metric attributes for every possible dimension (request ID, user ID, browser version). Metrics are for aggregation, not debugging. Use logs or traces for per-request detail.

**Business metrics on public endpoints:** Exposing revenue, user count, or order rate on the public `/metrics` endpoint without authentication. Business metrics must be access-restricted.

**Synchronous export blocking requests:** Configuring synchronous metric export that blocks the request while waiting for the backend. Use async export or non-blocking readers.

**No metric naming convention:** Metrics named `orders`, `orderCount`, `order_total` across different services. Standardize naming to avoid confusion in cross-service dashboards.

# Examples

**Counter for order processing:**
```php
$meter = $meterProvider->getMeter('commerce');
$orderCounter = $meter->createCounter('orders.created', [
    'description' => 'Number of orders created',
]);
$orderCounter->add(1, ['region' => $order->region, 'currency' => $order->currency]);
```

**Histogram for request latency:**
```php
$latencyHistogram = $meter->createHistogram('http.request.duration', [
    'description' => 'HTTP request duration in ms',
    'unit' => 'ms',
]);
$latencyHistogram->record($duration, ['method' => $request->method(), 'route' => $route]);
```

# Related Topics

**Prerequisites:**
- OpenTelemetry PHP SDK (MeterProvider setup)

**Closely Related Topics:**
- Prometheus Integration (Prometheus exposition format)
- Laravel Pulse (first-party metrics dashboard, complementary to OTel)

**Advanced Follow-Up Topics:**
- Grafana Dashboard Design (visualizing OTel metrics)

**Cross-Domain Connections:**
- Cost & Resource Optimization — metrics-based capacity planning

# AI Agent Notes

- OTel Metrics API is stable in PHP since v1.0 (2026)
- Counter for monotonic values, UpDownCounter for non-monotonic, Histogram for distributions
- Keep cardinality low — each unique attribute combination creates a time series
- Use semantic convention naming: `{domain}.{metric}.{unit}`
- Delta temporality for Prometheus-compatible queries
- Export interval default 60s — acceptable for most use cases
- Never use user IDs or session tokens as metric attributes
