# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Database Testing
**Knowledge Unit:** Test Databases
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Use SQLite locally for speed, MySQL/PostgreSQL in CI for production equivalence
- [ ] Apply rule: Never store real secrets in `.env.testing`
- [ ] Apply rule: Never run `php artisan config:cache` in the testing environment
- [ ] Apply rule: Configure parallel database naming with `ParallelTesting::token()`
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `.env.testing` uses SQLite and null drivers for external services
- [ ] `APP_ENV=testing` set in `phpunit.xml`
- [ ] No real secrets committed in `.env.testing`
- [ ] `.env.testing.example` committed with placeholder values
- [ ] `config:cache` never run with `APP_ENV=testing`
- [ ] Avoid: Committing real secrets to `.env.testing`
- [ ] Avoid: Running tests with `APP_ENV=production`
- [ ] Avoid: Using `config:cache` in testing

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Configuration layering**: `.env` (base) â†’ `.env.testing` (test overrides) â†’ `phpunit.xml <env>` (CI-specific) â†’ `$this->app->bind()` (per-test).
- **Database strategy**: SQLite `:memory:` for local speed. MySQL/PostgreSQL services in CI for production equivalence.
- **Environment variable hierarchy**: `phpunit.xml <env>` > `.env.testing` > `.env`. Highest priority in XML.
- **Testing service provider**: Optionally create `TestingServiceProvider` that registers null implementations for external services.
- **Parallel database naming**: `DB_DATABASE=myapp_test_{token}` using `ParallelTesting::token()` for worker isolation.
- **`.env.testing.local`**: Gitignored file for developer-specific overrides. `.env.testing` contains team defaults.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Use SQLite locally for speed, MySQL/PostgreSQL in CI for production equivalence
- [ ] Follow rule: Never store real secrets in `.env.testing`
- [ ] Follow rule: Never run `php artisan config:cache` in the testing environment
- [ ] Follow rule: Configure parallel database naming with `ParallelTesting::token()`
- [ ] Follow rule: Set null drivers for all external services in `.env.testing`
- [ ] Follow rule: Use `Env::fake()` for per-test environment overrides, never `$_ENV`
- [ ] - [ ] `.env.testing` uses SQLite and null drivers for external services
- [ ] - [ ] `APP_ENV=testing` set in `phpunit.xml`
- [ ] - [ ] No real secrets committed in `.env.testing`
- [ ] - [ ] `.env.testing.example` committed with placeholder values

# Performance Checklist
- [ ] No performance concerns identified

# Security Checklist
- [ ] No security concerns identified

# Reliability Checklist
- [ ] Ensure: Testing environment management controls which configuration, database, drivers, ...
- [ ] Verify: Use SQLite locally for speed, MySQL/PostgreSQL in CI for production equivalence
- [ ] Verify: Never store real secrets in `.env.testing`
- [ ] Verify: Never run `php artisan config:cache` in the testing environment
- [ ] Verify: Configure parallel database naming with `ParallelTesting::token()`

# Testing Checklist
- [ ] `.env.testing` uses SQLite and null drivers for external services
- [ ] `APP_ENV=testing` set in `phpunit.xml`
- [ ] No real secrets committed in `.env.testing`
- [ ] `.env.testing.example` committed with placeholder values
- [ ] `config:cache` never run with `APP_ENV=testing`
- [ ] CI matrix includes production-equivalent database engine
- [ ] Avoid: Committing real secrets to `.env.testing`
- [ ] Avoid: Running tests with `APP_ENV=production`
- [ ] Avoid: Using `config:cache` in testing

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Use SQLite locally for speed, MySQL/PostgreSQL in CI for production equivalence
- [ ] Apply: Never store real secrets in `.env.testing`
- [ ] Apply: Never run `php artisan config:cache` in the testing environment
- [ ] Apply: Configure parallel database naming with `ParallelTesting::token()`

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
- Use SQLite locally for speed, MySQL/PostgreSQL in CI for production equivalence
- Never store real secrets in `.env.testing`
- Never run `php artisan config:cache` in the testing environment
- Configure parallel database naming with `ParallelTesting::token()`
- Set null drivers for all external services in `.env.testing`
- Use `Env::fake()` for per-test environment overrides, never `$_ENV`
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Configure Test Databases for Local and CI Environments


