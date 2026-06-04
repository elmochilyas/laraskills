# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Browser & E2E Testing |
| Knowledge Unit | Dusk Waiting Strategies |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Dusk fundamentals, Dusk selectors, JavaScript/DOM timing |
| Related KUs | Dusk page objects, Dusk components, Flaky test prevention |
| Source | domain-analysis.md K014 |

# Overview

Dusk waiting strategies control how browser tests handle time-dependent page states: element availability, text rendering, dialog appearance, and JavaScript execution. Using explicit `waitFor()`/`waitForText()` over fixed `pause()` is the single most important factor in Dusk test reliability. Proper waiting strategies eliminate the #1 cause of flaky Dusk tests — timing-dependent element access.

# Core Concepts

- **`waitFor($selector, $seconds = 5)`**: Waits up to N seconds for an element to appear in the DOM.
- **`waitForText($text, $seconds = 5)`**: Waits for text to appear on the page.
- **`waitForLocation($path)`**: Waits for the browser URL to change to a specific path.
- **`waitForDialog($seconds = 5)`**: Waits for a JavaScript dialog (alert, confirm, prompt) to appear.
- **`waitUntilMissing($selector, $seconds = 5)`**: Waits for an element to be removed from the DOM.
- **`pause($milliseconds)`**: Fixed delay. Use only as last resort.
- **`whenAvailable($selector, $callback)`**: Waits for element + executes callback within the element's scope.
- **Implicit vs explicit waiting**: Dusk has implicit waits (page load) and requires explicit waits for dynamic content.

# When To Use

- Before interacting with any dynamically rendered element
- After form submissions, AJAX calls, or page transitions
- When testing JavaScript-heavy features (Livewire, Vue, React components)
- Before verifying elements that appear after async operations
- Before keyboard navigation sequences (wait for page stability first)

# When NOT To Use

- `pause()` should almost never be used — prefer `waitFor()` variants
- `waitForLocation()` is not needed after `visit()` (Dusk waits for page load implicitly)
- Excessive waiting before static elements that are rendered immediately with the page
- Global timeout increases as a substitute for targeted per-element waits

# Best Practices (WHY)

- **Always prefer `waitFor()` over `pause()`**: `pause(1000)` wastes time if the element appears in 100ms, but is too short if the element takes 2 seconds. `waitFor()` returns immediately when the condition is met, adapting to actual page timing.
- **Wait for a specific element, not a generic timeout**: Instead of `pause(3000)`, use `waitFor('@results')`. This expresses intent and is faster/reliable. The element signals that the state change is complete.
- **Perform the trigger action before waiting**: Call `waitFor('@dialog')` after click/press, not before. Waiting for an element that hasn't been triggered yet always times out.
- **Set reasonable 5-second default timeouts**: 30-second global timeouts make failing tests take 30x longer. Use 5 seconds as default; increase to 10+ seconds only for known slow operations (file uploads, complex reports).
- **Remove `pause()` after `waitFor()`**: If `waitFor()` succeeds, the element exists. Adding `pause(500)` after is wasted time. If the test is still flaky, the issue is elsewhere.
- **Use `whenAvailable()` for scoped async content**: This combines `waitFor()` and `within()` scoping in a single call, reducing nested code and ensuring reliable timing.

# Architecture Guidelines

- **Wait time configuration**: Set global timeout in `DuskTestCase` constructor to 5 seconds. Override per-wait for specific needs.
- **CI vs local timeouts**: CI runners may be slower. Use `$browser->waitFor('@element', 10)` in CI-specific configuration.
- **LiveWire-specific waiting**: Livewire updates DOM asynchronously. Use `waitForText()` after `->click()` or `->type()` that triggers Livewire updates.
- **Polling behavior**: Dusk polls every 250ms. Understanding this helps debug wait timing issues.

# Performance Considerations

- `waitFor()` polling: 250ms interval. First poll returns immediately if element exists. Average overhead <125ms.
- `waitForText()`: Full page source scan each poll. For large DOM, adds ~5-10ms per poll.
- `pause()`: Always blocks for the full duration. A 3-second pause wastes ~2.9s on average.
- `whenAvailable()`: Adds one `waitFor()` plus callback execution. Similar overhead to manual `waitFor()` + interaction.
- Implicit page load wait: Waits for `document.readyState === 'complete'`. Can take seconds for JS-heavy SPAs.

# Security Considerations

- No direct security implications. Waiting strategies don't affect application security posture.
- Long timeouts on slow CI pages could mask performance degradation that might have security implications (DoS via slow responses).

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using `pause()` as default waiting | Easy; doesn't require knowing what element to wait for | Flaky (too short) or slow (too long); doesn't express intent | Identify the element that signals state change; use waitFor() |
| Waiting too long by default | Setting global timeout to 30 seconds for safety | Tests take 30x longer on failure; CI pipelines become slow | 5 second default. Increase per-wait only for known slow operations |
| Waiting for elements that don't exist yet | Calling waitFor() before the trigger action | Element was never on the page; wait always times out | Perform trigger action first, then wait for the resulting element |
| Using pause() after waitFor() | Extra safety pause | waitFor() already guarantees existence; pause is wasted time | Remove the pause(). If still flaky, the issue is elsewhere. |
| Wrong wait method | Using waitForLocation() when waitForText() is appropriate | Wait times out because URL doesn't change | Use the method that matches the expected condition |

# Anti-Patterns

- **`pause()` as default waiting strategy**: Using fixed delays for all timing. Instead, use `waitFor()` variants that express intent.
- **Global timeout inflation**: Increasing the global timeout to 30 seconds instead of fixing individual waits. This makes test failures painfully slow.
- **Sequential `pause()` calls**: `pause(500)->pause(500)->pause(500)` instead of a single `waitFor()`.
- **Blind copying of pause values**: Copying pause durations from other tests without understanding the actual timing requirements.

# Examples

```php
// Wait for element before interaction
$browser->waitFor('@results')
    ->click('@first-result');

// Wait for text after form submission
$browser->press('@submit')
    ->waitForText('Saved successfully')
    ->assertSee('Saved');

// Wait for location change after navigation
$browser->click('@settings-link')
    ->waitForLocation('/settings')
    ->assertSee('Settings');

// When-available for modal interactions
$browser->press('@delete')
    ->whenAvailable('@confirm-modal', function ($modal) {
        $modal->press('@confirm');
    });

// Wait for element to disappear
$browser->waitUntilMissing('@loading-spinner')
    ->assertSee('Content loaded');
```

# Related Topics

- **Prerequisites**: Dusk fundamentals, Dusk selectors, JavaScript/DOM timing
- **Related**: Dusk page objects, Dusk components, Flaky test prevention
- **Advanced**: Custom waiting macros, Network condition simulation, JavaScript execution assertions

# AI Agent Notes

- When debugging a flaky Dusk test, the first thing to check is whether `pause()` is used. If so, replace with `waitFor()` or `waitForText()` using the element that signals the expected state change.
- If a `waitFor()` consistently times out, check whether the trigger action was performed before the wait. Common mistake: calling `waitFor('@modal')` before clicking the button that opens the modal.
- For Livewire components, use `waitForText()` after interactions. Livewire DOM updates are asynchronous and may not complete before the next Dusk statement.
- When testing file uploads, increase wait time to 10+ seconds. Upload handling involves both JavaScript and server-side processing.

# Verification

- [ ] No `pause()` calls exist in Dusk tests
- [ ] `waitFor()` variants are used for all dynamic content
- [ ] Trigger action is performed before wait condition
- [ ] Global timeout is set to 5 seconds (or reasonable project default)
- [ ] CI-specific timeouts are configured for slower runners
- [ ] `waitForLocation()` is used for navigation assertions
- [ ] `whenAvailable()` is used for async-rendered dialogs/modals
