# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Core Concepts & Fundamentals
**Knowledge Unit:** PHPUnit Configuration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always set `APP_ENV=testing` in `phpunit.xml` to ensure `.env.testing` is loaded
- [ ] Apply rule: Never run `php artisan config:cache` for the test environment
- [ ] Apply rule: Use `<source><include>` to scope coverage filtering to application code only
- [ ] Apply rule: Define separate `<testsuite>` entries for unit and feature tests
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `APP_ENV=testing` is set in `<php>` section
- [ ] Separate Unit and Feature test suites defined
- [ ] Coverage source scoped to `app/` directory
- [ ] Parallel process count matches CI runner CPUs minus 1
- [ ] No secrets hard-coded in the configuration file
- [ ] Avoid: Assuming Pest is a separate framework
- [ ] Avoid: Missing `APP_ENV=testing` in `phpunit.xml`
- [ ] Avoid: Using `it()` when `@depends` compatibility is needed

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **File structure**: `phpunit.xml` at project root. `pest.php` alongside it for Pest-specific config.
- **Environment variable hierarchy**: `phpunit.xml <env>` > `.env.testing` > `.env`. Highest priority in XML.
- **Test suite organization**: Define `<testsuite>` entries for unit, feature, and other test types. Allows targeted runs.
- **Coverage configuration**: Use `<source><include>` and `<source><exclude>` for accurate coverage. Exclude config, migrations, vendor.
- **Extension registration**: Register custom extensions in `<extensions>`. Extensions are PHP classes implementing PHPUnit extension interfaces.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always set `APP_ENV=testing` in `phpunit.xml` to ensure `.env.testing` is loaded
- [ ] Follow rule: Never run `php artisan config:cache` for the test environment
- [ ] Follow rule: Use `<source><include>` to scope coverage filtering to application code only
- [ ] Follow rule: Define separate `<testsuite>` entries for unit and feature tests
- [ ] Follow rule: Set parallel execution parameters matching CI runner capacity
- [ ] Follow rule: Never store secrets in `phpunit.xml` or `phpunit.xml.dist`
- [ ] - [ ] `APP_ENV=testing` is set in `<php>` section
- [ ] - [ ] Separate Unit and Feature test suites defined
- [ ] - [ ] Coverage source scoped to `app/` directory
- [ ] - [ ] Parallel process count matches CI runner CPUs minus 1

# Performance Checklist
- [ ] No performance concerns identified

# Security Checklist
- [ ] No security concerns identified

# Reliability Checklist
- [ ] Ensure: PHPUnit configuration via `phpunit.xml` controls test suite discovery, environme...
- [ ] Verify: Always set `APP_ENV=testing` in `phpunit.xml` to ensure `.env.testing` is loaded
- [ ] Verify: Never run `php artisan config:cache` for the test environment
- [ ] Verify: Use `<source><include>` to scope coverage filtering to application code only
- [ ] Verify: Define separate `<testsuite>` entries for unit and feature tests

# Testing Checklist
- [ ] `APP_ENV=testing` is set in `<php>` section
- [ ] Separate Unit and Feature test suites defined
- [ ] Coverage source scoped to `app/` directory
- [ ] Parallel process count matches CI runner CPUs minus 1
- [ ] No secrets hard-coded in the configuration file
- [ ] `config:cache` not run in test environment
- [ ] Avoid: Assuming Pest is a separate framework
- [ ] Avoid: Missing `APP_ENV=testing` in `phpunit.xml`
- [ ] Avoid: Using `it()` when `@depends` compatibility is needed

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always set `APP_ENV=testing` in `phpunit.xml` to ensure `.env.testing` is loaded
- [ ] Apply: Never run `php artisan config:cache` for the test environment
- [ ] Apply: Use `<source><include>` to scope coverage filtering to application code only
- [ ] Apply: Define separate `<testsuite>` entries for unit and feature tests

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Assuming Pest is a separate framework
- [ ] Avoid mistake: Missing `APP_ENV=testing` in `phpunit.xml`
- [ ] Avoid mistake: Using `it()` when `@depends` compatibility is needed
- [ ] Avoid mistake: Config cache collision

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
- Always set `APP_ENV=testing` in `phpunit.xml` to ensure `.env.testing` is loaded
- Never run `php artisan config:cache` for the test environment
- Use `<source><include>` to scope coverage filtering to application code only
- Define separate `<testsuite>` entries for unit and feature tests
- Set parallel execution parameters matching CI runner capacity
- Never store secrets in `phpunit.xml` or `phpunit.xml.dist`
- Prefer `test()` syntax over `it()` when `@depends` annotations are needed
- Keep `phpunit.xml` as the single source of truth; use `pest.php` only for Pest-specific additions
- Always configure `<source>` to exclude `vendor/`, `config/`, and `database/migrations/`
- Never apply `RefreshDatabase` globally in `pest.php`
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Configure PHPUnit Test Suite


