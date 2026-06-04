# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Core Concepts & Fundamentals
**Knowledge Unit:** Testing Environment Management
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always set `APP_ENV=testing` in `phpunit.xml`
- [ ] Apply rule: Never run `php artisan config:cache` when `APP_ENV=testing`
- [ ] Apply rule: Use `Env::fake()` for test-scoped environment overrides
- [ ] Apply rule: Set null drivers for mail, queue, cache, session, and broadcast in testing
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `APP_ENV=testing` is set in `phpunit.xml`
- [ ] `.env.testing` uses null/log drivers for external services
- [ ] `.env.testing.example` committed, `.env.testing` in `.gitignore`
- [ ] No real secrets in any committed configuration file
- [ ] `config:cache` never run in test environment
- [ ] Avoid: Committing real secrets to `.env.testing`
- [ ] Avoid: Running tests with `APP_ENV=production`
- [ ] Avoid: Using `config:cache` in testing

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Configuration layering**: `phpunit.xml <env>` > `.env.testing` > `.env`. Highest priority in XML.
- **Service driver nullification**: Set `MAIL_MAILER=log`, `QUEUE_CONNECTION=sync`, `CACHE_STORE=array` in `.env.testing`.
- **Database configuration**: `DB_CONNECTION=sqlite` locally; override in CI for MySQL/PostgreSQL via matrix variables.
- **Parallel testing**: Use `ParallelTesting` facade for process-specific database names and resource allocation.
- **CI environment injection**: Inject secrets via CI environment variables, not configuration files.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always set `APP_ENV=testing` in `phpunit.xml`
- [ ] Follow rule: Never run `php artisan config:cache` when `APP_ENV=testing`
- [ ] Follow rule: Use `Env::fake()` for test-scoped environment overrides
- [ ] Follow rule: Set null drivers for mail, queue, cache, session, and broadcast in testing
- [ ] Follow rule: Use SQLite for local testing, production-equivalent DB in CI
- [ ] Follow rule: Never commit real secrets to `.env.testing`
- [ ] - [ ] `APP_ENV=testing` is set in `phpunit.xml`
- [ ] - [ ] `.env.testing` uses null/log drivers for external services
- [ ] - [ ] `.env.testing.example` committed, `.env.testing` in `.gitignore`
- [ ] - [ ] No real secrets in any committed configuration file

# Performance Checklist
- **Config loading overhead**: Each test file reloads configuration from files. For 500+ test files, this adds 1-3 seconds.
- **Database connection per test**: `RefreshDatabase` with MySQL opens a new transaction per test. Transaction overhead is negligible (<1ms).
- **`.env.testing` file I/O**: Reading `.env.testing` on every test class load is fast (<1ms). Not a measurable bottleneck.
- **Service provider registration**: Heavy providers (like Telescope) can add 50-100ms per test class load. Disable non-essential providers in testing.

# Security Checklist
- **Secrets in `.env.testing`**: Never store real secrets. Use `.env.testing.example` with placeholders. Inject secrets via CI.
- **`APP_ENV` verification**: Always verify `APP_ENV=testing` is set. Running tests with `APP_ENV=production` can write to production databases.
- **CI secrets**: Inject database passwords, API keys via CI provider secrets, not committed configuration files.
- **Database access**: Testing databases should be isolated from production. Use separate credentials and databases.

# Reliability Checklist
- [ ] Ensure: Testing environment management controls which configuration, database, drivers, ...
- [ ] Verify: Always set `APP_ENV=testing` in `phpunit.xml`
- [ ] Verify: Never run `php artisan config:cache` when `APP_ENV=testing`
- [ ] Verify: Use `Env::fake()` for test-scoped environment overrides
- [ ] Verify: Set null drivers for mail, queue, cache, session, and broadcast in testing

# Testing Checklist
- [ ] `APP_ENV=testing` is set in `phpunit.xml`
- [ ] `.env.testing` uses null/log drivers for external services
- [ ] `.env.testing.example` committed, `.env.testing` in `.gitignore`
- [ ] No real secrets in any committed configuration file
- [ ] `config:cache` never run in test environment
- [ ] Heavy service providers disabled in testing
- [ ] Avoid: Committing real secrets to `.env.testing`
- [ ] Avoid: Running tests with `APP_ENV=production`
- [ ] Avoid: Using `config:cache` in testing

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always set `APP_ENV=testing` in `phpunit.xml`
- [ ] Apply: Never run `php artisan config:cache` when `APP_ENV=testing`
- [ ] Apply: Use `Env::fake()` for test-scoped environment overrides
- [ ] Apply: Set null drivers for mail, queue, cache, session, and broadcast in testing

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Committing real secrets to `.env.testing`
- [ ] Avoid mistake: Running tests with `APP_ENV=production`
- [ ] Avoid mistake: Using `config:cache` in testing
- [ ] Avoid mistake: Inconsistent database engines between environments

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Rules
- Always set `APP_ENV=testing` in `phpunit.xml`
- Never run `php artisan config:cache` when `APP_ENV=testing`
- Use `Env::fake()` for test-scoped environment overrides
- Set null drivers for mail, queue, cache, session, and broadcast in testing
- Use SQLite for local testing, production-equivalent DB in CI
- Never commit real secrets to `.env.testing`
- Disable non-essential service providers in testing
- Use CI environment variables for engine-override testing config
- Always verify `APP_ENV` in CI test output
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Configure Testing Environment


