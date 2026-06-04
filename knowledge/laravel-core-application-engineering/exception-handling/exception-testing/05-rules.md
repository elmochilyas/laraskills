# Rules for Exception Testing

---

## Rule: Write a Unit Test for Every Custom Exception Class

---

## Category

Testing

---

## Rule

Always write a unit test for every custom exception class that verifies its construction, message, code, and context properties. Never deploy a custom exception without a test.

---

## Reason

Exception context data is critical for debugging. Without tests, a refactored constructor signature or a missing context property silently produces incomplete error reports in production.

---

## Bad Example

```php
// No test for PaymentFailedException
// Later refactor: amount property removed from constructor
// No test catches the missing property
```

---

## Good Example

```php
test('payment failed exception contains correct context', function () {
    $exception = new PaymentFailedException(
        paymentMethod: 'pm_123',
        amount: 50.00,
        failureReason: 'insufficient_funds',
    );

    expect($exception->paymentMethod)->toBe('pm_123');
    expect($exception->amount)->toBe(50.00);
    expect($exception->failureReason)->toBe('insufficient_funds');
    expect($exception->getMessage())->toBe('Payment processing failed.');
    expect($exception->getCode())->toBe(422);
});
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: constructor changes silently break exception context. Reliability risks: error reports lack critical debugging data.

---

## Rule: Test Error Rendering for Every Request Type — HTML, JSON, and Inertia

---

## Category

Testing

---

## Rule

Always test that your exception handler returns the correct response format (HTML view, JSON, or Inertia component) for each request type. Never assume a single handler callback covers all request types.

---

## Reason

A `renderable()` callback that returns `response()->view(...)` for all requests will return HTML to API clients. Content negotiation must be tested for each request type to prevent format mismatch.

---

## Bad Example

```php
// Tests only JSON — HTML path is untested
public function test_404_returns_json()
{
    $response = $this->getJson('/api/non-existent');
    $response->assertStatus(404);
    // No test for web route — HTML 404 might be broken
}
```

---

## Good Example

```php
public function test_404_returns_api_error()
{
    $response = $this->getJson('/api/non-existent-route');
    $response->assertStatus(404);
    $response->assertJson(['error' => ['type' => 'not_found']]);
}

public function test_404_returns_html_for_web()
{
    $response = $this->get('/non-existent-page');
    $response->assertStatus(404);
    $response->assertViewIs('errors.404');
    $response->assertSee('Go Home');
}
```

---

## Exceptions

Applications with only one request type (pure API or pure web) only need to test that type.

---

## Consequences Of Violation

Reliability risks: API clients receive HTML errors. User experience: web users see raw JSON error responses.

---

## Rule: Test Error Page Views to Ensure They Render Without Errors

---

## Category

Testing

---

## Rule

Always write view tests for custom error pages (at minimum 404 and 500). Never deploy an error page without verifying it renders.

---

## Reason

A layout refactor, missing variable, or removed component class can break error pages silently. Since error pages are only shown during failures, the broken page goes unnoticed until a real error occurs — and then users see a white screen instead of a branded page.

---

## Bad Example

```php
// No error page tests — layout change breaks 404 page silently
// Users see "Whoops, looks like something went wrong." until someone reports it
```

---

## Good Example

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

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

User experience: users see broken or blank error pages. Reliability risks: error pages fail silently during real errors.

---

## Rule: Use $this->expectException() to Assert Exceptions Are Thrown

---

## Category

Testing

---

## Rule

Always use `$this->expectException()` or `$this->expectExceptionObject()` when testing that code throws a specific exception. Never use `try/catch` blocks that silently pass if no exception is thrown.

---

## Reason

A `try/catch` without a `fail()` in the `catch` block produces a false positive — the test passes even if the code stops throwing the expected exception. `expectException()` explicitly asserts the exception occurs.

---

## Bad Example

```php
// False positive — test passes even if exception is never thrown
try {
    $service->charge($user, -100);
} catch (PaymentFailedException $e) {
    // If exception is not thrown, test still passes
}
```

---

## Good Example

```php
// Explicit assertion — test fails if exception is not thrown
$this->expectException(PaymentFailedException::class);
$this->expectExceptionMessage('Negative amounts not allowed.');

$service->charge($user, -100);
```

---

## Exceptions

When testing that an exception is caught and handled at a higher layer, use `Log::spy()` or other assertions on the handling outcome instead of `expectException`.

---

## Consequences Of Violation

Reliability risks: false-positive tests pass when exceptions are no longer thrown. Maintenance risks: code evolves to not throw the expected exception, but tests still pass.

---

## Rule: Test Both with and without Exception Handling

---

## Category

Testing

---

## Rule

Always test exception behavior both with the application's exception handler (default) and bypassing it via `withoutExceptionHandling()`. Never rely on only one approach.

---

## Reason

The default handler tests the full error response flow (status code, view, JSON). `withoutExceptionHandling()` tests that the raw exception type and message are correct. Using only one approach misses either the rendering logic or the exception details.

---

## Bad Example

```php
// Tests only the rendered output — never verifies the exception type
public function test_404()
{
    $response = $this->get('/non-existent');
    $response->assertStatus(404);
    // Handler could be returning 404 for the wrong reason
}
```

---

## Good Example

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

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Reliability risks: a change to the exception class or handler rendering could produce a different status code for the same exception, and the test wouldn't catch it.

---

## Rule: Test That Production Error Pages Do Not Expose Stack Traces

---

## Category

Security

---

## Rule

Always test that production error responses (both HTML and JSON) do not contain stack traces, file paths, or internal class names. Never deploy without verifying this.

---

## Reason

Exposed stack traces in production leak internal application structure to attackers. A layout change or handler refactor could inadvertently include debug data in production responses. Automated tests catch this before deployment.

---

## Bad Example

```php
// No assertion that production responses don't leak details
public function test_500_page()
{
    $response = $this->get('/trigger-500');
    $response->assertStatus(500);
    // Leaked stack trace goes undetected
}
```

---

## Good Example

```php
public function test_500_page_does_not_expose_details()
{
    app()->detectEnvironment(fn () => 'production');

    $response = $this->withoutExceptionHandling()->get('/trigger-500');
    $response->assertStatus(500);
    $response->assertDontSee('Stack Trace');
    $response->assertDontSee('in /var/www/');
    $response->assertDontSee('vendor/laravel');
}

public function test_api_500_does_not_include_trace()
{
    app()->detectEnvironment(fn () => 'production');

    $response = $this->getJson('/api/trigger-500');
    $response->assertStatus(500);
    $response->assertJsonMissing(['trace', 'file', 'line']);
}
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Security risks: attackers discover internal paths and class names. Compliance risks: information disclosure vulnerabilities.

---

## Rule: Use Log::spy() to Assert Logging Behavior Without Writing to Disk

---

## Category

Testing

---

## Rule

Always use `Log::spy()` or `Log::shouldReceive()` to verify logging behavior in tests. Never write assertions against actual log files.

---

## Reason

Testing against log files couples tests to filesystem state, requires cleanup, and fails in parallel test runs. `Log::spy()` provides in-memory assertions that are fast, reliable, and isolated.

---

## Bad Example

```php
// File-based assertion — fragile, slow, run-order dependent
public function test_payment_failure_is_logged()
{
    $service->charge($this->user, 999999);
    $log = file_get_contents(storage_path('logs/laravel.log'));
    $this->assertStringContainsString('Payment failed', $log);
}
```

---

## Good Example

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

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Reliability risks: tests fail in CI due to log file contention. Maintenance risks: tests require log file cleanup and are order-dependent.

---

## Rule: Test Every findOrFail() Path for a 404 Response

---

## Category

Testing

---

## Rule

Always write a "not found" test for every endpoint that uses `findOrFail()`, `firstOrFail()`, or implicit route model binding. Never leave a 404 path untested.

---

## Reason

Without a 404 test, the error response for a missing resource is only tested when a real user encounters it. The 404 response could return HTML to an API client, or a broken view, without any test catching it.

---

## Bad Example

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

---

## Good Example

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

---

## Exceptions

Endpoints that explicitly handle missing resources without exceptions (returning null or empty responses) do not need 404 tests.

---

## Consequences Of Violation

Reliability risks: 404 responses are untested until production. Maintenance risks: a refactored handler behavior breaks 404 responses without detection.

---

## Rule: Test That Expected Exceptions Are NOT Reported at ERROR Level

---

## Category

Testing

---

## Rule

Always write a test verifying that expected exceptions (validation, 404, auth) are not logged at ERROR level. Never assume `dontReport` is working without a test.

---

## Reason

A misconfigured `dontReport` array or a changed base exception class causes expected exceptions to be logged as errors, flooding monitoring dashboards with noise. Automated tests catch configuration drift.

---

## Bad Example

```php
// No assertion about logging level — validation errors might flood ERROR logs
public function test_validation_failure()
{
    $response = $this->postJson('/api/users', []);
    $response->assertStatus(422);
    // Could still be logged as ERROR without test noticing
}
```

---

## Good Example

```php
public function test_handler_does_not_report_validation_exceptions()
{
    Log::spy();

    $response = $this->postJson('/api/users', []);
    $response->assertStatus(422);

    Log::shouldNotHaveReceived('error');
}
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: `dontReport` misconfiguration floods error logs. Reliability risks: real errors are buried under expected-exception noise.

---

## Rule: Include Exception Tests in CI Pipeline

---

## Category

Testing

---

## Rule

Always include exception handling tests in the CI pipeline with the same priority as feature tests. Never treat exception tests as optional or nice-to-have.

---

## Reason

Exception tests catch regressions in error handling that affect every user of the application. A broken 404 handler or a leaked stack trace is a user-facing bug. Skipping exception tests in CI allows these regressions to reach production.

---

## Bad Example

```bash
# Only runs feature tests — no exception tests in CI
vendor/bin/phpunit tests/Feature --no-coverage
```

---

## Good Example

```bash
# Includes all test types
vendor/bin/phpunit tests/Feature tests/Unit tests/Exception
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Reliability risks: broken error handling reaches production without detection. Maintenance risks: developers make changes to handlers without knowing they broke error responses.
