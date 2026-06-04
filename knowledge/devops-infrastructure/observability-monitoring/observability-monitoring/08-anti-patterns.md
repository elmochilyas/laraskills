# Anti-Patterns: Observability & Monitoring

## AP-OBS-001: Production Telescope
**Description:** Enabling Laravel Telescope on production to debug issues.
**Consequences:** Telescope logs every database query, HTTP request, and exception, causing severe database write load and storage bloat.
**Remediation:** Use Nightwatch or Sentry for production debugging. Telescope is designed and labeled as a development tool.

## AP-OBS-002: Alerting Without SLOs
**Description:** Setting alerts based on static thresholds without defined SLOs.
**Consequences:** Alert thresholds are arbitrary. Teams receive alerts for events that don't impact users and miss events that do.
**Remediation:** Define SLOs first. Alerts should measure SLO compliance, not arbitrary metric values.

## AP-OBS-003: Log Everything
**Description:** Logging every request, query, and event without sampling.
**Consequences:** Logging infrastructure costs explode. Finding relevant logs in millions of entries becomes impossible.
**Remediation:** Sample high-traffic endpoints. Log 100% only for errors and critical events.
