# Rules: Laravel Nightwatch

## Metadata
- **Source KU:** laravel-nightwatch
- **Subdomain:** Developer Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- NW-RULE-001: **Production APM** — Nightwatch is for production monitoring with long-term trend analysis.
- NW-RULE-002: **Deployment tracking** — Correlate performance changes with deployments for regression detection.
- NW-RULE-003: **Configure alerting** — Set thresholds (p95 > 500ms, error rate > 1%) for proactive notifications.

## Decision Rules
- NW-RULE-004: **Use Nightwatch** for production APM requiring historical retention and alerting.
- NW-RULE-005: **Use Pulse** for simpler, self-hosted real-time monitoring without budget for paid service.
- NW-RULE-006: **Use Telescope/Debugbar** for local development debugging.
- NW-RULE-007: **Do NOT use Nightwatch** if data residency restrictions prevent external services.
