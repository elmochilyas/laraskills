# Skill: Monitor and Observe AI Gateway Performance

## Purpose
Set up comprehensive observability for the AI gateway including request metrics (latency, tokens, cost), provider health monitoring, cost tracking by application/team, structured logging with PII redaction, and alerting on anomalies.

## When To Use
- Any production AI gateway — observability is not optional for production systems
- Multi-provider setups where cost tracking across providers is needed
- Teams that need to bill internal teams or clients based on AI usage
- Compliance environments requiring audit trails for AI API usage

## When NOT To Use
- Local development — basic logging suffices
- Prototypes where the observability infrastructure adds more overhead than the gateway itself

## Prerequisites
- KU-01 (AI Gateway Fundamentals) — understanding of gateway request flow
- Metrics infrastructure (Prometheus, or vendor metrics service)
- Log aggregation service (Elasticsearch, Loki, or vendor log service)
- Dashboard service (Grafana, or vendor dashboard)
- Pricing table for all configured providers and models

## Inputs
- Provider list and model pricing per provider
- Request flow (middleware pipeline stages)
- Alerting thresholds (latency SLOs, error rate budget, cost budgets)
- Compliance requirements (log retention, audit trail requirements)
- Team/application mappings for cost allocation

## Workflow
1. **Define metric dimensions**: Identify the key dimensions for segmentation: provider, model, task type, application/team, status code, cache status, streaming vs. non-streaming. Every metric should be taggable by these dimensions.
2. **Implement metrics middleware**: Create an `ObservabilityMiddleware` that wraps the gateway request. Before: record start time. After: compute latency, extract token usage, compute cost, emit counters and histograms. Target <1ms overhead.
3. **Track cost per request**: Implement a cost calculator using a cached pricing table. Compute cost from actual token usage × per-model pricing. Track by application, team, and feature for cost allocation.
4. **Set up structured logging**: Configure structured logging with consistent fields: correlation_id, provider, model, tokens (prompt/completion), cost, latency, cache status, status code, error details. Redact PII before writing logs.
5. **Build dashboards**: Create canonical dashboards for: latency (heatmap by provider), errors (stacked area by error type), cost (time-series by provider/team/feature), cache performance (hit rate, miss rate, eviction), streaming metrics (TTFT, TPS).
6. **Configure alerting**: Set alerts based on business impact: error rate >1% (5-minute window), p95 latency >2x baseline, cost increase >20% week-over-week, provider health check failure, cache hit rate drop >50%.
7. **Implement tracing**: Add OpenTelemetry (or equivalent) distributed tracing with correlation IDs propagated through the application → gateway → provider flow. Use sampling (1:100 for high throughput).
8. **Handle high throughput**: For gateways >1000 req/s, implement log sampling (1:10 for success, 1:1 for errors), async metric emission (batch + flush every 5s), and tracing sampling (1:100).
9. **Set up log retention**: Define retention policies per log type: raw logs 30 days, aggregated metrics 12 months, cost data 36 months. Implement automated purging.
10. **Review and iterate**: Weekly review of dashboards for anomalies. Monthly review of cost trends and alert thresholds. Quarterly review of retention and sampling policies.

## Validation Checklist
- [ ] Metrics are emitted for every request (counter, latency histogram, cost histogram)
- [ ] Logs are structured with consistent fields and PII redacted
- [ ] Cost is computed server-side using a maintained pricing table
- [ ] Dashboards exist for latency, errors, cost, and cache performance
- [ ] Alerts are configured for error rate spikes, latency degradation, and cost anomalies
- [ ] Log retention policy is defined and enforced
- [ ] Metrics and logs are sampled appropriately for the request volume

## Common Failures
- **Cost tracking is inaccurate**: Pricing table is outdated or doesn't match provider's billing. Fix: maintain pricing table as code with review on provider pricing changes.
- **Logs contain PII**: PII redaction transform not applied before logging. Fix: ensure PII redaction is always the first response transform and runs before logging middleware.
- **Alert fatigue**: Too many alerts with low signal. Fix: focus on business-impact alerts (cost spikes, error rates) rather than raw metric thresholds.
- **Metrics without context**: Raw numbers with no segmentation by provider/model/team. Fix: ensure all metrics are tagged with relevant dimensions.
- **Metric loss during gateway restart**: Counter-based metrics reset on restart. Fix: use cumulative counters with rate() or use a time-series DB for persistence.

## Decision Points
- **Log sampling rate**: 1:10 for high-throughput (>1000 req/s) to control costs. 1:1 for errors and slow requests (always log at full fidelity for anomalies).
- **Metric storage duration**: 30 days for raw metrics (high granularity). 12 months for downsampled metrics (1-hour resolution). 36 months for cost data.
- **Alert severity**: P1: complete service outage or >$1000/day cost anomaly. P2: error rate >1% or latency >3x baseline. P3: cache hit rate drop or single provider degradation.

## Performance Considerations
- Metrics emission: <1ms per request (async batch writer — flush every 5s)
- Log sampling: 1:10 reduces log volume by 90% for high throughput
- Cost computation: cached pricing table — <1ms lookup
- Tracing overhead: OpenTelemetry adds 1-5ms per span — use sampling
- Log storage: 1-5KB per request. At 1000 req/s, that's 86-430 GB/day. Plan retention accordingly.
- Async logging: use queue or UDP to avoid blocking the request path

## Security Considerations
- Redact PII from all logs before writing — use PII redaction transform from the pipeline
- Restrict log access to operations and security teams (logs contain request/response data)
- Aggregated metrics may leak business intelligence (request volume indicates business activity) — restrict dashboard access
- Alert notifications must not leak sensitive data (no request details in PagerDuty/Slack)
- Implement log retention compliance (GDPR, CCPA, HIPAA) with automated purging
- Metrics should not expose API keys, user identities, or sensitive business logic

## Related Rules
- Implement a type-safe provider capability registry to prevent unsupported operation calls
- Implement a common TelemetryInterface that every provider driver must implement
- Always implement streaming via provider-agnostic SSE events, not provider-specific event types

## Related Skills
- Skill: Set Up an AI Gateway with Routing, Caching, and Failover (ku-01)
- Skill: Load Balance Across AI Providers (ku-02)
- Skill: Manage API Keys Securely (ku-03)
- Skill: Transform Requests and Responses at the Gateway (ku-04)
- Skill: Track AI Usage Costs (cost-ku-01)

## Success Criteria
- Every request produces metrics (latency, tokens, cost), structured logs (with PII redacted), and trace (correlation ID)
- Dashboards show real-time latency heatmaps, error rates by provider, cost by team/application, and cache performance
- Alerts detect and notify on: error rate >1%, p95 latency >2x baseline, cost increase >20% week-over-week
- Cost tracking is accurate to within 1% of provider billing (verified monthly)
- Log retention is enforced with automated purging per policy
- Metrics and logs are fully sampled at appropriate rates without losing error context
- Gateway team can identify which provider/model/feature costs the most within 1 click of the dashboard