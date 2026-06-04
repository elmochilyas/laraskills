# Rules: Package Testing with Orchestra Testbench

## Metadata
- **Source KU:** package-testing-orchestra-testbench
- **Subdomain:** Package Development
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- TESTBENCH-RULE-001: **Extend Orchestra\Testbench\TestCase** — Test classes must extend this base class for Laravel integration testing.
- TESTBENCH-RULE-002: **Override getPackageProviders()** — Always return the package's service provider. Without this, provider-level registration is untested.
- TESTBENCH-RULE-003: **Use getEnvironmentSetUp()** — Configure test-specific settings (database, cache, queue) rather than relying on app defaults.
- TESTBENCH-RULE-004: **SQLite :memory: as default** — Fast CI tests. Add MySQL/PostgreSQL jobs for dialect-specific testing.
- TESTBENCH-RULE-005: **Use RefreshDatabase trait** — Resets database state between tests. Prevents migration re-execution per test class.

## Architecture Rules
- TESTBENCH-RULE-006: **Multi-version CI matrix** — Test across PHP 8.1-8.4 × Laravel 10-11 × SQLite + MySQL for guaranteed compatibility.
- TESTBENCH-RULE-007: **Focus test classes 5-15 methods** — Amortizes the ~100-200ms boot cost across multiple assertions.
- TESTBENCH-RULE-008: **Unit tests for isolated logic** — Not everything needs Testbench. Use plain PHPUnit/Pest for simple logic.

## Security Rules
- TESTBENCH-RULE-009: **No production credentials** — Use `getEnvironmentSetUp()` for test-specific configuration. Never point at production-like databases.

## Common Mistakes
- TESTBENCH-RULE-010: **Not registering package providers** — Tests pass even when provider registration is broken.
- TESTBENCH-RULE-011: **MySQL-specific features on SQLite** — JSON operations, `WHERE IN` ordering fail on SQLite. Test both.
- TESTBENCH-RULE-012: **Wrong Testbench version** — Must match target Laravel version. Check the version matrix documentation.
- TESTBENCH-RULE-013: **Shared state between tests** — Use `RefreshDatabase` trait. Reset config in `tearDown()`. Avoid static state.

## Anti-Pattern Rules
- TESTBENCH-RULE-014: **Avoid only unit tests, no Testbench** — Provider registration, routing, and migration bugs go undetected.
- TESTBENCH-RULE-015: **Avoid only Testbench, no unit tests** — Using Testbench for simple logic that doesn't need Laravel is unnecessarily slow.
- TESTBENCH-RULE-016: **Avoid skipping version matrix** — Testing only latest Laravel version misses backward compatibility issues.
