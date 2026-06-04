# Production vs Debug Display

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Production vs Debug Display
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

## Overview

Global exception handling in Laravel encompasses the complete lifecycle: how exceptions are caught, classified, reported, and rendered. A critical aspect is the difference between debug mode (development) and production mode behavior. In debug mode, detailed error pages with stack traces, request context, and solutions are shown. In production, generic error pages hide internals to prevent information leakage.

The engineering value is appropriate error detail per environment — maximum debugging information for developers, minimal information leakage for production users. The APP_DEBUG flag and environment detection control this behavior.

## Core Concepts

- **The Handler Lifecycle:** Exception thrown → `shouldReport()` check → `report()` with callbacks → `shouldRender()` check → `render()` with callbacks → default error page/JSON if no callback matches.
- **Laravel 11+ withExceptions():** Exception handling configured via fluent API in `bootstrap/app.php`. Replaces the Handler class approach from Laravel 10-.
- **shouldRenderJson Logic:** Checks `shouldRenderJsonWhen` callback, then falls back to `$request->expectsJson()`. Determines JSON vs HTML response.
- **Context Enrichment:** `context()` method adds global data (user ID, URL, IP) to all exception reports. Override to add application-specific context.
- **Log Levels per Exception:** Map exception classes to log levels via `$levels` property. Validation errors at INFO, payment failures at ERROR, unknown exceptions at CRITICAL.

## When To Use

- Debug mode (APP_DEBUG=true) for local development and staging environments
- Production mode (APP_DEBUG=false) for all production environments
- Environment-specific `renderable()` callbacks when different behavior is needed per environment
- Conditional reporting to suppress noisy exceptions in production

## When NOT To Use

- Do NOT run production with APP_DEBUG=true — exposes sensitive application details
- Do NOT use debug mode on public-facing staging environments accessible to external users
- Do NOT report expected exceptions at ERROR level — use INFO or WARNING
- Do NOT suppress all errors in production — critical failures must still be reported

## Best Practices (WHY)

- **Why separate debug and production behavior:** Debug mode provides maximum information for debugging. Production mode protects users and the application from information leakage.
- **Why use environment-specific error pages:** Detailed error information in development helps debugging. Generic branded pages in production protect security while maintaining user experience.
- **Why filter expected exceptions:** Log noise buries real errors. Validation errors, 404s, and auth failures are expected — don't report them as errors.
- **Why keep handler logic simple:** If the handler throws an exception during report/render, the original exception is lost. The handler must be reliable under all conditions.

## Architecture Guidelines

- Configure `shouldRenderJsonWhen` for API routes to ensure JSON error responses
- Never report expected exceptions (validation errors, 404s) at ERROR level
- Add global context (user ID, request ID) to all exception reports
- Test exception handler behavior with integration tests for each request type
- Use environment-specific error pages: detailed in local, branded in production
- Log exceptions with structured format (JSON) for log aggregation

## Performance

Global exception handling is not a hot path. The handler adds minimal overhead (~0.1ms per exception). `shouldRenderJsonWhen` and `shouldReport` checks are O(n) over registered callbacks — keep callback count under 20-30 for negligible impact.

## Security

- Never expose stack traces, file paths, or internal error details in production
- `APP_DEBUG=true` in production exposes full application internals — verify it's always false
- Ignition debug pages (Laravel 10) show environment variables, query logs, and request data — never enable in production
- In production, use generic error messages that do not reveal internal state

## Common Mistakes

1. **APP_DEBUG=true in Production:** Exposes sensitive application details (DB credentials, API keys, file paths) to any user triggering an error.

2. **Over-Reporting:** `$dontReport = []` reports everything including 404s and validation errors. Log noise buries real server errors.

3. **Missing API Error Responses:** API endpoint throws an exception and gets HTML back. Configure `shouldRenderJsonWhen` or check `$request->is('api/*')`.

4. **renderable Callback Returns Void:** A `renderable()` that calls `Log::warning()` but doesn't return a response. The handler falls through to the default, which may render HTML for an API request.

## Anti-Patterns

- **The Debug-in-Production Leak:** APP_DEBUG=true in production. Stack traces, environment variables, and query logs visible to users. Exposes the application to attack.
- **The Over-Reporting Handler:** Reporting every exception including expected 404s and validation errors. Logs are 95% noise, making it impossible to identify real failures.
- **The Silent Production Fail:** A handler that swallows exceptions in production without logging or alerting. Failures go undetected until users report them.
- **The Complex Handler:** A handler with database calls, external API requests, or complex business logic. Increases the risk of the handler itself failing.

## Examples

### Environment-Specific Error Page
```php
$exceptions->renderable(function (Throwable $e, Request $request) {
    if ($request->is('api/*')) {
        $message = app()->environment('local')
            ? $e->getMessage()
            : 'An unexpected error occurred.';

        return response()->json(['error' => ['message' => $message, 'type' => 'server_error']], 500);
    }
});
```

### Log Levels per Exception
```php
protected $levels = [
    AuthenticationException::class => LogLevel::INFO,
    ValidationException::class => LogLevel::INFO,
    PaymentFailedException::class => LogLevel::ERROR,
    HttpException::class => LogLevel::WARNING,
    Throwable::class => LogLevel::CRITICAL,
];
```

### Conditional Reporting
```php
$exceptions->reportable(function (NotFoundHttpException $e) {
    if (app()->environment('production')) {
        Log::warning('404', ['url' => request()->url()]);
    }
});
```

### Context Enrichment
```php
protected function context(): array
{
    return [
        'user_id' => auth()->id(),
        'url' => request()?->url(),
        'method' => request()?->method(),
        'ip' => request()?->ip(),
        'request_id' => request()?->header('X-Request-Id'),
    ];
}
```

## Related Topics

- **Exception Handler Configuration** — base handler concepts
- **Custom Exceptions** — exceptions the handler manages
- **HTTP Exception Rendering** — HTTP-specific rendering
- **JSON Error Formatting** — JSON error response formatting
- **Error Tracking Integration** — error tracking services

## AI Agent Notes

- Ensure APP_DEBUG=false in production environments
- Use environment-appropriate error pages: detailed in local, branded in production
- Configure `shouldRenderJsonWhen` for API routes
- Register a catch-all `renderable()` for `Throwable` in production
- Add global context via `context()` method
- Set appropriate log levels per exception type
- Never expose stack traces in production responses

## Verification

- [ ] APP_DEBUG=false in production environments
- [ ] Error pages are environment-appropriate (detailed in local, generic in production)
- [ ] `shouldRenderJsonWhen` is configured for API routes
- [ ] Catch-all `renderable()` exists for `Throwable` in production
- [ ] Global context is added via `context()` method
- [ ] Expected exceptions are filtered from ERROR-level reporting
- [ ] Handler logic is simple and avoids complex dependencies
- [ ] log levels are set appropriately per exception type
