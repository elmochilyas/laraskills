# Metadata

**Domain:** api-integration-engineering
**Subdomain:** observability
**Knowledge Unit:** integration-metrics
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Alert thresholds configured based on baseline data
- [ ] Circuit breaker state transitions recorded
- [ ] Metrics displayed in Pulse dashboard
- [ ] Correlate Integration Metrics with Business Metrics
- [ ] Monitor Leading Indicators, Not Just Lagging
- [ ] Set Alert Thresholds Based on Baseline Data
- [ ] Track Request Volume, Latency, and Error Rate Per Service
- [ ] Track Webhook Delivery Success Rate
- [ ] `/metrics` endpoint exposed for scraping
- [ ] Alert thresholds configured
- [ ] Dashboard built for integration overview
- [ ] Build Grafana dashboard for integration overview
- [ ] Collect metrics via middleware or Guzzle on-request handler
- [ ] Define metrics per integration: request count, latency (p50/p95/p99), error count, rate limit headroom

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Build Grafana dashboard for integration overview
- [ ] Collect metrics via middleware or Guzzle on-request handler
- [ ] Define metrics per integration: request count, latency (p50/p95/p99), error count, rate limit headroom
- [ ] Expose metrics endpoint: `/metrics` for Prometheus scraping
- [ ] Monitor metric trends over time for anomaly detection
- [ ] Set alert thresholds on error rate and latency
- [ ] Tag metrics with integration name, endpoint, status code
- [ ] Use Prometheus client or log-structured metrics
- [ ] Correlate Integration Metrics with Business Metrics
- [ ] Monitor Leading Indicators, Not Just Lagging
- [ ] Set Alert Thresholds Based on Baseline Data
- [ ] Track Request Volume, Latency, and Error Rate Per Service

---

# Performance Checklist

- [ ] Avoid blocking metric collection on critical path; use async recording
- [ ] Metric collection adds <1ms overhead per request (increment counters)
- [ ] Pulse snapshot storage: ~100 bytes per snapshot per queue
- [ ] Sample metrics for high-volume integrations to reduce storage

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] No baseline period before setting alert thresholds (too noisy or too silent)
- [ ] Not correlating metrics across layers (HTTP errors + queue delays + business impact)
- [ ] Storing all raw metrics indefinitely (unbounded storage growth)
- [ ] Tracking only error rates, not leading indicators (retry rate, headroom)
- [ ] Track Request Volume, Latency, and Error Rate Per Service

---

# Testing Checklist

- [ ] `/metrics` endpoint exposed for scraping
- [ ] Alert thresholds configured
- [ ] Alert thresholds configured based on baseline data
- [ ] Circuit breaker state transitions recorded
- [ ] Dashboard built for integration overview
- [ ] Metric trends monitored for anomalies
- [ ] Metrics collection via middleware or handler
- [ ] Metrics defined per integration (count, latency, errors, rate limit)
- [ ] Metrics displayed in Pulse dashboard
- [ ] Metrics tagged with integration, endpoint, status

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Tracking Only Error Rates, Not Leading Indicators]
- [ ] [No Baseline Period Before Setting Alert Thresholds]
- [ ] [Storing All Raw Metrics Indefinitely]
- [ ] [Not Correlating Metrics Across Layers]
- [ ] [Blocking Metric Collection on the Critical Path]

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


