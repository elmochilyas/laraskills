# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Browser & E2E Testing
Knowledge Unit: Pest Playwright Browser Testing
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Pest Playwright (Pest 4 browser testing) brings Playwright-powered browser testing to the Laravel ecosystem, replacing Dusk as the recommended approach for new projects (2026+). Playwright provides cross-browser support (Chromium, Firefox, WebKit), faster execution, auto-waiting, network interception, and modern debugging tools. Pest Playwright integrates Playwright's capabilities into Pest's expressive DSL, enabling E2E tests that are faster, more reliable, and more feature-rich than Dusk.

# Core Concepts
- **`use Browser(...)`**: Pest Playwright bootstrap. Registers browser context for the test.
- **`browser()` function**: Entry point for browser interactions. Returns a Playwright Browser instance.
- **Cross-browser support**: Same test runs on Chromium, Firefox, WebKit. Configured via `PEST_BROWSER` environment variable.
- **Auto-waiting**: Playwright automatically waits for elements to be actionable before interacting. No explicit `waitFor()` needed in most cases.
- **`visit()`, `click()`, `fill()`, `check()`**: Browser interaction methods. Similar to Dusk but with Playwright's engine.
- **Network interception**: `$browser->intercept()->mock('/api/*', $response)` for API mocking in browser tests.
- **Screenshot and video capture**: Built-in screenshot and video recording on failure. More sophisticated than Dusk.
- **Mobile viewport testing**: `$browser->viewport(375, 812)` for mobile-specific testing.

# Mental Models
- **Playwright as engine, Pest as DSL**: Pest Playwright wraps Playwright's API. All Playwright features are accessible; Pest provides the test framework.
- **Auto-waiting as reliability multiplier**: Playwright's auto-wait eliminates most flaky-element issues. Tests wait for actionability (visible, enabled, stable) by default.
- **Cross-browser as confidence**: Running the same test on Chromium + Firefox + WebKit catches browser-specific rendering or API differences.
- **Network interception as test isolation**: Mock API responses in browser tests to isolate frontend testing from backend state.

# Internal Mechanics
- **Playwright installation**: `playwright` Node package must be installed (`npx playwright install`). Pest Playwright communicates via Playwright's WebSocket protocol.
- **`use Browser(...)`**: Configures the browser test case. Sets up browser context, viewport, and environment.
- **Auto-waiting mechanism**: Playwright's `actionability checks`: element visible, enabled, not animating, stable position, receives events. Polls until conditions met, then performs action.
- **Network interception**: Playwright's `page.route()` API. Pest Playwright wraps this with `intercept()`.
- **Test isolation**: Each test gets a fresh browser context (cookies, localStorage, session). Contexts are cheap (~10ms to create).
- **Trace viewer**: Playwright captures test traces (screenshots, network logs, console output) for debugging.

# Patterns
- **Pattern: Cross-browser smoke test**
  - Purpose: Verify critical flow works in all supported browsers
  - Benefits: Catches browser-specific rendering/API issues
  - Tradeoffs: 3x CI execution time for 3 browsers
  - Implementation: Run test suite with `PEST_BROWSER=chromium`, `PEST_BROWSER=firefox`, `PEST_BROWSER=webkit` in CI matrix

- **Pattern: API mocking in browser tests**
  - Purpose: Isolate frontend behavior from backend state
  - Benefits: Deterministic API responses; test edge cases easily
  - Tradeoffs: Mocks may diverge from real API behavior
  - Implementation: `$browser->intercept()->mock('/api/user', ['name' => 'Test'])`

- **Pattern: Mobile viewport testing**
  - Purpose: Verify responsive design behavior
  - Benefits: Catches mobile layout and interaction issues
  - Tradeoffs: Touch events may differ from desktop clicks
  - Implementation: `$browser->viewport(375, 812)->visit('/')->assertSee('Mobile Menu')`

- **Pattern: Visual snapshot comparison**
  - Purpose: Detect visual regressions via screenshot comparison
  - Benefits: Catches CSS/layout changes that functional tests miss
  - Tradeoffs: Snapshot baseline maintenance; pixel differences may be false positives
  - Implementation: `$browser->visit('/')->assertScreenshot('homepage')`

# Architectural Decisions
- **Pest Playwright vs Dusk**: New projects ? Pest Playwright. Existing Dusk projects ? migrate gradually or stay with Dusk. Playwright is faster (~2x), more reliable (auto-waiting), and cross-browser.
- **Single-browser CI vs matrix**: Run Chromium on every PR. Full cross-browser matrix nightly or pre-release. Saves CI minutes while maintaining coverage.
- **Network interception vs backend fakes**: Use network interception for frontend-isolated tests. Use Laravel fakes for full-stack tests.
- **Screenshot assertion vs visual regression service**: `assertScreenshot()` is basic. For production visual regression, use dedicated services (Chromatic, Percy).

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Auto-waiting eliminates most flaky tests | Less control over wait timing | Acceptable; reliability > micro-optimization |
| Cross-browser support catches real issues | 3x CI execution time | Run matrix nightly, not on every PR |
| Network interception enables isolated frontend tests | Mock/real API divergence risk | Layer contract tests to verify mock accuracy |
| Trace viewer simplifies debugging | Trace storage can be large | Capture only on failure; configure retention |

# Performance Considerations
- Playwright test execution: 200-500ms per test (vs 500-1500ms for Dusk). Auto-waiting reduces wasted time.
- Browser startup: 1-3 seconds per test suite. Reuse browser across tests (new context, not new browser).
- Cross-browser execution: Firefox is ~same speed as Chromium. WebKit is ~10-20% slower.
- Video recording: Adds 30-50% to test time. Enable only on failure.
- CI resource usage: Playwright requires more memory than Dusk (~300MB per browser instance).

# Production Considerations
- **CI setup**: Install Playwright browsers via `npx playwright install --with-deps`. GitHub Actions provides `playwright` tool.
- **Browser version management**: Pin Playwright version in `package.json`. Browser versions are bundled with Playwright.
- **Test recording retention**: Set retention policy for screenshots/videos. 7 days is typical for CI.
- **Mobile device emulation**: Playwright supports device emulation (iPhone, Pixel). Define device presets for consistent mobile testing.

# Common Mistakes
- **Mistake: Not using auto-waiting (overriding with manual waits)**
  - Why: Dusk habit of explicit waiting
  - Why harmful: Manual waits negate Playwright's reliability advantage
  - Better: Let Playwright handle waiting. Only use explicit waits for edge cases.

- **Mistake: Running full cross-browser suite on every PR**
  - Why: Maximum confidence
  - Why harmful: CI takes 3x longer; feedback loop slows
  - Better: Chromium on PRs; full matrix on main branch or nightly

- **Mistake: Forgetting to install Playwright browsers**
  - Why: Only installing `pest-playwright` npm package
  - Why harmful: Tests fail with "browser not found" error
  - Better: Run `npx playwright install` in CI setup step

- **Mistake: Overusing network interception**
  - Why: Mocking all API calls for "reliable" tests
  - Why harmful: Tests pass but application doesn't work with real API
  - Better: Use interception for specific edge cases; test real API for happy path

# Failure Modes
- **Browser version mismatch**: Playwright version vs installed browser version. Run `npx playwright install` after upgrade.
- **Auto-wait timeout**: Element not becoming actionable within 30s default. Check for JavaScript errors, slow API, or conditional rendering.
- **Cross-browser CSS differences**: Test passes on Chromium, fails on Firefox. Investigate CSS compatibility.
- **Network interception race**: API response arrives before interception is set up. Register interception before navigation.
- **Mobile emulation limitations**: Touch events differ from click events. Test on real mobile devices for critical flows.

# Ecosystem Usage
- **Pest 4 core**: Pest browser testing is a first-class feature of Pest 4+ (2025). Documentation covers installation, configuration, and examples.
- **Laravel docs**: Laravel 13.x docs recommend Pest Playwright over Dusk for new projects.
- **Playwright ecosystem**: All Playwright features (codegen, trace viewer, inspector) work with Pest Playwright.
- **Laravel Jetstream**: Jetstream plans to offer Pest Playwright tests alongside Dusk tests.

# Related Knowledge Units
- **Prerequisites**: Pest fundamentals, Browser testing concepts, Playwright basics
- **Related Topics**: Dusk fundamentals, Visual regression testing, Accessibility testing with Playwright
- **Advanced Follow-up**: Playwright trace viewer, Custom Playwright fixtures, CI multi-browser matrix

# Research Notes
- Laravel Dusk remains the primary browser testing tool for Laravel as of 2026, with Pest's Playwright integration emerging as a modern alternative for teams already using Pest
- Browser testing best practices emphasize waiting strategies over fixed sleep() calls — Dusk's waitFor* methods and Playwright's auto-waiting reduce flakiness significantly
- CI/CD browser testing requires Chrome/Chromium installation; headless mode is the default in CI environments; GitHub Actions provides chromium via shivammathur/setup-php extension
- Page Object Model pattern reduces test maintenance by centralizing selector definitions and interaction methods; teams maintaining >20 browser tests should adopt this pattern
- Mobile viewport testing is increasingly important; responsive design regressions are a common source of undetected bugs in Laravel applications
