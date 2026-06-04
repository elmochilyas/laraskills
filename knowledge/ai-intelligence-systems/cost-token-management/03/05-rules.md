---
id: ku-03
title: "Observability & Alerting - Rules"
subdomain: "cost-management-observability"
ku-type: "operations"
date-created: "2026-06-02"
---

## Rules for Observability & Alerting

### R1: Define SLOs for latency, error rate, and cost per request before building any dashboard
- **Category:** Strategy
- **Rule:** Document Service Level Objectives (SLOs) for the three primary AI metrics — p95 latency, error rate, cost per request — before implementing any monitoring infrastructure or dashboards.
- **Reason:** Without defined SLOs, dashboards show metrics without context. Teams cannot distinguish between normal variation and degradation without knowing the target values.
- **Bad Example:** A Grafana dashboard showing latency graphs but no target lines or SLO burn rate indicators, leaving operators to guess whether 2-second p95 is acceptable.
- **Good Example:** SLOs defined as `p95_latency < 2s`, `error_rate < 1%`, `cost_per_request < $0.01` with burn-rate alerts at 2x and 3x consumption rates.
- **Exceptions:** Development environments where only trend observation (not SLO compliance) is needed.
- **Consequences of Violation:** Dashboards that look impressive but provide no actionable insight; teams cannot determine whether the system is healthy.

### R2: Use SLO-based burn rate alerts instead of static threshold alerts
- **Category:** Reliability
- **Rule:** Configure alerts using burn rate (how fast the error budget is consumed) over a sliding window rather than static threshold crossings.
- **Reason:** Static threshold alerts require constant tuning as traffic patterns change and generate noise during traffic bursts. Burn rate alerts measure impact on user-facing reliability.
- **Bad Example:** An alert that fires when error rate exceeds 5% in any 5-minute window, causing pages during every minor provider blip.
- **Good Example:** A burn rate alert that fires when error budget is consumed at 3x the budgeted rate over 1 hour, indicating a sustained degradation that requires investigation.
- **Exceptions:** Zero-tolerance safety metrics (PII leak detection) where any occurrence justifies an immediate alert.
- **Consequences of Violation:** Alert fatigue from static threshold noise, or missed degradations that accumulate slowly but exceed SLOs over the evaluation window.

### R3: Include correlation_id in every log, metric, and trace entry across all services
- **Category:** Observability
- **Rule:** Generate a unique `correlation_id` at the first entry point (HTTP request, queued job) and propagate it through all downstream calls, including LLM provider requests, cache lookups, and log entries.
- **Reason:** Without a correlation ID, connecting a user's request to the specific LLM provider latency, the cache lookup, and the log entries is impossible. Debugging becomes guesswork.
- **Bad Example:** Separate log entries for "user request," "LLM call," and "cache lookup" with no shared identifier across them.
- **Good Example:** A middleware that generates a UUID at request start, adds it to `Log::withContext(['correlation_id' => $id])`, and passes it as a header to the LLM provider.
- **Exceptions:** Internal monitoring health checks that don't need end-to-end traceability.
- **Consequences of Violation:** Debugging production issues takes 3-5x longer as engineers manually correlate timestamps across disparate log streams.

### R4: Never sample error logs — sample debug and info logs, but always log errors at full fidelity
- **Category:** Observability
- **Rule:** Configure log sampling rates of 1:10 or 1:100 for `debug` and `info` level logs, but always write every `warning`, `error`, and `critical` log entry without sampling.
- **Reason:** Sampled error logs miss the low-frequency events that cause the most damage. A 1:100 sampling rate means 99% of error occurrences are invisible to debugging.
- **Bad Example:** A global `sampling_rate: 0.01` configuration that applies to all log levels including errors.
- **Good Example:** Log driver config with level-based sampling: `'levels' => ['debug' => 0.1, 'info' => 0.1, 'warning' => 1.0, 'error' => 1.0, 'critical' => 1.0]`.
- **Exceptions:** High-frequency transient errors (rate limit warnings at 1000+/minute) that are expected and handled by automatic retry logic.
- **Consequences of Violation:** 99% of production errors go unlogged, making post-incident analysis impossible and extending mean-time-to-resolution.
