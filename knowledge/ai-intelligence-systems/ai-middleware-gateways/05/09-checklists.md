# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-middleware-gateways
**Knowledge Unit:** ku-05
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Alert on business impact, not raw metrics.
- [ ] Compute cost server-side
- [ ] Emit metrics before and after every request.
- [ ] Set up dashboards
- [ ] Use structured logging
- [ ] Alerts are configured for error rate spikes, latency degradation, and cost anomalies.
- [ ] Cost is computed server-side using a maintained pricing table.
- [ ] Dashboards exist for latency, errors, cost, and cache performance.
- [ ] Rules for Provider Abstraction Layer
- [ ] Alerts are configured for error rate spikes, latency degradation, and cost anomalies
- [ ] Cost is computed server-side using a maintained pricing table
- [ ] Dashboards exist for latency, errors, cost, and cache performance
- [ ] **Build dashboards**: Create canonical dashboards for: latency (heatmap by provider), errors (stacked area by error type), cost (time-series by provider/team/feature), cache performance (hit rate, miss rate, eviction), streaming metrics (TTFT, TPS).
- [ ] **Configure alerting**: Set alerts based on business impact: error rate >1% (5-minute window), p95 latency >2x baseline, cost increase >20% week-over-week, provider health check failure, cache hit rate drop >50%.
- [ ] **Define metric dimensions**: Identify the key dimensions for segmentation: provider, model, task type, application/team, status code, cache status, streaming vs. non-streaming. Every metric should be taggable by these dimensions.
- [ ] Alerts detect and notify on: error rate >1%, p95 latency >2x baseline, cost increase >20% week-over-week
- [ ] Cost tracking is accurate to within 1% of provider billing (verified monthly)
- [ ] Dashboards show real-time latency heatmaps, error rates by provider, cost by team/application, and cache performance

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering
- [ ] Implement input validation, output sanitization, and PII handling
- [ ] Implement response caching with appropriate TTL and invalidation strategy

---

# Implementation Checklist

- [ ] Alert on business impact, not raw metrics.
- [ ] Compute cost server-side
- [ ] Emit metrics before and after every request.
- [ ] Set up dashboards
- [ ] Use structured logging
- [ ] **Build dashboards**: Create canonical dashboards for: latency (heatmap by provider), errors (stacked area by error type), cost (time-series by provider/team/feature), cache performance (hit rate, miss rate, eviction), streaming metrics (TTFT, TPS).
- [ ] **Configure alerting**: Set alerts based on business impact: error rate >1% (5-minute window), p95 latency >2x baseline, cost increase >20% week-over-week, provider health check failure, cache hit rate drop >50%.
- [ ] **Define metric dimensions**: Identify the key dimensions for segmentation: provider, model, task type, application/team, status code, cache status, streaming vs. non-streaming. Every metric should be taggable by these dimensions.
- [ ] **Handle high throughput**: For gateways >1000 req/s, implement log sampling (1:10 for success, 1:1 for errors), async metric emission (batch + flush every 5s), and tracing sampling (1:100).
- [ ] **Implement metrics middleware**: Create an `ObservabilityMiddleware` that wraps the gateway request. Before: record start time. After: compute latency, extract token usage, compute cost, emit counters and histograms. Target <1ms overhead.
- [ ] **Implement tracing**: Add OpenTelemetry (or equivalent) distributed tracing with correlation IDs propagated through the application â†’ gateway â†’ provider flow. Use sampling (1:100 for high throughput).
- [ ] **Review and iterate**: Weekly review of dashboards for anomalies. Monthly review of cost trends and alert thresholds. Quarterly review of retention and sampling policies.

---

# Performance Checklist

- [ ] Cost computation involves a lookup and multiplication â€” cache the pricing table and compute in <1ms.
- [ ] Log sampling: for high-throughput gateways (>1000 req/s), sample logs (1:10 or 1:100) and only log full details for errors.
- [ ] Log storage grows fast: each request generates 1-5KB of log data. At 1000 req/s, that's 86-430 GB/day. Plan retention accordingly.
- [ ] Metrics emission should be <1ms per request. Use async metric writers (batch + flush every 5s).
- [ ] Tracing overhead: OpenTelemetry adds 1-5ms per span. Use sampling (1:100 for production).
- [ ] Async logging: use queue or UDP to avoid blocking the request path
- [ ] Cost computation: cached pricing table â€” <1ms lookup
- [ ] Log sampling: 1:10 reduces log volume by 90% for high throughput

---

# Security Checklist

- [ ] Alert channels:
- [ ] Log access control:
- [ ] Log retention:
- [ ] Metric aggregation:
- [ ] PII in logs:
- [ ] Implement log retention compliance (GDPR, CCPA, HIPAA) with automated purging
- [ ] Metrics should not expose API keys, user identities, or sensitive business logic
- [ ] Redact PII from all logs before writing â€” use PII redaction transform from the pipeline

---

# Reliability Checklist

- [ ] **Ignoring cache metrics** â€” cache hit rate, miss rate, and eviction rate are critical for understanding efficiency.
- [ ] **Missing latency breakdown** â€” knowing total latency is insufficient. Break down into: gateway overhead, provider latency, and transform time.
- [ ] **Not setting up alerts** â€” discovering a provider outage through user complaints is unacceptable.
- [ ] **Not tracking cost** â€” without per-request cost data, it's impossible to optimize spend or bill internally.
- [ ] **Sampling error logs** â€” errors should always be logged at full fidelity, never sampled.

---

# Testing Checklist

- [ ] Alerts are configured for error rate spikes, latency degradation, and cost anomalies
- [ ] Alerts are configured for error rate spikes, latency degradation, and cost anomalies.
- [ ] Alerts detect and notify on: error rate >1%, p95 latency >2x baseline, cost increase >20% week-over-week
- [ ] Cost is computed server-side using a maintained pricing table
- [ ] Cost is computed server-side using a maintained pricing table.
- [ ] Cost tracking is accurate to within 1% of provider billing (verified monthly)
- [ ] Dashboards exist for latency, errors, cost, and cache performance
- [ ] Dashboards exist for latency, errors, cost, and cache performance.
- [ ] Dashboards show real-time latency heatmaps, error rates by provider, cost by team/application, and cache performance
- [ ] Every request produces metrics (latency, tokens, cost), structured logs (with PII redacted), and trace (correlation ID)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Use structured logging

---

# Anti-Pattern Prevention Checklist

- [ ] [API Keys Hardcoded in Gateway Configuration]
- [ ] [No Key Rotation Schedule â€” Keys Never Changed]
- [ ] [Shared Keys Across Environments â€” Dev Key Works in Production]
- [ ] [No Key Usage Monitoring â€” Can't Detect Compromised Keys]
- [ ] [Keys in Version Control â€” Credential Leak]
- [ ] Dashboard Sprawl:
- [ ] Log Everything, Analyze Nothing:
- [ ] Metrics Without Context:
- [ ] Synchronous Logging:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Alert notifications must not leak sensitive data (no request details in PagerDuty/Slack)
- [ ] Async logging: use queue or UDP to avoid blocking the request path
- [ ] Implement log retention compliance (GDPR, CCPA, HIPAA) with automated purging

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


