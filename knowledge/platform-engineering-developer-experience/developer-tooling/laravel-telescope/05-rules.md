# Rules: Laravel Telescope

## Metadata
- **Source KU:** laravel-telescope
- **Subdomain:** Developer Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- TELESCOPE-RULE-001: **Selective watchers in production** — Enable only Exception, SlowQuery, FailedJob watchers.
- TELESCOPE-RULE-002: **Secure /telescope route** — Gate-based authorization. Never expose without authentication.
- TELESCOPE-RULE-003: **Schedule pruning** — `telescope:prune` prevents unbounded database growth.
- TELESCOPE-RULE-004: **Filter health checks** — Exclude health check endpoints via `Telescope::filter()` to reduce noise.
- TELESCOPE-RULE-005: **Use tags** — Add `Telescope::tag(['payment:failed'])` for organized filtering.
- TELESCOPE-RULE-006: **Redis storage for high-traffic** — Reduces database write load.

## Decision Rules
- TELESCOPE-RULE-007: **Use Telescope** for post-mortem analysis of failed requests and queue/job debugging.
- TELESCOPE-RULE-008: **Use Debugbar** for faster in-page feedback during development.
- TELESCOPE-RULE-009: **Use Pulse** for real-time aggregate live monitoring.
