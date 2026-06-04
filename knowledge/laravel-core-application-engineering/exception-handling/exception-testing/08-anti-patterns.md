# Anti-Patterns: Error Pages Customization

## 1. The Happy-Path-Only Test Suite

Every endpoint tested only for success with no tests for 404, 403, 422, or 500 responses.

```php
// Only happy path tested — 404 is untested
public function test_shows_user()
{
    $user = User::factory()->create();
    $response = $this->getJson("/api/users/{$user->id}");
    $response->assertOk();
}
// No test for GET /api/users/99999
```

Every endpoint using `findOrFail()`, `firstOrFail()`, or implicit route model binding needs a "not found" test. Missing this means the 404 path is untested until a real user encounters it. Write both success and failure tests:

```php
public function test_shows_user()
{
    $user = User::factory()->create();
    $response = $this->getJson("/api/users/{$user->id}");
    $response->assertOk();
}

public function test_returns_404_for_missing_user()
{
    $response = $this->getJson('/api/users/99999');
    $response->assertStatus(404);
    $response->assertJson(['error' => ['type' => 'not_found']]);
}
```

## 2. The Untested Error Page

A custom 404 or 500 page that breaks silently because the layout was refactored, with no test catching it.

```php
// No error page tests — layout change breaks 404 page silently
// Users see "Whoops, looks like something went wrong." until someone reports it
```

A layout change, missing variable, or removed component class can break error pages silently. Since error pages are only shown during failures, the broken page goes unnoticed until a real error occurs. Always write view tests for at minimum 404 and 500 error pages:

```php
public function test_404_page_has_expected_content()
{
    $view = $this->view('errors.404', ['exception' => new NotFoundHttpException()]);
    $view->assertSee('Page Not Found');
    $view->assertSee('Go Home');
    $view->assertDontSee('Stack Trace');
}
```

## 3. The Brittle Log Assertion

Asserting exact log message strings in tests instead of using `Log::spy()` to verify log level and context presence.

```php
// File-based assertion — fragile, slow, run-order dependent
public function test_payment_failure_is_logged()
{
    $service->charge($this->user, 999999);
    $log = file_get_contents(storage_path('logs/laravel.log'));
    $this->assertStringContainsString('Payment failed', $log);
}
```

Testing against log files couples tests to filesystem state, requires cleanup, and fails in parallel test runs. Use `Log::spy()` which provides in-memory assertions that are fast, reliable, and isolated:

```php
public function test_payment_failure_is_logged()
{
    Log::spy();

    try { (new PaymentService())->charge($this->user, 999999); }
    catch (PaymentFailedException) {}

    Log::shouldHaveReceived('error')
        ->once()
        ->withArgs(fn ($message) => str_contains($message, 'Payment failed'));
}
```

## 4. The False Positive from try/catch

Using `try/catch` blocks instead of `$this->expectException()` to assert exceptions are thrown — the test passes even if no exception occurs.

```php
// False positive — test passes even if exception is never thrown
try {
    $service->charge($user, -100);
} catch (PaymentFailedException $e) {
    // If exception is not thrown, test still passes
}
```

A `try/catch` without a `fail()` in the catch block produces a false positive. Always use `$this->expectException()` which explicitly asserts the exception occurs:

```php
$this->expectException(PaymentFailedException::class);
$this->expectExceptionMessage('Negative amounts not allowed.');

$service->charge($user, -100);
```

## 5. The Single-Sided Test

Testing exception behavior only with the application's exception handler (default) or only with `withoutExceptionHandling()`, but not both.

```php
// Tests only the rendered output — never verifies the exception type
public function test_404()
{
    $response = $this->get('/non-existent');
    $response->assertStatus(404);
    // Handler could be returning 404 for the wrong reason
}
```

The default handler tests the full error response flow (status code, view, JSON). `withoutExceptionHandling()` tests that the raw exception type and message are correct. Using only one approach misses either the rendering logic or the exception details. Always test both:

```php
public function test_model_not_found_exception()
{
    $this->withoutExceptionHandling();
    $this->expectException(ModelNotFoundException::class);
    $this->get('/api/users/99999');
}

public function test_404_response_format()
{
    $response = $this->getJson('/api/users/99999');
    $response->assertStatus(404);
    $response->assertJson(['error' => ['type' => 'not_found']]);
}
```

## 6. The Missing Security Assertion

Not testing that production error pages and API responses omit stack traces, file paths, and internal class names.

```php
// No assertion that production responses don't leak details
public function test_500_page()
{
    $response = $this->get('/trigger-500');
    $response->assertStatus(500);
    // Leaked stack trace goes undetected
}
```

Exposed stack traces in production leak internal application structure to attackers. A layout change or handler refactor could inadvertently include debug data in production responses. Always test that production error responses are safe:

```php
public function test_500_page_does_not_expose_details()
{
    app()->detectEnvironment(fn () => 'production');

    $response = $this->withoutExceptionHandling()->get('/trigger-500');
    $response->assertStatus(500);
    $response->assertDontSee('Stack Trace');
    $response->assertDontSee('in /var/www/');
}
```
