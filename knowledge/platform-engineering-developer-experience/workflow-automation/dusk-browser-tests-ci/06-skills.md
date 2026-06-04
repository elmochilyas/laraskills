# Skill: Run Dusk Browser Tests in CI

## Purpose
Configure Laravel Dusk browser tests to run in CI with Chrome headless mode, service containers, and artifact upload for debugging CI-only failures.

## When To Use
- Applications with JavaScript-heavy interactions (modals, AJAX forms, dynamic content)
- Critical user flows requiring end-to-end validation (registration, checkout, payment)
- SPA applications built with Inertia/React/Vue

## When NOT To Use
- Simple CRUD apps with standard form submissions (feature tests suffice)
- API-only applications with no browser UI
- When Dusk test maintenance outweighs value of catching JS regressions

## Prerequisites
- Laravel Dusk installed and configured
- Chrome/Chromium binary in CI environment
- GitHub Actions or equivalent CI platform

## Inputs
- CI workflow file (`.github/workflows/dusk.yml`)
- `.env.dusk.testing` — Dusk-specific environment configuration
- Dusk test files

## Workflow

1. **Use Chrome Headless Mode:** Add `--headless=new` (Chrome 112+) to Dusk's Chrome options. This eliminates the Xvfb requirement and simplifies CI setup.

2. **Configure CI Service Containers:** Add MySQL service container with health checks. Dusk tests need a real database, not SQLite.

3. **Run Dusk as Separate CI Job:** Run Dusk tests after unit/feature tests pass. Dusk tests are 10-100x slower than feature tests — keep them in a separate, parallel job.

4. **Use Auto-Detect ChromeDriver:** Run `php artisan dusk:chrome-driver` in CI to install the matching ChromeDriver version for the CI environment's Chrome.

5. **Upload Screenshots on Failure:** Configure CI to upload the `tests/Browser/screenshots/` and `tests/Browser/console/` directories as artifacts when Dusk tests fail. These are essential for debugging CI-only failures.

6. **Ensure Test Isolation:** Use `DatabaseMigrations` or `RefreshDatabase` trait on Dusk test classes. Database leakage causes flaky failures.

7. **Use `waitFor()` Instead of `sleep()`:** Use `$browser->waitFor()` and `waitForText()` methods instead of hard-coded `sleep()`. Eliminates flaky timing-dependent tests.

## Validation Checklist

- [ ] Chrome `--headless=new` configured (no Xvfb needed)
- [ ] MySQL service container with health check
- [ ] Dusk runs as separate CI job (after unit/feature tests)
- [ ] `dusk:chrome-driver` runs in CI for driver installation
- [ ] Screenshots and console logs uploaded as artifacts on failure
- [ ] `DatabaseMigrations`/`RefreshDatabase` used for isolation
- [ ] `waitFor()` instead of `sleep()` used in tests

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| ChromeDriver version mismatch | Use `dusk:chrome-driver` for auto-detection |
| Screenshots not accessible on failure | Upload as CI artifacts for debugging |
| Flaky tests from `sleep()` | Replace with `waitFor()` / `waitForText()` |
| Dusk running with unit tests | Separate jobs — Dusk is 10-100x slower |

## Decision Points

- **Use for JS-heavy interactions** (modals, AJAX, SPA) that feature tests can't cover
- **Use sparingly** for critical user flows only — Dusk tests are 10-100x slower than feature tests
- **Skip for API-only apps** with no browser UI

## Performance/Security Considerations

- **Dusk is slow:** 2-10 seconds per test vs milliseconds for feature tests
- **CI cost:** Dusk tests require more CI resources (Chrome, display server)
- **Screenshot artifacts:** Essential for debugging; include in CI artifact retention policy

## Related Rules

- DUSKCI-RULE-001: Use Chrome `--headless=new` mode
- DUSKCI-RULE-002: Use `dusk:chrome-driver` command
- DUSKCI-RULE-003: Use DatabaseMigrations or RefreshDatabase
- DUSKCI-RULE-004: Upload screenshots and console logs as CI artifacts
- DUSKCI-RULE-005: Run Dusk as separate CI job

## Related Skills

- Set Up Automated Testing in CI
- Run PHPStan in CI
- Run Pint in CI

## Success Criteria

- Dusk tests run reliably in CI with no flaky failures
- Screenshots are available for debugging CI-only failures
- Dusk job runs in parallel to unit/feature tests
- Critical user flows are validated end-to-end
