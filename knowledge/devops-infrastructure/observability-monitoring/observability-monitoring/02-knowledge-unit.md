# Observability & Monitoring

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Observability & Monitoring
- **Knowledge Unit:** Observability & Monitoring
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel's observability stack spans first-party tools (Nightwatch for production, Pulse for health dashboards, Telescope for debug assistance), third-party APM (Datadog, New Relic), and error tracking (Sentry, Flare). The three-pillar model (logging, metrics, tracing) guides production monitoring strategy, moving beyond simple "is the server up" checks to understanding application behavior at the request level.

---

## Core Concepts

- **Observability Pillars** — Logs (what happened), metrics (how much), traces (where the problem is)
- **Nightwatch** — Forge-native production monitoring with request sampling and performance insights
- **Pulse** — Real-time application health metrics dashboard with zero configuration
- **Telescope** — Development request debugging tool (not for production use)
- **Sentry/Flare** — Error tracking with stack traces, request context, and user feedback
- **Datadog/New Relic** — Full APM with distributed tracing, infrastructure monitoring, and custom dashboards

---

## Mental Models

- **Observability vs. Monitoring** — Monitoring tells you something is broken; observability lets you ask why it broke. Observability requires the three pillars working together with the ability to explore data without predefined queries.
- **Borrowed from Control Theory** — Observability means you can infer the internal state of a system from its external outputs. In Laravel, the external outputs are logs, metrics, and traces — they should be sufficient to diagnose any issue without deploying additional code.
- **SLOs Drive Observability** — Define Service Level Objectives (e.g., 99.9% uptime, p95 latency < 200ms). Observability infrastructure should tell you whether you're meeting your SLOs and when violation is imminent.

---

## Internal Mechanics

When a request hits a Laravel application with observability configured, a unique request ID is generated at the beginning of the request lifecycle. Middleware captures timing and request metadata. Log entries include the request ID for correlation. If tracing is enabled, spans are created for each operation (controller execution, database query, HTTP call, cache access). At the end of the request, the aggregated data is sent to the observability backend (Nightwatch, Datadog, OpenTelemetry collector). Pulse reads aggregate metrics from cache and displays them on a dashboard.

---

## Patterns

- **Log Structured Data** — Use JSON logging with consistent schemas including request ID, user ID, and duration
- **Monitor SLOs** — Define Service Level Objectives and monitor compliance; alert when approaching violation
- **Sample in High Traffic** — For high-throughput applications, sample requests rather than logging everything to manage cost
- **Correlate Logs and Traces** — Use unique request IDs across logs, metrics, and traces for cross-referencing

---

## Architectural Decisions

- **Nightwatch vs. Third-Party APM** — Choose Nightwatch for Forge-integrated, cost-effective monitoring; choose Datadog/New Relic for enterprise APM with custom dashboards and team familiarity
- **Pulse vs. Custom Metrics** — Use Pulse for immediate out-of-the-box visibility; build custom metrics for application-specific business KPIs
- **Error Tracking: Sentry vs. Flare** — Choose Sentry for broad integration ecosystem and team familiarity; choose Flare for Laravel-specific context with code snippet and environment details

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Request-level visibility into production | Monitoring infrastructure cost (data storage, compute) | Costs scale with data volume and retention period |
| Proactive issue detection before users notice | Alert configuration and tuning time | Thresholds must be tuned over weeks of baseline data |
| Debugging with full request context | Performance overhead of instrumentation | 1-5% overhead for tracing; sample rate must be configured |
| SLO-based alerting prevents violations | SLO definition and tracking complexity | Meaningful SLOs require understanding of user-facing behavior |

---

## Performance Considerations

Logging and metrics collection add minimal overhead (< 1%). Tracing instrumentation adds 1-5% overhead depending on depth. Nightwatch samples requests to manage both cost and performance impact. Pulse reads from cache, adding no database overhead. Telescope in production causes significant performance issues — never enable it on production servers. Datadog/New Relic agents consume memory and CPU on the application server.

---

## Production Considerations

Configure observability before going live. Define SLOs for key metrics (uptime, latency, error rate). Set up alerting with escalation policies. Sample requests in high-traffic environments. Correlate logs, metrics, and traces with request IDs. Review observability data weekly to identify trends. Document common runbooks alongside dashboards. Monitor the monitoring system independently.

---

## Common Mistakes

- **No Observability at Launch** — Going live without monitoring means discovering issues through user complaints. Configure before going live.
- **Telescope in Production** — Telescope's request recording causes significant memory and performance issues. Use Nightwatch or Sentry for production debugging.
- **Alert Fatigue from Poor Thresholds** — Setting alert thresholds without historical data causes too many or too few alerts. Tune thresholds over the first weeks of production data.
- **Siloed Pillars** — Using logging without metrics or traces. Full observability requires all three pillars working together with request ID correlation.
- **No SLO Definition** — Monitoring without defined SLOs means you don't know what "good enough" looks like.

---

## Failure Modes

- **Observability Backend Outage** — Nightwatch, Datadog, or logging service is unavailable. Detection: missing data in dashboards. Mitigation: buffer logs locally, implement fallback logging.
- **Log Volume Cost Explosion** — Error storm generates massive log volume, exceeding budget. Detection: cloud cost alert. Mitigation: implement log sampling, set log retention policies.
- **SLO Violation Without Alert** — SLO is violated but alert thresholds are too loose. Detection: users report issues before SLO alert fires. Mitigation: review and tighten SLO thresholds quarterly.
- **Monitoring Agent Crash** — Datadog/New Relic agent crashes on application server. Detection: gap in metrics data. Mitigation: implement agent health monitoring, configure auto-restart.

---

## Ecosystem Usage

Laravel's observability ecosystem is comprehensive. Nightwatch (Forge-native), Pulse (dashboard), and Telescope (debugging) are first-party tools. Sentry and Flare provide Laravel-specific error tracking with SDK packages. Datadog and New Relic offer full-stack APM with Laravel instrumentation. Laravel's logging system supports multiple channels (Stack, Slack, Papertrail, syslog). OpenTelemetry integration is available through community packages.

---

## Related Knowledge Units

### Prerequisites
- Laravel basics, server management

### Related Topics
- Infrastructure Monitoring Tools
- Nightwatch
- Pulse
- Telescope

### Advanced Follow-up Topics
- OpenTelemetry
- SLO-Based Alerting
- Error Budgets

---

## Research Notes

Observability requires all three pillars (logs, metrics, traces) working together. Configure before going live. Define SLOs and monitor compliance. Use request IDs for cross-pillar correlation. Never use Telescope in production. Sample requests in high traffic. Nightwatch is the first-party production monitoring choice for Forge users. Third-party APM (Datadog, New Relic) provides deeper capabilities at higher cost.
