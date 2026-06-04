# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Accessibility Regression Testing
Knowledge Unit: Accessibility Regression Testing
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Accessibility regression testing ensures that UI changes do not introduce barriers for users with disabilities. For Laravel applications, the primary approach integrates axe-core (via Dusk JavaScript execution) for automated accessibility audits and Pa11y CLI for scheduled checks. Key regression points include error-summary focus management, `aria-invalid` on invalid fields, `role="alert"`/`role="status"` announcements, and keyboard operability. This practice is emerging in 2026 but is becoming essential as regulatory requirements (WCAG, ADA) grow.

# Core Concepts
- **axe-core**: Browser-based accessibility engine that runs automated rules against the rendered DOM. Injects via Dusk's `script()` method. Covers ~57 rules for WCAG compliance.
- **Pa11y**: CLI tool for scheduled accessibility checks. Runs against URLs and produces reports. Integrates with CI pipelines via `pa11y-ci`.
- **ARIA attributes**: `aria-invalid="true"` on error fields, `aria-describedby` for help text, `role="alert"` for dynamic error summaries, `role="status"` for live region updates.
- **Keyboard operability**: Tab order, focus trapping in modals, skip-to-content links. Verified via Dusk `keys()` and tab sequence testing.
- **Color contrast**: Ensured at the design/system level; automated in CI via axe-core color-contrast rule.
- **Focus management**: After form submission errors or page transitions, focus must move to the error summary or new content region.

# Mental Models
- **Accessibility as regression, not audit**: Treat accessibility as a continuous regression check, not a one-time audit. Each deploy should verify that new code didn't break existing accessibility.
- **Automation as triage**: Automated tools catch ~30-50% of accessibility issues (the "low-hanging fruit"). Manual testing (screen reader, keyboard-only) catches the rest. Automate the repeatable checks.
- **Error state as a11y failure point**: Form validation errors are the most common accessibility regression. Ensure error summary focus, live region announcements, and field-level error associations work consistently.
- **Component-level responsibility**: Each Livewire/Vue/Blade component owns its accessibility contract. Tests should verify ARIA attributes, keyboard handling, and focus management per component.

# Internal Mechanics
- **Dusk + axe-core integration**: `$browser->script("axe.run().then(function(results){ window.axeResults = results; })")`. Results are JavaScript objects with violations, passes, incomplete, and inapplicable rules.
- **Pa11y configuration**: `.pa11yci` file defines URLs to check, standard (WCAG2AA), and reporters. Runs via `npx pa11y-ci` in CI pipeline.
- **Dusk keyboard simulation**: `$browser->keys('@input', '{tab}')` simulates keyboard navigation. `$browser->keys('@input', 'value')` for text input.
- **Focus assertion**: `$browser->assertFocused('@element')` verifies focus is on a specific element after interaction.
- **Live region verification**: After dynamic content updates, verify `role="status"` or `aria-live="polite"` regions contain expected content using `$browser->assertSeeIn('@live-region', 'Message')`.

# Patterns
- **Pattern: axe-core audit in Dusk test**
  - Purpose: Run automated accessibility audit on critical pages
  - Benefits: Catches contrast issues, missing labels, ARIA violations
  - Tradeoffs: Adds 1-3 seconds per page; not a complete a11y replacement
  - Implementation: `$browser->visit('/page')->script("axe.run(...)")` then assert violations array is empty

- **Pattern: Error-state accessibility verification**
  - Purpose: Verify form errors are announced and focusable
  - Benefits: Catches most common a11y regression
  - Tradeoffs: Requires specific error-triggering input
  - Implementation: Submit invalid form, assert `aria-invalid="true"`, focus on error summary, verify `role="alert"` present

- **Pattern: Keyboard tab flow validation**
  - Purpose: Verify tab order matches visual order
  - Benefits: Ensures keyboard-only users can navigate
  - Tradeoffs: Brittle if DOM order changes
  - Implementation: Sequence of `$browser->keys('@body', '{tab}')` and `assertFocused()` calls

- **Pattern: CI scheduled a11y check**
  - Purpose: Run full a11y scan outside of test suite
  - Benefits: Comprehensive coverage; separate from test flakiness
  - Tradeoffs: Slower; requires running app instance
  - Implementation: Deploy to staging, run `pa11y-ci`, publish report to artifact

# Architectural Decisions
- **axe-core vs Pa11y**: Use axe-core in Dusk tests for per-page regression checks during development. Use Pa11y for scheduled comprehensive scans in CI. They complement rather than replace each other.
- **Dusk vs dedicated a11y service**: For teams with strict compliance requirements, consider dedicated services (Deque, Accessibility Insights) for full audits. axe-core is sufficient for regression detection.
- **Component-level vs page-level a11y tests**: Start with page-level smoke tests (axe-core on critical pages). Add component-level tests for reusable components (modals, date pickers, multi-select).

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Automated a11y catches repeatable issues | ~30-50% coverage; misses manual-test-only issues | Supplement with periodic manual screen reader testing |
| axe-core integrates naturally with Dusk | Adds 1-3s per page test | Run on critical pages only (login, checkout, dashboard) |
| Pa11y CI gives comprehensive reports | Requires deployed staging environment | Include in nightly CI, not per-commit |
| Keyboard flow tests catch tab-order bugs | Brittle if DOM structure changes | Limit to critical flows; name selectors semantically |

# Performance Considerations
- axe-core script execution: 500-2000ms per page (depends on DOM complexity). Run on critical pages only.
- Pa11y scan: 2-10 seconds per URL. Run as separate CI job, not blocking test suite.
- Dusk keyboard tests: ~100ms per tab press. Sequence of 10-15 tabs adds ~1-2 seconds.
- Color contrast calculations: Done by axe-core CSS analysis. No additional performance cost beyond axe run.
- Focus management assertions: Instant (checks DOM focus state).

# Production Considerations
- **CI tooling**: Install axe-core via npm (`npm install axe-core`). Pa11y via `npx pa11y-ci` or npm package.
- **a11y regression gates**: Block PRs if axe-core violations increase compared to baseline. Store baseline in CI artifact.
- **Component library documentation**: Maintain a11y expectations per component in Storybook/docs. Reference in test comments.
- **Regulatory compliance**: Document which WCAG success criteria are covered by automated tests. Map test assertions to WCAG criteria IDs.
- **Training**: Teach developers what axe-core violations mean. Common violations (missing labels, low contrast, missing ARIA) should be fixable without accessibility expertise.

# Common Mistakes
- **Mistake: Running axe-core on every page in every test**
  - Why: Comprehensive coverage mindset
  - Why harmful: Adds significant test time; axe-core on heavy pages (dashboard) may timeout
  - Better: Run on critical pages once per test suite run; use separate a11y CI job for full scan

- **Mistake: Ignoring axe-core "incomplete" results**
  - Why: Incomplete results require manual review
  - Why harmful: Deferred manual review never happens; known issues accumulate
  - Better: Log incomplete results to CI artifact; schedule regular manual review sprint

- **Mistake: Only testing the "happy path" for a11y**
  - Why: Happy path usually has fewer accessibility issues
  - Why harmful: Error states, loading states, and empty states are most common a11y failures
  - Better: Test error states, loading skeletons, and empty table states with axe-core

- **Mistake: Not testing keyboard operability for modals/dialogs**
  - Why: Modals need focus trapping, escape-to-close, and focus return
  - Why harmful: Keyboard-only users cannot complete tasks involving modals
  - Better: Dusk test: open modal, tab through all focusable elements, press Escape, verify focus returns to trigger

# Failure Modes
- **axe-core false positives**: Color contrast rules may flag intentionally low-contrast elements (disabled inputs, placeholder text). Maintain an exclusion list.
- **axe-core version drift**: New axe-core versions add or change rules. A previously passing page may fail after update. Pin version and review rule changes.
- **Dynamic content timing**: Live regions may not update before Dusk assertion. Use `waitForText()` on live region content before checking ARIA attributes.
- **Keyboard test brittleness**: Tab order depends on DOM order. Adding a sidebar navigation item shifts tab sequence and breaks tests. Use semantic selectors for tab targets.
- **Focus trap implementation differences**: Custom focus trap implementations may not work with Dusk's keyboard simulation. Test manually with real keyboard first.

# Ecosystem Usage
- **Laravel core**: No built-in accessibility testing. Integration is manual via Dusk's JavaScript execution.
- **Laravel Nova**: Nova's components increasingly include ARIA attributes. Custom Nova tools should follow same patterns.
- **Filament**: Filament admin panel includes ARIA attributes in forms, tables, and modals. Verify accessibility per custom Filament component.
- **Livewire**: Livewire components handle dynamic content updates. Critical to verify live region announcements (role="status") after wire:submit or wire:click.

# Related Knowledge Units
- **Prerequisites**: Laravel Dusk fundamentals, JavaScript DOM basics, WCAG 2.1 understanding
- **Related Topics**: Dusk selectors and page objects, Flaky test prevention, Post-deployment health checks
- **Advanced Follow-up**: Screen reader testing automation, WCAG 2.2 compliance migration, Visual regression + a11y combined testing

# Research Notes
- axe-core integration with Dusk is documented in community blog posts but not in Laravel official docs; the pattern uses `$browser->driver->executeScript()` to inject and run axe-core
- Pa11y CI provides configurable thresholds for violation severity; teams can start with "critical only" violations and gradually tighten to include "serious" and "moderate" over time
- WCAG 2.2 adds focus-not-obscured, dragging movements, and accessible authentication requirements; axe-core 4.7+ includes corresponding rules
- Automated a11y testing is most effective when combined with a component library and design system that enforces accessible patterns at the framework level (Blade components with built-in ARIA)
- The PHP/Laravel community lags behind JS ecosystems in a11y testing practice; most guidance comes from frontend-focused sources rather than Laravel-specific resources
