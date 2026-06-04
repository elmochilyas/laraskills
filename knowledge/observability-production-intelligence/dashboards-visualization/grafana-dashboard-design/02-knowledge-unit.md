# Grafana Dashboard Design

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 07-dashboards-visualization
- **Knowledge Unit:** grafana-dashboard-design
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Grafana is the leading open-source observability dashboard platform, visualizing metrics, logs, and traces from Prometheus, Loki, Tempo, and other data sources. Dashboard design is a craft — poor design obscures signal in noise while good design surfaces anomalies within seconds, reducing Mean Time To Detection (MTTD) from hours to seconds.

---

## Core Concepts

- **Panel:** Single visualization widget — Time Series, Stat, Table, Bar Chart, Heatmap, Logs, Trace View
- **Row:** Container for grouping related panels — can be collapsed for organization
- **Template Variable:** Dynamic filter across the dashboard — `$service`, `$env`, `$region` enabling reusability
- **Alert Rule:** Condition evaluated against data source queries — fires via Alertmanager when triggered
- **Annotation:** Event marker on time series graphs — deployments, config changes, manual notes
- **Data Source:** Configured backend (Prometheus, Loki, Tempo, InfluxDB) that Grafana queries

---

## Mental Models

- **Newspaper Model:** Important news goes above the fold (top-left), supporting details below. The top row shows "headlines" — error rate, request rate, latency. Lower rows provide deeper details
- **Glanceability Model:** A good dashboard communicates status within 5 seconds. If you need to read labels and thresholds to understand the state, the dashboard has failed
- **Stoplight Model:** Three colors: green = healthy, yellow = degraded, red = critical. Consistent color coding across all panels enables instant situational awareness

---

## Internal Mechanics

Grafana dashboards are JSON documents defining panels, rows, data sources, and template variables. Each panel executes a query against its configured data source when the dashboard loads. Template variables are resolved first, then injected into panel queries. Panels render results according to their visualization type. Dashboards auto-refresh at configured intervals, re-executing all queries. The dashboard JSON can be provisioned and version-controlled as Infrastructure as Code.

---

## Patterns

- **Service Health Hierarchy:** Top row: Error rate, Request rate, Latency p95, Saturation. Middle rows: Breakdowns by endpoint, slowest queries. Bottom rows: Correlation panels linking to logs and traces. Benefit: hierarchical information architecture. Tradeoff: requires multiple dashboards for complete coverage.
- **Template Variable Reusability:** Use `$service`, `$env`, `$region` variables in all queries. Benefit: single dashboard for all environments and services. Tradeoff: variables add query overhead on dashboard load.
- **Deployment Annotations:** Send deployment events as Grafana annotations. Benefit: immediate correlation of performance changes to deployments. Tradeoff: requires CI/CD integration.

---

## Architectural Decisions

**Design for glanceability.** Place the most important metrics (error rate, request rate, p95 latency) at top-left. The first 5 seconds should answer: "Is there a problem?"

**Limit panels to 8-12 per dashboard.** A dashboard with 30+ panels overwhelms operators. Create focused sub-dashboards for specific domains (HTTP, Database, Queue).

**Use template variables for reusability.** Hardcoded service and environment in every query requires duplicated dashboards. Use `$service` and `$env` variables.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Hierarchical layout surfaces critical metrics first | More dashboards to maintain | Create focused dashboards per domain |
| Template variables make one dashboard reusable everywhere | Variable queries add load time | Keep variable queries fast (<200ms) |
| Deployment annotations show change correlation | Requires CI/CD integration | Essential for performance regression debugging |

---

## Performance Considerations

Default query range can be up to 30 days — limit to 7 days max for dashboard default. Each panel executes at least one query — 20 panels × 5 data sources = 100 queries per dashboard load. Template variables execute additional queries — keep fast (<200ms). Large dashboards (100+ panels) load slowly — split into focused dashboards.

---

## Production Considerations

Use Grafana folders and team access for dashboard permissions. Business metric dashboards (revenue, orders) should be restricted. Data sources may have broad query access — restrict per dashboard. Dashboard JSON may embed data source details — review before sharing externally.

---

## Common Mistakes

**Too many panels** — 50 panels covering every possible metric. Operators cannot find relevant information during incidents. Target 8-12 panels.

**No template variables** — hardcoded service and environment in every query. Dashboard must be duplicated for each environment.

**Panels without thresholds** — a Stat panel displaying "137" without color context. Add threshold colors: green for OK, yellow for warning, red for critical.

**Forgetting time range** — dashboard opens to "Last 6 hours" but critical panels only show data for last hour.

---

## Failure Modes

**Query timeout:** Panel query exceeds data source timeout. Detection: panel shows error or "No data." Mitigation: optimize PromQL/Loki queries; reduce query range; use recording rules.

**Template variable explosion:** High-cardinality variable returns thousands of values. Detection: dashboard load time increases significantly. Mitigation: limit template variable query results; use regex filtering.

**Dashboard JSON corruption:** Manual edit breaks dashboard JSON. Detection: dashboard fails to load. Mitigation: use Grafana provisioning with version-controlled JSON; avoid UI-only edits.

---

## Ecosystem Usage

Grafana is the standard visualization layer for Laravel observability stacks. It consumes data from Prometheus (metrics), Loki (logs), and Tempo (traces). Laravel Pulse and Nightwatch are first-party alternatives for simpler use cases. Grafana alerting integrates with Alertmanager for notification routing.

---

## Related Knowledge Units

### Prerequisites
- Prometheus metrics for metric panels
- Loki / logging for log panels

### Related Topics
- Alerting & Incident Response (alert rules on dashboard panels)
- Prometheus Integration (PromQL queries for panels)

### Advanced Follow-up Topics
- Grafana provisioning (Infrastructure as Code)
- Grafana API and dashboard management

---

## Research Notes

8-12 panels per dashboard maximum. Template variables for reusability: `$service`, `$env`, `$region`. Color conventions: Green=healthy, Yellow=warning, Red=critical. Annotate deployments for change correlation. Limit default time range to 7 days. Top row: Error rate, Request rate, Latency p95, Saturation. Bottom area: correlation links to logs and traces.
