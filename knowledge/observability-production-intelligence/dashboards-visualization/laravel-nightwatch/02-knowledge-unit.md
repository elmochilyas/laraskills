# Laravel Nightwatch

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 07-dashboards-visualization
- **Knowledge Unit:** laravel-nightwatch
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel Nightwatch is a first-party, self-hosted observability dashboard providing real-time monitoring of application health, performance, errors, and deployments with a UI designed specifically for Laravel developers. It focuses on Laravel-native concepts — queues, Horizon, Octane, Livewire, Artisan commands — without the complexity of general-purpose tools like Grafana.

---

## Core Concepts

- **Dashboard:** Main UI showing request rate, error rate, queue depth, and recent deployments at a glance
- **Transactions:** HTTP requests, queued jobs, scheduled tasks, and artisan commands — each with duration, status, and metadata
- **Watchers:** Data collectors capturing specific aspects — HTTP requests, queue jobs, cache operations, database queries, mail, notifications, custom events
- **Deployments:** Version-tracked deployments automatically correlated with performance changes
- **Alerting:** Built-in alert rules for high error rate, slow response time, failed jobs, and queue backpressure
- **Retention:** Configurable data retention (default 7 days) for transaction details and query logs

---

## Mental Models

- **Laravel Translator Model:** Nightwatch speaks Laravel, not PromQL. It understands jobs, listeners, mailables, and notifications natively — like having a translator between your Laravel app and observability
- **Dashboard Light Model:** Nightwatch is a simpler, focused dashboard — like a car's instrument panel vs a full airplane cockpit. Less powerful for complex analysis but much faster to set up and use
- **Black Box Model:** Nightwatch runs as a standalone service — the SDK sends data, the server processes it, the dashboard displays it. Each layer is independently scalable

---

## Internal Mechanics

Nightwatch runs as a standalone service alongside the Laravel application. The SDK package collects data and sends it to the Nightwatch server via batch async requests. The server receives, processes, and stores observability data. The dashboard UI queries the server for visualization. The SDK sends data in batches asynchronously to avoid blocking requests. Watchers instrument specific framework events — HTTP request lifecycle, query execution, job processing — and capture structured data with minimal overhead.

---

## Patterns

- **Selective Watcher Enablement:** Enable only watchers that provide actionable data — database queries yes, mail may be unnecessary. Benefit: reduces overhead and storage. Tradeoff: must review each watcher's cost/benefit.
- **Deployment Pipeline Integration:** Send deployment events via Nightwatch API or CLI. Benefit: automatic performance change correlation. Tradeoff: requires CI/CD integration.
- **PII Redaction Configuration:** Configure input sanitization for sensitive fields before SDK sends data. Benefit: prevents PII leakage. Tradeoff: may obscure useful debugging data if too aggressive.

---

## Architectural Decisions

**Use watchers selectively.** Each watcher adds overhead and storage. Enable only those providing actionable insight — database query watcher is useful, cache hit watcher likely is not.

**Configure retention aligned with debugging needs.** 7 days default is reasonable. Extend to 30 days for compliance, reduce to 3 days for high-traffic apps to save storage.

**Set up alerts for critical issues.** Error rate >5%, p95 latency >1000ms, and queue failures cover the most common production issues.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Laravel-native — speaks your domain language | Application-level only — no infrastructure metrics | Still need infrastructure monitoring (CPU, memory, disk) |
| Fast setup — running in an afternoon | Limited customization compared to Grafana | Good for most teams, limiting for advanced needs |
| Built-in alerting for common Laravel issues | Retention consumes storage — must plan capacity | Calculate expected storage before deploying |

---

## Performance Considerations

SDK overhead is ~1-5ms per request depending on enabled watchers — negligible. Network bandwidth is ~1-5KB per request worth of observability data. Server storage is ~10-100MB per day per 100K requests. Nightwatch uses its own database — ensure adequate indexing for query patterns.

---

## Production Considerations

SDK payload contains request data — configure input sanitization for sensitive fields. Communication between SDK and server should use HTTPS. Nightwatch dashboard requires authentication — restrict access to developers and ops. Nightwatch captures user IDs by default — review privacy policy and configure redaction if needed.

---

## Common Mistakes

**Enabling all watchers without review** — every watcher adds overhead and storage. Enable only those providing actionable insight.

**No PII redaction** — Nightwatch captures request input, headers, and user data by default. Configure input redaction for sensitive applications.

**Default retention without capacity planning** — 7-day retention can consume unexpected storage for high-traffic apps. Calculate before deploying.

**Ignoring watcher overhead** — running 15 watchers on every request without profiling. Test in staging before production rollout.

---

## Failure Modes

**SDK data loss on connection failure:** Nightwatch server unreachable — SDK buffers data but may drop if buffer overflows. Detection: gaps in dashboard data. Mitigation: configure adequate buffer size; monitor SDK health.

**Storage exhaustion:** Nightwatch server storage fills up due to high traffic or misconfigured retention. Detection: dashboard stops recording new data. Mitigation: monitor storage; configure retention and pruning.

**Watcher overhead impacting performance:** Too many watchers add measurable request time. Detection: APM or profiling shows increased latency. Mitigation: profile watcher overhead in staging; enable selectively.

---

## Ecosystem Usage

Nightwatch is a first-party Laravel observability tool, simpler than a full Grafana/OTel stack. It complements Laravel Pulse (real-time dashboard) and Telescope (development debugging). Nightwatch handles application-level observability; infrastructure monitoring (server CPU, memory, disk) requires separate tools.

---

## Related Knowledge Units

### Prerequisites
- Laravel service providers and configuration

### Related Topics
- Laravel Pulse (real-time dashboard, complementary)
- Error Tracking (Nightwatch includes error tracking)

### Advanced Follow-up Topics
- Custom watcher development
- Nightwatch API for custom integrations

---

## Research Notes

First-party Laravel observability tool, simpler than Grafana/OTel stack. Watchers add per-request overhead — enable selectively. Configure PII redaction for sensitive applications. Nightwatch is application-level only — still need infrastructure monitoring. Default 7-day retention, adjust based on traffic and compliance needs.
