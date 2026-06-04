# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Test Framework & Runner Infrastructure
Knowledge Unit: Test Databases
KU Code: ku-04-test-databases
ECC Phase: 4
Last Updated: 2026-06-02

# Executive Summary
Testing environment management controls which configuration, database, drivers, and services are used during test execution. Laravel uses `.env.testing`, `config/testing/` overrides, and environment-specific service container bindings. Proper environment management prevents tests from accidentally using production services, ensures deterministic configuration, and enables parallel database isolation. Misconfiguration is a leading cause of flaky tests and CI failures.

# Core Concepts
- **`.env.testing` file**: Automatically loaded when `APP_ENV=testing`. Overrides `.env`. Contains test-specific configuration.
- **`APP_ENV=testing`**: Automatically set by `phpunit.xml`. Triggers testing environment loading.
- **Config cache and testing**: `php artisan config:cache` does NOT cache testing config. Tests always read fresh config.
- **`config/testing/` directory**: Config files that override defaults when `APP_ENV=testing`.
- **`RefreshDatabase` trait**: Resets database state between tests using transactions.
- **Service container overrides**: Use `$this->app->bind()` in tests to swap implementations.
- **`Env::fake()`**: Fakes environment values for individual tests without modifying `.env.testing`.

# Mental Models
- **Environment as contract**: The testing environment is a contract between the test runner and the application. It defines what services are real, faked, or nulled.
- **Layered configuration**: `.env` base -> `.env.testing` -> `phpunit.xml <env>` -> per-test override. Each layer overrides the previous.
- **Safety net model**: Null drivers are a safety net. They prevent real service calls by default. Per-test fakes override the safety net intentionally.

# Internal Mechanics
- PHPUnit's `bootstrap` file loads `vendor/autoload.php` which triggers Laravel's bootstrap.
- Laravel checks `APP_ENV` early in bootstrap. If `testing`, it loads `.env.testing` after `.env`.
- `config/testing/` files are loaded after default config files, merging overrides.
- `phpunit.xml <env>` values are set via `putenv()` before the bootstrap runs, giving them highest precedence.
- `Env::fake()` uses Laravel's `Env` facade to override `env()` calls without modifying `$_ENV`.

# Patterns
- **Null driver pattern**: Set all external services to null/log drivers in `.env.testing` to prevent accidental real calls.
- **SQLite local, MySQL CI pattern**: Use SQLite `:memory:` for fast local runs and MySQL/PostgreSQL matrix in CI for production equivalence.
- **Env::fake() pattern**: Use `Env::fake()` for per-test environment overrides instead of modifying `$_ENV` globally.
- **Testing service provider pattern**: Create a provider that binds null implementations for third-party services.

# Architectural Decisions
- **Decision: `.env.testing` over inline config**: Centralizes test environment configuration in a single file. Version-controlled with placeholder values.
- **Decision: `phpunit.xml` environment variables for CI**: Highest precedence ensures CI settings always override local config.
- **Decision: `Env::fake()` over `putenv()`**: Scoped per-test and auto-cleaned. Prevents environment variable leaks across tests.

# Tradeoffs
- **SQLite vs MySQL**: SQLite is 2-3x faster but has behavioral differences (JSON, full-text, locking). Use SQLite locally, MySQL in CI.
- **Committed `.env.testing` vs CI-generated**: Committed file is visible to all developers but may contain placeholder values. CI generation is secure but requires setup.
- **Null drivers vs fakes**: Null drivers prevent side effects but don't allow assertions. Fakes provide assertions but require per-test setup.

# Performance Considerations
- Config loading overhead: Each test file reloads config. For 500+ files, adds 1-3 seconds.
- SQLite `:memory:`: Fastest option. No disk I/O for database operations. Approximately 2-3x faster than MySQL.
- MySQL transactions: `RefreshDatabase` with MySQL opens a new transaction per test. Negligible (<1ms).
- Service provider registration: Heavy providers add 50-100ms per test class. Disable in testing.

# Production Considerations
- Secret injection: Use CI secrets for real credentials. `.env.testing` should contain only placeholder values.
- `.env.testing` in version control: Commit with placeholder values. Never commit real API keys, passwords, or tokens.
- Database isolation: Parallel workers use process-specific databases. No cross-contamination.
- Service nullification: Null drivers prevent accidental real service calls. Essential safety net.

# Common Mistakes
- **Committing real secrets to `.env.testing`**: Secrets in git history exposed to all developers with repo access.
- **Running tests with `APP_ENV=production`**: Missing `APP_ENV=testing` in `phpunit.xml`. Tests may write to production database.
- **Using `config:cache` in testing**: Cached config ignores `.env.testing` overrides.
- **Inconsistent database engines between environments**: SQLite, MySQL, and PostgreSQL have behavioral differences.

# Failure Modes
- Missing `.env.testing`: Tests run with development environment configuration. May send real emails or use production database.
- Config cache staleness: Cached config from development persists into testing environment.
- Parallel database collision: Workers without process-specific databases write to the same tables.
- Secret exposure: Real credentials in committed `.env.testing` are exposed to all developers.

# Ecosystem Usage
- Laravel's testing environment is configured via `phpunit.xml` which ships with `APP_ENV=testing`.
- `.env.testing` is loaded automatically when `APP_ENV=testing` is detected.
- CI platforms (GitHub Actions, GitLab CI) inject secrets via environment variables.
- Third-party packages may require additional configuration for testing environment.

# Related Knowledge Units
- PHPUnit configuration (phpunit.xml)
- Database testing lifecycle
- Null driver pattern
- Service provider registration
- CI/CD pipeline integration

# Research Notes
- Laravel's environment file loading order has changed between versions. Verify behavior on the target Laravel version.
- SQLite `:memory:` databases are significantly faster for testing but have limitations with ALTER TABLE and full-text search.
- The `Env::fake()` method was added in Laravel 9 as a replacement for `putenv()` in testing.
