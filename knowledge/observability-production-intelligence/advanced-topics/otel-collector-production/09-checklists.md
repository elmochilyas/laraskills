# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 09-advanced-topics
**Knowledge Unit:** otel-collector-production
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Collector deployment topology chosen: per-host agent, centralized gateway, or both
- [ ] Resource limits configured to prevent OOM or CPU starvation under load
- [ ] Batch processor and memory limiter pipeline components enabled
- [ ] Persistent queue configured to prevent data loss during restarts
- [ ] Collector health monitored and alerting configured

---

# Architecture Checklist

- [ ] Agent mode vs gateway mode decision documented with scaling rationale
- [ ] Per-host agent pattern validated for Laravel deployment topology
- [ ] Memory limiter processor configured in pipeline with soft/hard limits
- [ ] Backpressure propagation strategy defined from gateway back to agents
- [ ] High availability design reviewed for collector gateway tier

---

# Implementation Checklist

- [ ] Collector configuration file version-controlled with pipeline definitions
- [ ] Batch processor configured with optimal timeout and max size for span throughput
- [ ] Memory limiter processor placed before batch processor in pipeline order
- [ ] Persistent queue storage configured on gateway collector for crash recovery
- [ ] File storage or persistent volume mounted for queue data

---

# Performance Checklist

- [ ] Collector throughput benchmarked at expected peak span volume
- [ ] Memory limiter ballast size tuned to reduce GC pressure
- [ ] Batch processor settings (timeout, min/max size) optimized for latency vs throughput
- [ ] Resource limits (memory, CPU) tuned per-host for agent collector
- [ ] Scaled gateway collector horizontally behind a load balancer

---

# Security Checklist

- [ ] TLS encryption configured between agents and gateway collector
- [ ] Collector API authentication enabled for metrics and health endpoints
- [ ] Sensitive data filtered at collector level using attributes processor
- [ ] Collector RBAC configured for management API access

---

# Reliability Checklist

- [ ] Retry policy configured on exporter with exponential backoff
- [ ] Persistent queue confirmed to survive collector process restart
- [ ] Backpressure tested by simulating backend OTel backend outage
- [ ] Graceful shutdown implemented to flush pending spans before exit
- [ ] Collector health check endpoint exposed for orchestration probes

---

# Testing Checklist

- [ ] Load test validates collector does not drop spans at 2x peak expected volume
- [ ] Failure test confirms persistent queue prevents data loss during crash
- [ ] Backpressure test verifies agents queue locally when gateway is down
- [ ] Integration test validates pipeline from PHP SDK through agent to gateway to backend

---

# Maintainability Checklist

- [ ] Collector configuration organized into reusable components (processors, exporters)
- [ ] Config changes validated with `otelcol validate` before deployment
- [ ] Collector version pinned in infrastructure-as-code and upgrade-tested
- [ ] Monitoring dashboard for collector health (memory, queue size, export errors)

---

# Anti-Pattern Prevention Checklist

- [ ] No memory limiter disabled or misconfigured (risk of OOM)
- [ ] No persistent queue omitted on gateway (risk of data loss)
- [ ] No backpressure propagation ignored (risk of agent OOM)
- [ ] No single gateway without HA in production

---

# Production Readiness Checklist

- [ ] Collector memory and CPU metrics exported to a separate monitoring system
- [ ] Alert rules set for queue size near capacity, export errors, OOM risk
- [ ] Auto-scaling configured for gateway collector based on queue depth or CPU
- [ ] Disaster recovery plan documented for collector failure scenarios
- [ ] Span throughput baseline established for anomaly detection

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related References

- OTLP Exporter & Collector Configuration (basic collector setup)
- OTel Auto-Instrumentation (collector receives auto-instrumented data)
- Span Sampling Strategies (tail sampling in collector)
- OpenTelemetry PHP SDK (SDK-side exporter configuration)
