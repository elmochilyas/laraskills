# API Monitoring and Alerting

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
API monitoring and alerting provides real-time visibility into API health, performance, and consumer experience. It covers health checks, error rate tracking, latency SLAs, uptime monitoring, and automated alerts. A robust monitoring system enables rapid incident detection, diagnosis, and resolution while providing data for capacity planning and SLA reporting.

## Core Concepts
- **Health Check:** A lightweight endpoint (`/health`) that verifies the API and its dependencies are operational.
- **Uptime Monitoring:** External monitoring that checks API availability at regular intervals from multiple locations.
- **Error Rate Tracking:** Real-time measurement of HTTP error responses (4xx, 5xx) as a percentage of total requests.
- **Latency SLA:** Performance targets (e.g., p95 < 500ms, p99 < 1000ms) with alerting thresholds.
- **Synthetic Monitoring:** Automated test scripts that simulate real consumer behavior and verify correct responses.
- **APM (Application Performance Monitoring):** Deep instrumentation of application code for transaction tracing and bottleneck identification.
- **Alert Fatigue:** The phenomenon where too many alerts cause the team to ignore or miss critical ones.

## Mental Models
- **Hospital Vital Signs Monitor:** Like a patient in ICU — heart rate (request rate), blood pressure (latency), oxygen (error rate), and temperature (server load) are all displayed in real-time, with alarms when any vital goes out of range.
- **Car Dashboard:** The speedometer (latency), fuel gauge (resources), check engine light (errors), and navigation (traffic patterns) give the driver a complete picture of vehicle health.

## Internal Mechanics
1. **Health Check Endpoint:** A dedicated endpoint that verifies database connectivity, cache availability, and critical service dependencies. Returns `200 OK` or `503 Service Unavailable`.
2. **Metrics Collection:** Application emits metrics (request count, errors, latency percentiles) to a time-series database (Prometheus, Datadog).
3. **Log Aggregation:** Structured logs are shipped to a centralized logging platform (Elasticsearch, Loki) for search and analysis.
4. **Alert Rules:** Predefined conditions trigger alerts (e.g., error rate > 5% for 5 minutes → P1 alert).
5. **Alert Routing:** Alerts are routed to the appropriate on-call rotation via PagerDuty/Opsgenie.
6. **SLA Calculation:** Uptime and latency metrics are aggregated into SLA compliance reports.
7. **Incident Response:** When an alert fires, the incident response process begins (acknowledge → diagnose → mitigate → postmortem).

## Patterns
- **RED Method:** Monitor Rate (requests/sec), Errors (failed requests/sec), Duration (latency distribution) — the three key signals for every service.
- **USE Method:** For every resource, monitor Utilization, Saturation, and Errors.
- **Multi-Window, Multi-Burst Alerting:** Alert on both sustained issues (high error rate for 5 minutes) and burst issues (sudden latency spike).
- **Synthetic Transactions:** Run scripted API scenarios every minute from multiple regions to detect availability issues before real consumers are affected.
- **Burn Rate Alerting:** Monitor how fast the error budget is being consumed — alert when burn rate exceeds threshold.

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| Metrics backend | Prometheus / Datadog / NewRelic | Prometheus + Grafana | Self-hosted, cost-effective, standard in K8s ecosystems |
| Alerting tool | AlertManager / PagerDuty / Opsgenie | PagerDuty | Reliable, good mobile app, team already uses it |
| Log aggregation | Elasticsearch / Loki / CloudWatch | Loki | Lightweight, integrates with Grafana, cost-effective |
| Synthetic monitoring | Built-in / Runscope / Checkly | Checkly | Simple setup, global regions, Playwright support |
| Uptime SLA target | 99.9% / 99.95% / 99.99% | 99.95% (monthly) | Appropriate for CRUD APIs; balances cost with reliability |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| High vs low alert sensitivity | High sensitivity catches issues early but causes alert fatigue; low sensitivity misses some issues |
| Self-hosted vs SaaS monitoring | Self-hosted is cost-effective but requires maintenance; SaaS is easier but expensive at scale |
| Built-in vs external health checks | Built-in checks cover deep dependencies but may fail to catch external accessibility issues; external checks cover the consumer's full experience |
| RED vs comprehensive monitoring | RED covers the essentials; comprehensive adds detail but increases complexity |

## Performance Considerations
- Health check endpoints should respond in < 100ms and avoid expensive database queries.
- Metrics collection is async (batch export) — negligible impact on request path.
- Log shipping should be async with a buffer to prevent log writes from blocking requests.
- Synthetic monitoring runs from external services — no impact on production infrastructure.

## Production Considerations
- **Monitoring:** Monitor the monitoring system itself (heartbeat alerts for Prometheus, Loki, Grafana).
- **Logging:** Centralized logging with structured JSON format; set appropriate retention (30 days hot, 1 year cold).
- **Backup:** Prometheus data persistence; Grafana dashboard configurations in git.
- **Rollback:** If a monitoring change causes issues (e.g., excessive log volume), revert the instrumentation change.
- **Testing:** Test alert rules with chaos engineering (inject failures and verify alerts fire correctly).

## Common Mistakes
- Setting alert thresholds too tight (false positives → alert fatigue → ignored alerts).
- Not having health check dependencies (health check passes but dependent services are down).
- Monitoring only averages and ignoring percentiles (average latency hides the long tail).
- No synthetic monitoring (waiting for real consumers to report issues).
- Alerting on every symptom (CPU spike) instead of every consumer-impacting signal (error rate).
- Not documenting runbooks for alerts (on-call engineer wastes time figuring out what to do).

## Failure Modes
- **Monitoring Outage:** Prometheus or Grafana is down → blind to API health. Mitigation: redundant monitoring instances; external uptime monitor.
- **Alert Storm:** A cascading failure triggers dozens of alerts simultaneously. Mitigation: alert deduplication, grouping, and dependency-aware alerting.
- **Silent Data Loss:** Monitoring pipeline loses data (collector crash, network issue) → missing metrics. Mitigation: monitoring pipeline health checks.
- **Dashboard Sprawl:** Too many dashboards → no single source of truth for API health. Mitigation: standardize on 3-tier dashboards (executive, operational, tactical).

## Ecosystem Usage
- **Stripe:** Publishes their uptime and latency status; uses extensive synthetic monitoring for payment flows.
- **Twilio:** "Twilio Status" page shows real-time and historical uptime per service.
- **GitHub:** "GitHub Status" with real-time incident reporting; extensive internal monitoring with ChatOps integration.

## Related Knowledge Units

### Prerequisites
- [API Usage Tracking](ku-16-api-usage-tracking)
- [Rate Limit Tier Design](ku-15-rate-limit-tier-design)

### Related Topics
- [API Audit Review Process](ku-08-api-audit-review-process)
- [Backward Compatibility Policy](ku-04-backward-compatibility-policy)

### Advanced Follow-up Topics
- SLO-based alerting and error budgets
- Distributed tracing for microservice API chains
- AI-driven anomaly detection for API traffic patterns

## Research Notes

### Source Analysis
Google's SRE book defines the RED method and burn rate alerting. The industry best practice is to alert on error budget consumption rather than raw error rate — this ties alerting directly to consumer impact.

### Key Insight
The most impactful monitoring investment is **synthetic transactions**. Real consumer monitoring always lags (consumers may not report issues promptly). Synthetic checks from multiple global regions detect availability and correctness issues within seconds, often before any real consumer is affected.

### Version-Specific Notes
- Laravel 11.x: Use `Laravel Prometheus` package for metrics; `Laravel Horizon` for queue monitoring; structured logging via `config/logging.php`.
- PHP 8.4: `ext-prometheus` via custom FFI or use a client library; `ext-opentelemetry` for distributed tracing support.
