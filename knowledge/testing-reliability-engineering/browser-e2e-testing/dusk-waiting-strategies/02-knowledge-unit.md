# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Browser & E2E Testing
Knowledge Unit: Dusk Waiting Strategies
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Dusk waiting strategies control how browser tests handle time-dependent page states: element availability, text rendering, dialog appearance, and JavaScript execution. Using explicit `waitFor()`/`waitForText()` over fixed `pause()` is the single most important factor in Dusk test reliability. Proper waiting strategies eliminate the #1 cause of flaky Dusk tests—timing-dependent element access.

# Core Concepts
- **`waitFor($selector, $seconds = 5)`**: Waits up to N seconds for an element matching `$selector` to appear in the DOM.
- **`waitForText($text, $seconds = 5)`**: Waits for text to appear on the page.
- **`waitForLocation($path)`**: Waits for the browser URL to change to a specific path (after navigation or redirect).
- **`waitForDialog($seconds = 5)`**: Waits for a JavaScript dialog (alert, confirm, prompt) to appear.
- **`waitUntilMissing($selector, $seconds = 5)`**: Waits for an element to be removed from the DOM.
- **`pause($milliseconds)`**: Fixed delay. Use only as last resort. Every `pause()` is a potential flaky test.
- **`whenAvailable($selector, $callback)`**: Waits for element + executes callback within the element's scope.
- **Implicit vs explicit waiting**: Dusk has implicit waits (page load) and requires explicit waits for dynamic content.

# Mental Models
- **Wait for condition, not time**: Express intent: "wait until the results appear" not "wait 2 seconds hoping results appear."
- **Element-existence as state signal**: An element appearing or disappearing signals a state change. Wait for these signals instead of arbitrary delays.
- **Polling over sleeping**: Dusk polling checks every 250ms. `pause(5000)` sleeps 5 seconds regardless. Polling reacts faster when elements appear early.
- **Timeout as safety net**: Default 5-second timeout is generous. Increase for slow operations (file uploads, complex JS rendering). Decrease for fast interactions.

# Internal Mechanics
- **`waitFor()` implementation**: Polls every 250ms using `element()` lookup. If element found, returns immediately. If not found after timeout, throws `TimeoutException`.
- **`waitForText()`**: Uses `getPageSource()` on each poll and checks for text via `strpos()`.
- **`waitForLocation()`**: Checks `getCurrentURL()` against expected path.
- **`waitForDialog()`**: Checks for modal dialog presence via WebDriver's `alertText()` method.
- **`whenAvailable()`**: `waitFor()` then wraps callback in `with($selector)` scope.
- **Poll interval**: 250ms default. Not configurable. For sub-second waits, use `pause(100)` as exception.
- **Implicit page load wait**: Dusk automatically waits for page loads after `visit()` and `click()` that trigger navigation. Configurable via `ImplicitlyWait` in ChromeDriver.

# Patterns
- **Pattern: Wait-for-element before interaction**
  - Purpose: Ensure element exists before clicking/typing
  - Benefits: Eliminates "element not found" errors on slow-rendering pages
  - Tradeoffs: Adds up to 5 seconds per wait (if element is very slow)
  - Implementation: `$browser->waitFor('@results')->click('@first-result')`

- **Pattern: Wait-for-text after state change**
  - Purpose: Wait for confirmation text after form submission
  - Benefits: Verifies state change completed before asserting
  - Tradeoffs: Text must be unique on the page
  - Implementation: `$browser->press('@submit')->waitForText('Saved successfully')->assertSee('Saved')`

- **Pattern: Wait-for-location after navigation**
  - Purpose: Wait for redirect or route change
  - Benefits: Ensures page loaded before interacting with new page
  - Tradeoffs: Only checks URL path, not page content
  - Implementation: `$browser->click('@settings-link')->waitForLocation('/settings')->assertSee('Settings')`

- **Pattern: When-available for modal interactions**
  - Purpose: Interact with dynamically shown modals/overlays
  - Benefits: Clean, scoped interaction pattern
  - Tradeoffs: Nested callbacks for complex flows
  - Implementation: `$browser->press('@delete')->whenAvailable('@confirm-modal', fn ($modal) => $modal->press('@confirm'))`

# Architectural Decisions
- **`waitFor()` vs `pause()`**: Always prefer `waitFor()` with a specific element. Use `pause()` only when no element signals the state change (e.g., animation completion without DOM change).
- **Wait time configuration**: Set reasonable timeouts per interaction. 5 seconds default is good for most cases. Use 10+ seconds for file uploads or slow API responses.
- **Polling expectations**: Dusk polls every 250ms. If your page updates within 50ms of element availability, the wait adds negligible time.
- **Global vs per-wait timeout**: Global timeout set in `DuskTestCase` constructor. Per-wait timeout overrides. Set global to 5s; adjust per-wait for specific needs.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| `waitFor()` eliminates flaky element-not-found errors | Adds up to N seconds per wait (timeout) | Timeout only reached when element is genuinely missing |
| `waitForText()` is precise | Does a full page source scan each poll | Acceptable for text-based assertions |
| `whenAvailable()` scopes interactions cleanly | Nested callbacks reduce readability | Limit to 1-2 nesting levels |
| Polling is efficient (early return) | Poll interval not configurable | 250ms is adequate for all practical cases |

# Performance Considerations
- `waitFor()` polling: 250ms interval. First poll returns immediately if element exists. Average overhead <125ms.
- `waitForText()`: Full page source scan each poll. For pages with large DOM, this adds ~5-10ms per poll.
- `pause()`: Always blocks for the full duration. A 3-second `pause()` blocks 3 seconds even if the element appeared in 100ms.
- `whenAvailable()`: Adds one `waitFor()` plus the callback execution. Similar overhead to manual `waitFor()` + interaction.
- Implicit page load wait: ChromeDriver waits for `document.readyState === 'complete'`. This can take several seconds for JS-heavy SPAs.

# Production Considerations
- **CI timeout settings**: Increase Dusk timeout in CI (slower runners). Use `$browser->waitFor('@element', 10)` for CI-specific waits.
- **Flaky test budget**: If a Dusk test fails intermittently, the waiting strategy is the first thing to review. Replace `pause()` with `waitFor()`.
- **Slow page logging**: Log pages that consistently need long waits. These pages have performance issues that should be addressed.
- **`pause()` audit**: Team convention: ban `pause()` in code review. Use CI linting to flag `pause()` calls.

# Common Mistakes
- **Mistake: Using `pause()` as default waiting**
  - Why: Easy; doesn't require knowing what element to wait for
  - Why harmful: Flaky (too short) or slow (too long); doesn't express intent
  - Better: Identify the element that signals the state change; use `waitFor()`.

- **Mistake: Waiting too long by default**
  - Why: Setting global timeout to 30 seconds for safety
  - Why harmful: Tests take 30x longer on failure; CI pipelines become slow
  - Better: 5 second default. Increase per-wait only for known slow operations.

- **Mistake: Waiting for elements that don't exist yet**
  - Why: Calling `waitFor('@dynamic-content')` before the action that triggers it
  - Why harmful: Element was never on the page; wait always times out
  - Better: Perform the trigger action first, then wait for the resulting element.

- **Mistake: Using `pause()` after `waitFor()`**
  - Why: `waitFor('@element')->pause(1000)` (extra safety pause)
  - Why harmful: `waitFor()` already guarantees the element exists; extra pause is wasted time
  - Better: Remove the `pause()`. If test is still flaky, the issue is elsewhere.

# Failure Modes
- **Timeout on element that never appears**: `waitFor()` times out. Check that the trigger action completed, JavaScript executed, and element condition is met.
- **Element found but not visible**: `waitFor()` checks DOM presence, not visibility. For visibility, use `waitFor()->assertVisible()`.
- **Text appears and disappears**: Dynamic page updates remove the waited-for text before assertion. Use `waitForText()` + immediate assertion.
- **Wait on page navigation**: After clicking a link, the current page elements are removed. `waitFor()` on new page elements works correctly because Dusk waits for the new page to load.

# Ecosystem Usage
- **Laravel Dusk core**: Dusk's `InteractsWithElements` trait provides all waiting methods. Source code shows polling mechanism (250ms interval).
- **Laravel Jetstream**: Jetstream Dusk tests demonstrate proper waiting for modal transitions, team switching, and API token creation flows.
- **Laravel Nova**: Nova Dusk tests use `whenAvailable()` extensively for modals, action confirmations, and tool panels.
- **LiveWire + Dusk**: LiveWire components update DOM asynchronously. Use `waitForText()` on LiveWire-rendered content.

# Related Knowledge Units
- **Prerequisites**: Dusk fundamentals, Dusk selectors, JavaScript/DOM timing
- **Related Topics**: Dusk page objects, Dusk components, Flaky test prevention
- **Advanced Follow-up**: Custom waiting macros, Network condition simulation, JavaScript execution assertions

# Research Notes
- Laravel Dusk remains the primary browser testing tool for Laravel as of 2026, with Pest's Playwright integration emerging as a modern alternative for teams already using Pest
- Browser testing best practices emphasize waiting strategies over fixed sleep() calls — Dusk's waitFor* methods and Playwright's auto-waiting reduce flakiness significantly
- CI/CD browser testing requires Chrome/Chromium installation; headless mode is the default in CI environments; GitHub Actions provides chromium via shivammathur/setup-php extension
- Page Object Model pattern reduces test maintenance by centralizing selector definitions and interaction methods; teams maintaining >20 browser tests should adopt this pattern
- Mobile viewport testing is increasingly important; responsive design regressions are a common source of undetected bugs in Laravel applications
