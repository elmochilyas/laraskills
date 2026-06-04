# Skill: Write End-to-End Tests with Pest and Playwright

## Purpose
Use Pest's browser testing capabilities with Playwright to write end-to-end tests that run across multiple browsers, capture screenshots, and provide reliable, cross-platform browser automation.

## When To Use
- When you need cross-browser testing (Chrome, Firefox, WebKit)
- When project requirements include visual regression testing
- When you prefer Playwright's API over Dusk for complex browser interactions
- When testing in CI environments where Playwright's Docker image provides better reliability
- When you need network interception or advanced request mocking

## When NOT To Use
- For simple Laravel browser tests (Dusk is more Laravel-native)
- When the team is already proficient with Dusk (consistency over features)
- When server-side rendering is the primary concern (Dusk is simpler)
- For tests requiring Laravel-specific integration (database seeding, authentication)

## Prerequisites
- Pest installed with the Pest Playwright plugin
- Playwright installed (`npx playwright install`)
- Understanding of Playwright's browser automation API
- Basic knowledge of Node.js/npm for Playwright configuration

## Inputs
- URL paths to test
- Browser actions (click, type, navigate)
- Expected page state (text, URL, elements)
- Screenshot capture points
- Network request expectations

## Workflow
1. Install Pest's browser plugin: `composer require pestphp/pest-plugin-playwright --dev`
2. Configure Playwright browsers in `playwright.config.js`
3. Write a browser test using Pest's `test()` with the `->browser()` helper
4. Navigate to pages: `$browser->visit('/login')`
5. Interact with elements: `$browser->type('[name="email"]', 'user@example.com')`
6. Use Playwright's built-in waiting (auto-waiting for elements)
7. Assert page state: `expect($browser->textContent('h1'))->toContain('Dashboard')`
8. Take screenshots for visual verification: `$browser->screenshot('login-page')`
9. Intercept network requests: `$browser->route('**/api/**', route => route.fulfill(...))`

## Validation Checklist
- [ ] Pest Playwright plugin is properly configured
- [ ] Tests run in at least the production browser (Chrome)
- [ ] Auto-waiting is relied upon (no manual pause/waits)
- [ ] Screenshots are captured on failure for debugging
- [ ] Network requests are mocked when testing with external APIs
- [ ] Database state is reset between tests
- [ ] Tests pass in CI with headless browser mode

## Common Failures
- Not using auto-waiting — adding unnecessary wait/sleep calls
- CSS selector fragility — selectors break when styles change
- Not resetting database between tests — state leakage
- Running headed browser in CI — must configure `headless: true`
- Not handling modals and popups — they block further interactions

## Decision Points
- Pest Playwright vs Dusk — Playwright for cross-browser and advanced features, Dusk for Laravel-native simplicity
- CSS selector vs text selector — CSS for elements with stable attributes, text for content-based targeting
- Screenshot on failure vs every action — on failure for debugging, every action for visual regression suites

## Performance Considerations
- Playwright tests are comparable to Dusk in runtime (2-30 seconds per test)
- Playwright's auto-waiting is more efficient than manual waits
- Running across multiple browsers multiplies CI time
- Use `workers: 1` for Playwright tests to avoid database conflicts
- Screenshots add ~200ms per capture

## Security Considerations
- Playwright can intercept and inspect network traffic — ensure no sensitive data in test requests
- Screenshots may capture PII — review before storing as artifacts
- Run Playwright tests against a dedicated test environment, never production
- Test CSRF protection and authentication flows end-to-end

## Related Rules
- [Rule: Use Auto-Waiting Instead of Manual Pause](./05-rules.md)
- [Rule: Configure Headless Mode for CI](./05-rules.md)
- [Rule: Reset Database State Between Tests](./05-rules.md)

## Related Skills
- Pest Fundamentals
- Dusk Fundamentals
- E2E Testing Best Practices

## Success Criteria
- [ ] Critical user flows have Pest Playwright E2E tests
- [ ] Tests run in Chrome at minimum (Firefox/WebKit for cross-browser requirements)
- [ ] No manual wait/sleep calls — all waits are automatic
- [ ] Screenshot on failure is enabled for debugging
- [ ] Tests pass reliably in CI with headless browsers
