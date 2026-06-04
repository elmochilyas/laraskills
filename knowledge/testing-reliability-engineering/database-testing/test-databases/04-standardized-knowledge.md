# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Test Framework & Runner Infrastructure
Knowledge Unit: Test Databases
 KU Code: ku-04-test-databases
ECC Phase: 4
Last Updated: 2026-06-02

---

# Overview
Testing environment management controls which configuration, database, drivers, and services are used during test execution. Laravel uses `.env.testing` (autoloaded when `APP_ENV=testing`), `config/testing/` overrides, and environment-specific service container bindings. Proper environment management prevents tests from accidentally using production services, ensures deterministic configuration, and enables parallel database isolation. Misconfiguration is a leading cause of flaky tests and CI failures. Test databases must balance fast local feedback (SQLite) with production-equivalent validation (MySQL/PostgreSQL in CI).

# Core Concepts
- **`.env.testing` file**: Automatically loaded when `APP_ENV=testing`. Overrides `.env`. Contains test-specific configuration.
- **`APP_ENV=testing`**: Automatically set by `phpunit.xml`. Triggers testing environment loading.
- **Config cache and testing**: `php artisan config:cache` does NOT cache testing config. Tests always read fresh config.
- **`config/testing/` directory**: Config files that override defaults when `APP_ENV=testing`. E.g., `config/testing/database.php`.
- **`RefreshDatabase` trait**: Resets database state between tests using transactions. Relies on correct testing database configuration.
- **Service container overrides**: Use `$this->app->bind()` in tests to swap implementations.
- **`Env::fake()`**: Fakes environment values for individual tests without modifying `.env.testing`.

# When To Use
- Setting up test environment configuration for new projects
- Configuring test databases (SQLite locally, MySQL/PostgreSQL in CI)
- Preventing accidental real service calls during testing (null drivers)
- Managing environment-specific credentials and API keys
- Isolating test configuration from development/production environments

# When NOT To Use
- Production environment configuration (never merge test config into production)
- Storing real secrets or credentials (use CI secrets)
- Config caching in testing environment (always read fresh config)
- Overriding config in every test (use `phpunit.xml` env vars for common settings)
- Environment-specific business logic (test behavior, not environment)

# Best Practices (WHY)
- **Use SQLite for local development, MySQL/PostgreSQL in CI**: Reason: SQLite is 2-3x faster for local runs. CI matrix includes production-equivalent database engines for accurate validation.
- **Set null drivers in `.env.testing` for all external services**: Reason: `MAIL_MAILER=log`, `QUEUE_CONNECTION=sync`, `CACHE_STORE=array` prevent accidental real service calls without per-test configuration.
- **Never store real secrets in `.env.testing`**: Reason: `.env.testing` is typically version-controlled. Use `.env.testing.example` with placeholders. Inject real secrets via CI environment variables.
- **Use `Env::fake()` instead of modifying `$_ENV` directly**: Reason: `Env::fake()` is scoped per-test and auto-cleaned. Direct `$_ENV` modification leaks across tests.
- **Never run `config:cache` in testing environment**: Reason: cached config ignores `.env.testing` overrides. Always use `config:clear` before test runs.
- **Configure `phpunit.xml` for CI-specific overrides**: Reason: `phpunit.xml` env vars have the highest precedence. Use them for CI database credentials, not `.env.testing`.
- **Document database engine differences between local and CI**: Reason: SQLite and MySQL have behavioral differences (JSON, full-text, locking). Document known gaps so developers aren't surprised by CI failures.

# Architecture Guidelines
- **Configuration layering**: `.env` (base) → `.env.testing` (test overrides) → `phpunit.xml <env>` (CI-specific) → `$this->app->bind()` (per-test).
- **Database strategy**: SQLite `:memory:` for local speed. MySQL/PostgreSQL services in CI for production equivalence.
- **Environment variable hierarchy**: `phpunit.xml <env>` > `.env.testing` > `.env`. Highest priority in XML.
- **Testing service provider**: Optionally create `TestingServiceProvider` that registers null implementations for external services.
- **Parallel database naming**: `DB_DATABASE=myapp_test_{token}` using `ParallelTesting::token()` for worker isolation.
- **`.env.testing.local`**: Gitignored file for developer-specific overrides. `.env.testing` contains team defaults.

# Performance
- **Config loading overhead**: Each test file reloads config. For 500+ files, adds 1-3 seconds. Group tests sharing config for efficiency.
- **SQLite `:memory:`**: Fastest option. No disk I/O for database operations. ~2-3x faster than MySQL.
- **MySQL transactions**: `RefreshDatabase` with MySQL opens a new transaction per test. Negligible (<1ms).
- **`.env.testing` file I/O**: <1ms per test class load. Not a measurable bottleneck.
- **Service provider registration**: Heavy providers (Telescope, Debugbar) add 50-100ms per test class. Disable in testing.

# Security
- **Secret injection**: Use CI secrets for real credentials. `.env.testing` should contain only placeholder values.
- **`.env.testing` in version control**: Commit with placeholder values. Never commit real API keys, passwords, or tokens.
- **Database isolation**: Parallel workers use process-specific databases. No cross-contamination.
- **Service nullification**: Null drivers prevent accidental real service calls. Essential safety net.
- **Log exposure**: Test logs should not contain PII or secrets. Configure log channel appropriately.

# Common Mistakes

**Mistake: Committing real secrets to `.env.testing`**
- Description: Including real API keys, database passwords, or tokens in `.env.testing`
- Cause: Convenience; "it's just for testing"
- Consequence: Secrets in git history are exposed to all developers with repo access
- Better: Use `.env.testing.example` with placeholder values. Inject real secrets via CI environment variables.

**Mistake: Running tests with `APP_ENV=production`**
- Description: Accidentally running tests on production server configuration
- Cause: Missing `APP_ENV=testing` in `phpunit.xml` or CI configuration
- Consequence: Tests may write to production database, send real emails, use real payment gateways
- Better: Always verify `APP_ENV=testing` is set in `phpunit.xml` and CI configuration.

**Mistake: Using `config:cache` in testing**
- Description: Running `php artisan config:cache` with `APP_ENV=testing`
- Cause: "Config caching speeds up tests"
- Consequence: Cached config ignores `.env.testing` overrides; stale config causes test failures
- Better: Never run `config:cache` with `APP_ENV=testing`. Use `config:clear` before test runs.

**Mistake: Inconsistent database engines between environments**
- Description: SQLite locally, MySQL in CI, PostgreSQL in production
- Cause: Different environments use different DB engines
- Consequence: JSON queries, full-text search, locking, and transaction behavior differ across engines
- Better: Use SQLite locally for speed, but run critical tests against production-equivalent DB in CI.

# Anti-Patterns
- **Shared `.env.testing` in CI**: CI should generate `.env.testing` from CI variables, not share a committed file with credentials.
- **No `.env.testing.example`**: Team members must guess which environment variables are needed for testing.
- **Global `Env::fake()` leaks**: Faking an environment variable globally affects all tests in the class. Scope to individual tests.
- **Skipping database isolation in parallel**: Running parallel tests without process-specific databases guarantees collisions.
- **Copy-pasting `.env` to `.env.testing`**: Development environment variables (real DB names, mail drivers) may leak into testing.

# Examples

**`.env.testing` for safe defaults**
```
APP_ENV=testing
APP_KEY=base64:testkeyplaceholder12345=
DB_CONNECTION=sqlite
DB_DATABASE=:memory:
MAIL_MAILER=log
QUEUE_CONNECTION=sync
CACHE_STORE=array
SESSION_DRIVER=array
BROADCAST_DRIVER=log
FILESYSTEM_DISK=local
```

**`config/testing/database.php` for MySQL in CI**
```php
<?php

return [
    'connections' => [
        'mysql' => [
            'driver' => 'mysql',
            'host' => env('DB_HOST', '127.0.0.1'),
            'database' => env('DB_DATABASE', 'myapp_test'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
        ],
    ],
];
```

**Env::fake() for per-test environment override**
```php
test('rate limiting uses different limit in testing', function () {
    Env::fake(['RATE_LIMIT' => 1000]);

    config(['app.rate_limit' => env('RATE_LIMIT')]);

    $this->post('/api/data')->assertOk();
});
```

# Related Topics
- PHPUnit configuration (phpunit.xml)
- Database testing lifecycle
- Null driver pattern
- Service provider registration
- CI/CD pipeline integration

# AI Agent Notes
- Always set `APP_ENV=testing` when generating `phpunit.xml` or test environment configuration.
- Generate `.env.testing` with null drivers for all external services: mail=log, queue=sync, cache=array, session=array.
- Never generate `.env.testing` with real secrets. Use placeholder values.
- For CI configuration, recommend matrix testing with multiple database engines (SQLite, MySQL, PostgreSQL).
- Use `Env::fake()` for per-test environment overrides, not `putenv()` or `$_ENV` manipulation.
- When generating test configuration, always include `config:clear` in CI setup steps.

# Verification
- [ ] `.env.testing` exists with safe defaults (SQLite, null drivers for external services)
- [ ] `APP_ENV=testing` is set in `phpunit.xml`
- [ ] No real secrets are committed in `.env.testing`
- [ ] `.env.testing.example` exists with placeholder values
- [ ] `config:cache` is never run with `APP_ENV=testing`
- [ ] CI matrix includes production-equivalent database engines
- [ ] Parallel workers use process-specific database names
- [ ] `Env::fake()` is used for environment overrides, not `putenv()` or `$_ENV`
