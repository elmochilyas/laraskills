# 07-Decision Trees: Dusk Browser Tests in CI

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | workflow-automation-ci-cd |
| **Knowledge Unit** | dusk-browser-tests-ci |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Test Scope | What to test with Dusk vs feature tests | Which user flows require real browser testing? |
| D02 | CI Infrastructure | How to set up Chrome/Chromium in CI | What tools and configuration are needed for browser tests in CI? |
| D03 | Parallel Execution | Whether to run Dusk tests in parallel | Is the Dusk suite large enough to benefit from parallelization? |
| D04 | Debugging Failures | How to diagnose CI-only Dusk failures | What artifacts help debug browser tests that only fail in CI? |

## Architecture-Level Decision Trees

### D01: Test Scope

```
START: Which tests should use Dusk vs feature tests?
│
├── Feature tests (PHPUnit/Pest) — most logic
│   ├── HTTP responses, JSON APIs, authentication
│   ├── Form validation, authorization, data manipulation
│   ├── Pro: fast (ms per test), reliable, easy to debug
│   └── Use for: 80-90% of all tests
│
├── Dusk tests (browser) — critical user flows only
│   ├── JavaScript-heavy interactions (modals, AJAX forms)
│   ├── Critical flows (registration, checkout, payment)
│   ├── Complex UI state (Livewire components, Inertia pages)
│   ├── Flows that depend on JavaScript redirects or DOM updates
│   ├── Pro: tests real browser behavior, catches JS issues
│   ├── Con: 10-100x slower than feature tests
│   └── Use for: 10-20% of tests — critical paths only
│
├── When NOT to use Dusk
│   ├── Simple form submissions without JS (feature test is faster)
│   ├── API endpoint testing (feature test is sufficient)
│   ├── Unit testable logic (unit test is faster)
│   └── Rule: if a feature test can do it, don't use Dusk
│
└── Dusk test count guideline
    ├── Small project: 5-10 Dusk tests (core user flows)
    ├── Medium project: 10-30 Dusk tests
    ├── Large project: 30-100 Dusk tests
    └── >100: consider parallel execution
```

### D02: CI Infrastructure

```
START: How do we set up Dusk in CI?
│
├── Chrome/Chromium installation
│   ├── GitHub Actions: use chromedriver or setup-chromedriver action
│   ├── Or: install Chrome via apt: google-chrome-stable
│   ├── Or: use Laravel Sail in CI (includes Chrome)
│   └── Must match: ChromeDriver version = Chrome version
│
├── ChromeDriver management
│   ├── Auto: php artisan dusk:chrome-driver --detect
│   ├── Auto-downloads matching ChromeDriver version
│   ├── Run: in CI setup step before Dusk tests
│   └── Fixes: most common Dusk CI failure (version mismatch)
│
├── Headless configuration
│   ├── Modern (Chrome 112+): --headless=new (no Xvfb needed)
│   ├── Legacy: --headless (may need Xvfb display server)
│   ├── Performance flags:
    │   │   ├── --no-sandbox (required for CI)
    │   │   ├── --disable-dev-shm-usage (prevents /dev/shm issues)
    │   │   └── --window-size=1920,1080 (consistent screenshots)
    │   └── Configure in tests/DuskTestCase.php
│
├── MySQL service container
│   ├── Dusk tests need database access
│   ├── Configure: MySQL with health check
│   └── Use: RefreshDatabase for isolation
│
└── Environment configuration
    ├── .env.dusk.testing for CI-specific settings
    ├── APP_URL=http://127.0.0.1:8000 (Dusk server URL)
    └── Configure: test-specific mail, queue, cache drivers
```

### D03: Parallel Execution

```
START: Should we run Dusk tests in parallel?
│
├── Sequential (suites under 100 tests)
│   ├── Command: php artisan dusk
│   ├── Time: 2-10 minutes for 50 tests
│   ├── Simpler: easier to debug, no parallel state issues
│   └── Best for: small to medium Dusk suites
│
├── Parallel (large suites, 100+ tests)
│   ├── Command: php artisan dusk --parallel --processes=4
│   ├── Time reduction: ~60% for large suites
│   ├── Requirements:
    │   │   ├── One database per process
    │   │   ├── Separate APP_URL ports per process
    │   │   └── File system isolation
    │   └── Complexity: higher, but necessary for large suites
│
└── Alternative: split into separate CI jobs
    ├── dusk-critical (5 tests, 2 min)
    ├── dusk-features (30 tests, 10 min)
    ├── Run: in parallel as separate CI jobs
    └── Pro: clear separation, independent pass/fail
```

### D04: Debugging Failures

```
START: How do we debug CI-only Dusk failures?
│
├── Screenshot capture (essential)
│   ├── Dusk automatically captures screenshots on failure
│   ├── Upload as CI artifact:
    │   │   ├── actions/upload-artifact with tests/Browser/screenshots/
    │   │   └── Retention: 7 days (enough for debugging)
│   ├── Review: examine screenshot before/after failure point
│   └── Compare: local vs CI screenshot differences
│
├── Console log capture
│   ├── Dusk captures browser console logs on failure
│   ├── Upload: tests/Browser/console/ as CI artifact
│   ├── Look for: JavaScript errors, 404s, CORS issues
│   └── Essential for: JavaScript-heavy application debugging
│
├── Common CI-only failure patterns
│   ├── Timing: use waitFor()/waitForText(), never sleep()
│   ├── Browser size: CI headless is smaller — responsive issues
│   ├── Fonts: CI may lack system fonts — layout differences
│   ├── Network: slower CI network — increase timeouts
│   └── Database: stale data from previous test — use RefreshDatabase
│
└── Debug workflow
    ├── Check screenshot and console log
    ├── Add waitFor() conditions if timing issue
    ├── Re-run: sometimes flaky (run 3x, if all fail → real issue)
    ├── If can't reproduce locally: add more assertions, re-run CI
    └── Permanent fix: address root cause, not symptom (don't add sleep())
```
