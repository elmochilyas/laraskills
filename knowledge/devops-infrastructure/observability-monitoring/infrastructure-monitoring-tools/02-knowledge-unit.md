# Infrastructure Monitoring Tools

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Observability & Monitoring
- **Knowledge Unit:** Infrastructure Monitoring Tools
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Infrastructure monitoring tools for Laravel encompass the three observability pillars: structured logging, metrics collection, and distributed tracing. The ecosystem includes first-party tools (Nightwatch, Pulse, Telescope) and third-party services (Sentry, Datadog, Flare). The goal is knowing what's happening inside your application at all times to detect, diagnose, and resolve issues before users are affected.

---

## Core Concepts

- **Logging** — Structured event records for debugging, audit, and analysis
- **Metrics** — Numerical measurements (request rate, error rate, latency percentiles)
- **Tracing** — Request-level visibility across service boundaries and internal operations
- **Nightwatch** — First-party Laravel production monitoring with Forge integration and request sampling
- **Pulse** — Real-time application health dashboard with key metrics at a glance
- **Telescope** — Development debug assistant for request, query, and exception inspection (not for production)
- **Health Checks** — Endpoint that validates the full application stack (database, Redis, queue, dependencies)

---

## Mental Models

- **Three Pillars of Observability** — Logs tell you what happened, metrics tell you how much, traces tell you where. Any production issue requires at least two pillars to diagnose effectively.
- **Monitor Before You Need It** — Configure monitoring before going live, not after. You need baseline data from day one to understand what "normal" looks like for your application.
- **Alert on Symptoms, Not Causes** — Alert when users are impacted (high error rate, slow responses), not when internal metrics deviate (CPU at 80%). Symptoms indicate service-level impact; causes are for investigation.

---

## Internal Mechanics

Monitoring tools collect data through agents installed on the server or SDKs integrated into the Laravel application. Logging writes structured records to files, stdout, or directly to aggregation services (CloudWatch, Logtail, Papertrail). Metrics are collected at intervals (every 10s, 60s) and sent to time-series databases for aggregation and visualization. Tracing instruments request execution, capturing timing for each operation (controller, query, HTTP call) and correlating them with a unique request ID. Health checks are HTTP endpoints that probe dependencies and return a pass/fail status.

---

## Patterns

- **Monitor Before Launch** — Configure monitoring before going live to establish baselines from day one
- **Set Alert Thresholds Based on History** — Define alert thresholds from observed data, not theoretical values. Adjust after the first weeks of production data.
- **Use Structured Logging** — Log in JSON format for machine parsing with consistent schema. Include request ID, user ID, and duration for correlation.
- **Implement Health Checks** — Create an endpoint that validates database, Redis, queue, and critical dependency status
- **Sample in High Traffic** — For high-throughput applications, sample requests rather than logging everything to manage cost

---

## Architectural Decisions

- **Nightwatch vs. Datadog/New Relic** — Choose Nightwatch for Forge-integrated, cost-effective monitoring; choose Datadog/New Relic for full APM with distributed tracing
- **Pulse vs. Custom Dashboard** — Use Pulse for immediate visibility with zero configuration; build custom dashboards for application-specific metrics
- **Telescope vs. Production Logging** — Use Telescope for development debugging; never enable Telescope in production — use Nightwatch or Sentry

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Early detection of production issues | Monitoring infrastructure cost | Monthly costs scale with data volume and retention |
| Structured logging enables debugging | Log volume management | High-traffic apps generate GBs of logs per day |
| Health checks automate incident detection | False positive alerts | Improperly configured health checks cause alert fatigue |
| Distributed tracing identifies bottlenecks | Tracing overhead on request latency | Sampling rate must be configured for high-traffic apps |

---

## Performance Considerations

Structured logging in JSON format adds minimal overhead but increases log storage. Tracing instrumentation adds 1-5% overhead to request processing. Metrics collection at high frequency (every 1s) can impact server performance — 10-60s intervals are standard. Health check endpoints should have minimal performance impact. Nightwatch samples requests to manage cost while maintaining visibility. Pulse uses cached aggregate data for minimal database overhead.

---

## Production Considerations

Monitor all production environments from day one — you need baseline data. Set up alerting for error rate, p95 latency, and health check failures. Use escalation policies (email → Slack → PagerDuty) based on severity. Review monitoring data weekly to identify trends and adjust thresholds. Rotate dashboards to ensure visibility is shared across the team. Document common runbook procedures alongside monitoring dashboards.

---

## Common Mistakes

- **Monitoring After Launch** — Configuring monitoring only after a production incident. You need baseline data from day one.
- **Alert Fatigue** — Too many low-severity alerts cause the team to ignore all alerts. Define alert thresholds carefully.
- **No Health Checks** — No automated endpoint validation means issues go undetected until users report them.
- **Telescope in Production** — Running Telescope in production causes significant performance degradation and memory usage. Use Nightwatch or Sentry instead.
- **Unstructured Logging** — Logging free-text messages without consistent structure makes automated analysis impossible.

---

## Failure Modes

- **Monitoring Infrastructure Outage** — The monitoring system itself goes down. Detection: no alerts, no data. Mitigation: monitor the monitoring system with independent health checks.
- **Log Volume Spikes** — Error storm generates massive log volume, exceeding retention budget. Detection: log ingestion rate alert. Mitigation: implement log sampling, increase retention temporarily.
- **Alert Storm** — Cascading failure triggers hundreds of alerts simultaneously. Detection: alert fatigue, missed critical alerts. Mitigation: implement alert deduplication and grouping.
- **Health Check False Negative** — Health check fails due to transient issue, triggering unnecessary incident. Detection: incident created for self-resolving issue. Mitigation: implement retry logic, require multiple consecutive failures.

---

## Ecosystem Usage

The Laravel ecosystem provides multiple monitoring options. Nightwatch is the first-party production monitoring service integrated with Forge. Pulse provides a real-time dashboard for application health. Telescope serves as a development debugging tool. Sentry and Flare provide error tracking with context. Datadog and New Relic offer full APM capabilities. Laravel's built-in logging system supports structured JSON logging out of the box.

---

## Related Knowledge Units

### Prerequisites
- Laravel basics, server management

### Related Topics
- Observability Monitoring
- Nightwatch
- Pulse
- Telescope

### Advanced Follow-up Topics
- OpenTelemetry
- APM
- Distributed Tracing

---

## Research Notes

Configure monitoring before going live. Use structured JSON logging for machine parsing. Set alert thresholds from historical data. Implement health checks for the full application stack. Never use Telescope in production. Sample requests in high-traffic applications. Nightwatch provides Forge-integrated monitoring. Datadog/New Relic offer full APM with distributed tracing.
