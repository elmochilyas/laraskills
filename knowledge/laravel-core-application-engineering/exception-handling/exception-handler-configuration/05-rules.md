# Rules for Exception Handler Configuration

---

## Rule: Use the Version-Appropriate Handler API

---

## Category

Framework Usage

---

## Rule

Always use the exception handler API appropriate for the Laravel version. Use `withExceptions()` in `bootstrap/app.php` for Laravel 11+. Use `App\Exceptions\Handler` with `register()` for Laravel 10 and below.

---

## Reason

The Handler class is not used by default in Laravel 11+. Using it requires manual service container binding and loses the fluent API. The `withExceptions()` closure provides a cleaner, testable interface.

---

## Bad Example

```php
// Laravel 11+ still using old Handler class with manual binding
$this->app->singleton(ExceptionHandler::class, Handler::class);
```

---

## Good Example

```php
// Laravel 11+ uses withExceptions()
return Application::configure(basePath: dirname(__DIR__))
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->dontReport([ValidationException::class]);
        $exceptions->renderable(function (Throwable $e) { ... });
    })
    ->create();
```

---

## Exceptions

Applications mid-upgrade from Laravel 10 to 11 may temporarily keep the Handler class. Migrate to `withExceptions()` as soon as all behavior is replicated.

---

## Consequences Of Violation

Maintenance risks: future upgrades require migration. Design risks: mixing patterns causes confusion about where exception configuration lives.

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

Expected exceptions are normal application behavior, not errors. Reporting them at ERROR level buries real server errors and triggers false alerts.

---

## Bad Example

```php
protected $dontReport = [];
```

---

## Good Example

```php
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

Applications under security audit may log 404s at WARNING level via `reportable()` callbacks to detect scan patterns.

---

## Consequences Of Violation

Real errors are buried in log noise. False alerts desensitize the team to monitoring signals.

---

## Rule: Keep the Handler Simple — No Complex Dependencies

---

## Category

Reliability

---

## Rule

Never add database calls, external API requests, or complex business logic to the exception handler. Keep it limited to mapping exception types to responses and adding context.

---

## Reason

If the handler itself throws, Laravel's fallback produces a bare 500 response and the original exception is lost. Complex dependencies increase the risk of handler failure.

---

## Bad Example

```php
$exceptions->reportable(function (Throwable $e) {
    Http::post('https://monitoring.example.com/alert', ['error' => $e->getMessage()]);
});
```

---

## Good Example

```php
$exceptions->reportable(function (Throwable $e) {
    Log::channel('critical')->error($e->getMessage(), [
        'exception' => get_class($e),
        'file' => $e->getFile(),
    ]);
});
```

---

## Exceptions

Error tracking SDKs (Sentry, Flare, Bugsnag) are designed to be safe to call from handlers.

---

## Consequences Of Violation

Handler failure causes silent loss of the original exception. The handler becomes a debugging hotspot.

---

## Rule: Separate Report and Render Pipelines

---

## Category

Architecture

---

## Rule

Always treat reporting and rendering as independent pipelines. Never put response generation inside `reportable()` or logging inside `renderable()`.

---

## Reason

An exception may be reported without being rendered (handled at service layer) or rendered without being reported (expected 404). Coupling the two forces unnecessary logging or prevents independent handling.

---

## Bad Example

```php
$exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
    Log::warning('404', ['url' => $request->url()]);
    return response()->view('errors.404', [], 404);
});
```

---

## Good Example

```php
$exceptions->reportable(function (NotFoundHttpException $e) {
    Log::warning('404', ['url' => request()?->url()]);
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

Changing rendering behavior accidentally affects reporting. Exceptions may be double-logged or not logged at all.

---

## Rule: Always Configure shouldRenderJsonWhen for Applications with API Routes

---

## Category

Framework Usage

---

## Rule

Always call `shouldRenderJsonWhen` for any application with API routes. Never rely solely on the `Accept: application/json` header for JSON detection.

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

API clients receive unparseable HTML. Developers must debug inconsistent error response types.

---

## Rule: Add Global Context via context() for All Exception Reports

---

## Category

Maintainability

---

## Rule

Always override the `context()` method to include `user_id`, `url`, `method`, `ip`, and `request_id` in every exception report.

---

## Reason

Without global context, exception reports lack the metadata needed to reproduce and debug errors. Each report must be individually enriched, which is inconsistent.

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

Debugging production errors requires manual log correlation. Critical debugging context is missing from error tracker entries.
