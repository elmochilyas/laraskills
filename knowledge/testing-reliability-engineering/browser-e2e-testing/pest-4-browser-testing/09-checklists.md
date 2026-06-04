# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Browser & E2E Testing
**Knowledge Unit:** Pest 4 Browser Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Use `browser()` Function Over Direct Playwright API Calls
- [ ] Apply rule: Test at Least One Mobile Viewport for Customer-Facing Pages
- [ ] Apply rule: Cache Playwright Browsers in CI
- [ ] Apply rule: Run Chromium on PRs, Full Cross-Browser Matrix on Main Branch
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Pest Playwright plugin is properly configured
- [ ] Tests run in at least the production browser (Chrome)
- [ ] Auto-waiting is relied upon (no manual pause/waits)
- [ ] Screenshots are captured on failure for debugging
- [ ] Network requests are mocked when testing with external APIs
- [ ] Avoid: Mistake
- [ ] Avoid: Using Dusk patterns in Pest 4 browser tests
- [ ] Avoid: Running E2E tests without viewport configuration

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Viewport granularity**: Test all viewports on critical pages (checkout, login). Test desktop-only on admin pages.
- **Browser matrix strategy**: Chromium on every PR. Full matrix on main branch or nightly.
- **Screenshot baseline management**: Store baselines in version control. Update deliberately via `pest --update-screenshots`.
- **Fake vs network mock**: Use `$browser->fake()` for API mocking in browser tests. Use `Http::fake()` for Laravel-side mocking in full-stack tests.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Use `browser()` Function Over Direct Playwright API Calls
- [ ] Follow rule: Test at Least One Mobile Viewport for Customer-Facing Pages
- [ ] Follow rule: Cache Playwright Browsers in CI
- [ ] Follow rule: Run Chromium on PRs, Full Cross-Browser Matrix on Main Branch
- [ ] Follow rule: Require Manual Baseline Review for Screenshot Tests
- [ ] Follow rule: Use `pest:dusk-migrate` for Dusk Migration, Then Manual Review
- [ ] - [ ] Pest Playwright plugin is properly configured
- [ ] - [ ] Tests run in at least the production browser (Chrome)
- [ ] - [ ] Auto-waiting is relied upon (no manual pause/waits)
- [ ] - [ ] Screenshots are captured on failure for debugging

# Performance Checklist
- Pest 4 browser tests are ~2x faster than equivalent Dusk tests (Playwright optimization vs ChromeDriver).
- Browser memory: ~300MB per concurrent browser instance. Parallel tests multiply memory.
- Screenshot comparison: <100ms per comparison.
- Viewport switching: Negligible. Playwright changes viewport without browser restart.
- CI cold start: First test installs Playwright browsers (~1-2 minutes). Cache the Playwright browser binaries.

# Security Checklist
- Playwright browsers execute in the same security context as the application. Ensure test environments (especially CI) don't have access to production credentials.
- Network mocking via `$browser->fake()` should not accidentally expose real API endpoints or secrets.
- Screenshot and video captures may contain sensitive test data. Set CI artifact retention policies.

# Reliability Checklist
- [ ] Ensure: Pest 4 introduced native browser testing as a built-in feature (not an additiona...
- [ ] Verify: Use `browser()` Function Over Direct Playwright API Calls
- [ ] Verify: Test at Least One Mobile Viewport for Customer-Facing Pages
- [ ] Verify: Cache Playwright Browsers in CI
- [ ] Verify: Run Chromium on PRs, Full Cross-Browser Matrix on Main Branch

# Testing Checklist
- [ ] Pest Playwright plugin is properly configured
- [ ] Tests run in at least the production browser (Chrome)
- [ ] Auto-waiting is relied upon (no manual pause/waits)
- [ ] Screenshots are captured on failure for debugging
- [ ] Network requests are mocked when testing with external APIs
- [ ] Database state is reset between tests
- [ ] Avoid: Mistake
- [ ] Avoid: Using Dusk patterns in Pest 4 browser tests
- [ ] Avoid: Running E2E tests without viewport configuration

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Use `browser()` Function Over Direct Playwright API Calls
- [ ] Apply: Test at Least One Mobile Viewport for Customer-Facing Pages
- [ ] Apply: Cache Playwright Browsers in CI
- [ ] Apply: Run Chromium on PRs, Full Cross-Browser Matrix on Main Branch

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using Dusk patterns in Pest 4 browser tests
- [ ] Avoid mistake: Running E2E tests without viewport configuration
- [ ] Avoid mistake: Not caching Playwright browsers in CI
- [ ] Avoid mistake: Visual regression without baseline review

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
- Use `browser()` Function Over Direct Playwright API Calls
- Test at Least One Mobile Viewport for Customer-Facing Pages
- Cache Playwright Browsers in CI
- Run Chromium on PRs, Full Cross-Browser Matrix on Main Branch
- Require Manual Baseline Review for Screenshot Tests
- Use `pest:dusk-migrate` for Dusk Migration, Then Manual Review
- Mock API Responses in Browser Tests for Deterministic Behavior
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Write End-to-End Tests with Pest and Playwright


