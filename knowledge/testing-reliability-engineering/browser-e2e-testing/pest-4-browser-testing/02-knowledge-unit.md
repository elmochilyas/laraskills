# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Browser & E2E Testing
Knowledge Unit: Pest 4 Browser Testing
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Pest 4 introduced native browser testing as a built-in feature (not an additional package), using Playwright under the hood. This replaces Laravel Dusk as the recommended E2E testing approach for new Laravel projects. Pest 4 browser testing offers auto-waiting, cross-browser execution, network interception, visual comparison, and mobile emulation—all integrated into the Pest CLI without additional setup. The shift represents Laravel's official endorsement of Playwright over Selenium/ChromeDriver.

# Core Concepts
- **Built-in, no extra package**: `pest --browser` or `pest --browser=firefox` runs browser tests. Playwright is bundled.
- **`use Browser(...)` trait**: Registers a test file as a browser test. Provides all Playwright capabilities through Pest's DSL.
- **`browser()` function**: Creates a browser session. Methods chain fluently: `browser()->visit('/')->assertSee('Hello')`.
- **Cross-browser via CLI**: `pest --browser=chromium` (default), `--browser=firefox`, `--browser=webkit`.
- **Viewport presets**: Built-in presets: `desktop`, `tablet`, `mobile`, `mobile-small`.
- **API mocking**: `$browser->fake('/api/*')` for API response mocking.
- **Covers `php artisan dusk:*` commands**: Pest 4 provides equivalent commands for browser management.
- **Dusk migration tool**: `pest:dusk-migrate` Artisan command to convert Dusk tests to Pest Playwright.

# Mental Models
- **Pest 4 browser = Playwright + Pest DSL**: All Playwright power accessible through Pest's higher-order syntax.
- **No Dusk dependency**: Browser testing is part of Pest, not a Laravel package. Upgrade Pest, get browser testing.
- **CLI-native browser selection**: Change browser per run without code changes. Useful for smoke testing different browsers locally.
- **Viewport as environment dimension**: Test desktop, tablet, and mobile in the same file using viewport presets.

# Internal Mechanics
- **Playwright process management**: Pest starts a Playwright server process. The server manages browser instances. Pest communicates via WebSocket.
- **Browser reuse**: Across tests within a file, the same browser process is reused (new context per test). Across files, browser may restart.
- **Context isolation**: Each test gets a clean browser context (clear cookies, localStorage, session). Contexts are lightweight.
- **Auto-waiting**: Playwright's actionability checks run implicitly: visible, enabled, stable, not animating. Configurable via `$browser->setDefaultTimeout()`.
- **Network mocking**: Uses Playwright's `page.route()` with pattern matching. Fakes are reset per test.
- **Screenshot comparison**: `assertScreenshot('name')` captures and compares against baseline stored in `tests/Browser/screenshots/baseline/`.

# Patterns
- **Pattern: Multi-viewport test**
  - Purpose: Verify responsive design across device sizes
  - Benefits: Single test covers all viewports
  - Tradeoffs: 3x execution for 3 viewports
  - Implementation: Use `$browser->viewport(...)->visit('/')->assertSee(...)` for each viewport

- **Pattern: Browser-specific test**
  - Purpose: Run a test only on a specific browser
  - Benefits: Test browser-specific features without cross-browser false positives
  - Tradeoffs: Reduces cross-browser coverage
  - Implementation: Use `pest --browser=webkit` with `skip` condition for other browsers

- **Pattern: API-mocked E2E test**
  - Purpose: Test frontend behavior with controlled API responses
  - Benefits: Deterministic; test loading, empty, error states
  - Tradeoffs: Mock must match real API contract
  - Implementation: `$browser->fake('/api/users', [$userData])->visit('/users')->assertSee('John')`

- **Pattern: Visual regression gate**
  - Purpose: Block PRs with visual changes
  - Benefits: Catches unintended CSS/layout changes
  - Tradeoffs: Baseline image maintenance; pixel differences from non-deterministic rendering
  - Implementation: `$browser->assertScreenshot('homepage')` with baseline commit workflow

# Architectural Decisions
- **Viewport granularity**: Test all viewports on critical pages (checkout, login). Test desktop-only on admin pages.
- **Browser matrix strategy**: Chromium on every PR. Full matrix (Chromium + Firefox + WebKit) on main branch or nightly.
- **Screenshot baseline management**: Store baselines in version control. Update deliberately via `pest --update-screenshots`.
- **Fake vs network mock**: Use `$browser->fake()` for API mocking. Use `Http::fake()` for Laravel-side mocking in full-stack tests.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Built-in browser testing, no extra package | Requires Playwright Node dependency | Manage Node version alongside PHP |
| Auto-waiting eliminates flaky element errors | Less explicit control over wait lifecycle | Acceptable tradeoff for reliability |
| Cross-browser via CLI flag | Full matrix is 3x CI time | Chromium on PRs; full matrix nightly |
| Visual regression is built-in | Baseline image maintenance overhead | Worth it for UI-critical applications |

# Performance Considerations
- Pest 4 browser tests are ~2x faster than equivalent Dusk tests (Playwright's optimization vs ChromeDriver).
- Browser memory: ~300MB per concurrent browser instance. Parallel tests multiply memory.
- Screenshot comparison: <100ms per comparison.
- Viewport switching: Negligible. Playwright changes viewport without browser restart.
- CI cold start: First test installs Playwright browsers (~1-2 minutes). Cache the Playwright browser binaries.

# Production Considerations
- **CI configuration**: GitHub Actions step: `npx playwright install --with-deps`. Cache `~/.cache/ms-playwright`.
- **Screenshot baseline workflow**: PRs that change UI should include new baselines. Auto-fail if baseline doesn't exist.
- **Browser deprecation**: Playwright updates may drop old browser versions. Pin `@playwright/test` version.
- **Test time budget**: Budget E2E tests for <20% of total CI time. If E2E dominates, reduce coverage or increase CI runners.

# Common Mistakes
- **Mistake: Using Dusk patterns in Pest 4 browser tests**
  - Why: Familiarity with Dusk API
  - Why harmful: Pest 4 browser API is different; Dusk patterns may not work or may be suboptimal
  - Better: Follow Pest 4 browser documentation. Use `dusk:migrate` for automatic conversion.

- **Mistake: Running E2E tests without viewport configuration**
  - Why: Using desktop viewport for all tests
  - Why harmful: Mobile users get untested behavior
  - Better: Test at least one mobile viewport for customer-facing pages

- **Mistake: Not caching Playwright browsers in CI**
  - Why: Default CI setup downloads browsers every run
  - Why harmful: 2+ minutes added to every CI run
  - Better: Cache `~/.cache/ms-playwright` with Playwright version key

- **Mistake: Visual regression without baseline review**
  - Why: Auto-updating baselines in CI
  - Why harmful: Visual regressions are silently "approved"
  - Better: Require manual baseline update PRs with visual diff review

# Failure Modes
- **Playwright browser not found**: Missing browser installation. Run `npx playwright install`.
- **Screenshot baseline mismatch**: CI environment renders fonts differently than local. Use standardized CI image/Docker.
- **Cross-browser test failure in one browser**: Chromium passes, WebKit fails. Investigate CSS compatibility or WebKit-specific behavior.
- **Network mock not matching real API**: Mock returns 200 but real API returns 500. Test against real API periodically.
- **Parallel browser test interference**: Two tests using same browser context may share cookies. Use `beforeEach` to create fresh context.

# Ecosystem Usage
- **Pest 4**: Native browser testing is the marquee feature of Pest 4. Documentation covers the full API.
- **Laravel docs**: Laravel 13.x testing documentation recommends Pest 4 browser testing for new projects.
- **Playwright**: All Playwright documentation and tools (codegen, inspector, trace viewer) are applicable.
- **Laravel Jetstream**: Jetstream 4+ includes Pest 4 browser test scaffolding.

# Related Knowledge Units
- **Prerequisites**: Pest fundamentals, Playwright basics, Browser testing concepts
- **Related Topics**: Pest Playwright, Dusk fundamentals, Visual regression testing, Mobile testing
- **Advanced Follow-up**: Playwright advanced features (codegen, trace viewer), Custom browser fixtures, CI multi-browser strategy

# Research Notes
- Laravel Dusk remains the primary browser testing tool for Laravel as of 2026, with Pest's Playwright integration emerging as a modern alternative for teams already using Pest
- Browser testing best practices emphasize waiting strategies over fixed sleep() calls — Dusk's waitFor* methods and Playwright's auto-waiting reduce flakiness significantly
- CI/CD browser testing requires Chrome/Chromium installation; headless mode is the default in CI environments; GitHub Actions provides chromium via shivammathur/setup-php extension
- Page Object Model pattern reduces test maintenance by centralizing selector definitions and interaction methods; teams maintaining >20 browser tests should adopt this pattern
- Mobile viewport testing is increasingly important; responsive design regressions are a common source of undetected bugs in Laravel applications
