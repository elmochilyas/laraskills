# Rules: Sail Customization (Dockerfiles)

## Metadata
- **Source KU:** sail-customization-dockerfiles
- **Subdomain:** Development Environments
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- SAILCUST-RULE-001: **Don't modify vendor/sail directly** — Changes overwritten on `composer update`; always use `sail:publish`.
- SAILCUST-RULE-002: **Chain RUN commands** — `RUN apk add pkg1 && docker-php-ext-install ext1` minimizes layers.
- SAILCUST-RULE-003: **Order by change frequency** — Least-changed instructions first to maximize Docker layer caching.
- SAILCUST-RULE-004: **Use shared scripts for multi-version** — Extract common install logic for version parity.
- SAILCUST-RULE-005: **Rebuild after changes** — `sail build --no-cache` — old image persists without rebuild.
- SAILCUST-RULE-006: **Commit docker/ directory** — Share customizations across the team via version control.

## Decision Rules
- SAILCUST-RULE-007: **Use when projects need PHP extensions not in Sail's default** (gd, imagick, swoole, pcntl).
- SAILCUST-RULE-008: **Add non-PHP services as separate Docker Compose services** — Don't overload the PHP container.
- SAILCUST-RULE-009: **Only publish when customization is needed** — Keep default Sail otherwise.
