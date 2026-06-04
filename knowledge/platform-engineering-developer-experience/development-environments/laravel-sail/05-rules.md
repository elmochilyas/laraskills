# Rules: Laravel Sail

## Metadata
- **Source KU:** laravel-sail
- **Subdomain:** Development Environments
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- SAIL-RULE-001: **Use sail alias** — `alias sail='bash vendor/bin/sail'` for convenient command execution.
- SAIL-RULE-002: **Don't modify docker-compose.yml directly** — Sail regenerates it; customize via .env or `sail:publish`.
- SAIL-RULE-003: **Match PHP version to production** — Avoids version-dependent bugs.
- SAIL-RULE-004: **Rebuild after Dockerfile changes** — `sail build --no-cache` — old image persists without rebuild.
- SAIL-RULE-005: **Run migrations after start** — `sail artisan migrate` — database starts empty.
- SAIL-RULE-006: **Use selective services** — Install only needed services via `--with=mysql,redis`.

## Decision Rules
- SAIL-RULE-007: **Use for all new Laravel projects** for team environment consistency.
- SAIL-RULE-008: **Use for cross-platform teams** (Windows, macOS, Linux) needing identical setups.
- SAIL-RULE-009: **Don't use in production** — Sail is a development tool.
- SAIL-RULE-010: **Don't use for simple projects** where Docker overhead outweighs consistency benefits.
