# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Error Pages Customization
**Generated:** 2026-06-03

---

# Decision Inventory

* `withoutExceptionHandling()` vs Default Handler in Tests
* Test Coverage Scope for Exception Paths
* Log Assertion Strategy (Spy vs ShouldReceive vs Facade Assertion)

---

# Architecture-Level Decision Trees

---

## Decision 1: `withoutExceptionHandling()` vs Default Handler in Tests

---

## Decision Context

Whether to use `$this->withoutExceptionHandling()` (bypasses custom handler, tests raw exception behavior) or the default handler (tests the final HTTP response your users receive).

---

## Decision Criteria

* Whether the test needs to verify the exception type, message, and code vs the rendered HTTP response
* Whether the test needs to verify that the custom handler's `renderable()` callback produces the correct output
* Whether the test needs to verify that the handler's `reportable()` callback logs correctly
* Whether the test needs to verify that error page views render correctly

---

## Decision Tree

Does the test need to verify the raw exception behavior (type, message, code, context)?
↓
YES → Use `withoutExceptionHandling()` — exception propagates to PHPUnit for assertion
NO → Does the test need to verify the final HTTP response the user receives?
    YES → Use default handler (no override) — tests the full renderable pipeline
    NO → Does the test need to verify error page view rendering?
        YES → Use `$this->view('errors.404')` — renders view directly without HTTP overhead
        NO → Does the test need to verify logging/reporting behavior?
            ↓
            YES → Use default handler with `Log::spy()` — handler fires, log spy captures calls
            NO → Use default handler — default behavior tests the most common path

---

## Rationale

`withoutExceptionHandling()` is for testing that a specific exception type is thrown with the correct message and code. The default handler is for testing the complete error response pipeline — what your users actually see. Both test styles are needed for comprehensive coverage.

---

## Recommended Default

**Default:** Use default handler for HTTP response tests. Use `withoutExceptionHandling()` for unit tests that verify exception construction and context data.
**Reason:** Default handler tests the full pipeline. `withoutExceptionHandling()` provides precise exception assertions without handler interference.

---

## Risks Of Wrong Choice

* Always `withoutExceptionHandling()`: Custom rendering logic is never tested — layout changes can break error pages silently
* Always default handler: Can't easily assert exception type and message — response assertions are indirect
* Only view tests: Handler rendering logic (API vs HTML branching) is untested
* No error page rendering tests: Layout changes break error pages silently

---

## Related Rules

* Exception Handler Testing
* Error Page Testing

---

## Related Skills

* Exception Handler Testing
* Error Page View Testing

---

---

## Decision 2: Test Coverage Scope for Exception Paths

---

## Decision Context

Which exception paths to test — determining the minimum set of exception tests needed for production confidence.

---

## Decision Criteria

* Whether the application has custom exception classes (each needs construction and context tests)
* Whether the handler has custom `renderable()` callbacks (each needs request-type-specific tests)
* Whether the handler has custom `reportable()` callbacks (each needs logging assertion tests)
* Whether the application uses `findOrFail()` or other exception-throwing methods (each needs a not-found test)

---

## Decision Tree

Does the application have custom exception classes?
↓
YES → Test each exception's construction and context data — constructor args, getter methods, message format
NO → Does the handler have custom `renderable()` callbacks?
    YES → Test each renderable for each request type (HTML, JSON, Inertia) — branching logic
    NO → Does the application use `findOrFail()` or `firstOrFail()`?
        YES → Test not-found path for every route that uses these methods
        NO → Test the default error pages (at minimum 404 and 500) render correctly

---

## Rationale

Custom exception classes need construction tests to ensure context data is captured correctly. Custom renderable callbacks need request-type-specific tests because they typically branch on `$request->expectsJson()`. Every `findOrFail()` call is a potential untested 404 path.

---

## Recommended Default

**Default:** Test every custom exception, every custom renderable for each request type, every `findOrFail()` route, and at minimum the 404 and 500 error pages.
**Reason:** These four categories cover 90% of exception-related failure modes. Omitting any category leaves a blind spot.

---

## Risks Of Wrong Choice

* No custom exception tests: Exception context data can be wrong — missing or incorrect fields propagate to logs
* No error page view tests: Layout refactor breaks 404 page — users see white screen, not branded page
* Only happy-path tests: Every `findOrFail()` route is a potential 404 that was never tested
* No request-type branching tests: `renderable()` returns wrong format for API or Inertia requests

---

## Related Rules

* Custom Exception Testing
* Exception Handler Testing

---

## Related Skills

* Exception Handler Testing
* Custom Exception Class Testing

---

---

## Decision 3: Log Assertion Strategy (Spy vs ShouldReceive vs Facade Assertion)

---

## Decision Context

Which approach to use for verifying that exceptions are logged correctly in tests — balancing reliability, simplicity, and isolation.

---

## Decision Criteria

* Whether the test needs to verify log channel routing (specific channel used)
* Whether the test needs to verify log level (ERROR vs WARNING vs INFO)
* Whether the test needs to verify log context contains specific data
* Whether the test is a feature test (HTTP) or unit test (service/action)

---

## Decision Tree

Is the test a feature test that exercises the full HTTP stack?
↓
YES → Use `Log::spy()` — simplest API, captures all log entries, supports fluent assertions
    ↓
    Need to verify channel, level, and context?
    ↓
    YES → Assert on the arguments passed to the Log facade — `Log::assertLogged()`
    NO → Assert only that a log was written — `Log::assertNothingLogged()` for opposite
NO → Is the test a unit test for a service or action?
    YES → Use `Log::shouldReceive()` with `Mockery` expectations — precise assertion on expected call
    NO → Is the test verifying that something was NOT logged?
        ↓
        YES → Use `Log::spy()` with `shouldNotHaveReceived()` — clearest intent
        NO → Use `Log::spy()` — most versatile, works for both feature and unit tests

---

## Rationale

`Log::spy()` is the recommended approach for most tests because it captures all log entries without modifying application behavior. `Log::shouldReceive()` with Mockery is more appropriate for precise expectations in unit tests. Both approaches avoid writing actual log files.

---

## Recommended Default

**Default:** Use `Log::spy()` for feature tests and `Log::shouldReceive()` for unit tests that need precise call counting.
**Reason:** `Log::spy()` provides the cleanest API for verifying log entries. `shouldReceive()` provides more control for complex expectations.

---

## Risks Of Wrong Choice

* Asserting exact log message: Brittle — message text changes break tests without behavior change
* No log assertion: Critical errors might be silently swallowed — no verification
* `Log::shouldReceive()` without `once()`: Call can happen zero times and test still passes
* Spy without `assertLogged`: No verification that the log was actually written — false positive

---

## Related Rules

* Log Assertion in Tests
* Exception Handler Testing

---

## Related Skills

* Exception Handler Testing
* Log Assertion Implementation
