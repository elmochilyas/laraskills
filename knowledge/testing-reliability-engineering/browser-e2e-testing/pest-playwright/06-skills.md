# Skill: Implement Pest Playwright Browser Testing

## Purpose
Configure and execute browser tests using Pest's Playwright integration to automate end-to-end testing with cross-browser support, network interception, and screenshot capabilities.

## When To Use
- When setting up a new browser testing suite from scratch
- When you need Playwright's cross-browser support (Chromium, Firefox, WebKit)
- When advanced features like network interception, geolocation, or device emulation are needed
- When migrating from Dusk to Playwright for better reliability
- When the testing team has Playwright experience

## When NOT To Use
- When the project already has a mature Dusk suite (migration cost outweighs benefits)
- For simple browser tests that don't need Playwright's advanced features
- When the team is unfamiliar with Playwright (learning curve)
- When the CI environment doesn't support Playwright's browser dependencies

## Prerequisites
- Pest PHP testing framework installed
- Node.js and npm for Playwright installation
- `pestphp/pest-plugin-playwright` Composer package
- Understanding of Playwright's browser and page concepts

## Inputs
- Application URL and ports for test environment
- Browser configurations (headless, viewport, device emulation)
- Test scenarios as browser action sequences
- Network routes to intercept and mock

## Workflow
1. Install Pest Playwright: `composer require pestphp/pest-plugin-playwright --dev`
2. Install Playwright browsers: `npx playwright install chromium`
3. Configure test server in `phpunit.xml` or Pest configuration
4. Write a test using `pest()->browser()` to create a browser context
5. Navigate and interact: `visit('/login')`, `fill('[name="email"]', 'user@test.com')`
6. Submit forms: `click('[type="submit"]')`
7. Assert page state: `assertUrl('/dashboard')`, `assertSee('Welcome')`
8. Intercept API calls: `mockApi('**/api/users', ['users' => [...]])`
9. Capture screenshots on failure: `screenshotOnFailure()`
10. Configure CI with Playwright's Docker image for reliable runs

## Validation Checklist
- [ ] Playwright browsers are installed and configured
- [ ] Test server is configured to start before tests
- [ ] Browser is configured as headless for CI
- [ ] Screenshot on failure is enabled
- [ ] Network interception is used for external API calls
- [ ] Database is reset between test runs
- [ ] Tests run in at least the primary target browser

## Common Failures
- Browser not installed — `npx playwright install` must be run
- Test server not configured — browser can't reach the application
- Missing browser dependencies in CI — requires system packages (libgconf, libnspr, etc.)
- Font rendering differences — screenshots may differ across environments
- Pop-ups not handled — dialogs block test execution

## Decision Points
- Chromium vs Firefox vs WebKit — test in the browser your users use most
- Headless vs headed — headless for CI, headed for local debugging
- Built-in assertions vs Playwright `expect` — use Pest assertions for consistency, Playwright expect for advanced assertions

## Performance Considerations
- Playwright cold start: ~1-3 seconds for browser launch
- Page navigation: 0.5-3 seconds depending on page complexity
- Network interception adds minimal overhead (<50ms per route)
- Each test should be independent — reset browser context per test
- Use `workers: 1` for browser tests to prevent database conflicts

## Security Considerations
- Playwright can execute arbitrary JavaScript — don't run untrusted test code
- Network interception captures all request data — avoid logging sensitive URLs
- Screenshots may contain sensitive data — restrict artifact access
- Run against a dedicated test environment with test-only data

## Related Rules
- [Rule: Configure Headless Mode for CI](./05-rules.md)
- [Rule: Enable Screenshot on Failure](./05-rules.md)
- [Rule: Mock External API Calls](./05-rules.md)

## Related Skills
- Pest Fundamentals
- Dusk Fundamentals
- E2E Testing Best Practices

## Success Criteria
- [ ] Playwright browsers are installed and tests run successfully
- [ ] Test suite runs in CI with headless browsers
- [ ] Screenshots are captured on failure for debugging
- [ ] External API calls are intercepted via Playwright routing
- [ ] Each test starts with a clean database state
