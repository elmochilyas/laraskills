# Rules for Exception Handler Configuration

---

## Rule: Centralize All Exception Handling in the Handler, Never in Controllers

---

## Category

Code Organization

---

## Rule

Always configure exception handling behavior in the centralized exception handler (`withExceptions()` in Laravel 11+ or `App\Exceptions\Handler` in Laravel 10-). Never put `try/catch` blocks in controllers solely to produce error responses.

---

## Reason

Duplicated error handling across controllers creates inconsistency. A centralized handler ensures every error type has the same behavior regardless of which controller threw it, and keeps controllers focused on request handling.

---

## Bad Example

```php
class UserController
{
    public function show($id)
    {
        try {
            $user = User::findOrFail($id);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Not found'], 404);
        }
    }
}
```

---

## Good Example

```php
// Controller just throws — handler manages the response
class UserController
{
    public function show($id)
    {
        return User::findOrFail($id);
    }
}

// In bootstrap/app.php
$exceptions->renderable(function (ModelNotFoundException $e, Request $request) {
    if ($request->is('api/*')) {
        return response()->json(['error' => ['message' => 'Resource not found.']], 404);
    }
});
```

---

## Exceptions

Domain-level recovery logic (retry alternative flows, circuit breakers) belongs in services with `try/catch`. This rule covers HTTP response rendering only.

---

## Consequences Of Violation

Maintenance risks: inconsistent error responses across controllers. Reliability risks: some endpoints handle errors correctly while others produce raw exceptions.

---

## Rule: Keep the Exception Handler Simple — No Complex Dependencies

---

## Category

Reliability

---

## Rule

Never add database calls, external API requests, or complex business logic to the exception handler. Keep it limited to mapping exception types to responses and adding context to reports.

---

## Reason

If the handler itself throws an exception, Laravel's fallback produces a bare 500 response and the original exception is lost. Complex dependencies increase the risk of handler failure.

---

## Bad Example

```php
// Handler with external API call — risk of failure
$exceptions->reportable(function (Throwable $e) {
    Http::post('https://monitoring.example.com/alert', [
        'error' => $e->getMessage(),
    ]);
});
```

---

## Good Example

```php
// Handler delegates reporting — no complex logic
$exceptions->reportable(function (Throwable $e) {
    Log::channel('critical')->error($e->getMessage(), [
        'exception' => get_class($e),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ]);
});
```

---

## Exceptions

Error tracking SDKs (Sentry, Flare, Bugsnag) are the exception — they are designed to be safe to call from handlers.

---

## Consequences Of Violation

Reliability risks: handler failure causes silent loss of the original exception. Maintenance risks: handler becomes a debugging hotspot.

---

## Rule: Always Configure dontReport for Expected Exceptions

---

## Category

Maintainability

---

## Rule

Always add expected exceptions (validation errors, 404s, authentication failures) to `dontReport`. Never report them at ERROR level.

---

## Reason

Expected exceptions are normal application behavior, not errors. Reporting them at ERROR level buries real server errors in log noise and triggers false alerts in monitoring systems.

---

## Bad Example

```php
// $dontReport is empty — every 404 and validation error is logged as ERROR
protected $dontReport = [];
```

---

## Good Example

```php
// Laravel 11+
$exceptions->dontReport([
    AuthenticationException::class,
    ValidationException::class,
    AuthorizationException::class,
    NotFoundHttpException::class,
    ThrottleRequestsException::class,
]);
```

---

## Exceptions

Applications undergoing security auditing may log 404s at WARNING level (not ERROR) to detect scan patterns. Use `reportable()` callbacks for this, not `dontReport` removal.

---

## Consequences Of Violation

Maintenance risks: real errors are buried in noise. Reliability risks: false alerts desensitize the team to monitoring signals.

---

## Rule: Always Configure shouldRenderJsonWhen for Applications with API Routes

---

## Category

Framework Usage

---

## Rule

Always call `shouldRenderJsonWhen` in the exception handler for any application with API routes. Never rely solely on the `Accept: application/json` header for JSON detection.

---

## Reason

Many HTTP clients (curl, SDKs, mobile apps) omit the `Accept` header. Without explicit route prefix detection, these clients receive HTML error pages they cannot parse.

---

## Bad Example

```php
// No shouldRenderJsonWhen — curl requests to api/* get HTML errors
```

---

## Good Example

```php
$exceptions->shouldRenderJsonWhen(function (Request $request) {
    return $request->is('api/*') || $request->expectsJson();
});
```

---

## Exceptions

Applications with zero API routes do not need this configuration.

---

## Consequences Of Violation

Reliability risks: API clients receive unparseable HTML. Maintenance risks: developers must debug inconsistent error response types.

---

## Rule: Separate Report and Render Pipelines — Never Couple Logging to Response Generation

---

## Category

Architecture

---

## Rule

Always treat reporting and rendering as independent pipelines. Never put response generation logic inside a `reportable()` callback, or logging logic inside a `renderable()` callback.

---

## Reason

An exception may be reported without being rendered (handled at service layer) or rendered without being reported (expected 404). Coupling the two forces unnecessary logging or prevents independent handling.

---

## Bad Example

```php
// renderable() that also logs — coupling the pipelines
$exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
    Log::warning('404', ['url' => $request->url()]);
    return response()->view('errors.404', [], 404);
});
```

---

## Good Example

```php
// Independent pipelines
$exceptions->reportable(function (NotFoundHttpException $e, Request $request) {
    Log::warning('404', ['url' => $request?->url()]);
});

$exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
    if ($request->expectsJson()) {
        return response()->json(['error' => 'Not found'], 404);
    }
    return response()->view('errors.404', [], 404);
});
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: changing rendering behavior accidentally affects reporting. Reliability risks: exceptions may be double-logged or not logged at all.

---

## Rule: Use withExceptions() for Laravel 11+, Handler Class for Laravel 10-

---

## Category

Framework Usage

---

## Rule

Always use the correct API for the Laravel version: `withExceptions()` in `bootstrap/app.php` for Laravel 11+, `App\Exceptions\Handler` with `register()` for Laravel 10 and below. Never mix the two patterns.

---

## Reason

The `Handler` class is not used by default in Laravel 11+. Using it requires manual service container binding and loses the fluent API. The `withExceptions()` closure provides a cleaner, testable interface.

---

## Bad Example

```php
// Laravel 11+ still using old Handler class
// App\Exceptions\Handler still exists and is manually bound
$this->app->singleton(ExceptionHandler::class, Handler::class);
```

---

## Good Example

```php
// Laravel 11+ — use withExceptions()
return Application::configure(basePath: dirname(__DIR__))
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->dontReport([ValidationException::class]);
        $exceptions->renderable(function (Throwable $e) { ... });
    })
    ->create();
```

---

## Exceptions

Applications being upgraded from Laravel 10 to 11 may temporarily keep the `Handler` class during the upgrade. Remove it as soon as all behavior is migrated.

---

## Consequences Of Violation

Maintenance risks: future upgrades require migration. Design risks: mixing patterns causes confusion about where exception configuration lives.

---

## Rule: Add Global Context via context() for All Exception Reports

---

## Category

Maintainability

---

## Rule

Always override the `context()` method on the exception handler to include `user_id`, `url`, `method`, `ip`, and `request_id` in every exception report.

---

## Reason

Without global context, exception reports lack the metadata needed to reproduce and debug errors. Each report must be individually enriched, which is inconsistent and error-prone.

---

## Bad Example

```php
// No context override — error reports have no request metadata
```

---

## Good Example

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

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: debugging production errors requires manual log correlation. Reliability risks: critical debugging context is missing from error tracker entries.
