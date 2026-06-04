# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Browser & E2E Testing |
| Knowledge Unit | Laravel Dusk Fundamentals |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | HTTP test helpers, JavaScript/DOM basics, CSS selectors |
| Related KUs | Dusk page objects, Dusk waiting strategies, Pest Playwright, Accessibility testing |
| Source | domain-analysis.md K012 |

# Overview

Laravel Dusk provides browser-based E2E testing using ChromeDriver (or Selenium-compatible drivers) to automate real browser interactions. While Pest Playwright is recommended for new projects (2026+), Dusk remains widely deployed in existing projects and is fully supported. Dusk tests catch JavaScript rendering, DOM interaction, and cross-page flow regressions that HTTP tests cannot. They are the slowest test type (~1-5 seconds per test) and constitute ~10% of a balanced test suite.

# Core Concepts

- **ChromeDriver**: Dusk uses ChromeDriver (part of Chrome/Chromium) to automate browser actions. Requires Chrome/Chromium installed.
- **Headless mode**: Browser runs without visible UI. Configured via `DuskTestCase::driver()`. Essential for CI environments.
- **`$browser->visit('/login')`**: Navigates the browser to a URL. All assertions follow a visit or interaction.
- **Element interaction**: `type()`, `click()`, `select()`, `check()`, `radio()`, `attach()` for form interactions.
- **Assertions**: `assertSee()`, `assertSeeIn()`, `assertTitle()`, `assertPathIs()`, `assertUrlIs()`, `assertPresent()`, `assertMissing()`.
- **Page objects**: `$browser->on(new LoginPage)` encapsulates page-specific selectors and methods.
- **Environment isolation**: Dusk uses its own environment file (`.env.dusk.local`) to prevent browser tests from affecting other configurations.
- **Screenshots**: Dusk captures screenshots on test failure by default. Configurable directory.

# When To Use

- For critical user flows that involve JavaScript rendering, DOM interaction, or cross-page navigation
- When testing features that require real browser behavior (JavaScript, cookies, localStorage)
- For visual verification of UI components (modals, dropdowns, dynamic forms)
- As the top ~10% of the test pyramid covering full end-to-end user journeys
- When maintaining an existing Dusk test suite (migration to Playwright is not urgent)

# When NOT To Use

- For logic testing that HTTP tests can cover (~90% of your test suite should be feature/unit tests)
- As the primary testing strategy (Dusk is the slowest and most flaky test type)
- When the feature can be adequately tested with HTTP test helpers (GET, POST, database assertions)
- In CI without headless mode configured
- Without proper waiting strategies (use `waitFor()` not `pause()`)

# Best Practices (WHY)

- **Use `@dusk` attribute selectors**: Add `@dusk="element-name"` to Blade templates. CSS class changes won't break tests. This is the single most impactful reliability improvement for Dusk tests.
- **Use `waitFor()` instead of `pause()`**: Fixed delays are either too short (flaky) or too long (slow). `waitFor()` waits for a specific condition and returns immediately when met.
- **Limit to critical user flows**: Dusk tests are slow. Reserve them for the most important user journeys (registration, login, checkout, core workflow). Everything else should be feature tests.
- **Run Dusk tests in parallel**: Use `php artisan dusk --parallel` to distribute tests across multiple ChromeDriver processes. Each parallel worker needs its own database and ChromeDriver instance.
- **Capture screenshots on failure**: Dusk automatically captures screenshots on assertion failure. Review these in CI artifacts instead of reproducing failures locally.
- **Use `.env.dusk.local` for isolation**: Dusk-specific environment configuration prevents browser tests from affecting other test environments.

# Architecture Guidelines

- **Dusk vs Pest Playwright**: Use Dusk for existing test suites. Use Pest Playwright for new projects (Pest 4+ recommended). Playwright is faster, cross-browser, and more modern.
- **Page objects for complex pages**: For pages with multiple interactions, use page objects to encapsulate selectors and interaction methods.
- **Environment file**: `.env.dusk.local` overrides `.env` settings. Use to set `APP_URL`, `DB_CONNECTION`, and other Dusk-specific configuration.
- **CI integration**: Use `php artisan dusk --headless` or configure headless mode in `DuskTestCase::driver()`.

# Performance Considerations

- Dusk test time: 1-5 seconds per test (browser launch + page loads + interactions).
- ChromeDriver startup: 2-5 seconds per test suite. Dusk can reuse a single browser instance across tests.
- Parallel Dusk execution: Each parallel worker needs its own ChromeDriver process. Memory: ~200MB per worker.
- Screenshot capture: <100ms per screenshot. Minor overhead.
- Database operations: Dusk tests use `RefreshDatabase` with transaction rollback, same as feature tests.

# Security Considerations

- `.env.dusk.local`: Never commit real secrets. Use CI-injected environment variables for Dusk configuration.
- Dusk browsers can access any URL the application serves. Ensure test data doesn't contain sensitive information.
- Screenshots in CI artifacts may contain test data. Set artifact retention policies appropriately.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using `pause()` for waiting | Simple to implement | Too short = flaky; too long = slow tests | Use `waitFor()` or `waitForText()` for specific elements |
| Not using `@dusk` selectors | Using CSS classes or IDs for element selection | CSS changes break tests; complex selectors are brittle | Add `@dusk="element-name"` to Blade templates |
| Running Dusk without headless mode in CI | Default expects display server | Tests fail with "cannot open display" error | Always configure headless mode in CI environment |
| Testing everything with Dusk | False confidence from full browser testing | Test suite takes hours; flaky tests erode trust | Feature tests for logic; Dusk for critical user flows only |
| Not running Dusk in parallel | Sequential execution | CI takes much longer than necessary | Use `php artisan dusk --parallel` |

# Anti-Patterns

- **E2E-heavy test suite**: >10% E2E tests. Instead, follow the testing pyramid: ~70% feature, ~20% unit, ~10% E2E.
- **No page objects**: Writing selectors and interactions directly in test files. Instead, use page objects for any page with multiple interactions.
- **Skipping feature tests in favor of Dusk**: Testing backend logic through the browser instead of HTTP test helpers. Instead, use the fastest test type for each layer.
- **Shared browser state across tests**: Relying on cookies or session from a previous test. Instead, ensure each test starts with clean browser state.

# Examples

```php
<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class LoginTest extends DuskTestCase
{
    public function test_user_can_login()
    {
        $user = User::factory()->create([
            'email' => 'user@example.com',
            'password' => bcrypt('password'),
        ]);

        $this->browse(function (Browser $browser) use ($user) {
            $browser->visit('/login')
                ->type('email', $user->email)
                ->type('password', 'password')
                ->press('@login-button')
                ->waitForLocation('/dashboard')
                ->assertSee('Welcome')
                ->assertPathIs('/dashboard');
        });
    }
}
```

# Related Topics

- **Prerequisites**: HTTP test helpers, JavaScript/DOM basics, CSS selectors
- **Related**: Dusk page objects, Dusk waiting strategies, Pest Playwright, Accessibility testing
- **Advanced**: Dusk CI integration, Multi-browser Dusk testing, Visual regression with Dusk

# AI Agent Notes

- When working on a Laravel project that already has Dusk tests, check the `tests/Browser` directory structure. Look for page objects in `tests/Browser/Pages/` and components in `tests/Browser/Components/`.
- The most common Dusk flakiness source is timing. Always add `waitFor()` or `waitForText()` after navigation or async operations.
- For CI setup, check if ChromeDriver is installed. Use `php artisan dusk:chrome-driver --detect` to manage versions.
- If a Dusk test is flaky, first replace any `pause()` calls with `waitFor()` or `waitForText()`. This fixes ~80% of flaky Dusk tests.

# Verification

- [ ] Dusk tests run successfully in headless mode
- [ ] ChromeDriver version matches Chrome version
- [ ] `.env.dusk.local` is configured and not committed with secrets
- [ ] `@dusk` attribute selectors are used for element targeting
- [ ] `waitFor()`/`waitForText()` replace `pause()` calls
- [ ] Dusk tests are limited to critical user flows (<10% of test suite)
- [ ] Screenshots are captured on failure and accessible in CI artifacts
- [ ] Dusk runs in parallel in CI
