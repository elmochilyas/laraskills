# Anti-Patterns: Infrastructure Monitoring Tools

## AP-MON-001: Dashboard Blindness
**Description:** Building beautiful dashboards that no one monitors or acts upon.
**Consequences:** Production incidents go undetected until users report them. Dashboards become decoration.
**Remediation:** Every metric on a dashboard should have at least one associated alert action. If no one responds, the metric doesn't need to be on a dashboard.

## AP-MON-002: Pager Fatigue
**Description:** Alerting on every anomaly, paging the on-call engineer for non-critical events.
**Consequences:** On-call engineers ignore alerts. Critical alerts are missed because they're indistinguishable from noise.
**Remediation:** Tier alerts: page for confirmed production issues (5xx spike, error rate increase), notify for warnings (disk usage > 80%). Review alert effectiveness monthly.

## AP-MON-003: Telescope in Production
**Description:** Running Laravel Telescope in production environment for debugging.
**Consequences:** Telescope stores every request, query, and exception in the database. Performance degradation and storage exhaustion.
**Remediation:** Use Nightwatch or Sentry for production debugging. Telescope is designed for local development only.
