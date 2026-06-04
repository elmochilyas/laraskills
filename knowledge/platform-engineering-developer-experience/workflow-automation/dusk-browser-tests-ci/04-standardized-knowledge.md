# Experience Curation: Dusk Browser Tests in CI

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/dusk-browser-tests-ci
- **Maturity:** Mature
- **Related Technologies:** Laravel Dusk, Selenium, ChromeDriver, GitHub Actions, Continuous Integration, Browser Testing
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Dusk browser tests in CI refers to running Laravel Dusk's browser automation tests in a CI/CD pipeline. Dusk provides a fluent API for browser testing using ChromeDriver or Selenium, enabling teams to validate JavaScript-heavy interactions, form submissions, authentication flows, and single-page application behavior that PHPUnit/Pest feature tests cannot cover. Running Dusk in CI requires: a Chrome/Chromium browser binary, ChromeDriver (matching the browser version), a display server (Xvfb for headless rendering), and appropriate configuration to run in headless mode. Dusk tests are slower than PHPUnit tests (2-10 seconds per test vs milliseconds) and require more CI resources, so they are typically run as a separate CI job after unit/feature tests pass.

## Core Concepts
- **Laravel Dusk:** Laravel's official browser automation tool; provides an expressive API for clicking links, filling forms, asserting page content, and waiting for JavaScript execution
- **Headless Browser:** Running the browser without a visible UI; Dusk uses Chrome's headless mode by default in CI
- **ChromeDriver:** A separate executable that controls the Chrome browser; version must match the installed Chrome/Chromium version
- **Xvfb (Virtual Framebuffer):** A display server that provides a virtual screen for browsers that require a display
- **.env.dusk.{environment}:** Environment files loaded specifically for Dusk tests (e.g., .env.dusk.local, .env.dusk.testing)
- **Dusk as Robot User:** Dusk tests are robotic users that interact with the application exactly as a human would

## When To Use
- Applications with JavaScript-heavy interactions (modals, AJAX forms, dynamic content loading)
- Critical user flows that must be validated end-to-end (registration, checkout, payment flows)
- Single-page applications built with Laravel + Inertia or Livewire
- Applications where feature tests alone are insufficient to catch UI regressions
- Projects with complex authentication flows that depend on JavaScript redirects

## When NOT To Use
- API-only applications with no browser UI
- Projects where Dusk test maintenance cost outweighs the value (small teams, simple UIs)
- Pages covered adequately by PHPUnit/Pest feature tests (simple form submissions without JavaScript)
- Projects without CI resources to handle the additional runtime and infrastructure requirements

## Best Practices
- **WHY:** Use Chrome's `--headless=new` mode (Chrome 112+) which doesn't require Xvfb; older `--headless` mode requires a display server that may not be available on CI runners
- **WHY:** Use Dusk's `dusk:chrome-driver` command to auto-detect and download the matching ChromeDriver version; ChromeDriver version mismatch is the most common Dusk CI failure
- **WHY:** Use the DatabaseMigrations or RefreshDatabase trait for test isolation; database state leakage between Dusk tests causes flaky failures that are hard to debug
- **WHY:** Upload screenshots and console logs as CI artifacts on test failure; these artifacts are essential for debugging Dusk failures that can't be reproduced locally
- **WHY:** Run Dusk as a separate CI job after unit/feature tests pass; this keeps the fast feedback loop for PHPUnit tests while adding browser test coverage

## Architecture Guidelines
- **GitHub Actions Dusk Pattern:** Run Dusk in a separate job with MySQL service container, Chrome installation, and screenshot upload on failure
- **Headless Configuration Pattern:** Configure Chrome with `--headless=new`, `--no-sandbox`, `--disable-dev-shm-usage`, `--window-size=1920,1080` for optimal CI performance
- **Sail Dusk in CI Pattern:** Use Sail's Docker environment for Dusk; ensures same PHP/Chrome versions as development
- **Parallel Dusk Pattern:** Use `php artisan dusk --parallel --processes=4` for large test suites (>100 tests); requires careful database isolation
- **Dusk Test Structure Pattern:** Use `$this->browse()` with Browser instance for each test; use `waitFor` and `waitForText` instead of `sleep()`
- **Browser Choice:** Chrome (most compatible); Chromium for Linux CI (lighter, faster to install)
- **Display Mode:** Headless=new (Chrome 112+); Xvfb as fallback for older Chrome versions

## Performance
- Dusk test: 2-10 seconds per test. Suite of 50 Dusk tests: 2-10 minutes. Compare to 50 PHPUnit feature tests: 10-30 seconds
- Dusk CI job needs more RAM (2-4GB for Chrome) and longer execution time; use GitHub Actions larger runners or self-hosted runners
- Database isolation (RefreshDatabase/DatabaseMigrations) adds overhead for each test; for 50+ Dusk tests, consider DatabaseTransactions where safe
- Dusk tests are 10-100x slower than feature tests; use them sparingly for critical user flows only

## Security
- Dusk tests may need API keys for JavaScript-heavy features (maps, payments); use .env.dusk.testing with CI-specific test keys
- Never commit production keys to .env.dusk files; use CI secrets for test API credentials
- Dusk screenshots captured on failure may contain sensitive data (user details, API responses); configure artifact retention policies appropriately
- Dusk tests run against a local Artisan server, not production; ensure no production data is used in test scenarios
- Browser console logs uploaded as artifacts may contain internal URLs or error details; restrict artifact access

## Common Mistakes

### Not running headless
- **Description:** Dusk tests fail in CI because the browser GUI can't render
- **Consequence:** Tests fail with browser-related errors; CI pipeline is blocked
- **Better Approach:** Always configure Chrome for headless mode in `tests/DuskTestCase.php`; use `--headless=new` flag

### Missing ChromeDriver
- **Description:** CI environment doesn't have ChromeDriver or it doesn't match Chrome version
- **Consequence:** Dusk tests fail with "ChromeDriver cannot be found"
- **Better Approach:** Run `php artisan dusk:chrome-driver` in CI setup steps; use Sail in CI for environment parity

### Timing-dependent tests
- **Description:** Tests use `sleep()` instead of `waitFor()`/`waitForText()`
- **Consequence:** Tests are flaky and fail intermittently based on CI runner performance
- **Better Approach:** Use Dusk's wait methods which poll for conditions; set reasonable timeout values for CI

### Database state leakage
- **Description:** Tests share database state; one test creates a record, another test fails because it already exists
- **Consequence:** Flaky, order-dependent test failures
- **Better Approach:** Use DatabaseMigrations or RefreshDatabase trait; ensure each test starts with a clean database

### Heavy test suites
- **Description:** 100+ Dusk tests running sequentially take 10-20 minutes
- **Consequence:** CI pipeline becomes too slow for practical use; developers skip running Dusk locally
- **Better Approach:** Use parallel Dusk execution; split into smaller test files; run only critical path Dusk tests

## Anti-Patterns
- **Using Dusk for everything:** Writing Dusk tests for every feature when feature tests would suffice; unnecessarily slow CI
- **No screenshot capture on failure:** Dusk test fails but no artifacts to debug; developers can't diagnose CI-only failures
- **Hardcoded wait times:** Using `$browser->pause(5000)` instead of `waitFor()`; tests are slow and flaky
- **Running Dusk and PHPUnit in the same job:** A single failure blocks the entire pipeline; separate jobs provide better feedback
- **Ignoring ChromeDriver version:** Pinning ChromeDriver to an older version while Chrome auto-updates; constant version mismatch failures

## Examples
- **Laravel Dusk:** The primary browser testing tool; integrates with CI via ChromeDriver and headless Chrome
- **Laravel Sail:** Provides a Docker environment with Chrome/ChromeDriver pre-installed; Dusk runs inside Sail for environment parity
- **Laravel Forge:** Deployment gated on Dusk CI results; validates full application before production deployment
- **GitHub Actions:** Most common CI platform for running Laravel Dusk tests; provides service containers alongside the Dusk test runner

## Related Topics
- automated-testing-in-ci (general CI test automation patterns)
- github-actions-for-laravel (CI platform for running Dusk)
- automated-deployment-pipelines (Dusk as a pre-deployment quality gate)
- laravel-sail (Docker environment for Dusk testing)
- browser-testing (broader Dusk testing patterns)

## AI Agent Notes
- ChromeDriver version mismatch is the #1 cause of Dusk CI failures; use `dusk:chrome-driver --detect` to auto-match
- Dusk tests should be reserved for critical user flows only; feature tests cover most application logic
- The `--headless=new` mode (Chrome 112+) eliminated the Xvfb requirement, simplifying CI configuration
- For teams using Sail in CI, ChromeDriver version matching is automatic (Docker image has matching versions)
- Screenshot artifacts on failure are essential; configure artifact upload even if retention is short

## Verification
- [ ] Dusk tests run in headless mode in CI (`--headless=new`)
- [ ] ChromeDriver version matches Chrome/Chromium version (use `dusk:chrome-driver`)
- [ ] Database isolation is configured (RefreshDatabase or DatabaseMigrations)
- [ ] Screenshots and console logs are uploaded as artifacts on failure
- [ ] Dusk runs as a separate CI job after unit/feature tests pass
- [ ] `.env.dusk.testing` file configures CI-appropriate settings
- [ ] Wait methods (`waitFor`, `waitForText`) are used instead of `sleep()`
- [ ] Chrome is configured with performance-optimized flags (`--no-sandbox`, `--disable-dev-shm-usage`)
- [ ] Test suite size is manageable (< 100 tests) or uses parallel execution
- [ ] CI runners have sufficient resources (2-4GB RAM) for browser tests
