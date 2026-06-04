# Knowledge Unit: Dusk Browser Tests in CI

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/dusk-browser-tests-ci
- **Maturity:** Mature
- **Related Technologies:** Laravel Dusk, Selenium, ChromeDriver, GitHub Actions, Continuous Integration, Browser Testing

## Executive Summary

Dusk browser tests in CI refers to running Laravel Dusk's browser automation tests in a CI/CD pipeline. Dusk provides a fluent API for browser testing using ChromeDriver or Selenium, enabling teams to validate JavaScript-heavy interactions, form submissions, authentication flows, and single-page application behavior that PHPUnit/Pest feature tests cannot cover. Running Dusk in CI requires: a Chrome/Chromium browser binary, ChromeDriver (matching the browser version), a display server (Xvfb for headless rendering), and appropriate configuration to run in a headless mode. Dusk tests are slower than PHPUnit tests (2-10 seconds per test vs milliseconds) and require more CI resources, so they are typically run as a separate CI job after unit/feature tests pass. Best practices include: using Dusk's `headless()` mode, parallel test execution with browser sharing, environment-specific `.env.dusk.{environment}` files, and database isolation via migrations on each test run.

## Core Concepts

- **Laravel Dusk:** Laravel's official browser automation tool; provides an expressive API for clicking links, filling forms, asserting page content, and waiting for JavaScript execution
- **Headless Browser:** Running the browser without a visible UI; Dusk uses Chrome's headless mode by default in CI, controlled via `$browser->headless()` or the `--headless` flag
- **ChromeDriver:** A separate executable that controls the Chrome browser; version must match the installed Chrome/Chromium version; managed via Dusk's `php artisan dusk:chrome-driver` command
- **Xvfb (Virtual Framebuffer):** A display server that provides a virtual screen for browsers that require a display (even in headless mode, some CI runners lack the necessary GPU/display libraries)
- **.env.dusk.{environment}:** Environment files loaded specifically for Dusk tests (e.g., .env.dusk.local, .env.dusk.testing); allow configuring a separate mail driver (log), queue driver (sync), and filesystem disk (local) for browser tests

## Mental Models

- **Dusk as Robot User:** Dusk tests are robotic users that interact with the application exactly as a human would—clicking buttons, typing text, reading page content, waiting for animations—validating the full stack from database to rendered HTML
- **Dusk as UI Feature Tests:** While PHPUnit feature tests validate HTTP responses and database state, Dusk validates the rendered UI—what the user actually sees and interacts with, including JavaScript-rendered content
- **Dusk in CI as Separate Concern:** Dusk tests are the slowest and most resource-intensive tests; they run in a separate CI job after fast tests (unit, feature) pass, like a quality gate that only opens after the earlier gates are cleared

## Internal Mechanics

1. **Environment Setup:** CI runner installs Chrome/Chromium (via apt-get or Docker image), downloads matching ChromeDriver (via dusk:chrome-driver or manual), and optionally starts Xvfb for headless rendering
2. **Application Server:** Dusk starts an Artisan serve instance (php artisan serve) on a random port to serve the application; the browser connects to this local server
3. **Database Isolation:** Dusk uses RefreshDatabase or DatabaseMigrations trait to reset the database between tests; a separate `.env.dusk.testing` file configures the CI database connection
4. **Browser Initialization:** Each Dusk test creates a browser instance using `$this->browse(function ($browser) { ... })`; the browser opens Chrome in headless mode, resizing to a standard viewport (1920x1080)
5. **Test Execution:** The browser navigates to URLs, interacts with elements, waits for JavaScript execution (waitFor, waitForText, pause), and makes assertions about page state
6. **Artifact Capture:** On test failure, Dusk captures a screenshot and stores the browser console log in `storage/logs/dusk/`; these artifacts are uploaded as CI job artifacts for debugging
7. **Cleanup:** After all tests, Dusk stops the Artisan server and closes the browser; CI cleans up the container/runner

## Patterns

- **GitHub Actions Dusk Pattern:**
  ```yaml
  dusk:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ALLOW_EMPTY_PASSWORD: yes
          MYSQL_DATABASE: testing
        ports:
          - 3306:3306
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-php
        with:
          php-version: 8.3
          extensions: mbstring, pdo_mysql, bcmath
      - run: composer install --no-interaction --prefer-dist
      - run: cp .env.dusk.testing .env
      - run: php artisan key:generate
      - run: php artisan dusk:chrome-driver /usr/bin/chromium-browser
      - run: php artisan dusk --reporter=html
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: dusk-failures
          path: tests/Browser/screenshots/
  ```
- **Headless Configuration Pattern:**
  ```php
  // tests/DuskTestCase.php
  protected function driver()
  {
      $options = (new ChromeOptions())->addArguments([
          '--disable-gpu',
          '--headless=new',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--window-size=1920,1080',
      ]);
      return RemoteWebDriver::create(
          'http://localhost:9515',
          DesiredCapabilities::chrome()->setCapability(
              ChromeOptions::CAPABILITY, $options
          )
      );
  }
  ```
  Configures Chrome for headless CI execution with performance-optimized flags.
- **Sail Dusk in CI Pattern:**
  ```bash
  # CI script for Sail-based Dusk
  ./vendor/bin/sail up -d
  ./vendor/bin/sail artisan dusk
  ./vendor/bin/sail down
  ```
  Uses Sail's Docker environment to run Dusk; ensures the same PHP/Chrome versions as development.
- **Parallel Dusk Pattern (Experimental):**
  ```bash
  php artisan dusk --parallel --processes=4
  ```
  Runs Dusk tests in parallel (Laravel 10+) using multiple browser instances; requires careful database isolation and shared-nothing test design.
- **Dusk Test Structure Pattern:**
  ```php
  public function test_user_can_login()
  {
      $this->browse(function (Browser $browser) {
          $browser->visit('/login')
              ->type('email', 'user@example.com')
              ->type('password', 'password')
              ->press('Login')
              ->assertPathIs('/dashboard')
              ->assertSee('Welcome back');
      });
  }
  ```

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Browser | Chrome (via ChromeDriver) vs Chromium | Chrome (most compatible, supported by Dusk directly); Chromium for Linux CI (lighter, faster to install) |
| Display mode | Headless vs Xvfb | Headless=new (Chrome 112+); Xvfb as fallback for older Chrome versions or CI without GPU libraries |
| Test isolation | RefreshDatabase vs DatabaseMigrations | DatabaseMigrations (cleaner, no test ordering concerns); RefreshDatabase (faster, shared state) |
| Parallel execution | Single process vs parallel | Single process for most projects (parallel Dusk requires careful isolation); parallel only for large suites (>100 tests) |

## Tradeoffs

- **Dusk vs Feature Tests:** Dusk tests catch JavaScript/UI bugs that feature tests cannot, but they are 10-100x slower and more brittle (timing issues, browser version incompatibilities). Use feature tests for logic, Dusk tests for critical user flows that depend on JavaScript.
- **Full CI Suite vs Separate Dusk Job:** Running Dusk in the same CI job as PHPUnit tests is faster (shared setup) but makes the entire pipeline slower. Running Dusk as a separate job (after PHPUnit passes) adds CI complexity but keeps the fast feedback loop for unit/feature tests.
- **Screenshot on Failure vs Video Recording:** Screenshots are lightweight (file size, CI storage) and capture the failure state. Video recordings capture the entire test execution (useful for debugging flaky tests) but consume significant CI storage and processing time. Use screenshots by default; add video for flaky test debugging.

## Performance Considerations

- **Test Execution Time:** Dusk test: 2-10 seconds per test. Suite of 50 Dusk tests: 2-10 minutes. Compare to 50 PHPUnit feature tests: 10-30 seconds.
- **CI Resource Usage:** Dusk CI job needs more RAM (2-4GB for Chrome) and longer execution time. Use GitHub Actions larger runners or self-hosted runners with sufficient resources.
- **ChromeDriver Version Mismatch:** A common CI failure: the installed Chrome version doesn't match the ChromeDriver version. Mitigate: use Dusk's `dusk:chrome-driver` command which auto-detects and downloads the matching driver.
- **Database Performance:** Dusk tests that use RefreshDatabase/DatabaseMigrations recreate the schema on every test; for 50+ Dusk tests, this adds significant overhead. Use DatabaseTransactions or shared test state where safe.

## Production Considerations

- **Dusk vs Production:** Dusk tests run against a development server (artisan serve); production behavior may differ (Nginx vs artisan serve, Vapor vs Docker). Run a separate smoke test suite against a staging deployment for production-like validation.
- **Secrets in Dusk Tests:** Dusk tests may need API keys for JavaScript-heavy features (maps, payments). Use .env.dusk.testing with CI-specific test keys; never commit production keys.
- **CI Storage for Artifacts:** Failed Dusk screenshots and console logs can consume significant CI storage. Configure artifact retention policies (7-30 days); clean up old artifacts regularly.

## Common Mistakes

- **Not running headless:** Dusk tests fail in CI because the browser GUI can't render; forgot to add `$browser->headless()` or configure ChromeDriver for headless mode
- **Missing ChromeDriver:** CI environment doesn't have ChromeDriver installed or it doesn't match the Chrome version; Dusk tests fail with "ChromeDriver cannot be found"
- **Timing-dependent tests:** Tests use sleep() instead of waitFor()/waitForText(); the test is flaky and fails intermittently based on CI runner performance
- **Database state leakage:** Tests share database state (one test creates a user, another test fails because the user already exists); forgot to use RefreshDatabase or DatabaseTransactions
- **Heavy test suites:** 100+ Dusk tests running sequentially take 10-20 minutes; no parallelization strategy; the CI pipeline becomes too slow for practical use

## Failure Modes

- **Chrome/Chromium Not Found:** CI runner doesn't have Chrome installed; Dusk can't create a browser instance. Mitigate: install Chrome in CI setup steps; use a pre-configured Docker image with Chrome.
- **ChromeDriver Version Mismatch:** CI runner's Chrome auto-updated but ChromeDriver is pinned to an older version. Mitigate: use Dusk's `dusk:chrome-driver --detect` to auto-detect and download the matching driver.
- **Xvfb Failure:** Headless mode requires a display server but Xvfb isn't configured. Mitigate: use Chrome's `--headless=new` flag (Chrome 112+) which doesn't require Xvfb.
- **Intermittent Timeout:** A test fails intermittently due to CI runner CPU throttling; `waitFor` times out because the page renders slowly. Mitigate: increase wait duration in CI (via environment variable or DuskTestCase override).

## Ecosystem Usage

- **Laravel Dusk:** The primary browser testing tool for Laravel; integrates with CI via ChromeDriver and headless Chrome
- **Laravel Sail:** Provides a Docker environment with Chrome/ChromeDriver pre-installed; Dusk tests can run inside the Sail container for environment parity
- **Laravel Forge:** Forge's deployment process can be gated on Dusk CI results; Dusk tests validate the full application before production deployment
- **GitHub Actions:** The most common CI platform for running Laravel Dusk tests; provides service containers for MySQL/PostgreSQL alongside the Dusk test runner

## Related Knowledge Units

- automated-testing-in-ci
- github-actions-for-laravel
- automated-deployment-pipelines
- laravel-sail

## Research Notes

- Laravel Dusk was introduced in Laravel 5.4 as an official alternative to Codeception and Behat for browser testing; it replaced the community-favored "laravel/browser-kit-testing" package
- Dusk v7+ (Laravel 10+) supports parallel testing via `--parallel` flag, significantly reducing CI times for large test suites
- Chrome's `--headless=new` mode (Chrome 112+) improved headless stability and compatibility compared to the older `--headless` mode; Dusk tests on CI should use the new mode
- The most common CI failure for Dusk is ChromeDriver version mismatch; teams using Sail in CI avoid this because the Docker image has matching Chrome and ChromeDriver versions
