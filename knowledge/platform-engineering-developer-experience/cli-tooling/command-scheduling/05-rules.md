# Rules: Command Scheduling

## Metadata
- **Source KU:** command-scheduling
- **Subdomain:** CLI Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- SCHED-RULE-001: **Single cron entry** — Entire schedule operates through `* * * * * php artisan schedule:run`.
- SCHED-RULE-002: **Always use `->withoutOverlapping()`** for tasks that run more frequently than their duration.
- SCHED-RULE-003: **Log all task output** with `->appendOutputTo($path)` for audit trails and debugging.
- SCHED-RULE-004: **Background for long tasks** — Use `->runInBackground()` so scheduler continues processing.
- SCHED-RULE-005: **Set mutex TTL** — `->withoutOverlapping(60)` with timeout prevents deadlocks from crashed tasks.
- SCHED-RULE-006: **Heartbeat monitoring** — Schedule a health-check recording task every minute to detect if cron stops.

## Architecture Rules
- SCHED-RULE-007: **Define schedules in `Kernel::schedule()`** grouped by domain or frequency.
- SCHED-RULE-008: **Use `->environments('production')`** to gate environment-specific tasks.
- SCHED-RULE-009: **Multi-server deployments** — Use `->onOneServer()` with shared cache (Redis) for coordination.
- SCHED-RULE-010: **Scheduled commands must never call interactive methods** (`ask()`, `confirm()`).

## Decision Rules
- SCHED-RULE-011: **Use for recurring maintenance, scheduled data processing, and heartbeat monitoring.**
- SCHED-RULE-012: **Use queues/listeners** for real-time or event-driven tasks instead.
