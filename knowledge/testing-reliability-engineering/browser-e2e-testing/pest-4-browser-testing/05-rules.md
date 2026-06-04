# Rules — Pest 4 Browser Testing

## Rule 1: Use `browser()` Function Over Direct Playwright API Calls
| Field | Value |
|-------|-------|
| **Name** | Use `browser()` Function Over Direct Playwright API Calls |
| **Category** | API Usage & Safety |
| **Rule** | Always use Pest 4's `browser()` function for browser interactions. Never call Playwright APIs directly. |
| **Reason** | Pest 4's `browser()` function handles context management, cleanup, error reporting, and integration with Pest's assertion system. Direct Playwright API calls bypass these safeguards and may cause resource leaks or inconsistent test state. |
| **Bad Example** | `$page = playwright()->newPage(); $page->goto('/login');` — manual Playwright API calls without Pest's safeguards. |
| **Good Example** | `browser()->visit('/login')->assertSee('Welcome')` — Pest-managed browser context. |
| **Exceptions** | Advanced Playwright features not exposed by Pest's DSL (e.g., custom CDP sessions). Document why Pest's API is insufficient. |
| **Consequences Of Violation** | Resource leaks; inconsistent cleanup; missing error context on failures. |

## Rule 2: Test at Least One Mobile Viewport for Customer-Facing Pages
| Field | Value |
|-------|-------|
| **Name** | Test at Least One Mobile Viewport for Customer-Facing Pages |
| **Category** | Responsive & Cross-Device |
| **Rule** | Always test customer-facing pages at a mobile viewport (e.g., 375x812) in addition to desktop. Use built-in viewport presets (`mobile`, `tablet`, `desktop`). |
| **Reason** | Desktop-only testing misses mobile layout issues, touch interaction problems, and responsive design regressions. Mobile traffic represents 50%+ of web traffic for most applications. Testing one mobile viewport catches the majority of responsive issues. |
| **Bad Example** | Testing only the desktop viewport — mobile users experience broken layouts and untested interactions. |
| **Good Example** | `browser()->viewport('mobile')->visit('/')->assertSee('Mobile Menu'); browser()->viewport('desktop')->visit('/')->assertSee('Full Navigation');`. |
| **Exceptions** | Admin-only pages that are never accessed from mobile devices. |
| **Consequences Of Violation** | Mobile users encounter broken layouts, untested interactions, and accessibility issues. |

## Rule 3: Cache Playwright Browsers in CI
| Field | Value |
|-------|-------|
| **Name** | Cache Playwright Browsers in CI |
| **Category** | CI & Performance |
| **Rule** | Cache the Playwright browser binaries directory (`~/.cache/ms-playwright`) in CI. Key the cache to the Playwright version. |
| **Reason** | Playwright browsers are ~400MB per installation. Without caching, every CI run downloads them from scratch, adding 1-2 minutes to the pipeline. Version-keyed caching ensures the cache is invalidated when Playwright is upgraded. |
| **Bad Example** | Adding `npx playwright install --with-deps` to CI without caching — 2 extra minutes per CI run. |
| **Good Example** | Cache `~/.cache/ms-playwright` with key based on Playwright version from `package.json` or lock file. |
| **Exceptions** | CI environments where cache storage is unavailable (ephemeral runners). |
| **Consequences Of Violation** | 1-2 minutes of wasted CI time per run; multiplied across all workflow runs. |

## Rule 4: Run Chromium on PRs, Full Cross-Browser Matrix on Main Branch
| Field | Value |
|-------|-------|
| **Name** | Run Chromium on PRs, Full Cross-Browser Matrix on Main Branch |
| **Category** | CI & Strategy |
| **Rule** | Run browser tests on Chromium only for PR feedback. Run the full cross-browser matrix (Chromium + Firefox + WebKit) when merging to main branch or on a nightly schedule. |
| **Reason** | Full cross-browser testing triples CI time. Most browser differences are caught by running Chromium. Running full matrix on every PR wastes CI minutes and slows developer feedback. Main-branch and nightly full matrix catches cross-browser regressions before release. |
| **Bad Example** | Running `pest --browser=chromium --browser=firefox --browser=webkit` on every commit — 3x CI time for marginal gain. |
| **Good Example** | PR: `pest --browser=chromium`. Main branch: `pest --browser=chromium --browser=firefox --browser=webkit`. |
| **Exceptions** | Projects where Firefox or WebKit have known behavioral differences that must be caught on every commit. |
| **Consequences Of Violation** | Slow CI pipeline; wasted runner minutes; delayed developer feedback. |

## Rule 5: Require Manual Baseline Review for Screenshot Tests
| Field | Value |
|-------|-------|
| **Name** | Require Manual Baseline Review for Screenshot Tests |
| **Category** | Testing & Review |
| **Rule** | Never auto-accept screenshot baselines in CI. Require manual PR review of all screenshot baseline changes before merging. |
| **Reason** | Auto-accepting baselines silently approves visual regressions. Intentional changes should be reviewed to confirm they're correct. Accidental changes (shifting elements, wrong content, styling regressions) get caught before reaching production. |
| **Bad Example** | CI workflow runs `pest --update-screenshots` and commits any baseline changes without review. |
| **Good Example** | Baselines are updated locally with `pest --update-screenshots`, reviewed in PR diff, and committed intentionally. |
| **Exceptions** | None. Screenshot baselines are visual contracts that require human review. |
| **Consequences Of Violation** | Visual regressions silently deployed to production; screenshot tests become meaningless. |

## Rule 6: Use `pest:dusk-migrate` for Dusk Migration, Then Manual Review
| Field | Value |
|-------|-------|
| **Name** | Use `pest:dusk-migrate` for Dusk Migration, Then Manual Review |
| **Category** | Migration |
| **Rule** | Use the `pest:dusk-migrate` Artisan command to convert Dusk tests to Pest Playwright. Always manually review the converted tests for Dusk-specific patterns that require adjustment. |
| **Reason** | The migration tool handles syntax conversion automatically, but Dusk-specific patterns (custom Dusk macros, `pause()` calls, Dusk-specific assertions) don't have direct Pest Playwright equivalents and need manual attention. |
| **Bad Example** | Running `pest:dusk-migrate` and committing results without review — missed Dusk-specific patterns cause test failures. |
| **Good Example** | Run migration, then review each file: replace `pause()` calls, verify assertions, check custom macro references. |
| **Exceptions** | Projects with trivial Dusk usage that doesn't involve custom macros or Dusk-specific patterns. |
| **Consequences Of Violation** | Broken tests after migration; missed Dusk-specific patterns that fail silently. |

## Rule 7: Mock API Responses in Browser Tests for Deterministic Behavior
| Field | Value |
|-------|-------|
| **Name** | Mock API Responses in Browser Tests for Deterministic Behavior |
| **Category** | Testing & Reliability |
| **Rule** | Use `$browser->fake('/api/*', $response)` to mock API responses in browser tests. This isolates frontend testing from backend state. |
| **Reason** | Real API calls introduce network dependency, test data management, and timing variability. Mocking creates deterministic tests that can verify loading, empty, error, and success states without external dependencies. |
| **Bad Example** | `browser()->visit('/users')` — real API call may return different data each run; test may fail due to network or data issues. |
| **Good Example** | `browser()->fake('/api/users', [['name' => 'John']])->visit('/users')->assertSee('John')` — deterministic API response. |
| **Exceptions** | End-to-end smoke tests that must validate the real API integration. Run separately from the main test suite. |
| **Consequences Of Violation** | Flaky tests due to network/dependency variability; hard to test specific edge cases. |
