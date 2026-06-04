# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Browser & E2E Testing
**Knowledge Unit:** Pest Playwright Browser Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Leverage Auto-Waiting Fully â€” Don't Add Manual Waits
- [ ] Apply rule: Run Chromium on PRs, Full Cross-Browser Matrix on Main Branch
- [ ] Apply rule: Install Playwright Browsers in CI Setup Step
- [ ] Apply rule: Use Network Interception for Deterministic API Responses
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Playwright browsers are installed and configured
- [ ] Test server is configured to start before tests
- [ ] Browser is configured as headless for CI
- [ ] Screenshot on failure is enabled
- [ ] Network interception is used for external API calls
- [ ] Avoid: Mistake
- [ ] Avoid: Not using auto-waiting (overriding with manual waits)
- [ ] Avoid: Running full cross-browser suite on every PR

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Pest Playwright vs Dusk**: New projects = Pest Playwright. Existing Dusk projects = migrate gradually or stay with Dusk. Playwright is ~2x faster, more reliable (auto-waiting), and cross-browser.
- **Single-browser CI vs matrix**: Run Chromium on every PR. Full cross-browser matrix nightly or pre-release. Saves CI minutes while maintaining coverage.
- **Network interception vs backend fakes**: Use network interception for frontend-isolated tests. Use Laravel fakes for full-stack tests.
- **Screenshot assertion vs visual regression service**: `assertScreenshot()` is basic. For production visual regression, use dedicated services (Chromatic, Percy).

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Leverage Auto-Waiting Fully â€” Don't Add Manual Waits
- [ ] Follow rule: Run Chromium on PRs, Full Cross-Browser Matrix on Main Branch
- [ ] Follow rule: Install Playwright Browsers in CI Setup Step
- [ ] Follow rule: Use Network Interception for Deterministic API Responses
- [ ] Follow rule: Capture Traces Only on Failure
- [ ] Follow rule: Use Viewport Presets for Responsive Testing
- [ ] - [ ] Playwright browsers are installed and configured
- [ ] - [ ] Test server is configured to start before tests
- [ ] - [ ] Browser is configured as headless for CI
- [ ] - [ ] Screenshot on failure is enabled

# Performance Checklist
- Playwright test execution: 200-500ms per test (vs 500-1500ms for Dusk). Auto-waiting reduces wasted time.
- Browser startup: 1-3 seconds per test suite. Reuse browser across tests (new context, not new browser).
- Cross-browser execution: Firefox is ~same speed as Chromium. WebKit is ~10-20% slower.
- Video recording: Adds 30-50% to test time. Enable only on failure.
- CI resource usage: Playwright requires more memory than Dusk (~300MB per browser instance).

# Security Checklist
- Playwright browsers can access any URL. Ensure test data doesn't contain sensitive information.
- Network interception mocks should not accidentally expose real API configurations or secrets in test code.
- Screenshots and video recordings captured on failure may contain test data. Set appropriate retention policies for CI artifacts.

# Reliability Checklist
- [ ] Ensure: Pest Playwright (Pest 4 browser testing) brings Playwright-powered browser testi...
- [ ] Verify: Leverage Auto-Waiting Fully â€” Don't Add Manual Waits
- [ ] Verify: Run Chromium on PRs, Full Cross-Browser Matrix on Main Branch
- [ ] Verify: Install Playwright Browsers in CI Setup Step
- [ ] Verify: Use Network Interception for Deterministic API Responses

# Testing Checklist
- [ ] Playwright browsers are installed and configured
- [ ] Test server is configured to start before tests
- [ ] Browser is configured as headless for CI
- [ ] Screenshot on failure is enabled
- [ ] Network interception is used for external API calls
- [ ] Database is reset between test runs
- [ ] Avoid: Mistake
- [ ] Avoid: Not using auto-waiting (overriding with manual waits)
- [ ] Avoid: Running full cross-browser suite on every PR

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Leverage Auto-Waiting Fully â€” Don't Add Manual Waits
- [ ] Apply: Run Chromium on PRs, Full Cross-Browser Matrix on Main Branch
- [ ] Apply: Install Playwright Browsers in CI Setup Step
- [ ] Apply: Use Network Interception for Deterministic API Responses

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not using auto-waiting (overriding with manual waits)
- [ ] Avoid mistake: Running full cross-browser suite on every PR
- [ ] Avoid mistake: Forgetting to install Playwright browsers
- [ ] Avoid mistake: Overusing network interception

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
- Leverage Auto-Waiting Fully â€” Don't Add Manual Waits
- Run Chromium on PRs, Full Cross-Browser Matrix on Main Branch
- Install Playwright Browsers in CI Setup Step
- Use Network Interception for Deterministic API Responses
- Capture Traces Only on Failure
- Use Viewport Presets for Responsive Testing
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Implement Pest Playwright Browser Testing


