# Knowledge Unit: Observability & Monitoring

## Metadata

- **ID:** ku-05
- **Subdomain:** AI Middleware & Gateways
- **Slug:** observability---monitoring
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Observability for AI gateways covers the collection, aggregation, and visualization of metrics, logs, and traces for every LLM API request. Unlike standard API observability, AI gateway observability must track token usage, cost per request, model behavior, latency percentiles, and error rates across multiple providers. This data feeds into cost allocation, capacity planning, performance optimization, and anomaly detection. In the Laravel ecosystem, observability is typically implemented using Laravel's built-in logging, Prometheus metrics, and distributed tracing.

## Core Concepts

- **Request Metrics:** Count, latency (p50/p95/p99), token usage (prompt + completion), cost per request.
- **Provider Metrics:** Error rate, rate limit hits, availability per provider endpoint.
- **Cost Tracking:** Per-request cost (computed from token counts Ã— provider pricing), aggregated by application, team, or feature.
- **Model Behavior Metrics:** Response length, tool call frequency, refusal rate, streaming chunk rate.
- **Distributed Tracing:** End-to-end trace from application â†’ gateway â†’ provider â†’ gateway â†’ application.
- **Logs:** Request/response bodies (with PII redaction), error details, routing decisions, cache hits/misses.
- **Alerting:** Anomaly detection on error rate spikes, latency degradation, cost spikes, and provider outages.

## Mental Models

- **Request Metrics:** Count, latency (p50/p95/p99), token usage (prompt + completion), cost per request.
- **Provider Metrics:** Error rate, rate limit hits, availability per provider endpoint.
- **Cost Tracking:** Per-request cost (computed from token counts Ã— provider pricing), aggregated by application, team, or feature.


## Internal Mechanics

The internal mechanics of Observability & Monitoring follow established patterns within the AI Middleware & Gateways domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Emit metrics before and after every request.** Track everything: routing decision, cache status, provider response, latency breakdown.
- **Use structured logging** with consistent fields across all log entries (correlation_id, provider, model, tokens, latency, status).
- **Compute cost server-side** using a pricing table, not from provider responses (which may change).
- **Set up dashboards** for the three pillars: latency (heatmaps), errors (stacked area charts), cost (time-series by provider).
- **Alert on business impact, not raw metrics.** "Cost increase >20% week-over-week" matters more than "latency >2s".

## Patterns

- **Emit metrics before and after every request.** Track everything: routing decision, cache status, provider response, latency breakdown.
- **Use structured logging** with consistent fields across all log entries (correlation_id, provider, model, tokens, latency, status).
- **Compute cost server-side** using a pricing table, not from provider responses (which may change).
- **Set up dashboards** for the three pillars: latency (heatmaps), errors (stacked area charts), cost (time-series by provider).
- **Alert on business impact, not raw metrics.** "Cost increase >20% week-over-week" matters more than "latency >2s".

## Architectural Decisions

- Implement observability as **middleware** in the gateway pipeline â€” every request passes through the observability middleware.
- Use **structured log drivers** (Laravel's `stderr` with JSON, or directly to OpenTelemetry/ELK).
- For metrics, use **Prometheus** with counters (requests, errors, tokens) and histograms (latency).
- For tracing, implement **OpenTelemetry** with the correlation ID propagated through every service.
- Store raw logs in a **log aggregation service** (Elasticsearch, Loki) with a retention policy (30-90 days).
- Store aggregated metrics in a **time-series database** (Prometheus, TimescaleDB) for long-term trends.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Metrics emission should be <1ms per request. Use async metric writers (batch + flush every 5s).
- Log sampling: for high-throughput gateways (>1000 req/s), sample logs (1:10 or 1:100) and only log full details for errors.
- Cost computation involves a lookup and multiplication â€” cache the pricing table and compute in <1ms.
- Tracing overhead: OpenTelemetry adds 1-5ms per span. Use sampling (1:100 for production).
- Log storage grows fast: each request generates 1-5KB of log data. At 1000 req/s, that's 86-430 GB/day. Plan retention accordingly.

## Production Considerations

- **PII in logs:** All log entries must be redacted for PII before writing. Use the same redaction transforms from ku-04.
- **Log access control:** Logs contain sensitive request/response data. Restrict access to operations and security teams.
- **Metric aggregation:** Aggregated metrics may leak business intelligence (e.g., request volume indicates business activity).
- **Alert channels:** Ensure alert notifications don't leak sensitive data (no request details in PagerDuty/Slack).
- **Log retention:** Comply with data retention regulations (GDPR, CCPA, HIPAA). Implement automated log purging.

## Common Mistakes

- **Not tracking cost** â€” without per-request cost data, it's impossible to optimize spend or bill internally.
- **Sampling error logs** â€” errors should always be logged at full fidelity, never sampled.
- **Missing latency breakdown** â€” knowing total latency is insufficient. Break down into: gateway overhead, provider latency, and transform time.
- **Ignoring cache metrics** â€” cache hit rate, miss rate, and eviction rate are critical for understanding efficiency.
- **Not setting up alerts** â€” discovering a provider outage through user complaints is unacceptable.

## Failure Modes

- **Dashboard Sprawl:** 50 dashboards that nobody looks at. Focus on 1-2 canonical dashboards plus targeted alerting.
- **Log Everything, Analyze Nothing:** Collecting all data but having no pipeline to extract insights. Define SLOs and measure against them.
- **Metrics Without Context:** Raw numbers without segmentation (by provider, model, feature, user) are nearly useless.
- **Synchronous Logging:** Blocking the request to write logs. Logs must be async (queue, UDP, or batch writer).

## Ecosystem Usage

### Metrics Middleware
```php
class ObservabilityMiddleware implements MiddlewareInterface {
    public function process(Request $request, callable $next): Response {
        $start = hrtime(true);

        $response = $next($request);

        $latencyMs = (hrtime(true) - $start) / 1_000_000;
        $tokens = $response->usage();
        $cost = $this->calculator->compute($tokens, $request->model());

        $this->metrics->counter('ai_requests_total', 1, [
            'provider' => $request->provider(),
            'model' => $request->model(),
            'status' => $response->statusCode(),
        ]);
        $this->metrics->histogram('ai_request_latency_ms', $latencyMs, [
            'provider' => $request->provider(),
        ]);
        $this->metrics->histogram('ai_cost_usd', $cost, [
            'provider' => $request->provider(),
        ]);

        return $response;
    }
}
```

### Structured Log Entry
```json
{
  "timestamp": "2026-06-02T12:00:00Z",
  "correlation_id": "req_abc123",
  "provider": "openai",
  "model": "gpt-4o",
  "latency_ms": 1240,
  "tokens": { "prompt": 450, "completion": 120 },
  "cost_usd": 0.0035,
  "cache_hit": false,
  "status": 200,
  "route": "chat/completions"
}
```

## Related Knowledge Units

- ku-01 (AI Gateway Fundamentals): Gateway architecture being monitored.
- ku-02 (Load Balancing & Failover): Monitoring provider health for routing decisions.
- cost-management-observability/ku-01: Cost tracking and allocation.
- cost-management-observability/ku-03: Observability-specific cost management.
- ai-safety-security/ku-03: Security monitoring and anomaly detection.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

