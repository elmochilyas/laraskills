# Global Exception Handling

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Global Exception Handling
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Global exception handling in Laravel encompasses the complete lifecycle: how exceptions are caught, classified, reported, and rendered. It covers the Handler configuration, reportable/renderable callbacks, Ignition integration (Laravel 10 and below), and the `withExceptions()` API in Laravel 11+.

The engineering value is a comprehensive, predictable error handling strategy that covers every exception type — from expected validation errors to unexpected server crashes — with appropriate responses for every request type (HTML, JSON, Inertia, API).

---

## Core Concepts

### The Handler Lifecycle

1. Exception is thrown (anywhere in the application)
2. Laravel's exception handler catches it
3. `shouldReport()` checks if the exception type should be reported
4. `report()` calls registered `reportable()` callbacks (or default log)
5. `shouldRender()` checks if render callbacks exist for this type
6. `render()` calls registered `renderable()` callbacks (or returns default error response)
7. If no callback matches: default error page or JSON response

### Laravel 11+ withExceptions()

Laravel 11 moved exception handling from a class to `bootstrap/app.php`:

```php
// bootstrap/app.php
return Application::configure(basePath: dirname(__DIR__))
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->dontReport([
            \Illuminate\Auth\AuthenticationException::class,
            \Illuminate\Validation\ValidationException::class,
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

---

## Mental Models

### The Exception Router

Think of the handler as a router for exceptions. Each route (exception type) maps to a handler (reportable/renderable callback). If no route matches, a default handler sends a 500 response. You configure routes in advance so every exception type has a defined behaviour.

### The Intelligent Filter

The handler filters exceptions: some are worth reporting (server errors, payment failures), others are expected and silently ignored (validation errors, 404s). The `dontReport` list is the filter configuration.

---

## Internal Mechanics

### shouldReport Logic

```php
protected function shouldReport(Throwable $e): bool
{
    // Check dontReport array
    foreach ($this->dontReport as $type) {
        if ($e instanceof $type) {
            return false;
        }
    }

    // Check reportable callbacks — if any returns a response, it counts as reported
    foreach ($this->reportableCallbacks as $callback) {
        $response = $callback($e);
        if ($response !== null) {
            return true;
        }
    }

    return true; // Default: report
}
```

### shouldRenderJson Logic

```php
public function shouldRenderJson(Request $request, Throwable $e): bool
{
    // Check shouldRenderJsonWhen callback
    if ($this->renderJsonCallback && ($this->renderJsonCallback)($request)) {
        return true;
    }

    // Default: request expects JSON
    return $request->expectsJson();
}
```

### Context Enrichment

```php
// Handler class
protected function context(): array
{
    return [
        'user_id' => auth()->id(),
        'url' => request()?->url(),
        'method' => request()?->method(),
        'ip' => request()?->ip(),
    ];
}
```

All exception reports automatically include this context.

---

## Patterns

### Conditional Reporting

```php
// Only report specific exceptions in production
$this->reportable(function (NotFoundHttpException $e) {
    if (app()->environment('production')) {
        Log::warning('404', ['url' => request()->url()]);
    }
});
```

### Environment-Specific Handling

```php
$this->renderable(function (Throwable $e, Request $request) {
    if (app()->environment('local')) {
        // Show detailed error in development
        return;
    }

    // Production: generic response
    return response()->view('errors.500', [], 500);
});
```

### Inertia Exception Rendering

```php
$this->renderable(function (NotFoundHttpException $e, Request $request) {
    if ($request->inertia()) {
        return Inertia::render('Errors/NotFound')->toResponse($request);
    }
});

$this->renderable(function (AuthorizationException $e, Request $request) {
    if ($request->inertia()) {
        return Inertia::render('Errors/Forbidden')->toResponse($request);
    }
});
```

### API Exception Responses

```php
$this->renderable(function (Throwable $e, Request $request) {
    if ($request->is('api/*')) {
        $status = $this->isHttpException($e) ? $e->getStatusCode() : 500;
        return response()->json([
            'error' => [
                'message' => $e->getMessage(),
                'type' => class_basename($e),
            ],
        ], $status);
    }
});
```

---

## Architectural Decisions

### Handler Class (Laravel 10-) vs withExceptions (Laravel 11+)

| Concern | Handler Class | withExceptions |
|---|---|---|
| Location | `app/Exceptions/Handler.php` | `bootstrap/app.php` |
| Syntax | Class with methods | Closure-based API |
| Flexibility | Extends framework class | Fluent configuration |
| IDE support | Standard PHP class | Closure in app bootstrap |
| Upgrade path | Removed in Laravel 11 | New default |

### Log Levels per Exception

```php
protected $levels = [
    \Illuminate\Auth\AuthenticationException::class => LogLevel::INFO,
    \Illuminate\Validation\ValidationException::class => LogLevel::INFO,
    \App\Exceptions\PaymentFailedException::class => LogLevel::ERROR,
    \Symfony\Component\HttpKernel\Exception\HttpException::class => LogLevel::WARNING,
    \Throwable::class => LogLevel::CRITICAL,
];
```

---

## Tradeoffs

| Concern | Centralized Handler | Scattered try/catch |
|---|---|---|
| Consistency | High | Low |
| Visibility | Hidden (magic) | Explicit |
| Maintainability | One file to change | Many files to change |
| Complexity for simple cases | Overkill | Natural |
| Recovery logic | Limited (post-error) | Full (alternative paths) |

---

## Performance Considerations

Global exception handling is not a hot path. The handler adds minimal overhead (~0.1ms per exception). `shouldRenderJsonWhen` and `shouldReport` checks are O(n) over the registered callbacks — keep callback count under 20-30 for negligible impact.

---

## Production Considerations

- Always configure `shouldRenderJsonWhen` for API routes to ensure JSON responses
- Never report expected exceptions (validation errors, 404s)
- Monitor exception rates with alerting (PagerDuty, Opsgenie) for critical exception types
- Add global context (user ID, request ID) to all exception reports
- Test exception handler behaviour with integration tests for each request type
- Use environment-specific error pages: detailed in local, branded in production
- Log exceptions with a consistent structured format (JSON) for log aggregation

---

## Common Mistakes

### Over-Reporting

```php
protected $dontReport = []; // Reports everything, including 404s and validation errors
```

Log noise buries real errors. Filter expected exceptions.

### Missing API Error Responses

An API endpoint throws an exception. The handler returns HTML (default). The API client can't parse it. Configure `shouldRenderJsonWhen` or check `$request->is('api/*')`.

### renderable Callback Returns Void

```php
// Bad — void return means "no handler found", falls through to default
$this->renderable(function (MyException $e) {
    Log::warning($e->getMessage());
});

// Good — return a response to indicate handled
$this->renderable(function (MyException $e) {
    Log::warning($e->getMessage());
    return response()->json(['error' => $e->getMessage()], 400);
});
```

---

## Failure Modes

### Handler Throws Exception

If the handler itself throws an exception during `report()` or `render()`, Laravel's fallback handler catches it and returns a generic 500 response. The original exception is lost. Keep handler logic simple.

### Unhandled Exception Type

A new exception type is added but no `renderable()` callback is registered. The handler returns the default 500 error page. Users see a generic server error. Mitigate: add a catch-all `renderable()` for custom domain exceptions.

### Silent Failures

An exception in a queued job kills the job. The framework retries (max attempts). After exhausting retries, it's moved to `failed_jobs`. If the exception is not reported, no one knows it failed. Always report queue job exceptions.

---

## Ecosystem Usage

### Laravel Telescope

Telescope provides a dedicated exception watcher that captures every exception with full context, making it easy to inspect handler behaviour during development.

### Ignition

Ignition integrates with the handler to provide detailed error pages with solutions, request context, and the ability to share errors with Flare.

### Sentry / Flare

Both services provide direct integration with Laravel's handler to automatically report exceptions. Flare specifically integrates with Ignition for local-to-production error tracking.

### Inertia.js

The Inertia adapter provides built-in error handling patterns that work with the global handler to render Inertia error components for HTTP errors.

---

## Related Knowledge Units

- **Exception Fundamentals** (this workspace) — base handler concepts
- **Custom Exception Classes** (this workspace) — exceptions the handler manages
- **HTTP Exceptions** (this workspace) — HTTP-specific rendering
- **API Exception Handling** (this workspace) — JSON error response formatting
- **Exception Logging & Reporting** (this workspace) — error tracking integration
- **Exception Testing** (this workspace) — testing handler behaviour

---

## Research Notes

- Laravel 11+ uses `withExceptions()` in `bootstrap/app.php` — the Handler class approach is deprecated
- `shouldRenderJsonWhen()` accepts a closure that determines API vs HTML responses
- `context()` method on the Handler adds global data to all exception reports
- `$levels` property maps exception classes to log levels
- `$dontflash` property prevents input from being flashed to session on specific exception types
- `report()` method can be overridden entirely for complete control
- `renderForConsole()` method handles Artisan command exceptions
- Inertia requests are detected via `$request->inertia()` (or `Inertia::getShared('errors')`)
