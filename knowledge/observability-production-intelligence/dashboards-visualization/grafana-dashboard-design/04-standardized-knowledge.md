# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 07-dashboards-visualization
**Knowledge Unit:** grafana-dashboard-design
**Difficulty:** Advanced
**Category:** Dashboard Design
**Last Updated:** 2026-06-03

# Overview

Grafana is the leading open-source observability dashboard platform. It visualizes metrics, logs, and traces from Prometheus, Loki, Tempo, and other data sources. For Laravel applications, Grafana provides the visual layer above OpenTelemetry-collected data.

Dashboard design in Grafana is a craft — poor design obscures signal in noise, while good design surfaces anomalies within seconds. The discipline involves selecting the right panel types, organizing layout hierarchically, using consistent color coding, and minimizing cognitive load.

Engineers should care because a well-designed dashboard reduces Mean Time To Detection (MTTD) from hours to seconds. Operators can spot anomalies at a glance — "that red spike means error rate just jumped" — without querying individual systems.

# Core Concepts

**Panel:** A single visualization widget. Types include Time Series, Stat, Table, Bar Chart, Heatmap, Logs, and Trace View. Each panel queries a data source and renders results.

**Row:** A container for grouping related panels. Rows can be collapsed for organization. Use rows to group panels by domain (HTTP, Database, Queue) or by concern (Errors, Latency, Throughput).

**Dashboard:** A collection of rows and panels. Dashboards should be focused on a single domain or persona. "Production Overview" for operators, "Database Performance" for DBAs, "Order Pipeline" for business teams.

**Template Variable:** A dynamic filter applied across the dashboard. Examples: `$service`, `$env`, `$region`. Template variables make dashboards reusable across environments and services.

**Alert Rule:** A condition evaluated against data source queries. When the condition is met, Grafana fires an alert via Alertmanager. Alert rules live on dashboards or independently.

**Annotation:** An event marker on a time series graph. Annotations can be automated (deployments, config changes) or manual. They provide context for performance changes.

**Data Source:** A configured backend (Prometheus, Loki, Tempo, InfluxDB, etc.) that Grafana queries. Each panel specifies its data source.

# When To Use

- **Production monitoring dashboards** for operators
- **Business metric dashboards** for stakeholders (orders, revenue, users)
- **Performance investigations** with correlated metrics, logs, and traces

# When NOT To Use

- **Real-time alerting only** — Grafana is visualization, not primary alerting
- **Infrequent debugging** — if a dashboard is viewed less than once a month, it may not need maintenance

# Best Practices

**Design for glanceability.** Place the most important metrics (error rate, request rate, p95 latency) at top-left. The first 5 seconds of looking at the dashboard should answer: "Is there a problem?"

**Use consistent color coding.** Green = healthy, Yellow = warning, Red = critical. Avoid random color assignments. Use threshold-based coloring on stats.

**Limit panels per dashboard.** A dashboard with 30+ panels overwhelms operators. Target 8-12 panels per dashboard. Create focused sub-dashboards for specific domains.

**Use template variables.** Make dashboards reusable with `$service`, `$env`, `$region` variables. Operators should not need to edit the dashboard JSON to change scope.

**Annotate deployments.** Send deployment events as Grafana annotations. When p95 latency jumps, the first question is "Did we just deploy?" Annotations answer this immediately.

# Architecture Guidelines

Dashboard structure should follow the observability hierarchy:
1. **Service Health** (top row): Error rate, Request rate, Latency p95, Saturation
2. **Breakdowns** (middle rows): Error breakdown by endpoint, Latency by endpoint, Slowest queries
3. **Debugging** (bottom rows): Correlation panels linking to logs and traces

Use Grafana's Explore mode for ad-hoc investigation. Dashboards are for known questions; Explore is for unknown questions.

# Performance Considerations

- **Query range limits:** Default search range can be up to 30 days. Limit to 7 days max for dashboard default. Use quick ranges (Last 6h, Last 24h) as landing view
- **Panel query explosion:** Each panel executes at least one query. 20 panels × 5 data sources = 100 queries per dashboard load
- **Template variable queries:** Dynamic variables execute additional queries on dashboard load. Keep variable queries fast (<200ms)
- **Dashboard JSON size:** Large dashboards (100+ panels) load slowly in browser. Split into multiple focused dashboards

# Security Considerations

- **Dashboard access control:** Use Grafana folders and team access. Business metric dashboards (revenue, orders) should be restricted
- **Data source permissions:** Grafana data sources may have broad query access. Restrict which data sources a dashboard can use
- **Dashboard JSON contains queries:** Dashboard JSON may embed data source details. Review before sharing externally

# Common Mistakes

**Too many panels.** A dashboard with 50 panels that covers every possible metric. Operators cannot find the relevant panel during an incident. Target 8-12 panels per dashboard.

**No template variables.** Hardcoded service and environment in every query. Dashboard must be duplicated for each environment. Always use `$service` and `$env` template variables.

**Panels without thresholds.** A Stat panel displaying "137" — is that good or bad? Add threshold colors: green for OK, yellow for warning, red for critical.

**Forgetting time range.** Dashboard opens to "Last 6 hours" by default but critical panels only show data for the last hour. Match time range to the data granularity.

# Anti-Patterns

**Dashboard as a firehose.** Trying to put every available metric onto a single dashboard. Operators suffer from information overload. Create focused dashboards per domain.

**No legend or label.** Panels with multiple time series and no legend. Operators cannot identify which line represents which service or endpoint. Always enable legend on multi-series graphs.

**Over-aggressive refresh.** Dashboard auto-refresh every 5 seconds. For most use cases, 30-60 second refresh is sufficient. Fast refresh adds unnecessary load.

**Panels that require interpretation.** A raw PromQL counter with no rate(). Operators must remember the query pattern. Panels should display meaningful values (rate, percentage, latency).

# Examples

**Stat panel for error rate:**
- PromQL: `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100`
- Threshold: Green <1%, Yellow 1-5%, Red >5%
- Unit: Percent

# Related Topics

**Prerequisites:**
- Prometheus metrics for metric panels
- Loki / logging for log panels

**Closely Related Topics:**
- Alerting & Incident Response (alert rules on dashboard panels)
- Prometheus Integration (PromQL queries for panels)

**Advanced Follow-Up Topics:**
- Grafana provisioning (Infrastructure as Code for dashboards)
- Grafana API and dashboard management

**Cross-Domain Connections:**
- DevOps & Infrastructure — Grafana server administration

# AI Agent Notes

- 8-12 panels per dashboard maximum
- Template variables for reusability: `$service`, `$env`, `$region`
- Color conventions: Green=healthy, Yellow=warning, Red=critical
- Annotate deployments for change correlation
- Limit default time range to 7 days
- Top row: Error rate, Request rate, Latency p95, Saturation
- Bottom area: correlation links to logs and traces
