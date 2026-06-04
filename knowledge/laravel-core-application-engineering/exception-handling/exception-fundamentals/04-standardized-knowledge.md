# Exception Handler Configuration

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Exception Handler Configuration
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

## Overview

Laravel's exception handling is built on a centralized handler that catches all uncaught exceptions and determines the appropriate response. The handler can report exceptions (log/report), render exceptions (HTTP response), and customize behavior per exception type. In Laravel 11+, this is configured via `withExceptions()` in `bootstrap/app.php`; in Laravel 10 and below, via `App\Exceptions\Handler`.

The engineering value is consistent, predictable error responses across your entire application. Instead of try/catch in every controller, you configure how each exception type should be handled in one place. This ensures 404s always return a 404 view, validation errors always redirect back, and API errors always return JSON.

## Core Concepts

- **The Exception Handler:** Centralized class or closure that receives all uncaught exceptions. Two pipelines: Report (log/report/notify) and Render (generate HTTP response).
- **Reporting vs Rendering:** Reporting logs/notifies/records the exception. Rendering generates the HTTP response (view, JSON, redirect). The two pipelines are independent.
- **Built-in Exception Types:** `ModelNotFoundException` (404), `AuthenticationException` (401 → redirect to login), `AuthorizationException` (403), `ValidationException` (422 → redirect back), `HttpException` (varies), `ThrottleRequestsException` (429).
- **Laravel 11+ withExceptions():** Exception handling configured in `bootstrap/app.php` using fluent API: `dontReport`, `reportable`, `renderable`, `shouldRenderJsonWhen`.
- **Boot Sequence:** Laravel boots → registers Handler via `bootstrap/app.php` → `register()` collects reportable/renderable callbacks → exceptions are dispatched through the pipeline.

## When To Use

- Always — the exception handler should be configured for every Laravel application
- Configure `shouldRenderJsonWhen` for any application with API routes
- Register `renderable()` callbacks for custom exception types
- Add global context via `context()` method for all exception reports

## When NOT To Use

- Do NOT put try/catch in every controller as a replacement for handler configuration
- Do NOT use the handler for domain-level recovery logic (retry, alternative flows) — use try/catch in services
- Do NOT add complex business logic to the handler — it must remain simple and reliable

## Best Practices (WHY)

- **Why centralized handling:** Consistency — every exception type has defined behavior in one place. No duplication across controllers.
- **Why keep the handler simple:** If the handler itself throws an exception, Laravel's fallback produces a bare 500 response. Avoid network calls, complex logic, or dependencies that might fail.
- **Why not report expected exceptions:** Validation errors, 404s, and authentication failures are expected behavior. Reporting them buries real errors in log noise.
- **Why separate report and render pipelines:** An exception can be reported but not rendered (caught higher up), or rendered but not reported (common expected error like 404). Independent pipelines give flexibility.

## Architecture Guidelines

- Laravel 11+: use `withExceptions()` in `bootstrap/app.php`
- Laravel 10-: use `App\Exceptions\Handler` with `register()` method
- Configure `dontReport` for expected exceptions (validation, 404, auth)
- Add global context via `context()` method on the Handler
- Register `renderable()` callbacks for custom exception types
- Register `reportable()` callbacks for custom reporting logic
- Keep handler logic simple — avoid dependencies that might fail

## Performance

Exception handling is not a performance path (exceptions should be exceptional). Creating exception instances is cheap (~0.01ms). Logging and stack trace generation adds cost (~1-5ms). Do NOT use exceptions for control flow.

## Security

- Never expose stack traces in production error responses
- Configure `dontReport` to avoid logging sensitive exceptions with PII
- If the handler throws, Laravel's fallback returns a bare 500 — no details leaked
- Override `context()` to include request metadata without exposing sensitive fields

## Common Mistakes

1. **Swallowing Exceptions:** A try/catch that silently ignores errors. The error is invisible — no log, no report, no recovery. Always log and handle or re-throw.

2. **Not Differentiating Exception Types:** Reporting every exception type (including validation errors and 404s) creates log noise that buries real errors.

3. **Handler Exception:** If the handler itself throws, the original exception is lost and a generic 500 is returned. Keep handler logic simple.

4. **Over-Reporting:** `$dontReport = []` reports everything including expected exceptions. Log noise drowns out real server errors.

## Anti-Patterns

- **The Silent Catch:** `catch (Exception $e) {}` with no logging, reporting, or recovery. The error is invisible — no debugging possible.
- **The Kitchen Sink Handler:** A handler with complex business logic, API calls, and external dependencies. Increases risk of the handler itself failing.
- **The Inline Handler:** Configuring exception behavior in controllers instead of the centralized handler. Creates duplication and inconsistency.

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

## Verification

- [ ] `dontReport` includes expected exceptions (validation, 404, auth)
- [ ] `shouldRenderJsonWhen` is configured for API routes
- [ ] `renderable()` callbacks exist for all custom exception types
- [ ] Global context is configured via `context()` method
- [ ] Handler logic is simple with no complex dependencies
- [ ] Laravel 11+ uses `withExceptions()`; Laravel 10- uses Handler class
- [ ] Expected exceptions are not over-reported
