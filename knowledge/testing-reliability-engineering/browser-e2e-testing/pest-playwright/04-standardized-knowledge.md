# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Browser & E2E Testing |
| Knowledge Unit | Pest Playwright Browser Testing |
| Difficulty | Intermediate |
| Maturity | Emerging |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Pest fundamentals, Browser testing concepts, Playwright basics |
| Related KUs | Dusk fundamentals, Visual regression testing, Accessibility testing with Playwright |
| Source | domain-analysis.md K054 |

# Overview

Pest Playwright (Pest 4 browser testing) brings Playwright-powered browser testing to the Laravel ecosystem, replacing Dusk as the recommended approach for new projects (2026+). Playwright provides cross-browser support (Chromium, Firefox, WebKit), faster execution, auto-waiting, network interception, and modern debugging tools. Pest Playwright integrates Playwright's capabilities into Pest's expressive DSL, enabling E2E tests that are faster, more reliable, and more feature-rich than Dusk.

# Core Concepts

- **`use Browser(...)`**: Pest Playwright bootstrap. Registers browser context for the test.
- **`browser()` function**: Entry point for browser interactions. Returns a Playwright Browser instance.
- **Cross-browser support**: Same test runs on Chromium, Firefox, WebKit via `PEST_BROWSER` environment variable.
- **Auto-waiting**: Playwright automatically waits for elements to be actionable (visible, enabled, stable) before interacting.
- **Network interception**: `$browser->intercept()->mock('/api/*', $response)` for API mocking in browser tests.
- **Screenshot and video capture**: Built-in screenshot and video recording on failure. More sophisticated than Dusk.
- **Mobile viewport testing**: `$browser->viewport(375, 812)` for mobile-specific testing.

# When To Use

- For new Laravel projects needing browser E2E testing (recommended 2026+)
- When cross-browser testing (Chromium, Firefox, WebKit) is required
- When auto-waiting is preferred over manual wait management
- For frontend-heavy applications where network interception and API mocking in browser tests add value
- When migrating from Dusk to a more modern, faster E2E framework

# When NOT To Use

- For existing projects with large Dusk test suites (migration cost may not be justified)
- When the CI environment cannot run Node.js (Playwright requires Node installation)
- When only Chromium is required and Dusk is already working reliably
- For simple E2E tests where feature HTTP tests would suffice

# Best Practices (WHY)

- **Leverage auto-waiting fully**: Don't add explicit waits out of habit from Dusk. Playwright waits for elements to be visible, enabled, and stable before acting. Manual waits negate this advantage.
- **Run Chromium on PRs, full cross-browser matrix on main**: Full cross-browser (Chromium + Firefox + WebKit) triples CI time. Use Chromium for per-PR feedback; run full matrix nightly or before releases.
- **Use network interception for deterministic API responses**: Mocking API responses in browser tests isolates frontend testing from backend state. Test loading, empty, error, and success states deterministically.
- **Install Playwright browsers in CI setup**: `npx playwright install --with-deps` must run before tests. Cache browser binaries to avoid re-downloading on every run.
- **Capture traces only on failure**: Playwright trace viewer captures all network requests, console output, and screenshots. Enable trace capture on failure to debug without reproducing locally.

# Architecture Guidelines

- **Pest Playwright vs Dusk**: New projects = Pest Playwright. Existing Dusk projects = migrate gradually or stay with Dusk. Playwright is ~2x faster, more reliable (auto-waiting), and cross-browser.
- **Single-browser CI vs matrix**: Run Chromium on every PR. Full cross-browser matrix nightly or pre-release. Saves CI minutes while maintaining coverage.
- **Network interception vs backend fakes**: Use network interception for frontend-isolated tests. Use Laravel fakes for full-stack tests.
- **Screenshot assertion vs visual regression service**: `assertScreenshot()` is basic. For production visual regression, use dedicated services (Chromatic, Percy).

# Performance Considerations

- Playwright test execution: 200-500ms per test (vs 500-1500ms for Dusk). Auto-waiting reduces wasted time.
- Browser startup: 1-3 seconds per test suite. Reuse browser across tests (new context, not new browser).
- Cross-browser execution: Firefox is ~same speed as Chromium. WebKit is ~10-20% slower.
- Video recording: Adds 30-50% to test time. Enable only on failure.
- CI resource usage: Playwright requires more memory than Dusk (~300MB per browser instance).

# Security Considerations

- Playwright browsers can access any URL. Ensure test data doesn't contain sensitive information.
- Network interception mocks should not accidentally expose real API configurations or secrets in test code.
- Screenshots and video recordings captured on failure may contain test data. Set appropriate retention policies for CI artifacts.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not using auto-waiting (overriding with manual waits) | Dusk habit of explicit waiting | Manual waits negate Playwright's reliability advantage | Let Playwright handle waiting. Only use explicit waits for edge cases |
| Running full cross-browser suite on every PR | Maximum confidence | CI takes 3x longer; feedback loop slows | Chromium on PRs; full matrix on main branch or nightly |
| Forgetting to install Playwright browsers | Only installing pest-playwright npm package | Tests fail with "browser not found" error | Run `npx playwright install` in CI setup step |
| Overusing network interception | Mocking all API calls for "reliable" tests | Tests pass but application doesn't work with real API | Use interception for specific edge cases; test real API for happy path |
| Not caching Playwright browsers in CI | Default CI downloads browsers every run | 2+ minutes added to every CI run | Cache `~/.cache/ms-playwright` with Playwright version key |

# Anti-Patterns

- **Dusk patterns in Pest Playwright tests**: Using `waitFor()` on every interaction when Playwright auto-waits by default.
- **Full cross-browser on every commit**: Running Chromium, Firefox, and WebKit for every push. Instead, use Chromium for rapid feedback, full matrix less frequently.
- **Mocking all external APIs**: Using network interception for every API call. Instead, use it for specific edge cases and test real integration paths separately.
- **Screenshot tests without baseline review**: Using `assertScreenshot()` but auto-accepting new baselines in CI without review.

# Examples

```php
use function Pest\Playwright\playwright;

uses(Browser::class);

it('can login across browsers', function () {
    browser()->visit('/login')
        ->fill('[name="email"]', 'user@example.com')
        ->fill('[name="password"]', 'password')
        ->click('button[type="submit"]')
        ->waitForURL('/dashboard')
        ->assertSee('Welcome');
});

it('can mock API responses', function () {
    browser()->intercept()
        ->mock('/api/user', ['name' => 'Test User']);

    browser()->visit('/profile')
        ->assertSee('Test User');
});

it('supports mobile viewport', function () {
    browser()->viewport(375, 812)
        ->visit('/')
        ->assertSee('Mobile Menu');
});
```

# Related Topics

- **Prerequisites**: Pest fundamentals, Browser testing concepts, Playwright basics
- **Related**: Dusk fundamentals, Visual regression testing, Accessibility testing with Playwright
- **Advanced**: Playwright trace viewer, Custom Playwright fixtures, CI multi-browser matrix

# AI Agent Notes

- When choosing between Dusk and Pest Playwright for a new project, always recommend Pest Playwright. It's faster, more reliable (auto-waiting), cross-browser, and officially recommended by Laravel docs for new projects (2026+).
- For existing Dusk projects, assess migration cost: check the number of Dusk tests and whether they use page objects. Page objects make migration easier via `pest:dusk-migrate`.
- Pest Playwright requires Node.js and Playwright browsers to be installed. Ensure the CI environment has these configured.
- The `pest:dusk-migrate` command can convert Dusk tests to Pest Playwright, but manual review is needed for complex Dusk-specific patterns.

# Verification

- [ ] Playwright browsers are installed (`npx playwright install --with-deps`)
- [ ] Auto-waiting is leveraged without unnecessary explicit waits
- [ ] Cross-browser matrix runs Chromium on PRs, full matrix on main
- [ ] Playwright browser cache is configured in CI
- [ ] Network interception tests match real API contract (periodic contract tests)
- [ ] Trace/video capture is enabled only on failure
- [ ] CI environment has Node.js installed for Playwright
