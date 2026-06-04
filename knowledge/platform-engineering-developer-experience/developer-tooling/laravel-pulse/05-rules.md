# Rules: Laravel Pulse

## Metadata
- **Source KU:** laravel-pulse
- **Subdomain:** Developer Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PULSE-RULE-001: **Secure /pulse route** — Use middleware authentication. Never expose Pulse publicly.
- PULSE-RULE-002: **Run pulse:check scheduler** — `$schedule->command('pulse:check')->everyMinute()` prevents unbounded DB growth.
- PULSE-RULE-003: **Monitor during deployments** — Keep Pulse open for 5-10min post-deploy to catch regressions.
- PULSE-RULE-004: **Start with built-in cards** — Add custom cards only for business-critical metrics.
- PULSE-RULE-005: **Use SQL storage** — Persists data across restarts (vs Redis which loses data).
- PULSE-RULE-006: **Keep raw retention at 1 hour** — Default balances debugging needs with storage.

## Decision Rules
- PULSE-RULE-007: **Use Pulse** for production real-time monitoring of throughput, slow queries, queues, exceptions.
- PULSE-RULE-008: **Use Telescope** for individual request debugging and historical analysis.
- PULSE-RULE-009: **Use Nightwatch** for long-term production APM with trends and alerting.
