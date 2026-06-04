# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Browser & E2E Testing |
| Knowledge Unit | Pest 4 Browser Testing |
| Difficulty | Intermediate |
| Maturity | Emerging |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Pest fundamentals, Playwright basics, Browser testing concepts |
| Related KUs | Pest Playwright, Dusk fundamentals, Visual regression testing, Mobile testing |
| Source | domain-analysis.md K060 |

# Overview

Pest 4 introduced native browser testing as a built-in feature (not an additional package), using Playwright under the hood. This replaces Laravel Dusk as the recommended E2E testing approach for new Laravel projects. Pest 4 browser testing offers auto-waiting, cross-browser execution, network interception, visual comparison, and mobile emulation — all integrated into the Pest CLI without additional setup. The shift represents Laravel's official endorsement of Playwright over Selenium/ChromeDriver.

# Core Concepts

- **Built-in, no extra package**: `pest --browser` or `pest --browser=firefox` runs browser tests. Playwright is bundled.
- **`use Browser(...)` trait**: Registers a test file as a browser test. Provides all Playwright capabilities through Pest's DSL.
- **`browser()` function**: Creates a browser session. Methods chain fluently: `browser()->visit('/')->assertSee('Hello')`.
- **Cross-browser via CLI**: `pest --browser=chromium` (default), `--browser=firefox`, `--browser=webkit`.
- **Viewport presets**: Built-in presets: `desktop`, `tablet`, `mobile`, `mobile-small`.
- **API mocking**: `$browser->fake('/api/*')` for API response mocking.
- **Dusk migration tool**: `pest:dusk-migrate` Artisan command to convert Dusk tests to Pest Playwright.

# When To Use

- For new Laravel projects that need browser E2E testing (the 2026+ recommended approach)
- When you want built-in browser testing without managing Dusk + ChromeDriver separately
- When cross-browser support (Chromium, Firefox, WebKit) is a requirement
- When migrating existing Dusk tests to Pest 4's Playwright engine
- For visual regression testing via built-in screenshot comparison

# When NOT To Use

- For projects still on Pest 3 or PHPUnit (requires Pest 4+)
- When the project has a large, stable Dusk test suite and migration cost isn't justified
- When Node.js cannot be installed in the CI environment
- As a replacement for feature HTTP tests (browser testing should still be ~10% of the suite)

# Best Practices (WHY)

- **Use `browser()` over manual Playwright API calls**: Pest 4's `browser()` function provides a clean DSL that handles context management, cleanup, and error reporting. Direct Playwright API calls bypass these safeguards.
- **Test at least one mobile viewport for customer-facing pages**: Desktop-only testing misses mobile layout and interaction issues. Use `$browser->viewport(375, 812)` for mobile testing.
- **Cache Playwright browsers in CI**: `~/.cache/ms-playwright` contains browser binaries (~400MB). Caching saves 1-2 minutes per CI run. Key the cache to the Playwright version.
- **Use `pest:dusk-migrate` for Dusk migration**: The built-in migration tool handles syntax conversion. Manual review is still needed for Dusk-specific patterns (like `pause()` and custom macros).
- **Require manual baseline review for screenshot tests**: Auto-accepting screenshot baselines in CI silently approves visual regressions. Require PRs to explicitly update baselines.
- **Run full cross-browser matrix on main branch**: Chromium on PRs for speed; full matrix (Chromium + Firefox + WebKit) on main branch or nightly for comprehensive coverage.

# Architecture Guidelines

- **Viewport granularity**: Test all viewports on critical pages (checkout, login). Test desktop-only on admin pages.
- **Browser matrix strategy**: Chromium on every PR. Full matrix on main branch or nightly.
- **Screenshot baseline management**: Store baselines in version control. Update deliberately via `pest --update-screenshots`.
- **Fake vs network mock**: Use `$browser->fake()` for API mocking in browser tests. Use `Http::fake()` for Laravel-side mocking in full-stack tests.

# Performance Considerations

- Pest 4 browser tests are ~2x faster than equivalent Dusk tests (Playwright optimization vs ChromeDriver).
- Browser memory: ~300MB per concurrent browser instance. Parallel tests multiply memory.
- Screenshot comparison: <100ms per comparison.
- Viewport switching: Negligible. Playwright changes viewport without browser restart.
- CI cold start: First test installs Playwright browsers (~1-2 minutes). Cache the Playwright browser binaries.

# Security Considerations

- Playwright browsers execute in the same security context as the application. Ensure test environments (especially CI) don't have access to production credentials.
- Network mocking via `$browser->fake()` should not accidentally expose real API endpoints or secrets.
- Screenshot and video captures may contain sensitive test data. Set CI artifact retention policies.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using Dusk patterns in Pest 4 browser tests | Familiarity with Dusk API | Pest 4 browser API is different; Dusk patterns may not work | Follow Pest 4 browser documentation. Use dusk:migrate for automatic conversion |
| Running E2E tests without viewport configuration | Using desktop viewport for all tests | Mobile users get untested behavior | Test at least one mobile viewport for customer-facing pages |
| Not caching Playwright browsers in CI | Default CI setup downloads browsers every run | 2+ minutes added to every CI run | Cache `~/.cache/ms-playwright` with Playwright version key |
| Visual regression without baseline review | Auto-updating baselines in CI | Visual regressions are silently "approved" | Require manual baseline update PRs with visual diff review |
| Not using viewport presets | Configuring viewport dimensions manually | Inconsistent mobile testing across tests | Use built-in viewport presets (desktop, tablet, mobile, mobile-small) |

# Anti-Patterns

- **Full cross-browser on every commit**: Wastes CI minutes. Chromium on PRs, full matrix on main branch or nightly.
- **No mobile testing at all**: Desktop-only E2E testing misses major UX issues for mobile users.
- **Auto-accepting screenshot baselines**: Silently approves visual regressions. Require manual review.
- **Dusk-isms in Pest 4 code**: Using `waitFor('@element')` style from Dusk instead of trusting Playwright's auto-waiting.

# Examples

```php
use function Pest\Playwright\playwright;

uses(Browser::class);

it('loads the home page', function () {
    browser()->visit('/')
        ->assertSee('Welcome');
});

it('tests responsive design across viewports', function () {
    browser()->viewport('mobile')
        ->visit('/')
        ->assertSee('Mobile Menu');

    browser()->viewport('desktop')
        ->visit('/')
        ->assertSee('Full Navigation');
});

it('mocks API responses', function () {
    browser()->fake('/api/users', [
        ['name' => 'John Doe', 'email' => 'john@example.com'],
    ]);

    browser()->visit('/users')
        ->assertSee('John Doe');
});

it('detects visual regressions', function () {
    browser()->visit('/')
        ->assertScreenshot('homepage');
});
```

# Related Topics

- **Prerequisites**: Pest fundamentals, Playwright basics, Browser testing concepts
- **Related**: Pest Playwright, Dusk fundamentals, Visual regression testing, Mobile testing
- **Advanced**: Playwright advanced features (codegen, trace viewer), Custom browser fixtures, CI multi-browser strategy

# AI Agent Notes

- Pest 4 browser testing is the recommended approach for new Laravel projects (2026+). When starting a new project, use `uses(Browser::class)` and `browser()` instead of Dusk.
- The `pest:dusk-migrate` command can convert Dusk tests, but check for Dusk-specific patterns (`pause()`, Dusk macros, Dusk-specific assertions) that need manual conversion.
- Remember that Playwright Node dependency must be installed. Add `npx playwright install --with-deps` to CI setup.
- For visual regression, use `assertScreenshot()` but establish a workflow for reviewing and updating baselines. Don't auto-accept.

# Verification

- [ ] Pest 4+ is installed with Playwright support
- [ ] `pest --browser` runs browser tests successfully
- [ ] Cross-browser testing works (Chromium, Firefox, WebKit)
- [ ] Viewport presets are configured for mobile testing
- [ ] Playwright browsers are cached in CI
- [ ] Screenshot baselines are stored in version control
- [ ] `pest:dusk-migrate` works for existing Dusk tests (if migrating)
- [ ] Network mocking tests validate against real API contract periodically
