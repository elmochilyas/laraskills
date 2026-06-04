# Skill: Implement Waiting Strategies in Dusk

## Purpose
Use adaptive waiting strategies (`waitFor()`, `waitForText()`, `waitForLocation()`, `whenAvailable()`) instead of fixed `pause()` calls to create reliable, efficient Dusk tests that adapt to actual page load times.

## When To Use
- Every Dusk test that waits for elements, text, or URL changes
- When testing JavaScript-rendered content that loads asynchronously
- When testing page transitions or navigation
- When testing elements that appear after AJAX calls
- When testing animations or transitions

## When NOT To Use
- For elements that are immediately present on page load (no wait needed)
- In assertions that check the current page state without waiting (`assertSee` on static content)
- When testing timing-specific behavior (use `pause()` only with explicit justification)

## Prerequisites
- Understanding of Dusk's waiting methods and their parameters
- Knowledge of the page's loading behavior (AJAX, JS rendering, animations)
- Familiarity with the default timeout configuration

## Inputs
- Element selector or text to wait for
- Maximum wait time (timeout) in seconds
- Expected URL path after navigation
- Expected dialog or modal state

## Workflow
1. Identify asynchronous elements that need waiting (loaded via JS, AJAX, or animations)
2. Use `$browser->waitFor('@results-table', 10)` for element presence with a timeout
3. Use `$browser->waitForText('Order Confirmed', 10)` for text content
4. Use `$browser->waitForLocation('/dashboard', 10)` for URL changes after clicks
5. Use `$browser->waitUntil('window.loaded')` for custom JavaScript conditions
6. Use `$browser->whenAvailable('@modal', fn ($modal) => $modal->assertSee('Confirm'))` for elements in iframes or modals
7. Set appropriate timeouts — high enough for slow CI, low enough for fast feedback
8. Never use `$browser->pause(1000)` — always use an adaptive wait

## Validation Checklist
- [ ] No `pause()` calls in test code
- [ ] `waitFor()` uses reasonable timeouts (5-10s default, 15s for slow pages)
- [ ] `waitForText()` is used for text-based waiting instead of element waiting
- [ ] `waitForLocation()` is used after navigation actions
- [ ] `waitUntil()` is used for custom JavaScript conditions
- [ ] `whenAvailable()` is used for iframes and modals
- [ ] Timeouts are tuned for the CI environment, not local machine
- [ ] Wait times are documented if they deviate from defaults

## Common Failures
- Using `pause(2000)` — too short on slow CI, too long on fast machines
- Not setting a timeout — default may be too short for CI environment
- Using `waitForText('Loading...')` — waits for loading text that may flash briefly
- Chaining waits unnecessarily — one well-placed wait is better than three
- Waiting for elements that don't exist — test fails with timeout, confusing to debug

## Decision Points
- `waitFor()` vs `waitForText()` — element for DOM presence, text for content-based waiting
- `waitForLocation()` vs `waitFor()` + `assertPathIs()` — waitForLocation is simpler for navigation
- Timeout duration: 5s for fast pages, 10s default, 15s for slow CI — tune based on CI measurements

## Performance Considerations
- Adaptive waits poll every 100ms — more efficient than fixed pauses
- A `waitFor()` that returns immediately (element already present) adds ~100ms max
- Long timeouts (15s+) only matter when something goes wrong — they don't affect passing tests
- Excessive waiting methods in a single test compound the worst-case runtime

## Security Considerations
- Waiting for security-related elements (2FA code input, password confirmation) ensures they're interactive
- Test that security pages load within reasonable timeouts
- Don't wait indefinitely for security alerts that may not appear
- Verify that error messages for unauthorized access appear correctly

## Related Rules
- [Rule: Replace `pause()` with `waitFor()`](./05-rules.md)
- [Rule: Set Timeouts for CI Environment](./05-rules.md)
- [Rule: One Well-Placed Wait Is Better Than Three](./05-rules.md)

## Related Skills
- Dusk Fundamentals
- Dusk Selectors and Page Objects
- Pest Playwright E2E Testing

## Success Criteria
- [ ] Zero `pause()` calls in the Dusk test suite
- [ ] All async-loaded elements use adaptive waiting strategies
- [ ] Tests pass reliably on both local machines and CI
- [ ] Timeouts are documented and tuned for the CI environment
- [ ] Tests fail quickly when elements are truly missing (not after 30s of waiting)
