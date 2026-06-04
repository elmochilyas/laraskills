# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Flaky Test Prevention
**Knowledge Unit:** Flaky Test Prevention Strategies
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Freeze Time for Every Time-Sensitive Test
- [ ] Apply rule: Use Explicit Values, Not Faker Defaults, for Asserted Fields
- [ ] Apply rule: Use `RefreshDatabase` for All Feature Tests
- [ ] Apply rule: Use `Http::fake()` for Any Test Interacting with External APIs
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Every time-sensitive test uses `$this->freezeTime()` or equivalent
- [ ] All external HTTP calls use `Http::fake()` in feature tests
- [ ] No Dusk tests use `pause()` â€” all use `waitFor()` or `waitForText()`
- [ ] All feature tests use `RefreshDatabase` or `DatabaseTransactions`
- [ ] Asserted fields use explicit values, not Faker defaults
- [ ] Avoid: Mistake
- [ ] Avoid: Ignoring flaky tests
- [ ] Avoid: Using `pause()` in Dusk tests

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Retry vs quarantine**: Retry (auto-retry flaky tests) is simpler but masks issues. Quarantine (separate suite that doesn't block CI) is more honest but requires discipline to fix.
- **`RefreshDatabase` vs `DatabaseTransactions`**: `RefreshDatabase` is more thorough (migrates + transactions). `DatabaseTransactions` is faster but may miss schema issues.
- **Fixed vs random data**: Fixed data for fields in assertions. Random (Faker) only for fields tests don't assert on.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Freeze Time for Every Time-Sensitive Test
- [ ] Follow rule: Use Explicit Values, Not Faker Defaults, for Asserted Fields
- [ ] Follow rule: Use `RefreshDatabase` for All Feature Tests
- [ ] Follow rule: Use `Http::fake()` for Any Test Interacting with External APIs
- [ ] Follow rule: Replace `pause()` with `waitFor()` in All Dusk Tests
- [ ] Follow rule: Track and Fix Flaky Tests Within 2 Weeks
- [ ] - [ ] Every time-sensitive test uses `$this->freezeTime()` or equivalent
- [ ] - [ ] All external HTTP calls use `Http::fake()` in feature tests
- [ ] - [ ] No Dusk tests use `pause()` â€” all use `waitFor()` or `waitForText()`
- [ ] - [ ] All feature tests use `RefreshDatabase` or `DatabaseTransactions`

# Performance Checklist
- Time freezing: Zero overhead. `Carbon::setTestNow()` is a static setter.
- `Http::fake()`: Faster than real HTTP calls (ms vs hundreds of ms).
- `RefreshDatabase`: Migration overhead per suite (~1-5s), not per test (transaction rollback is instant).
- `--retry` flag: Doubles CI time for flaky tests. Monitor retry rate.
- `waitFor()`: Polls every 100ms. More efficient than `pause(1000)`.

# Security Checklist
- Flaky tests in security-critical areas (auth, permissions) are dangerous. A flaky security test may pass when it should fail.
- Time-based security logic (password reset expirations, session timeouts) must be tested with frozen time.

# Reliability Checklist
- [ ] Ensure: Flaky tests â€” tests that pass and fail without code changes â€” are the number...
- [ ] Verify: Freeze Time for Every Time-Sensitive Test
- [ ] Verify: Use Explicit Values, Not Faker Defaults, for Asserted Fields
- [ ] Verify: Use `RefreshDatabase` for All Feature Tests
- [ ] Verify: Use `Http::fake()` for Any Test Interacting with External APIs

# Testing Checklist
- [ ] Every time-sensitive test uses `$this->freezeTime()` or equivalent
- [ ] All external HTTP calls use `Http::fake()` in feature tests
- [ ] No Dusk tests use `pause()` â€” all use `waitFor()` or `waitForText()`
- [ ] All feature tests use `RefreshDatabase` or `DatabaseTransactions`
- [ ] Asserted fields use explicit values, not Faker defaults
- [ ] Zero-assertion tests are eliminated
- [ ] Avoid: Mistake
- [ ] Avoid: Ignoring flaky tests
- [ ] Avoid: Using `pause()` in Dusk tests

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Freeze Time for Every Time-Sensitive Test
- [ ] Apply: Use Explicit Values, Not Faker Defaults, for Asserted Fields
- [ ] Apply: Use `RefreshDatabase` for All Feature Tests
- [ ] Apply: Use `Http::fake()` for Any Test Interacting with External APIs

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Ignoring flaky tests
- [ ] Avoid mistake: Using `pause()` in Dusk tests
- [ ] Avoid mistake: Not freezing time for time-sensitive code
- [ ] Avoid mistake: Using random data in assertions

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
- Freeze Time for Every Time-Sensitive Test
- Use Explicit Values, Not Faker Defaults, for Asserted Fields
- Use `RefreshDatabase` for All Feature Tests
- Use `Http::fake()` for Any Test Interacting with External APIs
- Replace `pause()` with `waitFor()` in All Dusk Tests
- Track and Fix Flaky Tests Within 2 Weeks
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Prevent Flaky Tests in Laravel


