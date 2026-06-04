# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Browser & E2E Testing
**Knowledge Unit:** Laravel Dusk Fundamentals
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Never Use `pause()` for Waiting in Dusk Tests
- [ ] Apply rule: Always Use `@dusk` Attribute Selectors for Element Targeting
- [ ] Apply rule: Limit Dusk Tests to Critical User Flows Only
- [ ] Apply rule: Always Configure Headless Mode in CI for Dusk
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Dusk test covers a critical user flow end-to-end
- [ ] `@dusk` selectors are used instead of CSS classes or XPath
- [ ] `waitFor()` or `waitForText()` is used instead of `pause()`
- [ ] Browser sessions are properly closed after the test
- [ ] Database is reset between tests (RefreshDatabase or DatabaseTruncation)
- [ ] Avoid: Mistake
- [ ] Avoid: Using `pause()` for waiting
- [ ] Avoid: Not using `@dusk` selectors

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Dusk vs Pest Playwright**: Use Dusk for existing test suites. Use Pest Playwright for new projects (Pest 4+ recommended). Playwright is faster, cross-browser, and more modern.
- **Page objects for complex pages**: For pages with multiple interactions, use page objects to encapsulate selectors and interaction methods.
- **Environment file**: `.env.dusk.local` overrides `.env` settings. Use to set `APP_URL`, `DB_CONNECTION`, and other Dusk-specific configuration.
- **CI integration**: Use `php artisan dusk --headless` or configure headless mode in `DuskTestCase::driver()`.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Never Use `pause()` for Waiting in Dusk Tests
- [ ] Follow rule: Always Use `@dusk` Attribute Selectors for Element Targeting
- [ ] Follow rule: Limit Dusk Tests to Critical User Flows Only
- [ ] Follow rule: Always Configure Headless Mode in CI for Dusk
- [ ] Follow rule: Use `.env.dusk.local` for Dusk-Specific Environment Configuration
- [ ] Follow rule: Always Use `RefreshDatabase` for Dusk Tests
- [ ] - [ ] Dusk test covers a critical user flow end-to-end
- [ ] - [ ] `@dusk` selectors are used instead of CSS classes or XPath
- [ ] - [ ] `waitFor()` or `waitForText()` is used instead of `pause()`
- [ ] - [ ] Browser sessions are properly closed after the test

# Performance Checklist
- Dusk test time: 1-5 seconds per test (browser launch + page loads + interactions).
- ChromeDriver startup: 2-5 seconds per test suite. Dusk can reuse a single browser instance across tests.
- Parallel Dusk execution: Each parallel worker needs its own ChromeDriver process. Memory: ~200MB per worker.
- Screenshot capture: <100ms per screenshot. Minor overhead.
- Database operations: Dusk tests use `RefreshDatabase` with transaction rollback, same as feature tests.

# Security Checklist
- `.env.dusk.local`: Never commit real secrets. Use CI-injected environment variables for Dusk configuration.
- Dusk browsers can access any URL the application serves. Ensure test data doesn't contain sensitive information.
- Screenshots in CI artifacts may contain test data. Set artifact retention policies appropriately.

# Reliability Checklist
- [ ] Ensure: Laravel Dusk provides browser-based E2E testing using ChromeDriver (or Selenium-...
- [ ] Verify: Never Use `pause()` for Waiting in Dusk Tests
- [ ] Verify: Always Use `@dusk` Attribute Selectors for Element Targeting
- [ ] Verify: Limit Dusk Tests to Critical User Flows Only
- [ ] Verify: Always Configure Headless Mode in CI for Dusk

# Testing Checklist
- [ ] Dusk test covers a critical user flow end-to-end
- [ ] `@dusk` selectors are used instead of CSS classes or XPath
- [ ] `waitFor()` or `waitForText()` is used instead of `pause()`
- [ ] Browser sessions are properly closed after the test
- [ ] Database is reset between tests (RefreshDatabase or DatabaseTruncation)
- [ ] Screenshots are captured on failure for debugging
- [ ] Avoid: Mistake
- [ ] Avoid: Using `pause()` for waiting
- [ ] Avoid: Not using `@dusk` selectors

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Never Use `pause()` for Waiting in Dusk Tests
- [ ] Apply: Always Use `@dusk` Attribute Selectors for Element Targeting
- [ ] Apply: Limit Dusk Tests to Critical User Flows Only
- [ ] Apply: Always Configure Headless Mode in CI for Dusk

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using `pause()` for waiting
- [ ] Avoid mistake: Not using `@dusk` selectors
- [ ] Avoid mistake: Running Dusk without headless mode in CI
- [ ] Avoid mistake: Testing everything with Dusk

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
- Never Use `pause()` for Waiting in Dusk Tests
- Always Use `@dusk` Attribute Selectors for Element Targeting
- Limit Dusk Tests to Critical User Flows Only
- Always Configure Headless Mode in CI for Dusk
- Use `.env.dusk.local` for Dusk-Specific Environment Configuration
- Always Use `RefreshDatabase` for Dusk Tests
- Run Dusk Tests in Parallel in CI
- Always Capture Screenshots on Dusk Test Failure
- Prefer Pest Playwright Over Dusk for New Projects
- Always Use Page Objects for Pages with Multiple Interactions
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Write Laravel Dusk Browser Tests


