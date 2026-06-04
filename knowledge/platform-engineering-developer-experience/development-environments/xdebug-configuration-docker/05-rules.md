# Rules: Xdebug Configuration in Docker

## Metadata
- **Source KU:** xdebug-configuration-docker
- **Subdomain:** Development Environments
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- XDEBUGD-RULE-001: **Toggle on demand** — Set `SAIL_XDEBUG_MODE=debug,develop` only during active debugging; default to off.
- XDEBUGD-RULE-002: **Use trigger mode** — `start_with_request=trigger` adds zero overhead until `XDEBUG_TRIGGER=1` is set.
- XDEBUGD-RULE-003: **Use `host.docker.internal`** — Docker Desktop provides this DNS name automatically for host access.
- XDEBUGD-RULE-004: **Start IDE listener first** — Click "Start Listening" before triggering a debug session.
- XDEBUGD-RULE-005: **Restart Sail after config change** — `sail stop && sail up -d` — SAIL_XDEBUG_MODE read at container start.
- XDEBUGD-RULE-006: **Use develop mode safely** — Safe for daily dev (only enhanced var_dump, ~3-5% overhead).

## Decision Rules
- XDEBUGD-RULE-007: **Use for step debugging** complex business logic during development.
- XDEBUGD-RULE-008: **Never enable in production** — Leaks code paths, slows requests, debug port is security risk.
- XDEBUGD-RULE-009: **Use Debugbar/Pulse for monitoring** — Xdebug only for step debugging, not for monitoring.
