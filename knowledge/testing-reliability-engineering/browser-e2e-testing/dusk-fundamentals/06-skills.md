# Skill: Write Laravel Dusk Browser Tests

## Purpose
Write automated browser tests using Laravel Dusk that simulate real user interactions — clicking, typing, navigating — to verify end-to-end functionality in a headless Chrome instance.

## When To Use
- Testing critical user flows (registration, checkout, onboarding)
- Testing JavaScript-heavy interfaces that can't be tested with HTTP feature tests
- Testing multi-page workflows with state across requests
- Testing UI interactions (modals, dropdowns, drag-and-drop)
- Testing features that depend on browser APIs (localStorage, cookies)

## When NOT To Use
- For simple CRUD operations that HTTP feature tests cover
- For testing API endpoints or backend logic
- As the primary test type — limit to ~10% of the test suite
- For testing visual appearance or layout (use visual regression tools)

## Prerequisites
- Dusk installed and configured (`php artisan dusk:install`)
- ChromeDriver running or configured
- `php artisan dusk` command to run tests
- Understanding of `$this->browse()` and the `Browser` class

## Inputs
- User flow to test (steps as a sequence of browser actions)
- Page URL to visit
- Element selectors for interactions and assertions
- Test data (user credentials, form inputs)

## Workflow
1. Create a Dusk test class extending `DuskTestCase`
2. Use `$this->browse(function (Browser $browser) { ... })` to start a browser session
3. Visit the starting page: `$browser->visit('/login')`
4. Interact with elements: `->type('email', 'user@example.com')`, `->click('@login-button')`
5. Wait for expected elements: `->waitForText('Dashboard')`, `->waitForLocation('/dashboard')`
6. Assert page state: `->assertSee('Welcome back')`, `->assertPathIs('/dashboard')`
7. For multi-user flows, pass multiple browser instances: `$this->browse(function ($first, $second) { ... })`
8. Use `@dusk` selectors in views for stable element targeting

## Validation Checklist
- [ ] Dusk test covers a critical user flow end-to-end
- [ ] `@dusk` selectors are used instead of CSS classes or XPath
- [ ] `waitFor()` or `waitForText()` is used instead of `pause()`
- [ ] Browser sessions are properly closed after the test
- [ ] Database is reset between tests (RefreshDatabase or DatabaseTruncation)
- [ ] Screenshots are captured on failure for debugging

## Common Failures
- Using CSS classes as selectors — brittle when styles change; use `@dusk` selectors
- Using `pause()` instead of `waitFor()` — flaky on slow CI, slow on fast machines
- Not isolating database state — tests interfere with each other
- Testing too many scenarios in one Dusk test — slow and brittle
- Forgetting to configure ChromeDriver for CI environment

## Decision Points
- Dusk vs Pest Playwright — Dusk for Laravel-native testing, Playwright for cross-framework or advanced scenarios
- Single browser vs multiple browsers — single for linear flows, multiple for real-time features
- `@dusk` selector vs CSS class — `@dusk` for stability, CSS for elements you don't control

## Performance Considerations
- Dusk tests are the slowest test type (2-30 seconds per test)
- Each `visit()` triggers a full page load — minimize page transitions per test
- Headless mode is faster than headed but still has browser overhead
- Use `RefreshDatabase` with `DatabaseTruncation` for faster database resets
- Capture screenshots only on failure, not for every test

## Security Considerations
- Dusk tests run against the test database — never run against production
- Test credentials should use factories, not real user accounts
- Verify that security-critical flows (login, password reset, 2FA) work correctly
- Ensure CSRF protection is tested by submitting real forms
- Test that error messages don't leak sensitive information

## Related Rules
- [Rule: Use `@dusk` Selectors for Stable Element Targeting](./05-rules.md)
- [Rule: Replace `pause()` with `waitFor()`](./05-rules.md)
- [Rule: Isolate Browser Tests with Fresh Database State](./05-rules.md)

## Related Skills
- Dusk Selectors and Page Objects
- Dusk Waiting Strategies
- Pest Playwright Integration

## Success Criteria
- [ ] Critical user flows have Dusk tests covering the full path
- [ ] All Dusk tests pass in CI without flakiness
- [ ] `@dusk` selectors are used consistently, not CSS classes
- [ ] `waitFor()` variants replace all `pause()` calls
- [ ] Test suite has ~10% browser tests (not 50%)
