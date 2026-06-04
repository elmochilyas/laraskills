# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Accessibility Testing
**Knowledge Unit:** Accessibility Regression Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Run axe-core on Critical Pages Only â€” Never on Every Page in Every Test
- [ ] Apply rule: Test Error States â€” Not Just Happy Path Accessibility
- [ ] Apply rule: Maintain an axe-core Baseline â€” Fail Only on New Violations
- [ ] Apply rule: Pin axe-core Version and Review Rule Changes on Upgrade
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Accessibility testing tool is integrated into the test suite
- [ ] Key user-facing pages are covered by accessibility tests
- [ ] WCAG 2.1 AA rules are included in the audit configuration
- [ ] Known false positives are documented and excluded
- [ ] Minimum accessibility score threshold is defined
- [ ] Avoid: Mistake
- [ ] Avoid: Running axe-core on every page in every test
- [ ] Avoid: Ignoring axe-core "incomplete" results

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Integration point**: Inject axe-core via `$browser->driver->executeScript()`. The pattern is not built into Laravel core â€” it is manual via Dusk's JavaScript execution.
- **Component-level responsibility**: Each Livewire/Vue/Blade component owns its accessibility contract. Tests should verify ARIA attributes, keyboard handling, and focus management per component.
- **Pa11y for comprehensive scans, Dusk for regression**: Use Pa11y for scheduled full scans in CI (nightly). Use Dusk + axe-core for per-PR regression gates on critical pages.
- **CI placement**: Run axe-core assertions in Dusk tests (blocking for PRs). Run Pa11y scans as separate non-blocking CI job (nightly or on schedule).
- **Component library convention**: Build ARIA attributes into Blade components by default. `<x-input>` should always render `aria-invalid` when errors are present.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Run axe-core on Critical Pages Only â€” Never on Every Page in Every Test
- [ ] Follow rule: Test Error States â€” Not Just Happy Path Accessibility
- [ ] Follow rule: Maintain an axe-core Baseline â€” Fail Only on New Violations
- [ ] Follow rule: Pin axe-core Version and Review Rule Changes on Upgrade
- [ ] Follow rule: Use `@dusk` Selectors for Keyboard Tab Flow Tests
- [ ] Follow rule: Log axe-core "Incomplete" Results for Manual Review
- [ ] - [ ] Accessibility testing tool is integrated into the test suite
- [ ] - [ ] Key user-facing pages are covered by accessibility tests
- [ ] - [ ] WCAG 2.1 AA rules are included in the audit configuration
- [ ] - [ ] Known false positives are documented and excluded

# Performance Checklist
- axe-core script execution: 500-2000ms per page (DOM complexity dependent). Run on critical pages only.
- Pa11y scan: 2-10 seconds per URL. Run as separate CI job, not blocking test suite.
- Dusk keyboard tests: ~100ms per tab press. A sequence of 10-15 tabs adds ~1-2 seconds.
- Focus management assertions: Instant (checks DOM focus state only).

# Security Checklist
- axe-core runs entirely in-browser; no external data transmission. Safe for staging/CI environments.
- Pa11y scans against deployed URLs. Ensure staging environment is not publicly discoverable if it contains sensitive data.
- Never run axe-core or Pa11y against production URLs without ensuring no data leakage from automated scanning.

# Reliability Checklist
- [ ] Ensure: Accessibility regression testing ensures that UI changes do not introduce barrie...
- [ ] Verify: Run axe-core on Critical Pages Only â€” Never on Every Page in Every Test
- [ ] Verify: Test Error States â€” Not Just Happy Path Accessibility
- [ ] Verify: Maintain an axe-core Baseline â€” Fail Only on New Violations
- [ ] Verify: Pin axe-core Version and Review Rule Changes on Upgrade

# Testing Checklist
- [ ] Accessibility testing tool is integrated into the test suite
- [ ] Key user-facing pages are covered by accessibility tests
- [ ] WCAG 2.1 AA rules are included in the audit configuration
- [ ] Known false positives are documented and excluded
- [ ] Minimum accessibility score threshold is defined
- [ ] Accessibility tests run in CI and can block PRs on regressions
- [ ] Avoid: Mistake
- [ ] Avoid: Running axe-core on every page in every test
- [ ] Avoid: Ignoring axe-core "incomplete" results

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Run axe-core on Critical Pages Only â€” Never on Every Page in Every Test
- [ ] Apply: Test Error States â€” Not Just Happy Path Accessibility
- [ ] Apply: Maintain an axe-core Baseline â€” Fail Only on New Violations
- [ ] Apply: Pin axe-core Version and Review Rule Changes on Upgrade

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Running axe-core on every page in every test
- [ ] Avoid mistake: Ignoring axe-core "incomplete" results
- [ ] Avoid mistake: Only testing the "happy path"
- [ ] Avoid mistake: Not testing keyboard operability for modals

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
- Run axe-core on Critical Pages Only â€” Never on Every Page in Every Test
- Test Error States â€” Not Just Happy Path Accessibility
- Maintain an axe-core Baseline â€” Fail Only on New Violations
- Pin axe-core Version and Review Rule Changes on Upgrade
- Use `@dusk` Selectors for Keyboard Tab Flow Tests
- Log axe-core "Incomplete" Results for Manual Review
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Implement Accessibility Regression Testing


