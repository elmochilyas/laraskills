# Knowledge Unit: Automated Testing in CI

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/automated-testing-in-ci
- **Maturity:** Mature
- **Related Technologies:** PHPUnit, Pest, GitHub Actions, GitLab CI, Laravel, Docker, Sail

## Executive Summary

Automated testing in CI refers to running Laravel's test suite (PHPUnit or Pest) automatically in a CI/CD pipeline on every push or pull request. The test suite includes unit tests, feature tests, and integration tests that validate application behavior, database interactions, HTTP responses, authentication, and API contracts. For Laravel applications, CI testing requires: a compatible PHP version, a database service (MySQL/PostgreSQL), a cache driver (Redis/file), a queue driver (database/redis), and environment configuration that mirrors production but uses CI-appropriate settings. Laravel's testing helpers (RefreshDatabase, WithFaker, Http facade faking, Notification faking, Mail faking) make CI testing straightforward by isolating test dependencies. The goal of automated testing in CI is to catch regressions before they reach production, enforce test coverage standards, and provide confidence for continuous deployment.

## Core Concepts

- **CI Test Runner:** A service (GitHub Actions, GitLab CI, Jenkins) that provisions a clean environment, installs dependencies, configures services, and runs the test suite on each code change
- **Service Containers:** CI services that provide MySQL, PostgreSQL, Redis, or Mailpit as standalone containers for tests; Laravel's `phpunit.xml` database configuration points to these CI services
- **Parallel Testing:** Running tests in parallel across multiple processes or CI runners to reduce total execution time; Laravel's `->parallel()` testing feature and PHPUnit's parallel testing support
- **Test Database Strategy:** Creating a dedicated test database (using `:memory:` SQLite for unit tests, or a CI-provided MySQL database for feature tests) that is refreshed between test runs
- **Caching Dependencies:** Caching the vendor/ directory between CI runs to avoid re-downloading Composer dependencies on every push, reducing pipeline time from 5+ minutes to under a minute

## Mental Models

- **CI as Clean Room:** Each CI run starts with a clean environment—no previous state, no cached data, no configuration drift. If tests pass in CI, the code is verified in isolation from any developer's specific environment.
- **Test Suite as Safety Net:** The CI test suite is a safety net deployed under every code change; if the net catches something (a test failure), the code doesn't progress to production until the hole is fixed.
- **Service Containers as Test Fixtures:** CI service containers (MySQL, Redis, Mailpit) are fixtures at the infrastructure level—they provide the same environment for every test run, eliminating "works on my machine" variability.

## Internal Mechanics

1. **Trigger:** Push to any branch, PR creation, or scheduled workflow
2. **Environment Provisioning:** CI provisions a PHP container (or runner with PHP installed), MySQL/PostgreSQL container, and Redis container
3. **Dependency Installation:** composer install (or composer install --no-interaction --prefer-dist) with caching; npm ci for frontend assets (if tested)
4. **Environment Configuration:** .env.testing or phpunit.xml environment variables configure database connection to CI service containers (DB_HOST=127.0.0.1, DB_PORT=3306, DB_DATABASE=testing, etc.)
5. **Database Setup:** php artisan migrate (or RefreshDatabase trait handles this per-test) to create the test schema
6. **Test Execution:** php artisan test or ./vendor/bin/pest runs the full test suite with parallel execution when available
7. **Result Reporting:** Test results are reported to the PR (pass/fail status), coverage reports are generated, and failure details (stack traces, failing assertions) are surfaced in CI logs

## Patterns

- **GitHub Actions PHPUnit Pattern:**
  ```yaml
  - name: Run tests
    env:
      DB_CONNECTION: mysql
      DB_HOST: 127.0.0.1
      DB_PORT: 3306
      DB_DATABASE: testing
      DB_USERNAME: root
      DB_PASSWORD: password
    run: php artisan test --parallel
  ```
  Uses environment variables to configure Laravel's database connection for CI.
- **Parallel Testing Pattern:**
  ```bash
  php artisan test --parallel --processes=4
  ```
  Runs tests across 4 processes, reducing total suite time by ~60% for large test suites.
- **Dependency Caching Pattern:**
  ```yaml
  - name: Cache Composer dependencies
    uses: actions/cache@v3
    with:
      path: vendor
      key: composer-${{ hashFiles('composer.lock') }}
  - name: Install dependencies
    run: composer install --no-interaction --prefer-dist
  ```
  Caches the vendor directory based on composer.lock hash; restore time: ~5 seconds vs ~60 seconds for fresh install.
- **MySQL Service Container Pattern:**
  ```yaml
  services:
    mysql:
      image: mysql:8.0
      env:
        MYSQL_DATABASE: testing
        MYSQL_ROOT_PASSWORD: password
      ports:
        - 3306:3306
      options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=5
  ```
  GitHub Actions service container that provides a MySQL instance for the test run.
- **SQLite In-Memory Pattern (for unit tests):**
  ```xml
  <!-- phpunit.xml -->
  <server name="DB_CONNECTION" value="sqlite"/>
  <server name="DB_DATABASE" value=":memory:"/>
  ```
  Uses SQLite in-memory database for faster unit tests; feature tests still use MySQL/PostgreSQL.
- **Coverage Reporting Pattern:**
  ```yaml
  - name: Generate coverage
    run: php artisan test --coverage --min=80
  - name: Upload coverage
    uses: codecov/codecov-action@v3
  ```
  Generates code coverage and uploads to Codecov; the --min=80 flag fails the build if coverage drops below 80%.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Test framework | PHPUnit vs Pest | Pest (modern, more readable assertions, parallel by default); PHPUnit for legacy projects |
| Database for tests | SQLite in-memory vs MySQL service | SQLite for unit tests (fast); MySQL service for feature tests (mirrors production) |
| Parallel execution | None vs 4 processes vs auto-detect | Auto-detect (n/2 processes where n = available cores); skip parallel for test suites with shared database state |
| Coverage enforcement | None vs % threshold vs diff-only | Diff-only (enforce coverage on new/changed code only); % threshold for baseline |

## Tradeoffs

- **SQLite vs MySQL for Tests:** SQLite in-memory is 5-10x faster than MySQL for unit tests but doesn't catch MySQL-specific issues (collation differences, transaction isolation, JSON column behavior). Use SQLite for unit tests that don't interact with the database; use MySQL service containers for feature tests.
- **Parallel vs Sequential Tests:** Parallel execution reduces CI time but complicates test isolation (shared database, file system, mock state). Sequential tests are simpler but slower. Use Laravel's RefreshDatabase with parallel testing to ensure database isolation per process.
- **Full Suite vs Targeted Tests:** Running the full test suite on every push catches all regressions but takes 10-30 minutes. Targeted tests (only tests related to changed files) are faster but may miss integration regressions. Run full suite on PR merges; run targeted tests on push.

## Performance Considerations

- **CI Pipeline Time:** Full test suite typically takes 5-15 minutes. Break down: composer install (30-60s), database setup (5-10s), test execution (3-12 minutes), coverage generation (30-60s).
- **Caching Strategy:** vendor/ caching saves 30-60 seconds per run. .phpunit.result.cache saves 10-30 seconds per run. node_modules/ caching saves 30-60 seconds if frontend tests are included.
- **Test Suite Growth:** A test suite of 1000 tests takes 5-10 minutes to run. At 5000 tests, parallel execution becomes necessary to keep CI under 15 minutes. Consider splitting the test suite into CI matrix jobs (unit, feature, browser).

## Production Considerations

- **Environment Parity:** CI test environment should mirror production as closely as possible (same PHP version, database version, Redis version). Use service containers that match production versions.
- **Secrets in CI:** Never hardcode production credentials in CI configuration. Use CI secrets (GitHub Actions secrets, GitLab CI variables) for test API keys, OAuth credentials, or external service endpoints.
- **Test Data Cleanup:** CI should not leave test data in any shared external service. Use fakes (Http::fake(), Mail::fake(), Notification::fake()) for external service interactions; test on isolated databases.

## Common Mistakes

- **Using SQLite for all tests:** Feature tests pass on SQLite but fail on MySQL due to collation, strict mode, or JSON column differences
- **Forgetting to refresh database:** Tests depend on database state from a previous test run; using RefreshDatabase or DatabaseTransactions trait prevents this
- **Hardcoded test credentials:** Tests use real API keys or credentials that are checked into the repository; they expire or are revoked, causing test failures
- **Flaky tests:** Tests that pass on the developer's machine but fail intermittently in CI due to timing, ordering, or environment differences
- **Not running tests in CI before merge:** Tests pass locally but CI runs in a different environment; "works on my machine" failures

## Failure Modes

- **Service Container Connection Timeout:** MySQL container isn't fully started when tests try to connect. Mitigate: use health checks with retry logic; wait for port readiness before starting tests.
- **Composer Memory Limit:** composer install fails on memory-constrained CI runners. Mitigate: set COMPOSER_MEMORY_LIMIT=-1; use dedicated CI runners with sufficient RAM.
- **Parallel Test Database Collisions:** Multiple parallel processes try to migrate or seed the same database simultaneously. Mitigate: use Laravel's built-in parallel testing support with database isolation.
- **Coverage Driver Missing:** Xdebug or PCOV is not installed on the CI runner; coverage generation fails silently or produces zero coverage. Mitigate: install the coverage driver in CI setup steps.

## Ecosystem Usage

- **Laravel Sail:** CI can use Sail for a production-like environment; Sail provides consistent PHP/MySQL/Redis versions matching the development environment
- **Laravel Forge:** Forge deployment triggers can await CI success; Forge's deploy script ties into the CI pipeline for automated production releases
- **Laravel Vapor:** Vapor's `vapor deploy` command can be integrated into CI; tests run before the deploy step to validate the code
- **Laravel Telescope/Debugbar:** These should be disabled in CI to avoid test interference; Telescope's watchers may cause side effects during test execution

## Related Knowledge Units

- github-actions-for-laravel
- automated-deployment-pipelines
- dusk-browser-tests-ci
- phpstan-in-ci
- pint-in-ci

## Research Notes

- Pest PHP framework (pestphp.com) has gained significant adoption since 2022; its parallel testing support and expressive assertion API make it the recommended choice for new Laravel projects
- Laravel 11 introduced `php artisan test --parallel` as a first-class feature using ParaTest under the hood, replacing the need for separate ParaTest configuration
- GitHub Actions is the most common CI platform for Laravel (approx 70% of public Laravel repositories), followed by GitLab CI (20%) and Bitbucket Pipelines (10%)
- The "default test database" pattern (using :memory: SQLite for speed) was popular in early Laravel but the community has shifted toward MySQL service containers for production-parity testing
