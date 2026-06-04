# Rules — Laravel Dusk Fundamentals

## Rule 1: Never Use `pause()` for Waiting in Dusk Tests
| Field | Value |
|-------|-------|
| **Name** | Never Use `pause()` for Waiting in Dusk Tests |
| **Category** | Timing & Reliability |
| **Rule** | Never use `pause()` for waiting in Dusk tests. Always use `waitFor()`, `waitForText()`, `waitForLocation()`, or `whenAvailable()` for element-specific waits. |
| **Reason** | Fixed delays are either too short (causing flaky failures on slow CI) or too long (wasting time on fast environments). `waitFor()` polls every 250ms and returns immediately when the condition is met, adapting to actual page timing. |
| **Bad Example** | `$browser->pause(3000)->assertSee('Welcome');` — wastes 3 seconds if element appears in 500ms, fails if element takes 4 seconds. |
| **Good Example** | `$browser->waitForText('Welcome', 5)->assertSee('Welcome');` — waits up to 5 seconds but returns immediately when text appears. |
| **Exceptions** | Use `pause()` only as a last-resort debugging aid during test development. Remove before committing. |
| **Consequences Of Violation** | Flaky tests that pass locally but fail in CI; or tests that are unnecessarily slow. Erodes trust in the test suite. |

## Rule 2: Always Use `@dusk` Attribute Selectors for Element Targeting
| Field | Value |
|-------|-------|
| **Name** | Always Use `@dusk` Attribute Selectors for Element Targeting |
| **Category** | Selectors & Stability |
| **Rule** | Always add `@dusk="element-name"` attributes to Blade templates for elements accessed in Dusk tests. Use the `@dusk` selector convention rather than CSS classes, IDs, or complex selectors. |
| **Reason** | CSS classes and IDs change during refactoring (Tailwind upgrades, BEM changes, design system migrations). `@dusk` attributes create a stable API contract between Blade templates and tests, independent of styling changes. |
| **Bad Example** | `$browser->click('.btn.btn-primary.form-submit')` — breaks when CSS framework or class naming changes. |
| **Good Example** | Blade: `<button @dusk="submit-btn" type="submit">Submit</button>`; Test: `$browser->press('@submit-btn')`. |
| **Exceptions** | Third-party UI where you cannot add `@dusk` attributes. Fall back to CSS selectors only when necessary. |
| **Consequences Of Violation** | Brittle tests that break during CSS refactoring; time wasted updating selectors across test files. |

## Rule 3: Limit Dusk Tests to Critical User Flows Only
| Field | Value |
|-------|-------|
| **Name** | Limit Dusk Tests to Critical User Flows Only |
| **Category** | Test Pyramid & Strategy |
| **Rule** | Limit Dusk tests to at most ~10% of the total test suite. Reserve browser tests for critical user flows (login, checkout, registration, core workflows) that require JavaScript rendering or cross-page navigation. |
| **Reason** | Dusk tests are the slowest test type (1-5 seconds per test) and the most flaky. Feature HTTP tests cover logic faster and more reliably. Over-reliance on E2E testing creates a slow, flaky suite that erodes developer trust. |
| **Bad Example** | A project with 200 Dusk tests and 50 feature tests — E2E-heavy suite takes hours and flaky tests erode trust. |
| **Good Example** | A project with 10 Dusk tests (login, checkout, registration) and 200 feature tests — fast, reliable, and comprehensive. |
| **Exceptions** | Projects that are heavily JavaScript-dependent may need a higher ratio, but always prefer Pest Playwright over Dusk for new projects. |
| **Consequences Of Violation** | Test suite takes hours to run; flaky tests multiply; developers stop trusting CI results. |

## Rule 4: Always Configure Headless Mode in CI for Dusk
| Field | Value |
|-------|-------|
| **Name** | Always Configure Headless Mode in CI for Dusk |
| **Category** | CI & Environment |
| **Rule** | Always configure Dusk to run in headless mode in CI environments. Use `php artisan dusk --headless` or override `DuskTestCase::driver()` to enable headless execution. |
| **Reason** | CI environments do not have a display server. Without headless mode, Dusk tests fail with "cannot open display" errors. Headless mode also reduces resource usage and is suitable for automated testing. |
| **Bad Example** | Running `php artisan dusk` in CI without headless configuration — tests fail with display errors. |
| **Good Example** | `php artisan dusk --headless` or overriding `driver()` in `DuskTestCase` to pass `--headless` to ChromeDriver. |
| **Exceptions** | Local development with visible browser for debugging. Never commit without headless CI configuration. |
| **Consequences Of Violation** | CI pipeline fails on all Dusk tests; no browser test coverage in automated builds. |

## Rule 5: Use `.env.dusk.local` for Dusk-Specific Environment Configuration
| Field | Value |
|-------|-------|
| **Name** | Use `.env.dusk.local` for Dusk-Specific Environment Configuration |
| **Category** | Configuration & Isolation |
| **Rule** | Use `.env.dusk.local` to configure Dusk-specific environment variables (APP_URL, DB_CONNECTION, etc.). Never commit real secrets to this file. |
| **Reason** | Dusk tests need a separate environment configuration to prevent browser tests from affecting other test environments or production data. The `.env.dusk.local` file overrides `.env` settings when Dusk runs. |
| **Bad Example** | Hardcoding `APP_URL=http://localhost:8000` in Dusk tests or committing `.env.dusk.local` with real credentials. |
| **Good Example** | `.env.dusk.local` with `APP_URL=http://localhost:8000` and `DB_DATABASE=dusk_testing`; secrets injected via CI environment variables. |
| **Exceptions** | CI environments where secrets are injected via environment variables rather than `.env.dusk.local`. |
| **Consequences Of Violation** | Browser tests affect other test environments; secrets leak to version control. |

## Rule 6: Always Use `RefreshDatabase` for Dusk Tests
| Field | Value |
|-------|-------|
| **Name** | Always Use `RefreshDatabase` for Dusk Tests |
| **Category** | Database & State Isolation |
| **Rule** | Always use the `RefreshDatabase` trait on Dusk test classes to ensure database isolation between tests. |
| **Reason** | Browser tests create database state (users, orders, etc.). Without database isolation, tests interfere with each other, causing order-dependent failures. `RefreshDatabase` wraps each test in a database transaction that rolls back after the test. |
| **Bad Example** | `class LoginTest extends DuskTestCase { /* no RefreshDatabase */ }` — user created in test 1 persists and affects test 2. |
| **Good Example** | `class LoginTest extends DuskTestCase { use RefreshDatabase; ... }` — each test gets a clean database. |
| **Exceptions** | Tests that intentionally test migration behavior or need data seeded by a previous migration. |
| **Consequences Of Violation** | Order-dependent test failures; flaky tests that pass in isolation but fail in suite. |

## Rule 7: Run Dusk Tests in Parallel in CI
| Field | Value |
|-------|-------|
| **Name** | Run Dusk Tests in Parallel in CI |
| **Category** | CI & Performance |
| **Rule** | Run Dusk tests in parallel using `php artisan dusk --parallel` in CI. Each parallel worker needs its own ChromeDriver instance and database connection. |
| **Reason** | Dusk tests are slow (1-5 seconds each). Running them sequentially for a suite of 50 tests takes 2-5 minutes. Parallel execution reduces wall-clock time proportionally to the number of workers. |
| **Bad Example** | `php artisan dusk` in CI — 50 tests run sequentially, taking 2+ minutes. |
| **Good Example** | `php artisan dusk --parallel` — distributes tests across 4 workers, completing in ~30 seconds. |
| **Exceptions** | CI environments with limited memory (<2GB) where multiple ChromeDriver instances would cause out-of-memory errors. |
| **Consequences Of Violation** | Unnecessarily slow CI pipeline; delayed developer feedback. |

## Rule 8: Always Capture Screenshots on Dusk Test Failure
| Field | Value |
|-------|-------|
| **Name** | Always Capture Screenshots on Dusk Test Failure |
| **Category** | Debugging & Observability |
| **Rule** | Always enable Dusk's built-in screenshot capture on test failure. Ensure CI artifacts retain screenshots for post-failure analysis. |
| **Reason** | Dusk tests fail in CI environments that cannot be reproduced locally (different data, timing, configuration). Screenshots capture the exact browser state at the moment of failure, enabling debugging without reproduction. |
| **Bad Example** | Relying solely on console output to debug a failed Dusk test in CI — no visual context available. |
| **Good Example** | Dusk automatically captures `screenshot.png` on failure; CI configuration uploads `tests/Browser/screenshots/` as artifacts with 7-day retention. |
| **Exceptions** | None. Always capture screenshots on failure. |
| **Consequences Of Violation** | Inability to debug CI-only failures; wasted developer time attempting reproduction. |

## Rule 9: Prefer Pest Playwright Over Dusk for New Projects
| Field | Value |
|-------|-------|
| **Name** | Prefer Pest Playwright Over Dusk for New Projects |
| **Category** | Tool Selection & Migration |
| **Rule** | For new Laravel projects (2026+), use Pest Playwright (Pest 4 browser testing) instead of Laravel Dusk. For existing projects with Dusk test suites, migration is not urgent. |
| **Reason** | Pest Playwright is faster (~2x), more reliable (auto-waiting), cross-browser (Chromium, Firefox, WebKit), and is the officially recommended approach for new Laravel projects. Dusk remains supported for existing suites. |
| **Bad Example** | Starting a new Laravel project in 2026 with Dusk as the primary browser testing tool. |
| **Good Example** | Using `uses(Browser::class)` and `browser()` function from Pest Playwright for new project browser tests. |
| **Exceptions** | Existing projects with large, stable Dusk test suites where migration cost exceeds benefit. |
| **Consequences Of Violation** | Slower test execution; limited to ChromeDriver; higher maintenance burden for browser tests. |

## Rule 10: Always Use Page Objects for Pages with Multiple Interactions
| Field | Value |
|-------|-------|
| **Name** | Always Use Page Objects for Pages with Multiple Interactions |
| **Category** | Organization & Maintainability |
| **Rule** | Create a Dusk Page object for any page that has more than 3 interactive elements accessed in tests. Store page objects in `tests/Browser/Pages/`. |
| **Reason** | Page objects encapsulate selectors and interaction methods, preventing selector duplication across tests. When the page structure changes, only the page object needs updating, not every test file. |
| **Bad Example** | Writing `$browser->type('input[name="email"]', ...)->type('input[name="password"]', ...)->press('button[type="submit"]')` in every login test. |
| **Good Example** | Creating `LoginPage extends Page` with `elements()` and `login()` method, then using `$browser->on(new LoginPage)->login('user@example.com', 'password')`. |
| **Exceptions** | Single-interaction tests (one click, one assertion) where page objects add unnecessary abstraction. |
| **Consequences Of Violation** | Selector duplication across tests; high maintenance cost when selectors change. |

## Rule 11: Use `whenAvailable()` for Async-Rendered Dialogs and Modals
| Field | Value |
|-------|-------|
| **Name** | Use `whenAvailable()` for Async-Rendered Dialogs and Modals |
| **Category** | Timing & Reliability |
| **Rule** | Use `$browser->whenAvailable('@selector', $callback)` for async-rendered elements (modals, dialogs, dynamically loaded content). This combines waiting and scoping in a single call. |
| **Reason** | `whenAvailable()` waits for the element to appear (polls every 250ms) and scopes all interactions within the callback to the element's context. This is more reliable and concise than separate `waitFor()` + manual scoping. |
| **Bad Example** | `$browser->waitFor('@confirm-modal')->within('@confirm-modal', fn ($m) => $m->press('@confirm'))` — redundant wait + scope. |
| **Good Example** | `$browser->whenAvailable('@confirm-modal', fn ($m) => $m->press('@confirm'))` — single call, clear intent. |
| **Exceptions** | Tests where you need to interact with elements outside the awaited container after the async element appears. |
| **Consequences Of Violation** | More verbose test code; potential timing issues from separate wait and scope calls. |
