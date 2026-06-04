# Rules — Dusk Waiting Strategies

## Rule 1: Always Prefer `waitFor()` Over `pause()`
| Field | Value |
|-------|-------|
| **Name** | Always Prefer `waitFor()` Over `pause()` |
| **Category** | Timing & Reliability |
| **Rule** | Never use `pause()` for waiting in Dusk tests. Always use `waitFor()`, `waitForText()`, or `waitForLocation()` with element-specific selectors. |
| **Reason** | `pause(1000)` wastes 900ms if the element appears in 100ms, but is too short if the element takes 2 seconds on slow CI. `waitFor()` polls every 250ms and returns immediately when the condition is met, adapting to actual page timing. |
| **Bad Example** | `$browser->pause(3000)->assertSee('Results loaded')` — fixed delay wastes time or causes flaky failures. |
| **Good Example** | `$browser->waitForText('Results loaded', 5)->assertSee('Results loaded')` — waits adaptively. |
| **Exceptions** | Use `pause()` only as a temporary debugging aid during test development. Never commit. |
| **Consequences Of Violation** | Flaky Dusk tests — the #1 source of Dusk flakiness. Tests pass locally but fail in CI. |

## Rule 2: Always Perform the Trigger Action Before Waiting
| Field | Value |
|-------|-------|
| **Name** | Always Perform the Trigger Action Before Waiting |
| **Category** | Timing & Reliability |
| **Rule** | Always call the interaction that triggers the state change (click, press, type) _before_ calling `waitFor()` on the resulting element. Never wait for an element that hasn't been triggered yet. |
| **Reason** | Waiting for an element that hasn't been triggered always times out, because the element exists only after the trigger action. The trigger action causes the state change; the wait condition observes the result. |
| **Bad Example** | `$browser->waitFor('@dialog')->press('@open-dialog')` — dialog doesn't exist yet; wait always times out. |
| **Good Example** | `$browser->press('@open-dialog')->waitFor('@dialog')` — trigger first, then wait for result. |
| **Exceptions** | Waiting for elements that are already rendered on page load (e.g., wait for a slow-loading image on initial page visit). |
| **Consequences Of Violation** | `waitFor()` consistently times out; test fails with timeout exceptions. |

## Rule 3: Set Default Wait Timeout to 5 Seconds
| Field | Value |
|-------|-------|
| **Name** | Set Default Wait Timeout to 5 Seconds |
| **Category** | Timing & Performance |
| **Rule** | Configure the default wait timeout to 5 seconds in `DuskTestCase`. Increase to 10+ seconds only for known slow operations (file uploads, report generation). |
| **Reason** | A 30-second global timeout means failing tests take 30 seconds to fail, making CI painfully slow. 5 seconds is sufficient for most operations. Longer waits should be explicitly justified for specific elements. |
| **Bad Example** | Setting the global timeout to 30 seconds "for safety" — failing tests take 30x longer to complete. |
| **Good Example** | 5-second default in `DuskTestCase`; `$browser->waitFor('@slow-report', 15)` for known slow operations. |
| **Exceptions** | CI runners that are significantly slower than local environments (increase per-wait, not globally). |
| **Consequences Of Violation** | Slow CI pipeline; developers waste minutes waiting for failing tests to time out. |

## Rule 4: Never Add `pause()` After `waitFor()`
| Field | Value |
|-------|-------|
| **Name** | Never Add `pause()` After `waitFor()` |
| **Category** | Timing & Performance |
| **Rule** | Never add a `pause()` call immediately after a successful `waitFor()`. If `waitFor()` succeeds, the element exists and is ready. |
| **Reason** | `waitFor()` guarantees the element is present before returning. Adding `pause(500)` after provides no additional reliability — it only wastes 500ms per occurrence. If the test is still flaky after `waitFor()`, the issue is elsewhere (wrong selector, race condition in app code). |
| **Bad Example** | `$browser->waitFor('@results')->pause(500)->click('@first-result')` — `pause(500)` is wasted time. |
| **Good Example** | `$browser->waitFor('@results')->click('@first-result')` — direct interaction after wait. |
| **Exceptions** | None. |
| **Consequences Of Violation** | Unnecessary test slowdown; accumulated wasted time across the test suite. |

## Rule 5: Use `waitForLocation()` for URL Change Assertions
| Field | Value |
|-------|-------|
| **Name** | Use `waitForLocation()` for URL Change Assertions |
| **Category** | Navigation & Timing |
| **Rule** | Use `$browser->waitForLocation('/path')` after navigation actions that change the browser URL. Pair with `assertPathIs()` for verification. |
| **Reason** | `waitForLocation()` waits for the URL to change, which is the most reliable signal that navigation completed. It's more robust than waiting for specific text or elements that may appear before or after the URL change. |
| **Bad Example** | `$browser->click('@login-btn')->pause(2000)->assertPathIs('/dashboard')` — fixed delay fails on slow connections. |
| **Good Example** | `$browser->press('@login-btn')->waitForLocation('/dashboard')->assertPathIs('/dashboard')` — waits for actual navigation. |
| **Exceptions** | Single-page applications where URL doesn't change on navigation (use `waitForText()` instead). |
| **Consequences Of Violation** | Tests fail when navigation takes longer than the fixed pause; flaky URL assertions. |

## Rule 6: Use `whenAvailable()` for Async Modals and Dialogs
| Field | Value |
|-------|-------|
| **Name** | Use `whenAvailable()` for Async Modals and Dialogs |
| **Category** | Timing & Reliability |
| **Rule** | Use `$browser->whenAvailable('@selector', $callback)` for async-rendered modals, dialogs, and dynamic content sections. This combines waiting and scoping. |
| **Reason** | `whenAvailable()` polls for the element to appear and then scopes all interactions within the callback to that element. This reduces the chance of timing-related failures and makes the code more concise than separate `waitFor()` + `within()` calls. |
| **Bad Example** | `$browser->waitFor('@confirm-modal')->within('@confirm-modal', fn ($m) => $m->press('@confirm'))` — two calls where one suffices. |
| **Good Example** | `$browser->whenAvailable('@confirm-modal', fn ($m) => $m->press('@confirm'))` — single call, clear intent. |
| **Exceptions** | When you need to interact with elements both inside and outside the modal after it appears. |
| **Consequences Of Violation** | More verbose test code; potential timing gap between `waitFor()` and `within()` calls. |

## Rule 7: Use `waitUntilMissing()` for Loading Indicators
| Field | Value |
|-------|-------|
| **Name** | Use `waitUntilMissing()` for Loading Indicators |
| **Category** | Timing & Reliability |
| **Rule** | Use `$browser->waitUntilMissing('@loading-spinner')` to wait for loading indicators to disappear before interacting with content. |
| **Reason** | Loading spinners indicate that content is being fetched or processed. Waiting for them to disappear ensures the subsequent content is ready for interaction. This is more reliable than waiting for content that might already be partially rendered. |
| **Bad Example** | `$browser->pause(3000)->assertSee('Content')` — assumes loading completes within 3 seconds. |
| **Good Example** | `$browser->waitUntilMissing('@loading-spinner', 10)->assertSee('Content')` — waits for actual loading completion. |
| **Exceptions** | Pages that don't use loading indicators. Use `waitForText()` or `waitFor()` instead. |
| **Consequences Of Violation** | Tests interact with partially loaded content; flaky failures when loading takes longer than expected. |
