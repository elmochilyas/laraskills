# Rules: Log Viewer and Debugging Patterns

## Metadata
- **Source KU:** log-viewer-debugging-patterns
- **Subdomain:** Developer Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- LOG-RULE-001: **Use structured logging** — JSON-formatted entries for machine parsing and centralized aggregation.
- LOG-RULE-002: **Use context arrays** — `Log::error('Payment failed', ['order_id' => 123, 'amount' => 50.00])` for actionable logs.
- LOG-RULE-003: **Configure log rotation** — Daily or size-based rotation with retention policy to prevent disk exhaustion.
- LOG-RULE-004: **Environment-based verbosity** — DEBUG in dev, INFO in staging, WARNING in production.
- LOG-RULE-005: **Use log channels** — Separate channels for application, queue, HTTP client, and security events.

## Decision Rules
- LOG-RULE-006: **Use logs** for post-incident analysis and production debugging.
- LOG-RULE-007: **Use Debugbar** for real-time request debugging during development.
- LOG-RULE-008: **Use log viewer package** (`opcodes/log-viewer`) for web UI log browsing without SSH.
