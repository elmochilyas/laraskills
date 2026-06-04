# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Test Framework & Runner Infrastructure |
| Knowledge Unit | Testing Environment Management |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Laravel configuration fundamentals, Service container basics |
| Related KUs | Database testing lifecycle, Service provider registration, Config caching |
| Source | domain-analysis.md K024 |

# Overview

Testing environment management controls which configuration, database, drivers, and services are used during test execution. Laravel uses `.env.testing` (autoloaded when `APP_ENV=testing`), `config/testing/` overrides, and environment-specific service container bindings. Proper environment management prevents tests from accidentally using production services, ensures deterministic configuration, and enables parallel database isolation. Misconfiguration is a leading cause of flaky tests and CI failures.

# Core Concepts

- **`.env.testing` file**: Automatically loaded when `APP_ENV=testing`. Overrides values from `.env`. Located at project root.
- **`APP_ENV=testing`**: Automatically set by `phpunit.xml` `<env name="APP_ENV" value="testing"/>`. Pest inherits this from PHPUnit configuration.
- **Testing config cache**: `php artisan config:cache` does NOT cache testing configuration. Each test run re-discovers configuration from files.
- **`config/testing/` directory**: Place config files here that override default config when `APP_ENV=testing`.
- **`RefreshDatabase` trait**: Resets database state between tests. Relies on correct testing database configuration.
- **Service container overrides**: Use `$this->app->bind()` in `setUp()` or feature test methods to swap implementations for testing.
- **`Env::fake()`**: Laravel's `Env` facade can fake environment values for individual tests without modifying `.env.testing`.

# When To Use

- Setting up a new Laravel project's testing configuration
- Configuring environment-specific drivers (mail, queue, cache, filesystem)
- Managing multiple test environments (local, CI, staging)
- Preventing accidental production service usage during testing
- Setting up parallel database isolation

# When NOT To Use

- Storing real secrets (use CI environment variables instead)
- Per-test configuration variations (use `$this->app->bind()` instead)
- Production deployment configuration (use `.env.production` instead)
- When `.env.testing` is not needed for simple projects

# Best Practices (WHY)

- **Always set `APP_ENV=testing` in `phpunit.xml`**: Reason: ensures `.env.testing` is loaded. Prevents production database connections.
- **Use `.env.testing.example` with placeholders**: Reason: keep real secrets out of version control. Commit only the example file.
- **Never run `config:cache` in testing**: Reason: cached config ignores `.env.testing` overrides. Use `config:clear` before test runs.
- **Use SQLite locally, MySQL/PostgreSQL in CI**: Reason: SQLite is 2-3x faster for local runs. Run production-equivalent DB in CI.
- **Set null drivers as defaults**: Reason: prevent accidental real service calls. Default mail, queue, cache to safe testing drivers.
- **Use `Env::fake()` instead of direct `$_ENV` manipulation**: Reason: `Env::fake()` is test-scoped and auto-cleaned.

# Architecture Guidelines

- **Configuration layering**: `phpunit.xml <env>` > `.env.testing` > `.env`. Highest priority in XML.
- **Service driver nullification**: Set `MAIL_MAILER=log`, `QUEUE_CONNECTION=sync`, `CACHE_STORE=array` in `.env.testing`.
- **Database configuration**: `DB_CONNECTION=sqlite` locally; override in CI for MySQL/PostgreSQL via matrix variables.
- **Parallel testing**: Use `ParallelTesting` facade for process-specific database names and resource allocation.
- **CI environment injection**: Inject secrets via CI environment variables, not configuration files.

# Performance Considerations

- **Config loading overhead**: Each test file reloads configuration from files. For 500+ test files, this adds 1-3 seconds.
- **Database connection per test**: `RefreshDatabase` with MySQL opens a new transaction per test. Transaction overhead is negligible (<1ms).
- **`.env.testing` file I/O**: Reading `.env.testing` on every test class load is fast (<1ms). Not a measurable bottleneck.
- **Service provider registration**: Heavy providers (like Telescope) can add 50-100ms per test class load. Disable non-essential providers in testing.

# Security Considerations

- **Secrets in `.env.testing`**: Never store real secrets. Use `.env.testing.example` with placeholders. Inject secrets via CI.
- **`APP_ENV` verification**: Always verify `APP_ENV=testing` is set. Running tests with `APP_ENV=production` can write to production databases.
- **CI secrets**: Inject database passwords, API keys via CI provider secrets, not committed configuration files.
- **Database access**: Testing databases should be isolated from production. Use separate credentials and databases.

# Common Mistakes

**Mistake: Committing real secrets to `.env.testing`**
- Description: Storing database passwords, API keys in version-controlled `.env.testing`
- Cause: Convenience; "it's just for testing"
- Consequence: Secrets in git history exposed to all developers
- Better: Use `.env.testing.example` with placeholder values; `.env.testing` is in `.gitignore`.

**Mistake: Running tests with `APP_ENV=production`**
- Description: Accidentally running tests on production server
- Cause: Missing `APP_ENV=testing` in `phpunit.xml`
- Consequence: Tests may write to production database, send real emails
- Better: Always verify `APP_ENV=testing` is set in `phpunit.xml`.

**Mistake: Using `config:cache` in testing**
- Description: Running `config:cache` and then running tests
- Cause: "Faster tests with cached config"
- Consequence: Cached config ignores `.env.testing` overrides
- Better: Never run `config:cache` with `APP_ENV=testing`.

**Mistake: Inconsistent database engines between environments**
- Description: SQLite locally, MySQL in CI without accounting for differences
- Cause: "SQLite is close enough to MySQL"
- Consequence: JSON queries, full-text search, locking behavior differ
- Better: Run critical tests against production-equivalent DB in CI.

# Anti-Patterns

- **Real service calls in tests**: Using real mail, queue, or payment drivers in testing environment. Always use null/log/sync drivers.
- **Shared `.env.testing` with secrets**: Committing `.env.testing` with real credentials. Use `.env.testing.example` pattern.
- **Config caching in CI**: Running `config:cache` before tests. Testing must read fresh configuration.
- **Environment variable leakage**: Modifying `$_ENV` or `$_SERVER` directly without cleanup.

# Examples

**Standard `.env.testing`**
```
APP_ENV=testing
APP_KEY=
DB_CONNECTION=sqlite
DB_DATABASE=:memory:
MAIL_MAILER=array
QUEUE_CONNECTION=sync
CACHE_STORE=array
SESSION_DRIVER=array
FILESYSTEM_DISK=local
BROADCAST_DRIVER=log
```

**Using `Env::fake()`**
```php
test('uses custom env value', function () {
    Env::fake(['API_TIMEOUT' => 30]);
    $config = config('services.api.timeout');
    expect($config)->toBe(30);
});
```

**Production-like database in CI**
```yaml
# .github/workflows/tests.yml
- name: Run tests with MySQL
  env:
    DB_CONNECTION: mysql
    DB_DATABASE: test
    DB_USERNAME: root
  run: php artisan test --parallel
```

# Related Topics

- Database testing lifecycle
- Service provider registration
- Config caching in Laravel
- Mutual environment deployment strategies
- CI secret management

# AI Agent Notes

- Always include `APP_ENV=testing` as the first env variable in generated `phpunit.xml` configurations.
- Set null drivers for mail, queue, cache, session, and broadcast in `.env.testing` by default.
- Never generate code that stores real secrets in `.env.testing`. Use CI environment variable references.
- Use `Env::fake()` for test-scoped environment overrides instead of direct `$_ENV` manipulation.
- For CI configurations, inject database credentials via CI environment variables, not configuration files.

# Verification

- [ ] `phpunit.xml` sets `APP_ENV=testing`
- [ ] `.env.testing` does not contain real secrets
- [ ] `.env.testing.example` is committed as a template
- [ ] Mail, queue, cache use null/log/sync drivers by default
- [ ] `config:cache` is never run with `APP_ENV=testing`
- [ ] CI uses production-equivalent database engine
- [ ] Database credentials in CI come from CI environment variables
- [ ] `Env::fake()` is used instead of direct `$_ENV` manipulation
