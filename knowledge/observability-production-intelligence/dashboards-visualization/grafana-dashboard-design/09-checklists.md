# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 07-dashboards-visualization
**Knowledge Unit:** grafana-dashboard-design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Grafana data sources configured: Prometheus, Loki, Tempo/Jaeger
- [ ] Dashboard organized around USE method: Utilization, Saturation, Errors
- [ ] RED metrics visualized: Rate, Errors, Duration per service
- [ ] Template variables used for dynamic dashboard filtering
- [ ] Annotations configured for deployment markers and incidents
- [ ] Alert rules created from dashboard panels

---

# Architecture Checklist

- [ ] Panel types matched to data type: time series, stat, table, bar gauge
- [ ] Data source per panel configured (Prometheus for metrics, Loki for logs)
- [ ] Template variables: service, environment, endpoint, status code
- [ ] Row organization: service health, latency, errors, traffic, saturation
- [ ] Annotation sources: deployments, error tracking, incidents
- [ ] Dashboard provisioning via YAML for version control

---

# Implementation Checklist

- [ ] Data source connections configured in Grafana via provisioning file
- [ ] Service health row: CPU, memory, request rate, error rate
- [ ] Latency row: p50, p95, p99 request duration, Apdex score
- [ ] Errors row: error count by status code, exception breakdown
- [ ] Traffic row: request rate by endpoint, throughput by service
- [ ] Saturation row: queue depth, DB connection pool, cache hit ratio

---

# Performance Checklist

- [ ] Dashboard panel query performance within Grafana time range
- [ ] Prometheus query optimization: recording rules for expensive queries
- [ ] Loki log query volume limited to reduce load
- [ ] Template variable queries scoped to reduce data source load
- [ ] Dashboard refresh interval balanced (1m for ops, 5m for review)
- [ ] Panel rendering time < 5 seconds for default time range

---

# Security Checklist

- [ ] Grafana access controlled via OAuth or LDAP
- [ ] Dashboard permissions set: view vs edit per team
- [ ] Data source credentials stored in Grafana secrets, not config files
- [ ] Public dashboards require explicit sharing permission
- [ ] Logs panel does not display sensitive log content
- [ ] API key authentication used for dashboard provisioning

---

# Reliability Checklist

- [ ] Dashboard renders without data source availability (partial rendering)
- [ ] Annotation refresh failure does not break dashboard
- [ ] Template variable value missing falls back to default
- [ ] Grafana itself monitored for availability
- [ ] Dashboard backup/export strategy in place
- [ ] Data source proxy timeout configured

---

# Testing Checklist

- [ ] Unit test: PromQL query returns expected metric values
- [ ] Integration test: dashboard panels render with test data
- [ ] Template variable test: all filter combinations produce valid queries
- [ ] Annotation test: deployment events appear on dashboard timeline
- [ ] Alert rule test: notification fires on threshold breach
- [ ] Performance test: dashboard renders within 5 seconds

---

# Maintainability Checklist

- [ ] Dashboard JSON version-controlled in repository
- [ ] Panel naming convention documented per team standards
- [ ] PromQL queries documented with inline comments in provisioning file
- [ ] Deprecated metrics migration plan documented
- [ ] Regular dashboard review scheduled (quarterly cleanup)
- [ ] Grafana provisioning config stored alongside application code

---

# Anti-Pattern Prevention Checklist

- [ ] Dashboard not used as primary alerting system (use Alertmanager)
- [ ] Panels not overloading single data source query
- [ ] Template variables not using wildcard on high-cardinality fields
- [ ] Refresh interval not set too low for expensive queries
- [ ] Not creating per-user dashboards (use template variables)
- [ ] Color scheme not using red/green alone (accessibility)

---

# Production Readiness Checklist

- [ ] Team on-call dashboard created: key metrics, recent errors, deploy annotations
- [ ] Alert rules exported to Prometheus/Alertmanager
- [ ] Grafana notification channels configured for alert delivery
- [ ] Dashboard provisioning automated in CI/CD
- [ ] Grafana backup tested (dashboard export + SQLite)
- [ ] On-call runbook includes Grafana investigation steps

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: data sources configured, USE/RED methodology applied, template variables, annotations, alert rules
- [ ] Security requirements satisfied: access controlled, permissions set, secrets protected
- [ ] Performance requirements satisfied: query optimization done, refresh interval balanced, rendering < 5s
- [ ] Testing requirements satisfied: PromQL validated, panels render, annotations work, alerts fire
- [ ] Anti-pattern checks passed: not primary alerting, queries scoped, accessibility considered
- [ ] Production readiness verified: on-call dashboard ready, alerts routed, provisioning automated, backup tested

---

# Related References

- Prometheus Integration (metrics data source)
- Logging & Structured Logging (Loki data source for logs)
- Distributed Tracing (Tempo/Jaeger data source for traces)
- Laravel Pulse (also a dashboard, complementary to Grafana)
