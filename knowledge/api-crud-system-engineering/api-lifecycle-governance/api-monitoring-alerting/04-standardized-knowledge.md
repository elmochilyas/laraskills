# ECC Standardized Knowledge — API Monitoring and Alerting

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | API Monitoring and Alerting |
| Difficulty | Advanced |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

API monitoring and alerting provides real-time visibility into API health, performance, and consumer experience. It covers health checks (< 100ms response), error rate tracking, latency SLA monitoring (p95 < 500ms), synthetic monitoring from multiple global regions, and automated alerts routed to on-call via PagerDuty. Uses the RED method (Rate, Errors, Duration) and burn rate alerting tied to error budget consumption.

## Core Concepts

- **Health check**: Lightweight endpoint (`/health`) verifying API and dependencies (DB, cache, critical services).
- **Uptime monitoring**: External checks from multiple global locations at regular intervals.
- **Error rate tracking**: Real-time measurement of HTTP error responses (4xx, 5xx) as percentage of total.
- **Latency SLA**: Performance targets (p95 < 500ms, p99 < 1000ms) with alerting thresholds.
- **Synthetic monitoring**: Automated test scripts simulating real consumer behavior from multiple regions.
- **RED method**: Monitor Rate (req/s), Errors (failed req/s), Duration (latency distribution).
- **Burn rate alerting**: Alert on how fast error budget is consumed, not raw error rate.

## When To Use

- All production APIs
- APIs with SLAs/SLOs
- Consumer-facing APIs where uptime impacts revenue
- Multi-service architectures needing coordinated monitoring

## When NOT To Use

- Development/staging environments (basic health check only)
- Prototype APIs not yet in production
- Internal batch jobs with no consumer impact

## Best Practices

- **Health check dependency verification**: Verify DB connectivity, cache availability, critical service deps. Not just return 200.
- **RED method for every service**: Rate (requests/sec), Errors (failed/sec), Duration (latency percentiles).
- **Synthetic transactions from multiple regions**: Detect availability issues before real consumers affected.
- **Multi-window, multi-burst alerting**: Alert on sustained issues (5 min high error rate) and burst issues (sudden latency spike).
- **Alert on error budget burn rate**: Not raw error rate. Alert when budget consumed faster than threshold.
- **Runbooks for every alert**: On-call engineer must know what to do immediately.
- **Monitor the monitoring system**: Heartbeat alerts for Prometheus, Loki, Grafana.

## Architecture Guidelines

- Metrics: Prometheus + Grafana (self-hosted, K8s standard).
- Logs: Loki (lightweight, integrates with Grafana).
- Alerting: PagerDuty with weekly primary/secondary rotation.
- Synthetic monitoring: Checkly (global regions, Playwright support).
- Health check responds in < 100ms, avoids expensive queries.
- 99.95% monthly uptime target for CRUD APIs.
- Three-tier dashboards: executive, operational, tactical.

## Performance Considerations

- Health check endpoints < 100ms, avoid expensive DB queries.
- Metrics collection is async (batch export) — negligible request path impact.
- Log shipping async with buffer — prevents log writes blocking requests.
- Synthetic monitoring runs from external services — no production infrastructure impact.

## Security Considerations

- Health check endpoints should not expose internal topology or version info.
- Synthetic monitoring credentials must have limited scoped permissions.
- Alert notification channels must not leak sensitive data in alert messages.
- Monitoring dashboards access-controlled by role.

## Common Mistakes

- Alert thresholds too tight (false positives -> alert fatigue -> ignored alerts).
- Health check without dependency verification (passes but deps are down).
- Monitoring averages only, ignoring percentiles (average hides long tail).
- No synthetic monitoring (waiting for real consumers to report issues).
- Alerting on symptoms (CPU spike) instead of consumer impact (error rate).
- No runbooks for alerts (on-call wastes time figuring out what to do).

## Anti-Patterns

- **Dashboard sprawl**: Too many dashboards, no single source of truth. Standardize on 3-tier.
- **Alert storm**: Cascading failure triggers dozens of alerts. Implement deduplication and grouping.
- **Silent data loss**: Monitoring pipeline loses data without detection. Implement pipeline health checks.
- **Monitoring everything without action**: Data collected but no alerts or dashboards using it.

## Examples

- Health check: `GET /health -> { "status": "ok", "database": "ok", "cache": "ok", "uptime": 3600 }`.
- RED dashboard: Rate = 1500 req/s, Errors = 0.5%, Duration p50 = 45ms, p95 = 120ms, p99 = 350ms.
- Alert rule: `Error rate > 5% for 5 minutes -> PagerDuty P1 alert -> on-call engineer acknowledged within 5 minutes`.
- SLA: `99.95% monthly uptime -> allowed downtime: ~21 minutes/month`.

## Related Topics

- **Prerequisites**: API Usage Tracking, Rate Limit Tier Design
- **Closely Related**: API Audit Review Process, Backward Compatibility Policy
- **Advanced**: SLO-based alerting and error budgets, Distributed tracing for microservice API chains, AI-driven anomaly detection for API traffic patterns

## AI Agent Notes

When setting up monitoring: implement health check with dependency verification (< 100ms), use RED method (Rate/Errors/Duration) for every service, run synthetic transactions from multiple regions, alert on error budget burn rate not raw errors, write runbooks for every alert, monitor the monitoring system, use three-tier dashboards, set 99.95% uptime target.

## Verification

Sources: Google SRE Book (RED method, burn rate alerting), Stripe status page, Twilio Status, GitHub Status, domain-analysis.md.
