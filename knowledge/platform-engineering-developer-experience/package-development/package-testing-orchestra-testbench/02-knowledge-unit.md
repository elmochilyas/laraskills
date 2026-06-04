# Knowledge Unit: Package Testing with Orchestra Testbench

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/package-testing-orchestra-testbench
- **Maturity:** Mature
- **Related Technologies:** PHPUnit, Pest, Laravel, Orchestra Testbench, Composer

## Executive Summary

Orchestra Testbench is the standard testing framework for Laravel packages. It boots a full Laravel application instance within the test environment, allowing package tests to exercise service provider registration, routing, configuration merging, database migrations, and view rendering—just as they would in a real Laravel application. The `Orchestra\Testbench\TestCase` base class extends PHPUnit's TestCase and provides methods for: loading package service providers, configuring the application environment, running migrations against an in-memory SQLite database, and making HTTP requests to package routes. Testbench supports testing across multiple Laravel versions using their version matrix.

## Core Concepts

- **Orchestra Testbench TestCase:** A base test class that creates a Laravel application instance for each test method; provides `getPackageProviders()` to auto-load the package's service provider
- **In-Memory Database:** By default, Testbench uses SQLite `:memory:` for testing migrations without requiring a real database connection
- **Package Auto-Discovery in Tests:** The `getPackageProviders()` method registers the package's service provider in the test-booted Laravel application, enabling provider-level integration tests
- **Environment Configuration:** `getEnvironmentSetUp()` method allows overriding application config values for tests (e.g., setting specific queue driver, cache store, or mail driver)

## Mental Models

- **Testbench as a Laravel Simulator:** It boots a real (minimal) Laravel application for each test, providing the same environment the package will run in—no mocks needed for framework interactions
- **Testbench as an Integration Test Framework:** It's designed for integration tests that verify package behavior end-to-end; unit tests for isolated package logic don't need Testbench
- **SQLite :memory: as a Zero-Config Database:** No external database needed; migrations run against an in-memory SQLite instance that persists only for the test method duration
- **Testbench Version Matrix:** Different Testbench versions support different Laravel versions; choosing the correct Testbench version is essential for the target Laravel version

## Internal Mechanics

1. **Test Boot Process:** `setUp()` in Testbench TestCase calls parent `setUp()` → creates `Illuminate\Foundation\Application` instance → registers default service providers → calls `getPackageProviders()` to register package providers → calls `getEnvironmentSetUp()` for config overrides → boots the application → your test method runs.
2. **Migration Execution:** `$this->setUpDatabase()` or `$this->artisan('migrate')` runs the package's migrations against the in-memory SQLite database; each test class typically migrates once in `setUp()`, not per method.
3. **Route Testing:** Package routes registered in boot() are available for HTTP testing via `$this->get()`, `$this->post()`, etc.; Testbench sets up a router and request pipeline.
4. **Facade/Alias Registration:** Package facades registered via `$this->app->register()` or auto-discovery are available in tests; `getPackageAliases()` method can register aliases explicitly.
5. **Database Assertions:** After database operations, use `$this->assertDatabaseHas()`, `$this->assertDatabaseMissing()`, `$this->assertDatabaseCount()` for state verification.

## Patterns

- **RefreshDatabase Trait Pattern:** Load `Illuminate\Foundation\Testing\RefreshDatabase` trait to reset the database between tests; for package testing, this ensures test isolation without manual cleanup.
- **Service Provider Loading Pattern:** Override `getPackageProviders()` to return `[PackageServiceProvider::class]`; for packages using Spatie tools, this loads the Spatie PackageServiceProvider automatically.
- **Config Override Pattern:** Override `getEnvironmentSetUp()` to set test-specific values: `$app['config']->set('database.default', 'sqlite'); $app['config']->set('database.connections.sqlite.database', ':memory:');`.
- **Multi-Version Testing Pattern:** Use PHPUnit's `@requires` annotation or matrix builds in CI to test across multiple Laravel/Testbench versions; conditional test logic for version-specific behavior.
- **Model Factory Pattern:** Define package model factories in `database/factories/` and register in `getEnvironmentSetUp()` for test data creation; factories are bootstrapped into the Testbench application.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Test framework | PHPUnit vs Pest via Testbench | PHPUnit for established packages; Pest for new packages (Pest has Testbridge for Testbench) |
| Database engine | SQLite :memory: vs MySQL vs PostgreSQL | SQLite :memory: for CI speed; MySQL/PostgreSQL for dialect-specific tests |
| Factory location | Package factories vs test helpers | Package factories for shared models; test helpers for one-off test setups |
| Route testing | Testbench HTTP tests vs contract tests | Testbench HTTP for end-to-end; contract tests for API package stability |

## Tradeoffs

- **Testbench Boot Time vs Test Isolation:** Each Testbench test creates a new Laravel application instance; boot takes ~100-200ms per test class. For large test suites, use `cachesApplication()` to share the app instance across tests (with care for state leakage).
- **SQLite vs Production Database:** SQLite in-memory is fast but doesn't catch MySQL-specific or PostgreSQL-specific SQL issues. Testbench supports multiple database connections; use SQLite for unit speed and a real database for integration CI.
- **Full Integration vs Unit Tests:** Testbench enables comprehensive integration tests but test execution is slower than isolated unit tests with mocking. Use both: unit tests for business logic, Testbench for provider + routing + migration integration.
- **Testbench Version Compatibility:** Each Laravel version requires a specific Testbench major version. The matrix constraint can be complex: package supports Laravel 10-11, requires Testbench 8-9 with conditional configuration.

## Performance Considerations

- **Test Class Boot Time:** ~100-200ms per test class (not per test method). Keep test classes focused (5-15 test methods) to amortize boot cost across multiple assertions.
- **Database Migration Time:** Full migration suite across all package migrations takes 100-500ms per test class. Use `RefreshDatabase` trait to only reset, not remigrate, between tests within the same class.
- **CI Pipeline Duration:** With 4 PHP versions × 3 Laravel versions = 12 CI jobs, each running 50+ tests, total CI time can exceed 30 minutes. Minimize by: reducing version matrix to LTS-only combinations, parallelizing test execution.
- **Memory Usage:** Each Testbench boot uses ~15-25MB of memory. For suites with many test classes, ensure PHP `memory_limit` is set appropriately (256M+).

## Production Considerations

- **CI Configuration:** Set up GitHub Actions (or equivalent) to run package tests with the Testbench version matrix: PHP 8.1-8.4 × Laravel 10-11 × database SQLite + MySQL.
- **Testbench Version Strategy:** Pin minimum Testbench version in `composer.json` `require-dev` to the lowest supported version; test with newer versions in CI matrix.
- **Database-Specific Tests:** For packages with database-specific features (JSON columns, full-text search, GIS data), add CI jobs with MySQL and PostgreSQL in addition to default SQLite.
- **Code Coverage:** Configure PHPUnit with Xdebug for coverage reports; Testbench supports code coverage without issues as it boots a real Laravel application.

## Common Mistakes

- **Not registering package providers:** Forgetting `getPackageProviders()` → package routes, commands, and configs aren't loaded → tests pass even when provider registration is broken
- **Using env() in config files without TestBench setup:** `env()` returns null in Testbench unless explicitly set; use `getEnvironmentSetUp()` or Config facade to set values
- **Assuming MySQL-specific features work on SQLite:** Using JSON column operations or `WHERE IN` ordering; SQLite has different capabilities; test with target database in CI
- **Shared state between tests:** Modifying application config, database state, or cache in one test affects others; use `RefreshDatabase` and reset config changes in `tearDown()`
- **Wrong Testbench version for Laravel version:** Installing Testbench 8 for Laravel 11 but using Testbench 8 API features that don't exist leads to confusing failures

## Failure Modes

- **Testbench Boot Failure:** Package's service provider throws exception during registration, preventing any test from running. Mitigate: add a minimal boot test that only verifies the provider registers without error.
- **SQLite Incompatibility:** Package migration uses MySQL-specific syntax (ENUM, JSON column, STORED generated columns) that fails on SQLite. Mitigate: test with MySQL in CI; use conditional migration code for compatibility.
- **Version Matrix Gap:** New Laravel version released but Testbench support not yet available, blocking testing. Mitigate: use `orchestra/testbench-legacy` for LTS versions; pin to working combinations.
- **Composer Dependency Conflict:** Package requires `orchestra/testbench ^8.0` but another dev dependency requires `^7.0`. Mitigate: analyze `composer why` output; consolidate on compatible version range.

## Ecosystem Usage

- **Spatie Packages:** All Spatie packages use Orchestra Testbench with consistent patterns; the Spatie package skeleton includes pre-configured Testbench setup
- **Laravel Core Packages:** Telescope, Horizon, Passport, Sanctum, and Pulse all use Testbench for testing
- **Community Packages:** Thousands of packages use Testbench; it's the de facto standard for Laravel package testing
- **Laravel Framework Tests:** The framework itself uses Orchestra Testbench for testing (the framework's test suite boots the application via Testbench)

## Related Knowledge Units

- package-skeleton-structure
- spatie-laravel-package-tools
- package-service-provider-patterns
- phpstan-config-for-laravel

## Research Notes

- Orchestra Testbench is maintained by the same community that maintains Laravel core dependencies (Taylor Otwell's team)
- Testbench's boot time has decreased significantly from v6 (500ms) to v9 (100-200ms) due to optimized application booting
- The Testbench version matrix is well-documented but remains the most common source of CI failures for package maintainers
- Pest (the alternative PHP testing framework) has `pest-plugin-testbench` for integration with Testbench, making it a viable alternative for new packages
