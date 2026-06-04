# Rules: GitHub Actions for Laravel

## Metadata
- **Source KU:** github-actions-for-laravel
- **Subdomain:** Workflow Automation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- GHA-RULE-001: **Use dependency caching** — Cache vendor/ and node_modules/ based on lock file hashes.
- GHA-RULE-002: **Health-check MySQL service containers** before running tests.
- GHA-RULE-003: **Use parallel jobs** for Pint, PHPStan, and tests — Reduces total pipeline time from 15-20min to 5-10min.
- GHA-RULE-004: **Store secrets as GitHub Actions secrets** — Never hardcode in workflow files. Rotate quarterly.
- GHA-RULE-005: **Use matrix builds for packages** — Single-version for apps matching production.
- GHA-RULE-006: **Deploy only after all test jobs pass** — Use `needs:` dependency on main branch pushes only.

## Architecture Rules
- GHA-RULE-007: **Standard pattern:** actions/cache for vendor/, shivammathur/setup-php, MySQL service container, matrix strategy.
- GHA-RULE-008: **Separate jobs for pint, phpstan, tests** running concurrently with independent runners.
- GHA-RULE-009: **Scheduled workflows** for cron-based maintenance: health checks, data pruning, cache warming.
- GHA-RULE-010: **Matrix testing** for packages — test multiple PHP/Laravel version combos; exclude incompatible pairs.

## Decision Rules
- GHA-RULE-011: **Use GitHub Actions for Laravel apps on GitHub** — Native integration, no additional platform.
- GHA-RULE-012: **Use GitLab CI/Runner native CI** for projects on non-GitHub hosting.
