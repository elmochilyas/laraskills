# Knowledge Unit: Observability & Alerting

## Metadata

- **ID:** ku-03
- **Subdomain:** Cost Management & Observability
- **Slug:** observability---alerting
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Observability and alerting for AI systems covers the real-time monitoring, logging, tracing, and alerting infrastructure that keeps AI applications running reliably and cost-effectively. Beyond standard application observability, AI-specific observability must track token usage, model behavior, provider latency, cost, cache performance, and safety events. This KU focuses on the metrics, logs, traces, and alerts that production AI systems need, building on the cost tracking (ku-01) and optimization (ku-02) foundations.

## Core Concepts

- **Service Level Indicators (SLIs):** Measurable aspects of service performance â€” latency (p50/p95/p99), error rate, throughput, cost per request, cache hit rate.
- **Service Level Objectives (SLOs):** Target values for SLIs (e.g., p95 latency < 2s, error rate < 1%, cost per request < $0.01).
- **Service Level Agreements (SLAs):** Contractual commitments based on SLOs.
- **Burned Budget:** In SLO-based alerting, how much of the error budget has been consumed over the window.
- **Distributed Tracing:** End-to-end request tracing from user â†’ application â†’ gateway â†’ LLM provider â†’ back.
- **Log Levels:** Structured log entries at different severity levels (debug, info, warning, error, critical) with consistent fields.
- **Anomaly Detection:** Automated identification of unusual patterns (sudden latency spike, error rate jump, cost surge).
- **Runbook:** Documented procedure for responding to each alert type.

## Mental Models

- **Service Level Indicators (SLIs):** Measurable aspects of service performance â€” latency (p50/p95/p99), error rate, throughput, cost per request, cache hit rate.
- **Service Level Objectives (SLOs):** Target values for SLIs (e.g., p95 latency < 2s, error rate < 1%, cost per request < $0.01).
- **Service Level Agreements (SLAs):** Contractual commitments based on SLOs.


## Internal Mechanics

The internal mechanics of Observability & Alerting follow established patterns within the Cost Management & Observability domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Define SLOs before building dashboards.** Know what "good" looks like before deciding what to measure.
- **Use the four golden signals:** Latency, traffic, errors, and saturation (cost/usage).
- **Implement structured logging** with a consistent schema across all services. Every log entry should include `correlation_id`, `timestamp`, `service`, `level`, `message`.
- **Set up multi-channel alerting** (PagerDuty, Slack, email) with different escalation paths for different severity levels.
- **Build runbooks for every alert.** An alert without a runbook is noise.
- **Use SLO-based alerting** (burn rate alerts) rather than static threshold alerts. Static thresholds require constant tuning.

## Patterns

- **Define SLOs before building dashboards.** Know what "good" looks like before deciding what to measure.
- **Use the four golden signals:** Latency, traffic, errors, and saturation (cost/usage).
- **Implement structured logging** with a consistent schema across all services. Every log entry should include `correlation_id`, `timestamp`, `service`, `level`, `message`.
- **Set up multi-channel alerting** (PagerDuty, Slack, email) with different escalation paths for different severity levels.
- **Build runbooks for every alert.** An alert without a runbook is noise.
- **Use SLO-based alerting** (burn rate alerts) rather than static threshold alerts. Static thresholds require constant tuning.

## Architectural Decisions

- Instrument all services with **OpenTelemetry** for traces, metrics, and logs â€” vendor-neutral and portable.
- Use a **metrics aggregation service** (Prometheus + Grafana) for real-time dashboards.
- Use a **log aggregation service** (Elasticsearch/Loki + Kibana/Grafana) for log analysis.
- Store traces in a **distributed tracing backend** (Jaeger, Tempo, or Datadog).
- Implement **health check endpoints** (`/health`, `/ready`) for load balancer and orchestrator health probes.
- For Laravel, use **Laravel Pulse** for built-in metrics or integrate with Prometheus via the `prometheus` package.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Metrics emission should be <1ms per request. Use batch metric writers that flush every 5-10 seconds.
- Log sampling: at high throughput (>1000 req/s), sample debug/info logs at 1:10 or 1:100. Errors are always logged at full fidelity.
- Tracing overhead is 1-5% of request latency. Use head-based sampling (1:100) for production.
- Log storage costs can exceed LLM API costs at scale. Implement retention policies: detailed logs for 7-30 days, sampled logs for 90 days, aggregated metrics for 1+ year.
- Alert evaluation frequency: evaluate burn rate alerts every 1-5 minutes (not continuously).

## Production Considerations

- **Log confidentiality:** Logs may contain PII, API keys, or sensitive business data. Apply redaction before writing.
- **Alert information disclosure:** Alert notifications should not include sensitive request details (PII, full error traces).
- **Access control:** Dashboards and logs should have role-based access. Not everyone should see cost data or error details.
- **Monitoring system security:** The observability infrastructure itself must be secured (prometheus, grafana, elasticsearch behind auth).
- **Audit trail integrity:** Logs used for compliance must be immutable (append-only).

## Common Mistakes

- Building dashboards before defining SLOs â€” dashboards without targets are decoration.
- Alert fatigue: too many alerts that nobody responds to. Start with 3-5 critical alerts and expand cautiously.
- Not monitoring cost â€” the most expensive AI incident is not a technical failure but a budget overrun discovered on the invoice.
- Missing provider-specific alerts â€” a provider outage with no alert means users discover the outage before the team does.
- Not documenting runbooks â€” when an alert fires at 3 AM, the on-call engineer needs clear instructions.

## Failure Modes

- **Vanity Metrics:** Tracking metrics that look good but don't correlate with user experience (e.g., "total requests served" without latency or error rate).
- **Alert on Everything:** Alerting on every anomaly without prioritization. Leads to ignored alerts.
- **No Correlation ID:** Logs, metrics, and traces that cannot be joined. Every request must have a correlation ID propagated across all services.
- **Reactive Monitoring:** Only investigating issues after users report them. Proactive anomaly detection catches issues before users notice.
- **Dashboard Sprawl:** 100 dashboards with no curated view. Maintain a single "Service Overview" dashboard plus targeted deep-dive dashboards.

## Ecosystem Usage

### Key AI Metrics
```
# Latency
ai_request_duration_seconds{provider="openai",model="gpt-4o"} â€” p50, p95, p99

# Errors
ai_request_errors_total{provider="openai",error_type="timeout"} â€” rate per minute

# Cost
ai_cost_usd_total{provider="openai",model="gpt-4o"} â€” per hour/day

# Cache
ai_cache_hit_ratio{provider="openai"} â€” per provider

# Tokens
ai_prompt_tokens_total{provider="openai"} â€” per minute
ai_completion_tokens_total{provider="openai"}
```

### SLO Configuration
```php
$slos = [
    'latency_p95' => ['target' => 2.0, 'window' => '28d', 'burn_rate' => 2],
    'error_rate' => ['target' => 0.01, 'window' => '28d', 'burn_rate' => 3],
    'cost_per_request' => ['target' => 0.005, 'window' => '30d', 'burn_rate' => 2],
];
```

## Related Knowledge Units

- ku-01 (Cost Tracking & Allocation): Cost data that feeds into observability.
- ku-02 (Cost Optimization Strategies): Observability-driven optimization.
- ai-middleware-gateway/ku-05: Gateway-level observability middleware.
- ai-safety-security/ku-05: Rate limiting observability.
- streaming-real-time-ai/ku-04: Monitoring streaming latency.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

