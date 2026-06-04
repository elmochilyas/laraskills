# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Feature & HTTP Testing
Knowledge Unit: Exception Handling Testing
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Exception handling testing verifies that application exceptions are correctly reported, logged, and converted to appropriate HTTP responses. Laravel provides the `Exceptions` facade for faking exception reporting, `assertReported()` and `assertNotReported()` for verification, and custom exception handling via `App\Exceptions\Handler`. Testing exception handling ensures errors are reported to the right channels, sensitive data is not leaked in responses, and the application degrades gracefully under failure conditions.

# Core Concepts
- **`Exceptions::fake()`**: Replaces the real exception handler with a fake that captures reported exceptions without actually sending them to configured channels.
- **`assertReported($exceptionClass)`**: Asserts an exception was reported. Optionally match by class, message, or callback.
- **`assertNotReported($exceptionClass)`**: Asserts an exception was not reported.
- **`assertReportedCount($count)`**: Asserts the total number of reported exceptions.
- **Custom exception handler**: `App\Exceptions\Handler` defines `report()` and `render()` methods. Test these methods directly for custom behavior.
- **`$this->assertException($exception)`**: (Community macro) Asserts a specific exception was thrown during a test.
- **Exception context**: `assertReported()` can verify that exceptions were reported with specific context data.

# Mental Models
- **Exception reporting = observability pipe**: Exceptions flow through the `report()` method to logging, external error trackers (Sentry, Flare), and notification channels. Faking captures this flow.
- **Exception rendering = HTTP response**: The `render()` method converts exceptions to HTTP responses. This determines what the user/client sees on error.
- **Two distinct concerns**: Reporting (who gets notified) vs Rendering (what the user sees). Test separately.
- **Fake as exception capture**: `Exceptions::fake()` records every reported exception for later assertion, without sending to real channels.

# Internal Mechanics
- **`Exceptions::fake()` implementation**: Wraps the current exception handler in a `Illuminate\Foundation\Testing\Fakes\ExceptionHandlerFake`. The fake records `report()` calls in an internal array.
- **`assertReported()`**: Searches the recorded exceptions array for a match by class or callback. Uses `instanceof` and optional closure for detailed matching.
- **`report()` and `render()` flow**: When an exception occurs in HTTP tests, the framework calls `$handler->report($e)` first, then `$handler->render($e, $request)` to generate the response.
- **Custom handler registration**: `App\Exceptions\Handler` is registered in `bootstrap/app.php`. The `Exceptions` facade replaces this binding.
- **Exception mapping**: The `$exceptionMap` property in `Handler` maps exception classes to HTTP status codes. Test that custom exceptions map correctly.

# Patterns
- **Pattern: Exception reporting verification**
  - Purpose: Verify specific exceptions are reported with correct context
  - Benefits: Ensures error monitoring captures critical failures
  - Tradeoffs: Test must trigger the actual exception path
  - Implementation: `Exceptions::fake(); $this->post('/order', $invalidData); Exceptions::assertReported(OrderFailedException::class)`

- **Pattern: Exception non-reporting**
  - Purpose: Verify expected/handled exceptions are not reported as errors
  - Benefits: Avoids noise in error monitoring
  - Tradeoffs: Must understand which exceptions are expected vs unexpected
  - Implementation: `Exceptions::assertNotReported(ValidationException::class)` after a validation failure

- **Pattern: Custom exception render testing**
  - Purpose: Test that custom exceptions render correct HTTP responses
  - Benefits: Consistent error format across the application
  - Tradeoffs: Tight coupling to exception class internals
  - Implementation: Instantiate custom exception, call `$handler->render($e, $request)`, assert response format

- **Pattern: Exception context data assertion**
  - Purpose: Verify exceptions carry useful debugging context
  - Benefits: Error monitoring gets actionable data
  - Tradeoffs: Context shape changes need test updates
  - Implementation: `Exceptions::assertReported(fn ($e) => $e->context['order_id'] === 123)`

# Architectural Decisions
- **`Exceptions::fake()` vs custom handler testing**: Use `Exceptions::fake()` for integration tests. Test custom handler methods directly for unit-level handler behavior.
- **Reporting vs Rendering tests**: Test reporting to verify error monitoring. Test rendering to verify user-facing error pages.
- **Production vs testing reporting**: Some exceptions should only be reported in production (e.g., 404s). Test that `report()` checks environment before reporting.
- **Silent exception handling**: HTTP exceptions should return appropriate status codes even if reporting fails. Test exception handling resilience.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| `Exceptions::fake()` prevents real error reporting | Fakes may not match real handler behavior | Test real handler in separate integration tests |
| Exception context assertions are powerful | Context structure changes break tests | Keep context stable; test only key fields |
| Custom render testing ensures error consistency | Tight coupling to exception class + handler | Acceptable for application-specific exceptions |
| Asserting non-reporting prevents error noise | Requires deep understanding of exception flow | Document expected vs unexpected exceptions |

# Performance Considerations
- `Exceptions::fake()` overhead: <1ms. The fake stores exceptions in an array, no I/O.
- Exception reporting in real handler: Could be slow (network calls to Sentry/Flare). Faking eliminates this.
- Exception rendering assertions: Similar cost to any HTTP response assertion.
- Custom handler unit tests: Sub-millisecond. Fastest approach for handler logic.

# Production Considerations
- **Error monitoring integration**: Test that Sentry/Flare receives exceptions with correct tags and context. Use `Exceptions::fake()` and verify context.
- **Sensitive data redaction**: Test that passwords, tokens, and PII are stripped from exception context before reporting.
- **Environment-aware reporting**: Test that `report()` only reports errors in applicable environments.
- **Error page rendering**: Test that 403, 404, 419, 500 error pages render correctly with appropriate status codes.
- **API error format consistency**: All API errors should return consistent JSON structure. Test in exception handler.

# Common Mistakes
- **Mistake: Not calling `Exceptions::fake()` before triggering the exception**
  - Why: Exception is reported to the real handler
  - Why harmful: Real error monitoring receives test errors; `assertReported()` fails
  - Better: Always call `Exceptions::fake()` at the start of tests that verify exception reporting

- **Mistake: Testing exception rendering without testing reporting**
  - Why: Focus on what the user sees
  - Why harmful: Exceptions may not be reported; silent failures in production
  - Better: Test both reporting and rendering for critical exceptions

- **Mistake: Forgetting to restore exception handler**
  - Why: `Exceptions::fake()` is not restored after test
  - Why harmful: Subsequent tests use fake handler; real reporting untested
  - Better: Pest handles auto-restoration; PHPUnit tests need `tearDown()` or use `Exceptions::assertNothingReported()` at end

- **Mistake: Testing framework exceptions instead of application exceptions**
  - Why: Expecting `ModelNotFoundException` to be reported
  - Why harmful: Framework exceptions may be handled before reporting; not application-level concern
  - Better: Test application-specific custom exceptions, not framework internals

# Failure Modes
- **Exception handler not resolved**: If `Exceptions::fake()` is called before the handler is bound in the container, boot the application first by making a request or accessing the container.
- **Reported but not rendered**: An exception reported via `report()` may be silenced and not rendered. Test both paths.
- **Handler override conflicts**: Custom exception handler registered in `AppServiceProvider` may override the fake. Ensure `Exceptions::fake()` is called after custom registration.
- **Assertion on non-reportable exceptions**: Some exceptions have `report()` method returning false (suppressed). `assertNotReported()` passes even if the exception was never fired. Use with understanding.

# Ecosystem Usage
- **Laravel core**: The `Exceptions` facade and `Handler` class are tested within Laravel's own test suite.
- **Laravel Sentry/Flares**: Error monitoring integrations test that the handler's `report()` method correctly passes exceptions to external services.
- **Laravel Horizon**: Horizon's exception handling for failed jobs is tested via `Exceptions::fake()`.
- **API packages**: API error formatting packages test that their exception renderers produce consistent JSON.

# Related Knowledge Units
- **Prerequisites**: HTTP test helpers, PHP exception handling, Error monitoring concepts
- **Related Topics**: HTTP test helpers, Validation testing, Authentication testing
- **Advanced Follow-up**: Custom exception handler design, Error monitoring integration testing, API error contract testing

# Research Notes
- Laravel's HTTP test helpers (get(), post(), put(), delete()) provide a full-stack testing experience without starting a web server — requests flow through the kernel internally
- Response assertions (ssertStatus(), ssertJson(), ssertSee()) are chainable and provide clear failure messages for debugging test failures
- Pest's higher-order expectations (expect()->toBeOk()) provide a more expressive syntax than PHPUnit's $response->assertOk()
- Test datasets (#[DataProvider]) reduce boilerplate when testing multiple input variations for validation and API endpoint testing
- Exception handling testing requires intercepting Laravel's exception handler to assert specific exceptions are thrown with expected messages
