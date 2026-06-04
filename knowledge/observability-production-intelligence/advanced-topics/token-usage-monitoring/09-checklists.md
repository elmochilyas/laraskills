# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 09-advanced-topics
**Knowledge Unit:** token-usage-monitoring
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Token consumption tracked per model, user, feature, and time period for cost attribution
- [ ] OTel Counter and Histogram metrics configured for token usage instrumentation
- [ ] Real-time cost dashboards built by combining token counts with API pricing data
- [ ] Budget alerts and anomaly detection set for unexpected token consumption spikes

---

# Architecture Checklist

- [ ] Token metrics pipeline designed alongside LLM tracing, not as a separate observability silo
- [ ] Metric dimensions selected to support cost attribution (model, user, feature, environment)
- [ ] Aggregation strategy chosen for Counter and Histogram metric types

---

# Implementation Checklist

- [ ] OTel Counter instrument created for total token count per request or batch
- [ ] OTel Histogram instrument created for token distribution per model
- [ ] Prompt tokens, completion tokens, and total tokens recorded as separate metric attributes
- [ ] Cost per 1K tokens mapped from provider pricing into metric labels
- [ ] Token counting method chosen (API response tokens vs local estimation)

---

# Performance Checklist

- [ ] Metric emission configured as asynchronous to avoid adding latency to LLM requests
- [ ] Histogram bucket boundaries tuned for expected token ranges per model
- [ ] Cardinality of metric dimensions reviewed to prevent Prometheus metric explosion

---

# Security Checklist

- [ ] Cost data aggregated to prevent exposure of individual user spending
- [ ] API pricing configuration stored in secure configuration, not hardcoded
- [ ] Token metrics stripped of PII before export to monitoring backend

---

# Reliability Checklist

- [ ] Token metric emission fails gracefully if LLM API response lacks token counts
- [ ] Fallback estimation method implemented for providers that do not return token counts
- [ ] Metric data buffered locally if OTel exporter is temporarily unavailable

---

# Testing Checklist

- [ ] Unit tests verify token count extraction from multiple LLM provider responses
- [ ] Integration tests confirm Counter and Histogram metrics reach Prometheus
- [ ] Tests cover edge cases: zero-token responses, missing usage fields, provider errors
- [ ] Budget alert thresholds tested against historical token usage data

---

# Maintainability Checklist

- [ ] Provider pricing configuration externalized to a config file or database, not hardcoded
- [ ] Metric naming follows OpenTelemetry semantic convention for gen_ai metrics
- [ ] Dashboard definitions version-controlled alongside application code

---

# Anti-Pattern Prevention Checklist

- [ ] No synchronous metric export blocking the LLM API response path
- [ ] No unbounded metric dimensions causing cardinality explosion
- [ ] No hardcoded per-model pricing that goes stale on provider price changes

---

# Production Readiness Checklist

- [ ] Token usage dashboards deployed showing per-model, per-user, and per-feature breakdowns
- [ ] Budget alerts configured with appropriate thresholds and notification channels
- [ ] Cost anomaly detection rules set to flag >2x normal token consumption
- [ ] Metric retention policy aligned with cost reporting cycles (monthly/quarterly)

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

- LLM Tracing with OpenTelemetry (span-level token attributes)
- OTel Metrics API (Counter, Histogram instrument types)
- Prometheus Integration (token cost dashboards and alerting)
