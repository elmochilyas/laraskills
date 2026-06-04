# Exception Handling Fundamentals

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Exception Fundamentals
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Laravel's exception handling is built on a centralized `Handler` class (`App\Exceptions\Handler`) that catches all uncaught exceptions and determines the appropriate response. The handler can report exceptions (log/report), render exceptions (HTTP response), and customize behaviour per exception type.

The engineering value is consistent, predictable error responses across your entire application. Instead of try/catch in every controller, you configure how each exception type should be handled in one place. This ensures 404s always return a 404 view, validation errors always redirect back, and API errors always return JSON.

---

## Core Concepts

### The Exception Handler

```php
// app/Exceptions/Handler.php
namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontReport = [
        \Illuminate\Auth\AuthenticationException::class,
        \Illuminate\Auth\Access\AuthorizationException::class,
        \Symfony\Component\HttpKernel\Exception\HttpException::class,
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            // Custom reporting logic
        });

        $this->renderable(function (CustomException $e, Request $request) {
            return response()->view('errors.custom', [], $e->getStatusCode());
        });
    }
}
```

### Reporting vs Rendering

| Concern | Reporting | Rendering |
|---|---|---|
| Purpose | Log, notify, record | Generate HTTP response |
| Default behaviour | `log` (Laravel logging stack) | Error page or JSON |
| Customization | `reportable()` method | `renderable()` method |
| Stopping propagation | `return false` in reportable | Returning a response |

### Exception Types

| Exception | HTTP Code | Default Handling |
|---|---|---|
| `ModelNotFoundException` | 404 | 404 error page |
| `AuthenticationException` | 401 | Redirect to login |
| `AuthorizationException` | 403 | 403 error page |
| `ValidationException` | 422 | Redirect back with errors |
| `HttpException` | (varies) | Error page for the code |
| `ThrottleRequestsException` | 429 | 429 error page |

---

## Mental Models

### The Safety Net

Think of the exception handler as a safety net. Every uncaught exception falls into the handler. It then routes the exception to the right action: log it, render an error response, ignore it, or notify the team. Nothing should escape without being handled.

### The Two Pipelines

- **Report pipeline**: Exception → `report()` → logging system (or Sentry, Flare, etc.)
- **Render pipeline**: Exception → `render()` → HTTP response (view, JSON, redirect)

The two pipelines are independent. An exception can be reported but not rendered (if caught higher up), or rendered but not reported (if it's a common expected error like 404).

---

## Internal Mechanics

### Boot Sequence

1. Laravel boots the framework
2. `bootstrap/app.php` registers `App\Exceptions\Handler` as the exception handler
3. During `register()`, `reportable()` and `renderable()` callbacks are collected
4. When an exception occurs:
   - `Handler->report()` iterates reportable callbacks; if any returns a Response, reporting stops
   - `Handler->render()` iterates renderable callbacks; if any returns a Response, it's sent to the client
   - If no custom callback matches, default behaviour runs

### Default Rendering

Laravel checks the request's `ExpectsJson()` method. If the request expects JSON (API, Inertia, AJAX), the error response is JSON. Otherwise, it's an HTML error view (`errors/{code}.blade.php`).

---

## Patterns

### Custom Exception Classes

```php
namespace App\Exceptions;

use Exception;

class PaymentFailedException extends Exception
{
    public function __construct(
        string $message = 'Payment processing failed',
        int $code = 422,
        public readonly ?array $context = null,
    ) {
        parent::__construct($message, $code);
    }
}
```

### Handling in the Handler

```php
// Handler's register() method
$this->renderable(function (PaymentFailedException $e, Request $request) {
    if ($request->expectsJson()) {
        return response()->json([
            'error' => $e->getMessage(),
            'context' => $e->context,
        ], $e->getCode());
    }

    return back()->with('error', $e->getMessage());
});
```

### Ignoring Specific Exceptions

```php
protected $internalDontReport = [
    \Illuminate\Auth\AuthenticationException::class,
    \Illuminate\Validation\ValidationException::class,
];
```

---

## Architectural Decisions

### Centralized vs Inline Handling

| Concern | Centralized (Handler) | Inline (try/catch) |
|---|---|---|
| Consistency | High (one place) | Low (per-controller) |
| Duplication | None | High |
| Flow clarity | Hidden (magic) | Explicit (visible) |
| Exception type | Best for HTTP exceptions | Best for domain exceptions |

Use the Handler for HTTP-layer concerns (404, 403, 500). Use try/catch for domain-level decisions (retry logic, alternative flows).

---

## Tradeoffs

| Concern | Custom Exception Classes | Generic Exception |
|---|---|---|
| Type safety | Catch specific types | Catch Throwable or Exception |
| Debugging | Clear type = clear origin | Must inspect message/code |
| Handler customization | Simple (type-based matching) | Conditional logic |
| Class explosion | N exception classes | 1 exception class |

---

## Performance Considerations

Exception handling is not a performance path (exceptions should be exceptional). Creating exception instances is cheap (~0.01ms). Logging and stack trace generation adds cost (~1-5ms). Do NOT use exceptions for control flow.

---

## Production Considerations

- Configure an external error tracker (Sentry, Flare, Bugsnag) early
- Never report expected exceptions (validation errors, authentication failures)
- Log all unexpected exceptions with full stack traces
- Use log levels appropriately: `error` for 500s, `warning` for 4xx, `info` for handled errors
- Customize error pages (`resources/views/errors/*.blade.php`) for your brand
- Test the exception handler with integration tests
- Monitor exception rates — a spike indicates a bug or attack

---

## Common Mistakes

### Swallowing Exceptions

```php
// Bad — silently swallows errors
try {
    $this->processPayment();
} catch (Exception $e) {
    // Nothing — error is invisible
}

// Good — log and handle
try {
    $this->processPayment();
} catch (PaymentException $e) {
    Log::error('Payment failed', ['error' => $e->getMessage()]);
    throw $e; // Or recover gracefully
}
```

### Not Differentiating Exception Types

```php
$report = [
    'all' => true, // Reports validation errors, auth failures, everything
];
```

Only report exceptions that indicate a bug or infrastructure issue. Don't report expected application errors.

---

## Failure Modes

### Handler Exception

If the exception handler itself throws an exception, Laravel's fallback handler produces a plain 500 response. Always keep the handler simple — avoid network calls, complex logic, or dependencies that might fail.

### Infinite Report Loop

A `reportable()` callback that calls `Log::error()` and `Log::error()` itself throws an exception → infinite loop. Wrap custom reporting in try/catch.

---

## Ecosystem Usage

### Laravel Telescope

Telescope's exception watcher provides a real-time view of all exceptions thrown during requests, including their context and stack traces.

### Ignition

Ignition provides detailed error pages during development with stack traces, request context, and solutions for common exceptions.

### Sentry / Flare / Bugsnag

Error tracking services integrate with Laravel's exception handler to capture production errors and provide alerting, trending, and debugging tools.

### Laravel Debugbar

The debugbar displays exception information during development, including the last exception thrown and its context.

---

## Related Knowledge Units

- **Custom Exception Classes** (this workspace) — defining domain-specific exceptions
- **Global Exception Handling** (this workspace) — advanced handler customization
- **HTTP Exceptions** (this workspace) — 404, 403, 500 handling
- **Validation Exceptions** (this workspace) — form request validation errors
- **API Exception Handling** (this workspace) — JSON error responses
- **Exception Logging & Reporting** (this workspace) — error tracking integration
- **Exception Testing** (this workspace) — testing exception-driven behaviour

---

## Research Notes

- Laravel's exception handler extends `Illuminate\Foundation\Exceptions\Handler`
- `report()` and `render()` are the core methods to customize
- `$dontReport` property lists exceptions to silently ignore
- `$internalDontReport` (in recent versions) extends the ignored list
- `register()` is the modern way to add reportable/renderable callbacks (replacing `$dontReport` property)
- `context()` method in the Handler can add global context to all exception reports
- `shouldntReport()` is a method alternative to `$dontReport` property
- Laravel 11+ uses `withExceptions()` in `bootstrap/app.php` instead of a Handler class
