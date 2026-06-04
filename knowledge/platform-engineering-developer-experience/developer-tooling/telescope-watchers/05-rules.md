# Rules: Telescope Watchers

## Metadata
- **Source KU:** telescope-watchers
- **Subdomain:** Developer Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- TELWATCH-RULE-001: **Enable all watchers in development** — 18 built-in watchers for comprehensive debugging.
- TELWATCH-RULE-002: **Selective watchers in production** — Enable only Exception, SlowQuery, FailedJob to limit overhead.
- TELWATCH-RULE-003: **Configure watcher thresholds** — `QueryWatcher` `slow` threshold, `RequestWatcher` `size_limit` in `config/telescope.php`.
- TELWATCH-RULE-004: **Filter sensitive data** — Use `Telescope::filter()` to exclude health checks, sensitive endpoints.

## Architecture Rules
- TELWATCH-RULE-005: **Custom watchers** — Extend `Telescope\Watchers\Watcher` for app-specific debugging data capture.
- TELWATCH-RULE-006: **Entry recording** — Watchers create `EntryResult` objects via `Telescope::record()`.
- TELWATCH-RULE-007: **Tag entries** — Automatic tags (`auth:user-{id}`, `slow:true`) for dashboard filtering.

## Decision Rules
- TELWATCH-RULE-008: **Full capture in development** — All watchers enabled for complete debugging insight.
- TELWATCH-RULE-009: **Minimal capture in production** — Only Exception, SlowQuery, FailedJob to balance insight vs overhead.
