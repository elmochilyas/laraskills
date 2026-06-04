# Exception Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Exception Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Exception testing validates that exceptions are thrown when they should be, that the exception handler renders them correctly, and that error logging/reporting works as expected. It covers three layers: unit tests for exception classes, integration tests for handler behaviour, and feature tests for HTTP error responses.

The engineering value is confidence that your error handling works before it's tested by a real user. A 404 should return a branded error page (not a white screen). A validation error should redirect back with errors. An API error should return JSON — not HTML.

---

## Core Concepts

### What to Test in Exception Handling

| Layer | What to Test | Example |
|---|---|---|
| Exception class | Construction, context data, message | `PaymentFailedException` stores correct amount |
| Handler behaviour | `reportable()` and `renderable()` callbacks | `NotFoundHttpException` returns JSON for API |
| HTTP response | Status code, content type, body | 404 returns `{"error": "not found"}` |
| Logging | Log channel, level, context | `PaymentFailedException` logged to billing channel |
| Error page | View rendering, brand elements | 404 page shows home link |

### Testing Thrown Exceptions

```php
use App\Exceptions\Billing\PaymentFailedException;

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
    expect($exception->getCode())->toBe(422);
});

test('exception is thrown when payment fails', function () {
    $service = new PaymentService();

    $this->expectException(PaymentFailedException::class);
    $this->expectExceptionMessage('Card declined');

    $service->charge($this->user, 999999); // Triggers failure
});
```

---

## Mental Models

### The Contract Test Suite

Exception tests are contract tests for your error contract. They assert: "When X goes wrong, the exception Y is thrown, with context Z, and the handler returns response format W." If any of these change, the test fails — alerting you that API clients or error pages need updating.

### The Safety Net Verification

The exception handler is your safety net. Testing it confirms the net catches everything it should and responds appropriately. A missing `renderable()` callback means an exception type falls through to a generic 500 — and your API client gets HTML.

---

## Internal Mechanics

### Exception Handler Bypass

When `$this->withoutExceptionHandling()` is called in a test, Laravel removes the custom exception handler and registers a new handler that re-throws the exception. This causes PHPUnit to catch it as an uncaught exception, which PHPUnit then converts to a test failure (if no `expectException()` is set) or passes it (if it matches the expected exception).

### Handler Re-engagement

`$this->withExceptionHandling()` re-registers the application's exception handler, restoring the normal error response flow. This is the default state for all tests unless explicitly changed.

### Log Facade Mocking

`Log::spy()` and `Log::shouldReceive()` work by swapping the Log facade's underlying instance with a mock. When the exception handler calls `Log::error()`, the mock records the call instead of writing to disk. Assertions can then verify the log level, message, and context.

### HTTP Test Exception Flow

When an HTTP test sends a request and an exception occurs:

1. The application's exception handler catches it
2. The handler runs `renderable()` callbacks
3. If a callback returns a Response, it's sent as the test response
4. If no callback matches, the default error response is returned
5. The test response is returned to the test method for assertion

---

## Patterns

### Testing the Handler's Render Behaviour

```php
// Using Laravel's HTTP testing
public function test_404_returns_api_error()
{
    $response = $this->getJson('/api/non-existent-route');

    $response->assertStatus(404);
    $response->assertJson([
        'error' => [
            'message' => 'Resource not found.',
            'type' => 'not_found',
            'code' => 404,
        ],
    ]);
}

public function test_404_returns_html_for_web()
{
    $response = $this->get('/non-existent-page');

    $response->assertStatus(404);
    $response->assertViewIs('errors.404');
    $response->assertSee('Go Home');
}

public function test_403_returns_forbidden()
{
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/admin');

    $response->assertStatus(403);
    $response->assertJson(['error' => ['type' => 'forbidden']]);
}
```

### Testing Custom Exception Rendering

```php
public function test_payment_failure_renders_correctly()
{
    $this->withoutExceptionHandling(); // Disable handler — test raw exception rendering

    $this->expectException(PaymentFailedException::class);
    $this->expectExceptionMessage('Card declined.');

    $service = new PaymentService();
    $service->charge($this->user, 999999);
}

public function test_payment_failure_handled_by_handler()
{
    // With exception handling enabled — test the final response
    PaymentGateway::shouldReceive('charge')
        ->andThrow(new PaymentFailedException(
            paymentMethod: 'pm_123',
            amount: 50.00,
            failureReason: 'card_declined',
        ));

    $response = $this->actingAs($this->user)
        ->postJson('/api/payments', ['amount' => 50.00]);

    $response->assertStatus(422);
    $response->assertJson([
        'error' => [
            'type' => 'payment_failed',
            'message' => 'Your card was declined.',
        ],
    ]);
}
```

### Testing Error Page Views

```php
public function test_404_page_has_expected_content()
{
    $response = $this->get('/missing-page');
    $response->assertStatus(404);

    // Test the view directly
    $view = $this->view('errors.404', ['exception' => new NotFoundHttpException()]);
    $view->assertSee('Page Not Found');
    $view->assertSee('Go Home');
    $view->assertDontSee('Stack Trace'); // Never in production
}

public function test_500_page_does_not_leak_details()
{
    $response = $this->get('/trigger-500');
    $response->assertStatus(500);

    // In production: don't show error details
    $response->assertDontSee('Stack Trace');
    $response->assertDontSee('in /var/www/');
    $response->assertSee('Something went wrong');
}
```

### Testing Logging Behaviour

```php
use Illuminate\Support\Facades\Log;

public function test_payment_failure_is_logged()
{
    Log::shouldReceive('channel')
        ->with('billing')
        ->andReturnSelf();

    Log::shouldReceive('error')
        ->once()
        ->withArgs(function ($message, $context) {
            return str_contains($message, 'Payment failed')
                && isset($context['amount'])
                && $context['amount'] === 50.00;
        });

    $service = new PaymentService();
    try {
        $service->charge($this->user, 999999);
    } catch (PaymentFailedException) {
        // Expected
    }
}
```

### Testing Handler's Report Callbacks

```php
public function test_handler_does_not_report_validation_exceptions()
{
    Log::spy();

    $response = $this->postJson('/api/users', []); // Missing required fields

    $response->assertStatus(422);

    Log::shouldNotHaveReceived('error');
}
```

---

## Architectural Decisions

### withExceptionHandling vs withoutExceptionHandling

| Approach | When to Use |
|---|---|
| `$this->withoutExceptionHandling()` | Test raw exception behaviour (class, message, code) |
| Default (with handling) | Test final HTTP response (status, JSON, view) |

Use `withoutExceptionHandling` for unit-level exception tests. Use the default for integration tests that verify the full error response flow.

### Testing Specific Exception Types vs Generic

| Approach | Utility |
|---|---|
| `assertThrows(CustomException::class)` | Precise type checking |
| `assertStatus(500)` | Broad error response checking |
| `assertJsonStructure(['error'])` | Response contract checking |

---

## Tradeoffs

| Concern | Comprehensive Exception Tests | Minimal Exception Tests |
|---|---|---|
| Coverage | Every error path tested | Only critical paths |
| Test maintenance | Updates when error format changes | Less brittle |
| CI time | Slower (more tests) | Faster |
| Confidence | High | Low (missed edge cases) |

---

## Performance Considerations

Exception tests are fast when they don't hit external services. A test that throws and catches an exception completes in ~1ms. Exception handler integration tests (HTTP testing) take ~50-100ms (same as any HTTP test).

---

## Production Considerations

- Test every custom exception's construction and context data
- Test the handler's rendering for each request type (HTML, JSON, Inertia)
- Test that expected exceptions are NOT reported (validation, auth)
- Test that unexpected exceptions ARE reported (server errors)
- Test error page views render without errors
- Test API error response format matches documented contract
- Test environment-specific behaviour (stack traces in local, not in production)
- Use `Log::spy()` to verify logging without actually writing to disk
- Include exception tests in CI — they're fast and catch regressions early

---

## Common Mistakes

### Not Testing Error Pages

Error pages are often forgotten. A layout change breaks the 404 page. The user sees a white screen instead of a branded error. Always test at least the 404 and 500 error pages.

### Testing Only Happy Path

```php
// Tests 10 CRUD operations but never what happens when a model is missing
public function test_user_can_view_post() { /* ... */ }
// Missing: test_user_gets_404_for_missing_post()
```

Every endpoint that uses `findOrFail()` needs a "not found" test.

### Catching Exceptions Without Re-throwing

```php
// Bad — test passes even if exception is NOT thrown
try {
    $service->charge($this->user, 999999);
} catch (PaymentFailedException $e) {
    // Test passes regardless
}

// Good — assert exception is thrown
$this->expectException(PaymentFailedException::class);
$service->charge($this->user, 999999);
```

---

## Failure Modes

### False Positive from withoutExceptionHandling

`$this->withoutExceptionHandling()` disables the handler. The raw exception propagates to PHPUnit, which catches it. The test passes only if the exception is expected. But this bypasses your custom rendering logic — the error response your API client receives is never tested. Test both: raw exception (unit) and handler-rendered response (integration).

### Brittle Log Assertions

Log messages and context keys change during refactoring. Tests that assert exact log messages break unnecessarily. Assert on log level and presence of key context, not exact message strings.

---

## Ecosystem Usage

### PHPUnit / Pest

Both testing frameworks provide expectation methods for exception testing. Pest's `throws()` helper offers a more readable syntax for asserting exceptions.

### Laravel HTTP Testing

Laravel's HTTP test methods (`get()`, `post()`, `getJson()`) automatically handle exceptions and provide assertion methods for status codes, JSON structure, and error views.

### Inertia Testing

Inertia adapter provides `assertInertia()` for testing that error responses render the correct Inertia components with proper error data.

### CI/CD Integration

Exception tests can be included in CI pipelines to catch regressions in error handling before deployment.

---

## Related Knowledge Units

- **Exception Fundamentals** (this workspace) — base concepts for testing
- **Custom Exception Classes** (this workspace) — testing exception construction
- **Global Exception Handling** (this workspace) — testing handler callbacks
- **HTTP Exceptions** (this workspace) — testing HTTP error responses
- **API Exception Handling** (this workspace) — testing JSON error responses
- **Exception Logging & Reporting** (this workspace) — testing log output
- **Feature Tests** (this workspace) — organizing exception tests in feature structure

---

## Research Notes

- `$this->expectException()` asserts an exception will be thrown in the next operation
- `withoutExceptionHandling()` disables the application's exception handler for the test
- `withExceptionHandling()` re-enables it (useful after calling `withoutExceptionHandling`)
- `assertStatus()` checks the HTTP response status code
- `assertSessionHasErrors()` checks validation errors in session
- `assertJsonValidationErrors()` checks validation errors in JSON response
- `Log::spy()` / `Log::shouldReceive()` verify logging behaviour
- PHPUnit's `expectExceptionMessage()` asserts partial message match
- PHPUnit's `expectExceptionCode()` asserts exception code
- Error page views can be tested with `$this->view('errors.404')`
- Inertia error page tests require `$response->assertInertia()` with component assertion
