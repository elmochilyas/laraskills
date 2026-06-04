# Rules: Xdebug Integration with Sail

## Metadata
- **Source KU:** xdebug-integration-sail
- **Subdomain:** Developer Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- XDEBUG-RULE-001: **Disable when not debugging** — Xdebug adds significant overhead. Leave disabled via `SAIL_XDEBUG_MODE=off` when not actively debugging.
- XDEBUG-RULE-002: **Never enable in production** — Xdebug must never be enabled in production environments.
- XDEBUG-RULE-003: **Use trigger variables** — `XDEBUG_SESSION` cookie/GET parameter to start debugging on demand.

## Architecture Rules
- XDEBUG-RULE-004: **Sail includes Xdebug** — Pre-installed in PHP Docker images. Configured via `SAIL_XDEBUG_MODE` and `SAIL_XDEBUG_CONFIG`.
- XDEBUG-RULE-005: **IDE key matching** — `PHPSTORM` or `VSCODE` must match IDE configuration for session detection.
- XDEBUG-RULE-006: **Docker host communication** — Uses `host.docker.internal` for container-to-host IDE connection.

## Decision Rules
- XDEBUG-RULE-007: **Use for step debugging** complex business logic and failing tests with breakpoints.
- XDEBUG-RULE-008: **Use for profiling** — Cachegrind output for performance analysis.
- XDEBUG-RULE-009: **Use Debugbar/logs** for simpler issues that don't require step debugging.
