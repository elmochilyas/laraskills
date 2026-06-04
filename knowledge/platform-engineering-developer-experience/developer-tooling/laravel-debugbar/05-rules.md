# Rules: Laravel Debugbar

## Metadata
- **Source KU:** laravel-debugbar
- **Subdomain:** Developer Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- DBG-RULE-001: **Disable in production** — `DEBUGBAR_ENABLED=false`. Exposes DB queries, session data, app internals.
- DBG-RULE-002: **Disable for API routes** — `Debugbar::disable()` in API middleware to prevent response corruption.
- DBG-RULE-003: **Use IP whitelisting** — On staging, restrict via `DEBUGBAR_ALLOWED_IPS` env var.
- DBG-RULE-004: **Avoid during performance testing** — Adds 50-200ms overhead, producing inaccurate benchmarks.

## Decision Rules
- DBG-RULE-005: **Use Debugbar** for real-time in-page debugging during development. Best for quick feedback on queries, views, events.
- DBG-RULE-006: **Use Telescope** for API/JSON backends where toolbar injection doesn't work.
- DBG-RULE-007: **Use Pulse** for production real-time monitoring. Debugbar is development-only.
