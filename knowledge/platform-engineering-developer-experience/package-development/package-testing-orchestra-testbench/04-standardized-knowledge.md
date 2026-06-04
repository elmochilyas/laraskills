# Experience Curation: Package Testing with Orchestra Testbench

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/package-testing-orchestra-testbench
- **Maturity:** Mature
- **Related Technologies:** PHPUnit, Pest, Laravel, Orchestra Testbench, Composer
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Orchestra Testbench is the standard testing framework for Laravel packages. It boots a full Laravel application instance within the test environment, allowing package tests to exercise service provider registration, routing, configuration merging, database migrations, and view rendering—just as they would in a real Laravel application. The `Orchestra\Testbench\TestCase` base class extends PHPUnit's TestCase and provides methods for: loading package service providers, configuring the application environment, running migrations against an in-memory SQLite database, and making HTTP requests to package routes. Testbench supports testing across multiple Laravel versions using their version matrix.

## Core Concepts
- **Orchestra Testbench TestCase:** A base test class that creates a Laravel application instance for each test method; provides `getPackageProviders()` to auto-load the package's service provider
- **In-Memory Database:** By default, Testbench uses SQLite `:memory:` for testing migrations without requiring a real database connection
- **Package Auto-Discovery in Tests:** `getPackageProviders()` registers the package's service provider in the test-booted Laravel application, enabling provider-level integration tests
- **Environment Configuration:** `getEnvironmentSetUp()` allows overriding application config values for tests (e.g., setting specific queue driver, cache store, or mail driver)
- **Testbench as a Laravel Simulator:** It boots a real (minimal) Laravel application for each test, providing the same environment the package will run in
- **Testbench as an Integration Test Framework:** Designed for integration tests; unit tests for isolated logic don't need Testbench

## When To Use
- Testing service provider registration and boot logic
- Testing package routes and controllers with HTTP requests
- Testing configuration merging and publishing behavior
- Testing database migrations against a real (SQLite) database
- Testing view rendering and component registration
- Testing multi-version compatibility across Laravel versions

## When NOT To Use
- Unit testing isolated business logic that doesn't depend on Laravel framework (use plain PHPUnit/Pest)
- Testing pure PHP classes with no framework dependencies (use standard unit tests for speed)
- Packages that don't interact with Laravel's service container, config, routing, or database
- Performance-sensitive test suites where Testbench's boot overhead is disproportionate to test value

## Best Practices
- **WHY:** Override `getPackageProviders()` to return the package's service provider; without this, provider-level registration is not tested
- **WHY:** Use SQLite `:memory:` as the default database for fast CI tests; add MySQL/PostgreSQL jobs for dialect-specific tests
- **WHY:** Override `getEnvironmentSetUp()` to configure test-specific settings (database, cache, queue drivers) rather than relying on application defaults
- **WHY:** Use the `RefreshDatabase` trait to reset database state between tests within the same class, avoiding migration re-execution
- **WHY:** Configure CI with a version matrix (PHP 8.1-8.4 × Laravel 10-11 × SQLite + MySQL) to ensure compatibility across supported versions
- **WHY:** Keep test classes focused (5-15 test methods) to amortize the ~100-200ms boot cost across multiple assertions

## Architecture Guidelines
- **Service Provider Loading Pattern:** Override `getPackageProviders()` to return `[PackageServiceProvider::class]`
- **Config Override Pattern:** Override `getEnvironmentSetUp()` to set test-specific config values via `$app['config']->set()`
- **Database Testing Pattern:** Use SQLite `:memory:` for speed; add MySQL/PostgreSQL jobs in CI for dialect-specific testing
- **Multi-Version Testing Pattern:** Use PHPUnit's `@requires` annotation or matrix builds in CI across multiple Laravel/Testbench versions
- **Model Factory Pattern:** Define package model factories in `database/factories/` and register in `getEnvironmentSetUp()` for test data creation
- **Route Testing Pattern:** Package routes registered in boot() are available for HTTP testing via `$this->get()`, `$this->post()`, etc.
- **RefreshDatabase Trait Pattern:** Load `Illuminate\Foundation\Testing\RefreshDatabase` to reset database between tests

## Performance
- ~100-200ms boot time per test class (not per test method); keep test classes focused with 5-15 test methods
- Full migration suite takes 100-500ms per test class; use `RefreshDatabase` to only reset, not remigrate, between tests
- With 4 PHP versions × 3 Laravel versions = 12 CI jobs, total CI time can exceed 30 minutes; minimize by testing LTS-only combinations
- Each Testbench boot uses ~15-25MB of memory; ensure PHP `memory_limit` is set appropriately (256M+)
- Testbench's boot time has decreased from v6 (500ms) to v9 (100-200ms) due to optimized application booting

## Security
- Testbench creates a fresh application for each test, ensuring no state leakage between tests
- Ensure tests don't use production credentials or API keys; use `getEnvironmentSetUp()` for test-specific configuration
- Database tests should use isolated SQLite databases; never point tests at production-like databases
- Testbench's in-memory database is ephemeral and leaves no traces; suitable for CI environments

## Common Mistakes

### Not registering package providers
- **Description:** Forgetting to override `getPackageProviders()` in the test class
- **Consequence:** Package routes, commands, and configs aren't loaded; tests pass even when provider registration is broken
- **Better Approach:** Always return the package's service provider from `getPackageProviders()`; this is the core of integration testing

### Using env() in config files without Testbench setup
- **Description:** Package config uses `env()` calls that return null in Testbench unless explicitly set
- **Consequence:** Config values are null or fallback defaults, which may differ from real application behavior
- **Better Approach:** Use `getEnvironmentSetUp()` or Config facade to set values; don't rely on `env()` in package config files for test scenarios

### Assuming MySQL-specific features work on SQLite
- **Description:** Using JSON column operations, `WHERE IN` ordering, or other MySQL-specific SQL
- **Consequence:** Tests pass on SQLite but fail in production with MySQL; false sense of security
- **Better Approach:** Test with both SQLite (fast CI) and MySQL (production parity); use conditional migration code for compatibility

### Shared state between tests
- **Description:** Modifying application config, database state, or cache in one test affects others
- **Consequence:** Tests become order-dependent; one test's changes leak into another test's assertions
- **Better Approach:** Use `RefreshDatabase` trait; reset config changes in `tearDown()`; avoid static state

### Wrong Testbench version for Laravel version
- **Description:** Installing Testbench incompatible with the target Laravel version
- **Consequence:** Boot failures, missing methods, confusing errors
- **Better Approach:** Follow Testbench's version matrix documentation; pin minimum version in `composer.json` `require-dev`

## Anti-Patterns
- **Only unit tests, no Testbench:** Testing package classes in isolation without testing service provider registration, routing, or migration; provider bugs go undetected
- **Only Testbench, no unit tests:** Using Testbench for every test, even simple logic that doesn't need a Laravel application; unnecessarily slow test suite
- **Hardcoded database paths in tests:** Using file-based SQLite databases that persist between runs; use `:memory:` for isolation
- **Testing implementation details:** Writing tests that assert specific config values or internal behavior rather than observable package behavior
- **Skipping version matrix testing:** Testing only the latest Laravel version and assuming backward compatibility

## Examples
- **Spatie Packages:** All Spatie packages use Testbench with consistent patterns; the skeleton includes pre-configured Testbench setup
- **Laravel Telescope:** Uses Testbench for testing service provider registration, dashboard routes, and data recording
- **Laravel Sanctum:** Uses Testbench for testing token-based authentication, middleware, and route protection
- **Spatie/laravel-permission:** Uses Testbench for testing permission gates, middleware, and Blade directives in a full Laravel context

## Related Topics
- package-skeleton-structure (skeleton includes pre-configured Testbench setup)
- spatie-laravel-package-tools (Testbench integration for packages using Spatie tools)
- package-service-provider-patterns (Testbench tests provider registration)
- phpstan-config-for-laravel (static analysis complements Testbench integration testing)
- pest-testing-framework (Pest has Testbench integration via pest-plugin-testbench)

## AI Agent Notes
- Testbench is the de facto standard for Laravel package testing; always recommend it for integration tests
- The Testbench version matrix is well-documented but remains the most common source of CI failures; always verify version compatibility
- SQLite `:memory:` is the default and fastest option; add MySQL/PostgreSQL for production-parity testing
- Testbench boot time has improved significantly from v6 (500ms) to v9 (100-200ms); this matters for test suite organization
- For new packages, Pest with pest-plugin-testbench is a viable alternative to PHPUnit

## Verification
- [ ] Test classes extend `Orchestra\Testbench\TestCase`
- [ ] `getPackageProviders()` returns the package's service provider class
- [ ] `getEnvironmentSetUp()` configures test-specific settings (database, cache, queue)
- [ ] SQLite `:memory:` is used as the default database
- [ ] `RefreshDatabase` trait is used for test isolation
- [ ] CI matrix tests across supported PHP and Laravel versions
- [ ] Both SQLite and MySQL are tested in CI
- [ ] Testbench version matches the target Laravel version
- [ ] A minimal boot test verifies the provider registers without error
- [ ] Unit tests for isolated logic exist alongside integration tests
