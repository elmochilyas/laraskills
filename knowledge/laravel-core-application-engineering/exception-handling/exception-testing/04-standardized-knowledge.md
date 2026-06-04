# Error Pages Customization

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Error Pages Customization
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

## Overview

Exception testing validates that exceptions are thrown when they should be, that the exception handler renders them correctly, and that error logging/reporting works as expected. It covers three layers: unit tests for exception classes, integration tests for handler behavior, and feature tests for HTTP error responses. This includes testing custom error pages to ensure they render correctly.

The engineering value is confidence that your error handling works before it's tested by a real user. A 404 should return a branded error page (not a white screen). A validation error should redirect back with errors. An API error should return JSON — not HTML.

## Core Concepts

- **What to Test:** Exception class construction and context, handler reportable/renderable callbacks, HTTP response (status, content type, body), logging (channel, level, context), error page rendering.
- **withoutExceptionHandling:** Bypasses the custom handler so raw exception behavior can be tested. Exception propagates to PHPUnit for assertion.
- **withExceptionHandling (default):** Uses the application's exception handler. Tests the full error response flow.
- **AuthenticationException → 401:** `abort()` helper throws `Symfony\Component\HttpKernel\Exception\HttpException`.

## When To Use

- Test every custom exception's construction and context data
- Test the handler's rendering for each request type (HTML, JSON, Inertia)
- Test that expected exceptions are NOT reported (validation, auth)
- Test that unexpected exceptions ARE reported (server errors)
- Test error page views render without errors
- Test API error response format matches documented contract
- Test environment-specific behavior (stack traces in local, not in production)

## When NOT To Test

- Do NOT test framework internals — test your application's exception handling behavior
- Do NOT test every possible exception type — focus on custom exceptions and key HTTP errors
- Do NOT assert exact log messages — they're brittle. Assert on log level and presence of key context
- Do NOT rely solely on `withoutExceptionHandling` — it bypasses your custom rendering logic

## Best Practices (WHY)

- **Why test error pages:** A layout change can break the 404 page. Users see a white screen instead of a branded error. Always test at least 404 and 500 pages.
- **Why test both with and without exception handling:** `withoutExceptionHandling` tests the raw exception (type, message, code). The default handler tests the final HTTP response your users see.
- **Why test every `findOrFail()` path:** Every endpoint using `findOrFail()` needs a "not found" test. Missing this means the 404 path is untested until a user hits it.
- **Why use `Log::spy()` for logging tests:** Verifies logging without writing to disk. Fast, reliable, and isolates the test from external logging infrastructure.

## Architecture Guidelines

- Test every custom exception's construction and context data (unit test)
- Test the handler's rendering for each request type (HTML, JSON, Inertia)
- Test error page views render without errors (use `$this->view('errors.404')`)
- Test API error response format matches documented contract
- Use `Log::spy()` to verify logging without writing to disk
- Include exception tests in CI — they're fast and catch regressions early

## Performance

Exception tests are fast. A unit test that throws and catches an exception completes in ~1ms. Handler integration tests (HTTP testing) take ~50-100ms (same as any HTTP test).

## Security

- Test that production error pages do not expose stack traces or file paths
- Test that API error responses do not include sensitive data
- Test that debug mode shows detailed errors and production mode shows generic errors
- Test that 500 errors return generic messages in production

## Common Mistakes

1. **Not Testing Error Pages:** A layout change breaks the 404 page. Users see a white screen. Always test at least the 404 and 500 error pages.

2. **Testing Only Happy Path:** Every endpoint using `findOrFail()` needs a "not found" test. Missing this means the 404 path is untested until a user hits it.

3. **Catching Exceptions Without Re-throwing:** `try { ... } catch (Exception $e) { ... }` — the test passes even if the exception is NOT thrown. Use `$this->expectException()`.

4. **False Positive from withoutExceptionHandling:** `withoutExceptionHandling()` disables the handler and tests raw exception behavior — but your custom rendering logic is never tested. Test both.

## Anti-Patterns

- **The Happy-Path-Only Test Suite:** Every endpoint tested only for success. No tests for 404, 403, 422, or 500 responses. Users find the error pages before developers do.
- **The Untested Error Page:** A custom 404 page that breaks silently because the layout was refactored. No test catches it until someone visits a missing URL.
- **The Brittle Log Assertion:** Tests that assert exact log message strings. Refactoring changes the message, breaking the test. Assert on log level and context presence instead.

## Examples

### Testing Custom Exception Construction
```php
test('payment failed exception contains correct context', function () {
    $exception = new PaymentFailedException(
        paymentMethod: 'pm_123',
        amount: 50.00,
        failureReason: 'insufficient_funds',
        message: 'Your card was declined.',
    );

    expect($exception->paymentMethod)->toBe('pm_123');
    expect($exception->amount)->toBe(50.00);
    expect($exception->failureReason)->toBe('insufficient_funds');
    expect($exception->getMessage())->toBe('Your card was declined.');
});
```

### Testing HTTP Error Responses
```php
public function test_404_returns_api_error()
{
    $response = $this->getJson('/api/non-existent-route');
    $response->assertStatus(404);
    $response->assertJson([
        'error' => ['message' => 'Resource not found.', 'type' => 'not_found', 'code' => 404],
    ]);
}

public function test_404_returns_html_for_web()
{
    $response = $this->get('/non-existent-page');
    $response->assertStatus(404);
    $response->assertViewIs('errors.404');
    $response->assertSee('Go Home');
}
```

### Testing Error Page Views
```php
public function test_404_page_has_expected_content()
{
    $view = $this->view('errors.404', ['exception' => new NotFoundHttpException()]);
    $view->assertSee('Page Not Found');
    $view->assertSee('Go Home');
    $view->assertDontSee('Stack Trace');
}

public function test_500_page_does_not_leak_details()
{
    $response = $this->get('/trigger-500');
    $response->assertStatus(500);
    $response->assertDontSee('Stack Trace');
    $response->assertDontSee('in /var/www/');
    $response->assertSee('Something went wrong');
}
```

### Testing Logging Behavior
```php
public function test_payment_failure_is_logged()
{
    Log::shouldReceive('channel')
        ->with('billing')
        ->andReturnSelf();
    Log::shouldReceive('error')
        ->once()
        ->withArgs(function ($message, $context) {
            return str_contains($message, 'Payment failed') && isset($context['amount']);
        });

    $service = new PaymentService();
    try { $service->charge($this->user, 999999); } catch (PaymentFailedException) {}
}

public function test_handler_does_not_report_validation_exceptions()
{
    Log::spy();
    $response = $this->postJson('/api/users', []);
    $response->assertStatus(422);
    Log::shouldNotHaveReceived('error');
}
```

## Related Topics

- **Exception Handler Configuration** — base concepts for testing
- **Custom Exceptions** — testing exception construction
- **HTTP Exception Rendering** — testing HTTP error responses
- **JSON Error Formatting** — testing JSON error responses
- **Error Tracking Integration** — testing log output

## AI Agent Notes

- Test custom exception construction and context data
- Test handler rendering for HTML, JSON, and Inertia request types
- Test error page views render without errors
- Test API error responses match the documented contract
- Use `Log::spy()` for logging assertions
- Test both `withoutExceptionHandling` (raw exception) and default (rendered response)
- Test that production error pages don't expose stack traces

## Verification

- [ ] Every custom exception class has a construction test
- [ ] Handler rendering is tested for HTML, JSON, and Inertia
- [ ] Error page views (at minimum 404 and 500) render without errors
- [ ] API error responses match the documented contract
- [ ] Production error pages do not expose stack traces
- [ ] Expected exceptions are NOT reported at ERROR level
- [ ] Logging assertions use `Log::spy()` or `Log::shouldReceive()`
- [ ] Every `findOrFail()` path has a "not found" test
- [ ] Exception tests are included in CI pipeline
