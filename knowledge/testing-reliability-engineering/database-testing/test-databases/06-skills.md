# Skill: Configure Test Databases for Local and CI Environments

## Purpose
Set up `.env.testing` with safe defaults, production-equivalent CI database configuration, and proper environment variable management for isolated test execution.

## When To Use
- Setting up test database configuration for new Laravel projects
- Configuring SQLite for local speed and MySQL/PostgreSQL for CI accuracy
- Preventing accidental real service calls (mail, queue, cache) during testing
- Managing database isolation for parallel workers

## When NOT To Use
- Per-test configuration variations (use `Env::fake()` or `$this->app->bind()`)
- Storing real secrets (use CI environment variables)
- Config caching in testing (always read fresh config)

## Prerequisites
- `phpunit.xml` with `APP_ENV=testing` set
- Database drivers configured (SQLite for local, MySQL/PostgreSQL for CI)

## Inputs
- Local database engine (SQLite in-memory)
- CI database engine (MySQL or PostgreSQL)
- Service driver preferences (mail, queue, cache, session)

## Workflow
1. Verify `APP_ENV=testing` is set as the first `<env>` in `phpunit.xml` — this loads `.env.testing`
2. Create `.env.testing` with safe defaults: `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`, `MAIL_MAILER=array`, `QUEUE_CONNECTION=sync`, `CACHE_STORE=array`, `SESSION_DRIVER=array`, `BROADCAST_DRIVER=log`
3. Create `.env.testing.example` with placeholder values; add `.env.testing` to `.gitignore`
4. Configure CI environment variables to override database engine: `DB_CONNECTION=mysql`, `DB_DATABASE=test`, `DB_USERNAME=root`, `DB_PASSWORD=${{ secrets.DB_PASSWORD }}`
5. Never commit real secrets to any version-controlled configuration file
6. Never run `php artisan config:cache` with `APP_ENV=testing` — use `config:clear` before test runs
7. For parallel execution, configure process-specific database names using `ParallelTesting::token()`
8. Use `Env::fake()` for per-test environment overrides — never modify `$_ENV` or `$_SERVER` directly

## Validation Checklist
- [ ] `.env.testing` uses SQLite and null drivers for external services
- [ ] `APP_ENV=testing` set in `phpunit.xml`
- [ ] No real secrets committed in `.env.testing`
- [ ] `.env.testing.example` committed with placeholder values
- [ ] `config:cache` never run with `APP_ENV=testing`
- [ ] CI matrix includes production-equivalent database engine
- [ ] Parallel workers use process-specific database names
- [ ] `Env::fake()` used for environment overrides (not `putenv()` or `$_ENV`)

## Common Failures
- Committing real secrets to `.env.testing` — exposed in git history
- Running tests with `APP_ENV=production` — writes to production database
- `config:cache` in CI — stale config ignores `.env.testing` overrides
- SQLite-only CI — engine-specific bugs undetected until production
- Direct `$_ENV` manipulation — environment variables leak between tests

## Decision Points
- SQLite for local speed vs MySQL/PostgreSQL in CI for production equivalence
- `.env.testing` for team defaults vs `.env.testing.local` (gitignored) for developer overrides
- CI environment variable injection vs modifying `.env.testing` per environment

## Performance Considerations
- SQLite `:memory:` is 2-3x faster than MySQL for local testing
- Config loading for 500+ files adds 1-3 seconds total
- Service provider registration (Telescope, Debugbar) adds 50-100ms per class — disable in testing
- Each parallel worker needs its own database connection pool

## Security Considerations
- Never store real secrets in `.env.testing` — use CI environment variables
- Test databases must use separate credentials from production databases
- CI database credentials should have minimal permissions (test database only)
- Use `Env::fake()` for per-test overrides — it's auto-cleaned and doesn't leak

## Related Rules (from 05-rules.md)
- Rule 1: Use SQLite locally for speed, MySQL/PostgreSQL in CI for production equivalence
- Rule 2: Never store real secrets in `.env.testing`
- Rule 3: Never run `php artisan config:cache` in the testing environment
- Rule 4: Configure parallel database naming with `ParallelTesting::token()`
- Rule 5: Set null drivers for all external services in `.env.testing`
- Rule 6: Use `Env::fake()` for per-test environment overrides

## Success Criteria
- Local tests run fast on SQLite `:memory:` (no setup, instant)
- CI uses production-equivalent database engine, catching engine-specific bugs
- No real secrets in version-controlled configuration
- Environment variables don't leak between tests
