# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 05-metrics-collection
**Knowledge Unit:** prometheus-integration
**Difficulty:** Intermediate
**Category:** Metrics Export & Scraping
**Last Updated:** 2026-06-03

# Overview

Prometheus is the de facto standard for metrics collection and alerting in the cloud native ecosystem. Laravel applications can expose Prometheus metrics via the OpenTelemetry SDK (OTLP → Prometheus exporter in Collector), the `open-telemetry/exporter-prometheus` package, or community packages like `promphp/prometheus_push_gateway`.

The Prometheus exposition format (text-based, `Content-Type: text/plain`) is consumed by the Prometheus server, which scrapes metrics endpoints at configured intervals. Alertmanager handles alert routing based on Prometheus alert rules.

Engineers should care because Prometheus integration transforms application metrics into actionable data. Without it, metrics exist in the application's memory but are not persisted, queried, or alerted upon.

# Core Concepts

**Scrape:** Prometheus server periodically pulls metrics from a target endpoint (`/metrics`). The target returns metrics in Prometheus exposition format. This is the standard collection model.

**Pushgateway:** A Prometheus component for receiving metrics from short-lived jobs (queue workers, batch scripts, cron tasks) that finish before a scrape interval completes. Use sparingly — scrape is preferred.

**Exposition Format:** Text-based format with `TYPE`, `HELP`, and metric lines. Example: `http_requests_total{method="GET",status="200"} 1027`. One line per time series with labels.

**Metric Types:** Counter (cumulative count), Gauge (current value), Histogram (bucketed distribution), Summary (quantile distribution). Map OTel instruments to Prometheus types appropriately.

**Labels:** Key-value pairs that distinguish time series within a metric. `{method="GET", endpoint="/api/orders", status_code="200"}`. Each unique label combination creates a new time series.

**Alertmanager:** Prometheus component that handles alert deduplication, grouping, routing, and notification. Alert rules are defined in Prometheus config and evaluated against collected metrics.

# When To Use

- **All production Laravel applications** with Prometheus infrastructure
- **Containerized/Kubernetes deployments** with auto-discovered scrape targets
- **Applications needing metric-based alerting** (Prometheus + Alertmanager)

# When NOT To Use

- **Applications using only OTel-native backends** (Tempo, Jaeger) — use OTLP export instead
- **Very small deployments** without metrics infrastructure

# Best Practices

**Prefer scrape over push.** Scrape-based collection is more resilient — Prometheus manages collection schedule, handles target health, and automatically discovers new targets. Reserve Pushgateway for short-lived jobs only.

**Use OpenTelemetry SDK as the metrics API.** Generate metrics via OTel Metrics API, export via OTLP to Collector, configure Prometheus exporter in Collector. This provides vendor-neutral instrumentation with Prometheus consumption.

**Limit label cardinality.** Each unique label value combination creates a time series. Keep label values to <100 per label. Monitor cardinality growth.

**Name metrics following conventions.** Prometheus naming convention: `namespace_metricname_unit`. Example: `laravel_http_requests_total`, `db_query_duration_seconds`.

**Secure the metrics endpoint.** `/metrics` exposes internal operation data. Do not expose on public networks. Use internal DNS or require authentication for external access.

# Architecture Guidelines

Two primary integration patterns:

1. **OTLP → Collector → Prometheus:** Application emits OTel metrics. Collector receives via OTLP, processes, and exposes Prometheus scrape endpoint. Prometheus scrapes Collector. This is the recommended pattern for OTel-instrumented apps.

2. **Direct Prometheus export:** Application includes `open-telemetry/exporter-prometheus` and exposes `/metrics` directly. Prometheus scrapes the application. Simpler but couples application to Prometheus format.

Scrape-based collection is preferred over Pushgateway. Pushgateway is only appropriate for batch jobs that complete before the next scrape interval.

# Performance Considerations

- **Scrape endpoint generation:** Generating the exposition format for all metrics takes 1-50ms depending on metric count. CPU cost on each scrape
- **Scrape interval:** 15-60s is standard. Faster scraping increases application CPU but provides more granular data
- **Histogram bucket count:** 10-15 buckets per histogram is standard. More buckets increase exposition size
- **Label cardinality monitoring:** High cardinality (>10,000 unique combinations) degrades scrape performance and Prometheus storage

# Security Considerations

- **Metrics endpoint exposure:** `/metrics` reveals internal operation data (request rate, error rate, endpoint performance). Do not expose publicly
- **Pushgateway authentication:** Pushgateway should require basic auth or network-level access control
- **Metric label review:** Ensure metric labels do not contain PII or sensitive data
- **Prometheus access control:** Restrict access to Prometheus UI and API to engineering team

# Common Mistakes

**Using Pushgateway for long-lived processes.** Pushgateway is designed for short-lived jobs. Using it for web server metrics creates single points of failure and stale metrics.

**No label strategy.** Adding arbitrary labels without considering cardinality. Each unique label combination multiplies time series count.

**Counter reset handling.** Prometheus counters reset on process restart. Queries using `rate()` or `increase()` handle resets automatically. Cumulative counters without rate smoothing show sudden drops on restart.

**Exposition format errors.** Invalid metric names (containing hyphens, starting with digits), duplicate TYPE lines, or unescaped label values break Prometheus parsing.

# Anti-Patterns

**Pushgateway for web metrics:** Sending per-request metrics to Pushgateway instead of exposing a scrape endpoint. Pushgateway becomes a bottleneck and single point of failure.

**Unlimited label cardinality:** Adding `user_id` or `request_id` as a label. Each user creates a time series. 100,000 users = 100,000 time series for one metric.

**Metrics endpoint unprotected:** `/metrics` accessible from the public internet. Internal operation data, request rates, and error patterns exposed to anyone.

# Examples

**Prometheus scrape config for Laravel:**
```yaml
scrape_configs:
  - job_name: 'laravel'
    static_configs:
      - targets: ['app:8080']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

# Related Topics

**Prerequisites:**
- OpenTelemetry Metrics API (instrument creation)

**Closely Related Topics:**
- Grafana Dashboard Design (dashboards consuming Prometheus metrics)
- Alerting & Incident Response (Alertmanager integration)

**Advanced Follow-Up Topics:**
- PromQL query optimization
- Recording rules for expensive queries

**Cross-Domain Connections:**
- DevOps & Infrastructure — Prometheus server deployment

# AI Agent Notes

- Scrape-based collection is preferred over Pushgateway for all long-lived processes
- OTel → Collector → Prometheus is the recommended integration pattern
- Keep metric label cardinality low (<100 values per label)
- `/metrics` endpoint must not be publicly exposed
- Naming convention: `appname_metricname_unit`
- Prometheus `rate()` function handles counter reset automatically
- Pushgateway only for short-lived jobs (queue, cron, batch)
