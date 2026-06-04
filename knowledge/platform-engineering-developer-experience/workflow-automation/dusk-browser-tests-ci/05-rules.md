# Rules: Dusk Browser Tests in CI

## Metadata
- **Source KU:** dusk-browser-tests-ci
- **Subdomain:** Workflow Automation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- DUSKCI-RULE-001: **Use Chrome `--headless=new` mode** (Chrome 112+) — Eliminates Xvfb requirement.
- DUSKCI-RULE-002: **Use `dusk:chrome-driver` command** to auto-detect matching ChromeDriver version.
- DUSKCI-RULE-003: **Use DatabaseMigrations or RefreshDatabase** for test isolation — DB leakage causes flaky failures.
- DUSKCI-RULE-004: **Upload screenshots and console logs as CI artifacts** on failure — Essential for debugging CI-only failures.
- DUSKCI-RULE-005: **Run Dusk as separate CI job** after unit/feature tests pass.

## Architecture Rules
- DUSKCI-RULE-006: **Use `--headless=new`, `--no-sandbox`, `--disable-dev-shm-usage`** flags for optimal CI performance.
- DUSKCI-RULE-007: **Separate job pattern:** MySQL service container, Chrome installation, screenshot upload on failure.
- DUSKCI-RULE-008: **Use `$browser->waitFor()` and `waitForText()`** instead of `sleep()` — Avoids flaky timing-dependent tests.

## Decision Rules
- DUSKCI-RULE-009: **Use for JS-heavy interactions** (modals, AJAX, SPA) that feature tests can't cover.
- DUSKCI-RULE-010: **Use sparingly** for critical user flows only — Dusk tests are 10-100x slower than feature tests.
- DUSKCI-RULE-011: **Skip for API-only apps** with no browser UI.
