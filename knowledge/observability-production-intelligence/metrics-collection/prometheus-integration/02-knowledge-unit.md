# Prometheus Integration

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 05-metrics-collection
- **Knowledge Unit:** prometheus-integration
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Prometheus is the de facto standard for metrics collection and alerting in the cloud native ecosystem. Laravel applications expose Prometheus metrics via OpenTelemetry SDK (OTLP → Prometheus exporter in Collector) or direct exporters, transforming application metrics into actionable data that can be queried, alerted upon, and visualized.

---

## Core Concepts

- **Scrape:** Prometheus server periodically pulls metrics from a target endpoint (`/metrics`) — the standard collection model
- **Pushgateway:** Component for receiving metrics from short-lived jobs (queue workers, batch scripts) that finish before a scrape interval completes
- **Exposition Format:** Text-based format with `TYPE`, `HELP`, and metric lines — `http_requests_total{method="GET"} 1027`
- **Metric Types:** Counter (cumulative), Gauge (current value), Histogram (bucketed distribution), Summary (quantile distribution)
- **Labels:** Key-value pairs distinguishing time series within a metric — each unique combination creates a new time series
- **Alertmanager:** Handles alert deduplication, grouping, routing, and notification based on Prometheus alert rules

---

## Mental Models

- **Garden Watering Model:** Scrape is like scheduled garden watering — Prometheus visits each plant (endpoint) on a regular schedule to collect data. Pushgateway is like bringing water to the garden when plants can't be reached
- **Library Catalog Model:** Each metric is a book, labels are the catalog metadata (author, genre, year). Each unique label combination is a separate copy in the catalog
- **Checkbook Model:** Each time series is a bank account. Every new label value opens a new account. With 100,000 user_id labels, you have 100,000 accounts to maintain — expensive and slow

---

## Internal Mechanics

Two primary integration patterns exist. In the OTel pattern, the application emits OTel metrics, the Collector receives them via OTLP and exposes a Prometheus scrape endpoint. Prometheus scrapes the Collector. In the direct pattern, the application includes `open-telemetry/exporter-prometheus` and exposes `/metrics` directly. Prometheus generates the exposition format from all registered metrics on each scrape request (1-50ms generation time). Alertmanager receives alerts from Prometheus based on configured rules and routes to notification channels.

---

## Patterns

- **OTLP → Collector → Prometheus:** Application emits OTel metrics → Collector receives via OTLP → Collector exposes Prometheus endpoint. Benefit: vendor-neutral instrumentation with Prometheus consumption. Tradeoff: requires Collector infrastructure.
- **Direct Prometheus Export:** Application includes exporter and exposes `/metrics`. Benefit: simpler, no Collector needed. Tradeoff: couples application to Prometheus format.
- **Pushgateway for Short-Lived Jobs:** Batch scripts and queue workers push metrics on completion. Benefit: captures metrics from processes too short for scrape. Tradeoff: single point of failure; stale metrics if push fails.

---

## Architectural Decisions

**Prefer scrape over push.** Scrape-based collection is more resilient — Prometheus manages collection schedule, handles target health, and automatically discovers new targets. Reserve Pushgateway for short-lived jobs only.

**Use OTel SDK as the metrics API.** Generate metrics via OTel Metrics API, export via OTLP to Collector, configure Prometheus exporter in Collector. This provides vendor-neutral instrumentation with Prometheus consumption.

**Limit label cardinality.** Each unique label value combination creates a time series. Keep label values to <100 per label.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Scrape-based collection is resilient and self-healing | Requires Prometheus infrastructure | Standard for cloud native deployments |
| OTLP → Collector → Prometheus is vendor-neutral | Requires OTel Collector | Decouples app from metric format |
| Pushgateway captures short-lived job metrics | Single point of failure; stale metrics possible | Use sparingly, only for batch jobs |

---

## Performance Considerations

Scrape endpoint generation takes 1-50ms depending on metric count — CPU cost on each scrape. Standard scrape interval is 15-60s. Histogram bucket count (10-15 is standard) affects exposition size. High cardinality (>10,000 unique combinations) degrades scrape performance and Prometheus storage.

---

## Production Considerations

`/metrics` endpoint reveals internal operation data (request rate, error rate, endpoint performance) — do not expose publicly. Pushgateway should require authentication or network-level access control. Ensure metric labels do not contain PII or sensitive data. Restrict access to Prometheus UI and API to engineering team.

---

## Common Mistakes

**Using Pushgateway for long-lived processes** — Pushgateway is designed for short-lived jobs. Using it for web server metrics creates single points of failure and stale metrics.

**No label strategy** — adding arbitrary labels without considering cardinality. Each unique label combination multiplies time series count.

**Counter reset handling** — Prometheus counters reset on process restart. Queries using `rate()` or `increase()` handle resets automatically. Cumulative counters without rate smoothing show sudden drops on restart.

**Exposition format errors** — invalid metric names, duplicate TYPE lines, or unescaped label values break Prometheus parsing.

---

## Failure Modes

**Pushgateway accumulation:** Metrics pushed but never cleaned up — old metric values persist indefinitely. Detection: stale metrics in Prometheus queries. Mitigation: use Pushgateway with `push_add_metrics` disabled; implement cleanup.

**High cardinality explosion:** A label with unbounded values (user_id, request_id) creates millions of time series. Detection: Prometheus storage grows rapidly; queries time out. Mitigation: never use unbounded values as labels; set cardinality limits.

**Scrape target down:** Prometheus cannot reach the metrics endpoint. Detection: target appears as DOWN in Prometheus UI. Mitigation: configure proper readiness probes; ensure metrics endpoint is not behind authentication.

---

## Ecosystem Usage

Laravel applications expose Prometheus metrics via OpenTelemetry (recommended) via the OTel → Collector → Prometheus path. Community packages like `promphp/prometheus_push_gateway` provide direct Prometheus client functionality. Grafana dashboards consume Prometheus metrics for visualization. Alertmanager handles routing for Prometheus alerts.

---

## Related Knowledge Units

### Prerequisites
- OpenTelemetry Metrics API (instrument creation)

### Related Topics
- Grafana Dashboard Design (dashboards consuming Prometheus metrics)
- Alerting & Incident Response (Alertmanager integration)

### Advanced Follow-up Topics
- PromQL query optimization
- Recording rules for expensive queries

---

## Research Notes

Scrape-based collection is preferred over Pushgateway for all long-lived processes. OTel → Collector → Prometheus is the recommended integration pattern. Keep metric label cardinality low (<100 values per label). `/metrics` endpoint must not be publicly exposed. Naming convention: `appname_metricname_unit`. Pushgateway only for short-lived jobs (queue, cron, batch).
