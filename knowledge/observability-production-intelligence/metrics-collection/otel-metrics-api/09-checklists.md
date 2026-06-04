# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 05-metrics-collection
**Knowledge Unit:** otel-metrics-api
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] OTel Metrics API instruments understood: Counter, UpDownCounter, Histogram, ObservableGauge
- [ ] MeterProvider initialized with SDK configuration
- [ ] Business metrics identified: orders processed, revenue, active users
- [ ] System metrics identified: request duration, queue depth, cache hit ratio
- [ ] Aggregation temporality (delta vs cumulative) decided per instrument
- [ ] Cardinality limits defined per metric to prevent explosion

---

# Architecture Checklist

- [ ] MeterProvider configured with reader and exporter
- [ ] Counter used for monotonically increasing values (requests, orders)
- [ ] UpDownCounter used for values that increase and decrease (queue depth, connections)
- [ ] Histogram used for distribution measurements (latency, payload size)
- [ ] ObservableGauge used for externally-measured values (memory usage, CPU)
- [ ] Aggregation temporality: delta preferred for rate queries, cumulative for totals

---

# Implementation Checklist

- [ ] `MeterProvider` created in service provider with service name
- [ ] Meters created per domain (orders, users, cache, queues)
- [ ] Counters registered for key business events: `orders.created`, `users.registered`
- [ ] Histogram registered for endpoint latency: `http.request.duration`
- [ ] ObservableGauge registered for memory: `process.memory.usage`
- [ ] Attributes attached to metrics with high-value, low-cardinality keys

---

# Performance Checklist

- [ ] Metric recording overhead measured per call (sub-millisecond expected)
- [ ] Histogram bucket boundaries tuned for expected value range
- [ ] Aggregation temporality impact on memory usage assessed
- [ ] Cardinality limits enforced via attribute allowlist
- [ ] Metric export interval tuned (default 60s) for visibility vs overhead
- [ ] MeterProvider shutdown registered for clean metric flush

---

# Security Checklist

- [ ] Metric attributes reviewed for PII or sensitive data
- [ ] Business metrics (revenue, order counts) access-restricted
- [ ] User ID not used as metric attribute (high cardinality)
- [ ] Metric export endpoint authenticated
- [ ] Metric data in transit encrypted (TLS)
- [ ] Metric retention policy compliant with data governance

---

# Reliability Checklist

- [ ] Metric recording failure does not crash application
- [ ] Export timeout configured for backend connectivity issues
- [ ] Aggregation temporality consistency across SDK restarts
- [ ] Histogram overflow bucket handling verified
- [ ] Counter drift detection (e.g., on process restart for cumulative)
- [ ] Metric reader backpressure handling on slow export

---

# Testing Checklist

- [ ] Unit test: Counter records correct monontonic sum
- [ ] Unit test: Histogram records distribution correctly
- [ ] Unit test: UpDownCounter handles positive and negative deltas
- [ ] Integration test: metrics visible in Prometheus/Grafana dashboard
- [ ] Performance test: recording overhead < 100 microseconds per call
- [ ] Stress test: high-frequency metric labels do not cause OOM

---

# Maintainability Checklist

- [ ] Metric names follow OpenTelemetry semantic conventions
- [ ] Meter instances organized by domain in `App\Metrics` namespace
- [ ] Attribute key naming convention documented
- [ ] Metric definitions listed in ADR for team reference
- [ ] Cardinality review scheduled quarterly per metric
- [ ] Dashboard queries documented alongside metric definition

---

# Anti-Pattern Prevention Checklist

- [ ] No high-cardinality attributes (user IDs, email, session tokens)
- [ ] No Counter for non-monotonic values (use UpDownCounter)
- [ ] No Histogram with more than 100 buckets
- [ ] No metric recording in hot path without measuring overhead
- [ ] No business metrics exposed on public endpoint
- [ ] No metric naming conflicts across different domains

---

# Production Readiness Checklist

- [ ] Metric export confirmed to Prometheus or OTel Collector
- [ ] Grafana dashboard provisioned with key metrics
- [ ] Metric alerting configured for anomaly detection
- [ ] Cardinality explosion alert configured
- [ ] Metric retention aligned with storage budget
- [ ] Baseline metric values captured before launch

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: MeterProvider configured, instrument types matched to use cases, temporality decided
- [ ] Security requirements satisfied: attributes sanitized, business metrics access-restricted, export encrypted
- [ ] Performance requirements satisfied: overhead measured, bucket boundaries tuned, cardinality limited
- [ ] Testing requirements satisfied: all instrument types tested, export confirmed, stress test passed
- [ ] Anti-pattern checks passed: no high-cardinality attributes, correct instrument choice, public exposure avoided
- [ ] Production readiness verified: export confirmed, dashboard created, alerts configured, baseline captured

---

# Related References

- Prometheus Integration (Prometheus exposition format for OTel metrics)
- OpenTelemetry PHP SDK (MeterProvider setup)
- Laravel Pulse (first-party metrics dashboard, complementary to OTel)
