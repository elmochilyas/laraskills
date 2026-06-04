# Exception Handler Configuration

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Exception Handler Configuration
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

## Overview

Laravel's exception handler is the centralized mechanism that catches all uncaught exceptions and determines how they should be reported (logged/notified) and rendered (HTTP response). In Laravel 11+, configuration happens via `withExceptions()` in `bootstrap/app.php`; in Laravel 10 and below, via `App\Exceptions\Handler`.

The engineering value is consistent, predictable error behavior across your entire application. Instead of scattered try/catch blocks, you define once how each exception type should be handled — ensuring 404s always return a 404 view, validation errors always redirect back, and API errors always return JSON.

## Core Concepts

- **Two Pipelines:** The exception handler has two independent pipelines. The reporting pipeline logs/notifies/records the exception. The rendering pipeline generates the HTTP response (view, JSON, redirect). They can be used independently or together.
- **dontReport:** An array of exception classes that should never be logged. Expected exceptions (validation errors, 404s, authentication failures) go here to prevent log noise.
- **reportable():** Register a callback that runs when an exception is reported. Used for custom logging, external error tracking, or notifications.
- **renderable():** Register a callback that runs when an exception is rendered. Used for custom HTTP responses, JSON formatting, or Inertia error components.
- **shouldRenderJsonWhen:** A callback that determines whether exceptions should render as JSON. Essential for applications with API routes.
- **context():** Override to add global metadata (user ID, URL, IP) to all exception reports.

## When To Use

- Every Laravel application — exception handler configuration is not optional
- Applications with API routes must configure `shouldRenderJsonWhen`
- Applications with custom exception types need `renderable()` callbacks
- Applications with domain-specific logging (billing, audit) need `reportable()` callbacks
- All production applications need `dontReport` configured for expected exceptions

## When NOT To Use

- Do NOT use the handler for domain-level recovery logic (retry, alternative flows) — use try/catch in services
- Do NOT add complex business logic to the handler — it must remain simple and reliable
- Do NOT put response generation in `reportable()` or logging in `renderable()` — pipelines must remain independent

## Best Practices

- **Centralize, don't scatter:** Every exception type should have defined behavior in one place. Centralized handling ensures consistency and prevents duplication.
- **Keep the handler simple:** If the handler itself throws, Laravel's fallback produces a bare 500 response. Avoid network calls, complex logic, or dependencies that might fail.
- **Don't report expected exceptions:** Validation errors, 404s, and authentication failures are normal behavior. Reporting them buries real errors in log noise.
- **Independent pipelines:** An exception can be reported without being rendered (caught at service layer) or rendered without being reported (expected 404). Keep them decoupled.

## Architecture Guidelines

- Laravel 11+: use `withExceptions()` in `bootstrap/app.php`
- Laravel 10-: use `App\Exceptions\Handler` with `register()` method
- Configure `dontReport` for expected exceptions (validation, 404, auth)
- Add global context via `context()` method on the Handler
- Register `renderable()` callbacks for custom exception types
- Register `reportable()` callbacks for custom reporting logic
- Keep handler logic simple — avoid dependencies that might fail

## Performance Considerations

Exception handling is not a performance path (exceptions should be exceptional). Creating exception instances is cheap (~0.01ms). Logging and stack trace generation adds cost (~1-5ms). Do NOT use exceptions for control flow. Callback registration traversal is O(n) — keep under 20-30 callbacks for negligible impact.

## Security Considerations

- Never expose stack traces in production error responses
- Configure `dontReport` to avoid logging sensitive exceptions with PII
- If the handler throws, Laravel's fallback returns a bare 500 — no details leaked
- Override `context()` to include request metadata without exposing sensitive fields
- Ensure `shouldRenderJsonWhen` is configured for API routes to prevent HTML leaks

## Common Mistakes

1. **Empty dontReport:** Reporting every exception type (including validation errors and 404s) creates log noise that buries real errors. Always configure `dontReport`.

2. **Handler Exception:** If the handler itself throws, the original exception is lost and a generic 500 is returned. Keep handler logic simple.

3. **Mixed Pipelines:** Putting logging inside `renderable()` or response generation inside `reportable()` couples independent concerns. Keep pipelines separate.

4. **Wrong Version API:** Using `Handler` class in Laravel 11+ (not used by default, requires manual binding) or `withExceptions()` in Laravel 10- (not available). Use the version-appropriate API.

5. **Missing shouldRenderJsonWhen:** API routes without `shouldRenderJsonWhen` return HTML error pages when the `Accept` header is missing. Always configure for API routes.

## Anti-Patterns

- **The Kitchen Sink Handler:** A handler with complex business logic, API calls, and external dependencies. Increases risk of handler failure.
- **The Silent Catch:** `catch (Exception $e) {}` with no logging, reporting, or recovery. The error is invisible.
- **The Over-Reporting Handler:** Reporting every exception including expected 404s and validation errors at ERROR level.

## Examples

### Laravel 11+ withExceptions()
```php
// bootstrap/app.php
return Application::configure(basePath: dirname(__DIR__))
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->dontReport([
            AuthenticationException::class,
            ValidationException::class,
        ]);

        $exceptions->reportable(function (Throwable $e) {
            if ($e instanceof PaymentFailedException) {
                Log::channel('billing')->error($e->getMessage(), $e->context());
            }
        });

        $exceptions->renderable(function (PaymentFailedException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['error' => $e->getMessage()], 422);
            }
        });

        $exceptions->shouldRenderJsonWhen(function (Request $request) {
            return $request->is('api/*') || $request->expectsJson();
        });
    })
    ->create();
```

### Handler Class (Laravel 10-)
```php
class Handler extends ExceptionHandler
{
    protected $dontReport = [
        AuthenticationException::class,
        ValidationException::class,
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) { /* custom reporting */ });
        $this->renderable(function (CustomException $e, Request $request) {
            return response()->view('errors.custom', [], $e->getStatusCode());
        });
    }
}
```

### Global Context Enrichment
```php
protected function context(): array
{
    return [
        'user_id' => auth()->id(),
        'url' => request()?->fullUrl(),
        'method' => request()?->method(),
        'ip' => request()?->ip(),
        'request_id' => request()?->header('X-Request-Id'),
    ];
}
```

## Related Topics

- **Custom Exception Classes** — defining domain-specific exceptions
- **HTTP Exception Rendering** — 404, 403, 500 handling
- **JSON Error Formatting** — API error responses
- **Validation Error Formatting** — form validation error responses
- **Production vs Debug Display** — environment-specific handling

## AI Agent Notes

- Use `withExceptions()` for Laravel 11+, `Handler` class for Laravel 10-
- Configure `dontReport` for expected exceptions (validation, 404, auth)
- Always configure `shouldRenderJsonWhen` for API routes
- Keep handler logic simple — no complex dependencies
- Register `renderable()` callbacks for each custom exception type
- Add global context via `context()` method
