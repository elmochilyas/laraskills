# Rules: Automated Testing in CI

## Metadata
- **Source KU:** automated-testing-in-ci
- **Subdomain:** Workflow Automation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- ATCI-RULE-001: **Use SQLite in-memory for unit tests** (5-10x faster) and MySQL service containers for feature tests.
- ATCI-RULE-002: **Always use RefreshDatabase trait** for test isolation — Avoids order-dependent flaky failures.
- ATCI-RULE-003: **Cache vendor/ based on composer.lock hash** — Reduces CI time by 30-60s per run.
- ATCI-RULE-004: **Configure CI DB connection via CI env vars** — Not in .env files; keeps CI credentials separate.
- ATCI-RULE-005: **Run tests in parallel** for suites over 500 tests — `php artisan test --parallel` reduces time ~60%.
- ATCI-RULE-006: **Enforce coverage threshold** — `--coverage --min=80` in CI pipeline.

## Architecture Rules
- ATCI-RULE-007: **DB env vars in CI workflow** (DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE), not in phpunit.xml.
- ATCI-RULE-008: **MySQL service container** with health checks for feature tests.
- ATCI-RULE-009: **CI is a clean room** — Clean environment, no previous state, no configuration drift.
- ATCI-RULE-010: **Pest for new projects** — Modern assertions, parallel by default. PHPUnit for legacy.

## Decision Rules
- ATCI-RULE-011: **Every Laravel app** should have automated tests running in CI.
- ATCI-RULE-012: **Skip for prototypes** where iteration speed outweighs test coverage.
- ATCI-RULE-013: **Require CI test pass** as branch protection rule — Never merge failing CI.
