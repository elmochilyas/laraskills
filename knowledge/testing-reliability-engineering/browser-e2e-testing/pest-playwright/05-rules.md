# Rules — Pest Playwright Browser Testing

## Rule 1: Leverage Auto-Waiting Fully — Don't Add Manual Waits
| Field | Value |
|-------|-------|
| **Name** | Leverage Auto-Waiting Fully — Don't Add Manual Waits |
| **Category** | Timing & Reliability |
| **Rule** | Do not add explicit `waitFor()` or `pause()` calls out of habit from Dusk. Trust Playwright's auto-waiting, which waits for elements to be visible, enabled, and stable before interacting. |
| **Reason** | Playwright's auto-waiting is more sophisticated than Dusk's explicit waits. It checks actionability (visible, enabled, not animating) before every interaction. Adding manual waits negates this reliability advantage and reintroduces timing-related flakiness. |
| **Bad Example** | `browser()->waitForSelector('#login-btn')->click('#login-btn')` — redundant manual wait before a Playwright action that already auto-waits. |
| **Good Example** | `browser()->click('#login-btn')` — Playwright auto-waits for actionability before clicking. |
| **Exceptions** | Edge cases like waiting for a specific network response or custom JavaScript condition not covered by Playwright's built-in auto-waiting. |
| **Consequences Of Violation** | Slower tests; reintroduces Dusk-style timing flakiness; negates Playwright's reliability advantage. |

## Rule 2: Run Chromium on PRs, Full Cross-Browser Matrix on Main Branch
| Field | Value |
|-------|-------|
| **Name** | Run Chromium on PRs, Full Cross-Browser Matrix on Main Branch |
| **Category** | CI & Strategy |
| **Rule** | Configure CI to run browser tests on Chromium for every PR, and run the full cross-browser matrix (Chromium + Firefox + WebKit) on main branch merges or nightly. |
| **Reason** | Cross-browser execution triples CI time. Chromium covers >95% of browser-specific issues. Running the full matrix on every commit wastes runner minutes and slows feedback. Main-branch coverage catches cross-browser regressions before release. |
| **Bad Example** | Running `PEST_BROWSER=chromium && PEST_BROWSER=firefox && PEST_BROWSER=webkit` on every PR — 3x CI time. |
| **Good Example** | PR: `PEST_BROWSER=chromium php artisan test`. Main: matrix with all three browsers. |
| **Exceptions** | Projects where Firefox or WebKit compatibility is known to be fragile and requires per-commit verification. |
| **Consequences Of Violation** | Slow CI pipeline; excessive runner minute consumption; delayed feedback. |

## Rule 3: Install Playwright Browsers in CI Setup Step
| Field | Value |
|-------|-------|
| **Name** | Install Playwright Browsers in CI Setup Step |
| **Category** | CI & Environment |
| **Rule** | Always run `npx playwright install --with-deps` as a CI setup step before running browser tests. Cache the browser binaries to avoid re-downloading. |
| **Reason** | Playwright browsers are not included in the `pest-playwright` npm package. They must be installed separately. Without this step, tests fail with "browser not found" errors. The `--with-deps` flag installs system-level dependencies needed for browser execution. |
| **Bad Example** | CI workflow installs `pest-playwright` but doesn't run `npx playwright install` — tests fail with "browser not found." |
| **Good Example** | CI step: `run: npx playwright install --with-deps` followed by `npx playwright install chrome` (or specific browsers). |
| **Exceptions** | CI images that already have Playwright browsers pre-installed. |
| **Consequences Of Violation** | CI pipeline fails on all browser tests with missing browser errors. |

## Rule 4: Use Network Interception for Deterministic API Responses
| Field | Value |
|-------|-------|
| **Name** | Use Network Interception for Deterministic API Responses |
| **Category** | Testing & Reliability |
| **Rule** | Use `$browser->intercept()->mock('/api/*', $response)` to mock API responses in browser tests for deterministic, isolated frontend testing. |
| **Reason** | Real API calls introduce external dependencies, test data management, and timing variability. Network interception creates deterministic tests that can cover loading states, empty responses, error conditions, and success paths without relying on external services. |
| **Bad Example** | `browser()->visit('/dashboard')` — real API call to `/api/dashboard` may fail due to network or data issues. |
| **Good Example** | `browser()->intercept()->mock('/api/dashboard', ['revenue' => 1000])->visit('/dashboard')->assertSee('$1,000')`. |
| **Exceptions** | Full-stack integration tests that must validate the real API contract. Run these separately. |
| **Consequences Of Violation** | Flaky browser tests due to API dependencies; inability to test specific edge cases deterministically. |

## Rule 5: Capture Traces Only on Failure
| Field | Value |
|-------|-------|
| **Name** | Capture Traces Only on Failure |
| **Category** | Debugging & Performance |
| **Rule** | Enable Playwright trace capture only on test failure, not on every test run. |
| **Reason** | Playwright traces record all network requests, console output, screenshots, and DOM snapshots. This data is invaluable for debugging failures but adds 30-50% overhead to test time. Enabling traces only on failure provides debugging data without slowing down passing tests. |
| **Bad Example** | Enabling trace capture for all tests — every test runs 30-50% slower; CI artifacts include traces for passing tests. |
| **Good Example** | Configuring Playwright to capture traces only on `'on-first-retry'` or `'retain-on-failure'`. |
| **Exceptions** | Debugging sessions during test development where traces are needed for every run. |
| **Consequences Of Violation** | Slower test execution; larger CI artifact storage; unnecessary resource usage. |

## Rule 6: Use Viewport Presets for Responsive Testing
| Field | Value |
|-------|-------|
| **Name** | Use Viewport Presets for Responsive Testing |
| **Category** | Responsive & Cross-Device |
| **Rule** | Use built-in viewport presets (`desktop`, `tablet`, `mobile`, `mobile-small`) instead of manual pixel dimensions for responsive testing. |
| **Reason** | Viewport presets provide consistent, well-tested dimensions that mirror real devices. Manual pixel values (`375, 812`) vary across tests and are harder to maintain. Presets ensure consistency across the team and make the test's intent clear. |
| **Bad Example** | `$browser->viewport(375, 812)->visit('/')` — manual pixel values, unclear which device this represents. |
| **Good Example** | `$browser->viewport('mobile')->visit('/')` — clear intent, consistent dimensions. |
| **Exceptions** | Tests requiring a specific custom viewport not covered by presets (e.g., unusual tablet dimensions). |
| **Consequences Of Violation** | Inconsistent responsive testing; hard-to-maintain custom viewport dimensions. |
