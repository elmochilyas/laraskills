# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 05-metrics-collection
**Knowledge Unit:** prometheus-integration
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Prometheus exposition format (`Content-Type: text/plain`) understood
- [ ] Scrape endpoint configured for Prometheus server
- [ ] OpenTelemetry-to-Prometheus export via Collector evaluated
- [ ] `open-telemetry/exporter-prometheus` package considered
- [ ] `promphp/prometheus_push_gateway` evaluated for job-based metrics
- [ ] Alertmanager integration configured for metric-based alerting

---

# Architecture Checklist

- [ ] Scrape-based vs push-based metric collection decision documented
- [ ] Collector pipeline: OTLP receiver → Prometheus exporter
- [ ] OpenTelemetry exporter-prometheus for direct exposition
- [ ] Pushgateway reserved for short-lived job metrics only
- [ ] Metric types mapped correctly: Counter, Gauge, Histogram, Summary
- [ ] Labels strategy defined (bounded cardinality, tenant/service/endpoint)

---

# Implementation Checklist

- [ ] Metrics endpoint registered in Laravel routes (`/metrics`)
- [ ] OpenTelemetry MeterProvider configured with Prometheus exporter
- [ ] Prometheus scrape configuration updated with target and interval
- [ ] Pushgateway endpoint configured for queue job metrics
- [ ] Histogram bucket definitions aligned with Prometheus conventions
- [ ] Alertmanager rule file created with relevant metric thresholds

---

# Performance Checklist

- [ ] Scrape endpoint response time measured under load
- [ ] Metrics exposition overhead per scrape request assessed
- [ ] Pushgateway push frequency tuned to avoid storage churn
- [ ] Label cardinality monitored to prevent metrics explosion
- [ ] Scrape interval balanced with metric granularity needs
- [ ] Collector batch export optimization for Prometheus

---

# Security Checklist

- [ ] `/metrics` endpoint not publicly exposed (internal network)
- [ ] Pushgateway basic authentication configured
- [ ] Prometheus server access restricted via network policy
- [ ] Metric labels reviewed for PII or sensitive data
- [ ] Alertmanager webhook endpoints authenticated
- [ ] Exporter endpoint authentication configured if needed

---

# Reliability Checklist

- [ ] Scrape failure does not crash application
- [ ] Pushgateway connectivity failure does not block job execution
- [ ] Metric staleness handling configured in Prometheus
- [ ] Alertmanager high availability configured
- [ ] Prometheus storage retention aligned with query needs
- [ ] Metric name changes deployed with backward-compatible aliasing

---

# Testing Checklist

- [ ] Unit test: metrics endpoint returns valid Prometheus format
- [ ] Integration test: Prometheus scrapes and stores metric values
- [ ] Integration test: Alertmanager fires alert on threshold breach
- [ ] Performance test: scrape overhead within acceptable range
- [ ] Stress test: high-label-cardinality metric does not degrade Prometheus
- [ ] Security test: metrics endpoint returns 401 from external network

---

# Maintainability Checklist

- [ ] Metric naming follows Prometheus conventions (`namespace_metric_unit`)
- [ ] Label key naming documented and enforced in code review
- [ ] Alertmanager rules version-controlled with application code
- [ ] Grafana dashboards documented alongside Prometheus metric definitions
- [ ] Prometheus config change process documented
- [ ] Regular metric cleanup review scheduled (quarterly)

---

# Anti-Pattern Prevention Checklist

- [ ] Pushgateway not used for long-lived process metrics
- [ ] Labels not used for high-cardinality values (user IDs, emails)
- [ ] Counter metric names not reused for Gauge (name uniqueness)
- [ ] `/metrics` endpoint not protected by rate limiting
- [ ] Scrape interval not set too low for exposition cost
- [ ] Alertmanager not configured without silence/acknowledge workflow

---

# Production Readiness Checklist

- [ ] Prometheus target health verified in staging
- [ ] Scrape target auto-discovery configured (Kubernetes annotations or static config)
- [ ] Metric retention aligned with storage capacity (default 15 days)
- [ ] Alertmanager notification routing configured to team channel
- [ ] Grafana dashboard created for key business and system metrics
- [ ] Prometheus backup strategy documented

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: scrape/push decision made, Collector or direct exporter configured, label strategy defined
- [ ] Security requirements satisfied: endpoint not public, labels sanitized, Alertmanager webhooks authenticated
- [ ] Performance requirements satisfied: scrape overhead measured, cardinality bounded, interval balanced
- [ ] Testing requirements satisfied: format valid, scrape and store verified, alert threshold tested, stress tested
- [ ] Anti-pattern checks passed: Pushgateway used correctly, no high-cardinality labels, metric names unique
- [ ] Production readiness verified: target health confirmed, auto-discovery configured, retention set, dashboards created

---

# Related References

- OpenTelemetry Metrics API (instrument creation)
- Dashboards & Visualization (Grafana dashboards consuming Prometheus metrics)
- Alerting & Notification (Prometheus Alertmanager integration)
