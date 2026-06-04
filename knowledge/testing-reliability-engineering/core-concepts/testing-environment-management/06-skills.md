# Skill: Configure Testing Environment

## Purpose
Set up safe, deterministic testing environment configuration with `.env.testing`, null drivers, database isolation, and environment variable management.

## When To Use
- Setting up a new Laravel project's testing environment
- Configuring environment-specific drivers (mail, queue, cache)
- Preventing accidental production service usage during testing
- Configuring parallel database isolation

## When NOT To Use
- Per-test configuration variations (use `$this->app->bind()` or `Env::fake()`)
- Storing real secrets (use CI environment variables)
- Configuring production deployment

## Prerequisites
- `phpunit.xml` with `APP_ENV=testing` set
- Access to create/modify `.env.testing` file
- Understanding of service drivers (mail, queue, cache)

## Inputs
- Database engine for local testing (SQLite) and CI (MySQL/PostgreSQL)
- Service drivers for mail, queue, cache, session, broadcast
- Any CI-specific environment variable overrides

## Workflow
1. Verify `APP_ENV=testing` is set in `phpunit.xml` as the first `<env>` in `<php>` section
2. Create `.env.testing` with safe defaults: `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`, `MAIL_MAILER=array`, `QUEUE_CONNECTION=sync`, `CACHE_STORE=array`, `SESSION_DRIVER=array`, `BROADCAST_DRIVER=log`
3. Create `.env.testing.example` with placeholder values and add `.env.testing` to `.gitignore`
4. Disable non-essential service providers in testing (Telescope, Debugbar, analytics) by checking `$this->app->environment('testing')` in service providers
5. Configure CI environment variables to override database engine: `DB_CONNECTION=mysql`, `DB_DATABASE=test` with credentials from CI secrets
6. Use `Env::fake()` for test-scoped environment overrides — never modify `$_ENV` or `$_SERVER` directly
7. Run `php artisan config:clear` before any test execution (never `config:cache`)
8. Add an `APP_ENV` verification step in CI that confirms `APP_ENV=testing` is set before tests run

## Validation Checklist
- [ ] `APP_ENV=testing` is set in `phpunit.xml`
- [ ] `.env.testing` uses null/log drivers for external services
- [ ] `.env.testing.example` committed, `.env.testing` in `.gitignore`
- [ ] No real secrets in any committed configuration file
- [ ] `config:cache` never run in test environment
- [ ] Heavy service providers disabled in testing
- [ ] CI injects production-equivalent database credentials via env vars
- [ ] `Env::fake()` used instead of direct `$_ENV` manipulation

## Common Failures
- Missing `APP_ENV=testing` — tests run against development database
- Real secrets committed in `.env.testing` — exposed in git history
- `config:cache` running in CI — stale config values used
- SQLite locally and MySQL in CI with different behavior (JSON queries, locking)
- Direct `$_ENV` manipulation leaking between tests

## Decision Points
- Use SQLite locally (2-3x faster, no setup) vs production-equivalent DB locally
- Use CI environment variables for engine overrides vs modifying `.env.testing` per environment
- Disable non-essential providers at the provider level vs using `config/app.php` environment checks

## Performance Considerations
- Each service provider adds 50-100ms per test class load; disable unnecessary ones
- SQLite is 2-3x faster than MySQL for local testing
- Transaction overhead of `RefreshDatabase` with MySQL is negligible (<1ms per test)
- Config loading for 500+ files adds 1-3 seconds total

## Security Considerations
- Never store real secrets in `.env.testing` — use `.env.testing.example` with placeholders
- Always verify `APP_ENV=testing` before running tests — prevents production data corruption
- CI secrets should be injected via CI provider secrets, not configuration files
- Testing databases must be isolated from production with separate credentials

## Related Rules (from 05-rules.md)
- Rule 1: Always set `APP_ENV=testing` in `phpunit.xml`
- Rule 2: Never run `php artisan config:cache` when `APP_ENV=testing`
- Rule 3: Use `Env::fake()` for test-scoped environment overrides
- Rule 4: Set null drivers for mail, queue, cache, session, and broadcast
- Rule 5: Use SQLite for local testing, production-equivalent DB in CI
- Rule 6: Never commit real secrets to `.env.testing`
- Rule 7: Disable non-essential service providers in testing
- Rule 8: Use CI environment variables for engine-override testing config
- Rule 9: Always verify `APP_ENV` in CI test output

## Success Criteria
- Tests run with correct environment isolation (no production service calls)
- Local and CI testing use appropriate database engines
- No secrets exposed in version-controlled configuration
- Test suite is not slowed by unnecessary service providers
