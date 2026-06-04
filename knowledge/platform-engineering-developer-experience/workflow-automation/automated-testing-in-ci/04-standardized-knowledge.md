# Experience Curation: Automated Testing in CI

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/automated-testing-in-ci
- **Maturity:** Mature
- **Related Technologies:** PHPUnit, Pest, GitHub Actions, GitLab CI, Laravel, Docker, Sail
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Automated testing in CI refers to running Laravel's test suite (PHPUnit or Pest) automatically in a CI/CD pipeline on every push or pull request. The test suite includes unit tests, feature tests, and integration tests that validate application behavior, database interactions, HTTP responses, authentication, and API contracts. For Laravel applications, CI testing requires: a compatible PHP version, a database service (MySQL/PostgreSQL), a cache driver (Redis/file), a queue driver (database/redis), and environment configuration that mirrors production but uses CI-appropriate settings. Laravel's testing helpers (RefreshDatabase, WithFaker, Http facade faking, Notification faking, Mail faking) make CI testing straightforward by isolating test dependencies.

## Core Concepts
- **CI Test Runner:** A service (GitHub Actions, GitLab CI, Jenkins) that provisions a clean environment, installs dependencies, configures services, and runs the test suite on each code change
- **Service Containers:** CI services that provide MySQL, PostgreSQL, Redis, or Mailpit as standalone containers for tests
- **Parallel Testing:** Running tests in parallel across multiple processes or CI runners to reduce total execution time
- **Test Database Strategy:** Creating a dedicated test database refreshed between test runs (SQLite :memory: for unit tests, CI-provided MySQL for feature tests)
- **Caching Dependencies:** Caching vendor/ directory between CI runs to avoid re-downloading Composer dependencies on every push
- **CI as Clean Room:** Each CI run starts with a clean environment—no previous state, no cached data, no configuration drift

## When To Use
- Every Laravel application and package should have automated tests running in CI
- Projects with multiple contributors (CI ensures tests pass regardless of local environment differences)
- Applications with database interactions, API endpoints, or authentication (feature tests catch integration issues)
- Projects practicing continuous deployment (tests must pass before deployment proceeds)

## When NOT To Use
- Prototype or experimental projects where speed of iteration outweighs test coverage
- Documentation-only or static-site Laravel projects with no application logic to test
- Projects with no test suite yet (add tests and CI simultaneously; don't add CI for empty tests)

## Best Practices
- **WHY:** Use SQLite in-memory for unit tests (5-10x faster than MySQL) and MySQL service containers for feature tests that exercise database-specific behavior; this balances speed with production parity
- **WHY:** Always use the `RefreshDatabase` trait to ensure test isolation; without it, test order dependencies cause flaky failures in CI that don't reproduce locally
- **WHY:** Cache vendor/ directory based on composer.lock hash to reduce CI time by 30-60 seconds per run; restore keys provide fallback cache hits
- **WHY:** Configure CI database connection via environment variables in the CI configuration, not in .env files; this keeps CI credentials separate from development
- **WHY:** Run tests in parallel (`php artisan test --parallel`) for test suites over 500 tests; parallel execution reduces CI time by ~60% for large suites

## Architecture Guidelines
- **GitHub Actions PHPUnit Pattern:** Configure DB environment variables in CI workflow (DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE) rather than in phpunit.xml
- **Parallel Testing Pattern:** Use `php artisan test --parallel --processes=4` to run tests across 4 processes; reduces suite time by ~60%
- **Dependency Caching Pattern:** Cache vendor/ with hash-based key on composer.lock; restore keys for fallback
- **MySQL Service Container Pattern:** Use health-checked MySQL service container with testing database
- **SQLite In-Memory Pattern:** Configure phpunit.xml with DB_CONNECTION=sqlite and DB_DATABASE=:memory: for unit-only test suites
- **Coverage Reporting Pattern:** Generate coverage with `--coverage --min=80` flag to enforce minimum coverage threshold
- **Test Framework Choice:** Pest for new projects (modern, more readable assertions, parallel by default); PHPUnit for legacy projects

## Performance
- Full test suite typically takes 5-15 minutes in CI. Breakdown: composer install (30-60s), database setup (5-10s), test execution (3-12 minutes), coverage generation (30-60s)
- vendor/ caching saves 30-60 seconds per run. .phpunit.result.cache saves 10-30 seconds per run
- A test suite of 1000 tests takes 5-10 minutes to run. At 5000 tests, parallel execution is necessary to keep CI under 15 minutes
- SQLite in-memory is 5-10x faster than MySQL for unit tests but doesn't catch MySQL-specific issues

## Security
- Never hardcode production credentials in CI configuration. Use CI secrets (GitHub Actions secrets, GitLab CI variables) for test API keys or external service endpoints
- CI should not leave test data in any shared external service. Use fakes (Http::fake(), Mail::fake(), Notification::fake()) for external service interactions
- Test on isolated databases that are destroyed after each CI run
- Coverage reports may expose code paths; ensure coverage uploads are to authenticated services (Codecov, Coveralls)

## Common Mistakes

### Using SQLite for all tests
- **Description:** Running both unit and feature tests on SQLite in-memory
- **Consequence:** Feature tests pass on SQLite but fail on MySQL due to collation, strict mode, or JSON column differences
- **Better Approach:** Use SQLite for unit tests; MySQL service container for feature tests

### Forgetting to refresh database
- **Description:** Tests depend on database state from a previous test run
- **Consequence:** Tests become order-dependent; CI runs fail intermittently
- **Better Approach:** Use RefreshDatabase or DatabaseTransactions trait in all database-interacting test classes

### Hardcoded test credentials
- **Description:** Tests use real API keys or credentials checked into the repository
- **Consequence:** Credentials expire or are revoked, causing test failures; credentials exposed to all repository users
- **Better Approach:** Use CI secrets for test credentials; use fakes for external services

### Flaky tests
- **Description:** Tests that pass locally but fail intermittently in CI
- **Consequence:** Wasted CI time debugging non-existent bugs; reduced confidence in test suite
- **Better Approach:** Investigate timing, ordering, and environment differences; use deterministic data

### Not running tests in CI before merge
- **Description:** Tests pass locally but CI runs in a different environment
- **Consequence:** "Works on my machine" failures merged to main branch
- **Better Approach:** Require CI test pass as branch protection rule; never merge failing CI

## Anti-Patterns
- **Full suite on every push without parallelization:** Running all tests sequentially on every push; CI takes 30+ minutes for large suites
- **Skipping database testing entirely:** Only unit tests, no feature tests; database interaction bugs go undetected
- **Ignoring CI-only failures:** Tests that only fail in CI are marked as "CI issues" and ignored; they often indicate real environment differences
- **No coverage enforcement:** Test suite exists but coverage gradually drops; untested code grows unchecked
- **Service container without health check:** MySQL container started but tests run before it's ready; flaky failures on CI but not locally

## Examples
- **Laravel Sail:** CI can use Sail for a production-like environment; Sail provides consistent PHP/MySQL/Redis versions
- **Laravel Forge:** Forge deployment triggers can await CI success; Forge's deploy script ties into the CI pipeline
- **Laravel Vapor:** Vapor's `vapor deploy` command integrated into CI; tests run before the deploy step
- **Laravel Telescope/Debugbar:** Disabled in CI to avoid test interference; Telescope's watchers may cause side effects

## Related Topics
- github-actions-for-laravel (CI platform for running tests)
- automated-deployment-pipelines (tests validate code before deployment)
- dusk-browser-tests-ci (browser testing in CI pipeline)
- phpstan-in-ci (static analysis complements testing)
- pint-in-ci (code style checking runs alongside tests)

## AI Agent Notes
- Pest PHP framework has gained significant adoption since 2022; its parallel testing support makes it the recommended choice for new Laravel projects
- Laravel 11 introduced `php artisan test --parallel` as a first-class feature using ParaTest
- The community has shifted from SQLite-only testing toward MySQL service containers for production parity
- Flaky tests are the #1 cause of CI frustration; invest time in fixing them immediately
- For large test suites, splitting into matrix jobs (unit, feature, browser) keeps CI under 15 minutes

## Verification
- [ ] CI pipeline runs the full test suite on every push and pull request
- [ ] Database service containers (MySQL/PostgreSQL) are configured with health checks
- [ ] vendor/ caching is configured with hash-based keys
- [ ] Parallel testing is enabled for large test suites
- [ ] RefreshDatabase trait is used for test isolation
- [ ] Coverage threshold is enforced (--min=80 or similar)
- [ ] CI secrets are used for test credentials (not hardcoded)
- [ ] External services are faked (Http::fake(), Mail::fake())
- [ ] Test results are reported to PR (pass/fail status)
- [ ] Branch protection requires CI test pass before merge
