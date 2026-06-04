# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Accessibility Regression Testing |
| Knowledge Unit | Accessibility Regression Testing |
| Difficulty | Intermediate |
| Maturity | Emerging |
| Priority | P2 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Laravel Dusk fundamentals, JavaScript DOM basics, WCAG 2.1 understanding |
| Related KUs | Dusk selectors and page objects, Flaky test prevention, Post-deployment health checks |
| Source | domain-analysis.md K032 |

# Overview

Accessibility regression testing ensures that UI changes do not introduce barriers for users with disabilities. For Laravel applications, the primary approach integrates axe-core (via Dusk JavaScript execution) for automated accessibility audits and Pa11y CLI for scheduled checks. Key regression points include error-summary focus management, `aria-invalid` on invalid fields, `role="alert"`/`role="status"` announcements, and keyboard operability. This practice is emerging in 2026 but becoming essential as regulatory requirements (WCAG, ADA) grow.

# Core Concepts

- **axe-core**: Browser-based accessibility engine running ~57 automated rules against the rendered DOM. Injected via Dusk's `script()` method.
- **Pa11y**: CLI tool for scheduled accessibility checks against URLs, producing reports. Integrates via `pa11y-ci`.
- **ARIA attributes**: `aria-invalid="true"` on error fields, `aria-describedby` for help text, `role="alert"` for dynamic error summaries, `role="status"` for live region updates.
- **Keyboard operability**: Tab order, focus trapping in modals, skip-to-content links. Verified via Dusk `keys()` and tab sequence testing.
- **Focus management**: After form submission errors or page transitions, focus must move to the error summary or new content region.
- **Color contrast**: Ensured at design/system level; automated in CI via axe-core `color-contrast` rule.

# When To Use

- On every critical page (login, checkout, dashboard, registration) in CI
- On error states (form validation, 404, 500) — the most common accessibility regression points
- On reusable components (modals, date pickers, multi-select) during development
- On dynamic content regions (live regions, async-loaded sections)
- As scheduled nightly scans for comprehensive coverage

# When NOT To Use

- As a substitute for manual screen reader testing (automation catches only ~30-50% of issues)
- On every page in every Dusk test (adds 1-3 seconds per page)
- For visual design accessibility (color perception, contrast perception — use design tooling)
- As a replacement for WCAG compliance audits by accessibility specialists

# Best Practices (WHY)

- **Run axe-core on critical pages only**: axe-core adds 500-2000ms per execution. Running on every page in every test balloons CI time. Select the top 5-10 user-facing pages for regression coverage.
- **Test error states, not just happy paths**: Error states (validation errors, 404, 500) are where accessibility most commonly fails. Form validation without `aria-invalid` or focus management is the #1 a11y regression.
- **Maintain an axe-core baseline**: Store known violation counts per page in CI artifacts. Fail only when violations increase, not on existing violations. This allows progressive improvement.
- **Use `@dusk` selectors for keyboard tests**: Keyboard tab flow tests are brittle. Using `@dusk` attribute selectors (not CSS classes) isolates tests from DOM structure changes.
- **Pin axe-core version**: New axe-core versions add or change rules. A previously passing page may fail after update. Pin version and review rule changes during upgrades.
- **Log "incomplete" results to CI artifacts**: axe-core "incomplete" results require manual review. Deferred review never happens unless scheduled. Create a recurring CI task for incomplete review.
- **Document WCAG coverage mapping**: Map test assertions to WCAG success criteria IDs. This provides audit trail for compliance reporting and identifies coverage gaps.

# Architecture Guidelines

- **Integration point**: Inject axe-core via `$browser->driver->executeScript()`. The pattern is not built into Laravel core — it is manual via Dusk's JavaScript execution.
- **Component-level responsibility**: Each Livewire/Vue/Blade component owns its accessibility contract. Tests should verify ARIA attributes, keyboard handling, and focus management per component.
- **Pa11y for comprehensive scans, Dusk for regression**: Use Pa11y for scheduled full scans in CI (nightly). Use Dusk + axe-core for per-PR regression gates on critical pages.
- **CI placement**: Run axe-core assertions in Dusk tests (blocking for PRs). Run Pa11y scans as separate non-blocking CI job (nightly or on schedule).
- **Component library convention**: Build ARIA attributes into Blade components by default. `<x-input>` should always render `aria-invalid` when errors are present.

# Performance Considerations

- axe-core script execution: 500-2000ms per page (DOM complexity dependent). Run on critical pages only.
- Pa11y scan: 2-10 seconds per URL. Run as separate CI job, not blocking test suite.
- Dusk keyboard tests: ~100ms per tab press. A sequence of 10-15 tabs adds ~1-2 seconds.
- Focus management assertions: Instant (checks DOM focus state only).

# Security Considerations

- axe-core runs entirely in-browser; no external data transmission. Safe for staging/CI environments.
- Pa11y scans against deployed URLs. Ensure staging environment is not publicly discoverable if it contains sensitive data.
- Never run axe-core or Pa11y against production URLs without ensuring no data leakage from automated scanning.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Running axe-core on every page in every test | Comprehensive coverage mindset | Significant test time; axe-core on heavy pages may timeout | Run on critical pages once per suite; separate CI job for full scan |
| Ignoring axe-core "incomplete" results | Incomplete results require manual review | Deferred manual review never happens; known issues accumulate | Log incomplete results to CI artifact; schedule regular manual review |
| Only testing the "happy path" | Happy path has fewer accessibility issues | Error states, loading states, empty states are most common a11y failures | Test error states, loading skeletons, and empty table states with axe-core |
| Not testing keyboard operability for modals | Modals need focus trapping, escape-to-close, focus return | Keyboard-only users cannot complete tasks involving modals | Dusk test: open modal, tab through all focusable elements, press Escape, verify focus returns to trigger |
| Testing accessibility only once | Treating as one-time audit | Regression goes undetected after deployments | Integrate into CI as continuous regression check |

# Anti-Patterns

- **Axe-core on entire page suite in every test run**: Running comprehensive a11y scans as part of every Dusk test. Instead, run a focused set on critical pages in tests and comprehensive scan as separate job.
- **Using `pause()` for keyboard navigation**: Using fixed delays instead of explicit element waits. Instead, use `waitFor()` and `waitForText()` before keyboard interaction assertions.
- **Auto-updating axe-core without review**: Letting CI auto-update axe-core version. Instead, pin version and review new rules during upgrade.
- **Testing only with axe-core defaults**: Using only default axe-core configuration. Instead, configure rules to match project's WCAG target level (A, AA, AAA).

# Examples

```php
// Dusk + axe-core integration test
$browser->visit('/login')
    ->script('
        axe.run().then(function(results) {
            window.axeViolations = results.violations;
        });
    ')
    ->waitUntil('typeof window.axeViolations !== "undefined"');

$violations = $browser->script('return window.axeViolations;')[0];
$this->assertCount(0, $violations, 'Accessibility violations found on /login');

// Error state accessibility verification
$browser->visit('/register')
    ->press('@submit')
    ->waitFor('@error-summary')
    ->assertAttribute('@email-input', 'aria-invalid', 'true')
    ->assertFocused('@error-summary')
    ->assertPresent('[role="alert"]');

// Keyboard tab flow test
$browser->keys('@body', '{tab}')
    ->assertFocused('@skip-link')
    ->keys('@skip-link', '{tab}')
    ->assertFocused('@nav-toggle');
```

# Related Topics

- **Prerequisites**: Laravel Dusk fundamentals, JavaScript DOM basics, WCAG 2.1 understanding
- **Related**: Dusk selectors and page objects, Flaky test prevention, Post-deployment health checks
- **Advanced**: Screen reader testing automation, WCAG 2.2 compliance migration, Visual regression + a11y combined testing

# AI Agent Notes

- When writing a11y tests for a Laravel project, first identify the 5-10 most critical user-facing pages. Add axe-core audits to those pages in existing Dusk tests rather than creating new dedicated test files.
- The most common a11y regression patterns in Laravel apps are: (1) form validation without `aria-invalid`, (2) error summaries without focus management or `role="alert"`, (3) modals/dialogs without focus trapping, (4) dynamic content updates without `aria-live` announcements.
- Check if the project uses a component library (Blade components, Livewire, Filament). If so, verify that components already include ARIA attributes before writing custom a11y tests.
- For teams new to a11y testing, start with the `security` preset of axe-core (critical/serious violations only). Gradually expand to full WCAG AA coverage as the team matures.

# Verification

- [ ] axe-core can be injected and run via Dusk `script()` method
- [ ] Violations array is empty for all critical pages
- [ ] Error states have `aria-invalid="true"` on invalid fields
- [ ] Error summary receives focus after form submission failure
- [ ] `role="alert"` or `role="status"` present on dynamic notifications
- [ ] Keyboard tab order matches visual order on critical flows
- [ ] Modals trap focus and return focus on close
- [ ] Pa11y CI scan completes without exceeding violation threshold
- [ ] axe-core version is pinned and rule changes reviewed
- [ ] Incomplete results are logged and reviewed periodically
