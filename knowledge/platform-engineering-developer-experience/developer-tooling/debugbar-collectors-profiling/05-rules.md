# Rules: Debugbar Collectors and Profiling

## Metadata
- **Source KU:** debugbar-collectors-profiling
- **Subdomain:** Developer Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- DBGCOL-RULE-001: **Disable in production** — `DEBUGBAR_ENABLED=false` or `APP_DEBUG=false`. Exposes DB queries with values and session data.
- DBGCOL-RULE-002: **Disable for API routes** — Use `Debugbar::disable()` in API middleware to prevent response corruption.
- DBGCOL-RULE-003: **Selective collection** — Enable only needed collectors to minimize overhead.
- DBGCOL-RULE-004: **Limit stack trace depth** — 3-5 levels identifies query source with lower overhead than full traces.

## Architecture Rules
- DBGCOL-RULE-005: **Custom collectors** — Extend `Debugbar\DataCollector\DataCollector` for app-specific debugging data.
- DBGCOL-RULE-006: **Environment-based config** — All collectors in dev; selective in staging; disabled in production.

## Decision Rules
- DBGCOL-RULE-007: **Use Debugbar** for real-time in-page debugging during development.
- DBGCOL-RULE-008: **Use Telescope** for historical debugging and API/JSON responses.
- DBGCOL-RULE-009: **Avoid during performance testing** — Debugbar adds 50-200ms overhead.
