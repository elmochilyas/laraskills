# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Browser & E2E Testing
Knowledge Unit: Laravel Dusk Fundamentals
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Laravel Dusk provides browser-based E2E testing using ChromeDriver (or Selenium-compatible drivers) to automate real browser interactions. While Pest Playwright is recommended for new projects (2026+), Dusk remains widely deployed in existing projects and is fully supported. Dusk tests catch JavaScript rendering, DOM interaction, and cross-page flow regressions that HTTP tests cannot. They are the slowest test type (~1-5 seconds per test) and constitute ~10% of a balanced test suite.

# Core Concepts
- **ChromeDriver**: Dusk uses ChromeDriver (part of the Chrome/Chromium browser) to automate browser actions. Requires Chrome/Chromium installed.
- **Headless mode**: Browser runs without visible UI. Configured via `DuskTestCase::driver()`. Essential for CI environments.
- **`$browser->visit('/login')`**: Navigates the browser to a URL. All assertions follow a visit or interaction.
- **Element interaction**: `type()`, `click()`, `select()`, `check()`, `radio()`, `attach()` for form interactions.
- **Assertions**: `assertSee()`, `assertSeeIn()`, `assertTitle()`, `assertPathIs()`, `assertUrlIs()`, `assertPresent()`, `assertMissing()`.
- **Page objects**: `$browser->on(new LoginPage)` encapsulates page-specific selectors and methods.
- **Environment isolation**: Dusk uses its own environment file (`.env.dusk.local`) to prevent browser tests from affecting other configurations.
- **Screenshots**: Dusk captures screenshots on test failure by default. Configurable directory.

# Mental Models
- **Dusk as real user simulation**: Dusk drives a real browser. JavaScript executes, DOM renders, CSS applies. Tests verify what a real user sees and interacts with.
- **Slow but thorough**: Each test takes seconds. Parallel execution is essential. Tests should cover critical user flows only.
- **Page objects as API abstraction**: Page objects hide CSS selectors and interaction details. Test logic reads as business operations, not DOM manipulation.
- **Waiting as assertion strategy**: Dusk interactions need explicit waiting. `waitFor()` replaces `sleep()` with element-specific waiting.

# Internal Mechanics
- **`DuskTestCase::driver()`**: Configures ChromeDriver options. Default: `--disable-gpu --headless --window-size=1920,1080`. Customizable per-environment.
- **ChromeDriver process**: Dusk starts a ChromeDriver process automatically (`php artisan dusk:chrome-driver`). Listens on port 9515.
- **Request lifecycle**: `$browser->visit('/page')` sends HTTP request through Laravel (same as feature tests) but then renders the HTML, executes JavaScript, and waits for page load.
- **Cookies and session**: Dusk uses the same session/cookie mechanism as feature tests. `$browser->loginAs($user)` authenticates via session cookies.
- **Screenshot capture**: On assertion failure, Dusk captures `screenshot.png` (with timestamp). Screenshots stored in `tests/Browser/screenshots/`.
- **Console log capture**: Dusk captures browser console logs on failure, aiding JavaScript error debugging.

# Patterns
- **Pattern: Critical user flow E2E**
  - Purpose: Test complete user journeys (register ? create resource ? logout ? login ? verify)
  - Benefits: Catches integration issues across multiple pages and states
  - Tradeoffs: Slow (3-10 seconds per flow); break easily on UI changes
  - Implementation: `$browser->visit('/register')->type(...)->press('Register')->assertPathIs('/dashboard')->assertSee('Welcome')`

- **Pattern: Page object encapsulation**
  - Purpose: Hide selectors and interaction details
  - Benefits: UI changes only affect page objects, not tests
  - Tradeoffs: More classes to maintain
  - Implementation: Create `Pages/LoginPage.php` with `url()`, `elements()`, and interaction methods

- **Pattern: Screenshot-on-failure debugging**
  - Purpose: Capture visual state when test fails
  - Benefits: Instant visual debugging; no need to reproduce locally
  - Tradeoffs: Screenshots consume CI artifact storage
  - Implementation: Dusk captures automatically. Configure `screenshots` directory. Review in CI artifacts.

- **Pattern: CI headless configuration**
  - Purpose: Ensure Dusk runs in CI environment
  - Benefits: Reproducible CI runs without display server dependency
  - Tradeoffs: Headless may not catch all rendering issues (font rendering, GPU-accelerated features)
  - Implementation: `DuskTestCase::driver()` returns headless Chrome config

# Architectural Decisions
- **Dusk vs Pest Playwright**: Use Dusk for existing Dusk test suites. Use Pest Playwright for new projects (Pest 4+ recommended). Playwright is faster, cross-browser, and more modern.
- **Page objects vs direct selectors**: Use page objects for pages with multiple interactions. Use direct selectors for simple single-interaction tests.
- **Custom `@dusk` selectors**: Add `@dusk="element-name"` attributes to Blade templates for stable, CSS-independent selectors.
- **Browser environment file**: `.env.dusk.local` overrides `.env` settings. Use to set `APP_URL`, `DB_CONNECTION`, and other Dusk-specific configuration.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Real browser testing catches JS/DOM issues | Slow (1-5s per test) | Parallel execution; limit E2E to critical paths |
| Page objects clean up test code | More classes to maintain | Good investment for stable UI |
| Screenshot debugging is invaluable | Storage space for CI artifacts | Configure retention policy |
| Headless mode works in all CI | May miss GPU/font-specific rendering | Supplement with visual regression for critical UI |

# Performance Considerations
- Dusk test time: 1-5 seconds per test (browser launch + page loads + interactions).
- ChromeDriver startup: 2-5 seconds per test suite. Dusk can reuse a single browser instance across tests.
- Parallel Dusk execution: Each parallel worker needs its own ChromeDriver process. Memory consumption: ~200MB per worker.
- Screenshot capture: <100ms per screenshot. Minor overhead.
- Database operations: Dusk tests use `RefreshDatabase` with transaction rollback, same as feature tests.

# Production Considerations
- **CI Chrome installation**: GitHub Actions provides `chrome` tool. For self-hosted runners, ensure Chrome/Chromium is installed and updated.
- **`.env.dusk.local`**: Never commit real secrets. Use CI-injected environment variables for Dusk configuration.
- **Flaky test management**: Dusk tests are the most flaky test type. Use `waitFor()` over `pause()`, stable selectors (`@dusk` attributes), and retry strategies.
- **Browser version compatibility**: ChromeDriver version must match Chrome version. Dusk's `chrome-driver` command manages this. Run before CI test suite.

# Common Mistakes
- **Mistake: Using `pause()` for waiting**
  - Why: `$browser->pause(1000)` waits a fixed time
  - Why harmful: Too short = flaky; too long = slow tests
  - Better: Use `waitFor()` or `waitForText()` that wait for specific elements

- **Mistake: Not using `@dusk` selectors**
  - Why: Using CSS classes or IDs for element selection
  - Why harmful: CSS changes break tests; complex selectors are brittle
  - Better: Add `@dusk="element-name"` to Blade templates; use `$browser->element('@element-name')`

- **Mistake: Running Dusk tests without headless mode in CI**
  - Why: Default configuration expects display server
  - Why harmful: Tests fail with "cannot open display" error
  - Better: Always configure headless mode in CI environment

- **Mistake: Testing everything with Dusk**
  - Why: Confidence from full browser testing
  - Why harmful: Test suite takes hours; flaky tests erode trust
  - Better: Feature tests for logic; Dusk for critical user flows only

# Failure Modes
- **ChromeDriver version mismatch**: Chrome update breaks ChromeDriver. Run `php artisan dusk:chrome-driver --detect` to manage versions.
- **Timeout on slow pages**: Pages with heavy JavaScript or slow API calls may not load within default timeout. Use `waitFor()` with explicit timeout.
- **Element not found**: Element doesn't exist or is dynamically rendered. Use `waitFor()` before interaction.
- **Stale element reference**: Page re-renders after interaction; element reference becomes stale. Re-query the element after page updates.
- **Database state leakage**: `RefreshDatabase` rollback may not fully clean up data used by Dusk tests. Ensure clean state per test.

# Ecosystem Usage
- **Laravel core**: Dusk is developed and maintained by the Laravel core team. Included as optional dependency (`laravel/dusk`).
- **Laravel Nova**: Nova uses Dusk for its browser-based test suite. Demonstrates complex modal, dropdown, and form interaction testing.
- **Laravel Spark**: Spark's subscription and team management flows are tested with Dusk for multi-step interactions.
- **Laravel Jetstream**: Jetstream provides Dusk tests with its scaffolding, demonstrating team invitation and API token management flows.

# Related Knowledge Units
- **Prerequisites**: HTTP test helpers, JavaScript/DOM basics, CSS selectors
- **Related Topics**: Dusk page objects, Dusk waiting strategies, Pest Playwright, Accessibility testing
- **Advanced Follow-up**: Dusk CI integration, Multi-browser Dusk testing, Visual regression with Dusk

# Research Notes
- Laravel Dusk remains the primary browser testing tool for Laravel as of 2026, with Pest's Playwright integration emerging as a modern alternative for teams already using Pest
- Browser testing best practices emphasize waiting strategies over fixed sleep() calls — Dusk's waitFor* methods and Playwright's auto-waiting reduce flakiness significantly
- CI/CD browser testing requires Chrome/Chromium installation; headless mode is the default in CI environments; GitHub Actions provides chromium via shivammathur/setup-php extension
- Page Object Model pattern reduces test maintenance by centralizing selector definitions and interaction methods; teams maintaining >20 browser tests should adopt this pattern
- Mobile viewport testing is increasingly important; responsive design regressions are a common source of undetected bugs in Laravel applications
