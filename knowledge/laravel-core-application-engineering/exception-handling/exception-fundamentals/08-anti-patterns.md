# Anti-Patterns: Exception Handler Configuration

## 1. The Inline Handler

Configuring exception behavior in controllers instead of the centralized exception handler.

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

Always configure exception handling behavior in the centralized exception handler (`withExceptions()` in Laravel 11+ or `App\Exceptions\Handler` in Laravel 10-). Duplicated error handling across controllers creates inconsistency. A centralized handler ensures every error type has the same behavior regardless of which controller threw it.

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

## 2. The Kitchen Sink Handler

A handler with complex business logic, database calls, external API requests, and dependencies that increase the risk of the handler itself failing.

```php
// Handler with external API call — risk of failure
$exceptions->reportable(function (Throwable $e) {
    Http::post('https://monitoring.example.com/alert', [
        'error' => $e->getMessage(),
    ]);
});
```

If the handler itself throws an exception, Laravel's fallback produces a bare 500 response and the original exception is lost. Keep the handler limited to mapping exception types to responses and adding context to reports. Error tracking SDKs (Sentry, Flare, Bugsnag) are the designed exception.

```php
// Handler delegates reporting — no complex logic
$exceptions->reportable(function (Throwable $e) {
    Log::channel('critical')->error($e->getMessage(), [
        'exception' => get_class($e),
    ]);
});
```

## 3. The Over-Reporting Handler

Reporting every exception type including expected exceptions (validation errors, 404s, authentication failures) at ERROR level.

```php
// $dontReport is empty — every 404 and validation error is logged as ERROR
protected $dontReport = [];
```

Always add expected exceptions to `dontReport`. Expected exceptions are normal application behavior, not errors. Reporting them at ERROR level buries real server errors in log noise and triggers false alerts in monitoring systems.

```php
$exceptions->dontReport([
    AuthenticationException::class,
    ValidationException::class,
    AuthorizationException::class,
    NotFoundHttpException::class,
    ThrottleRequestsException::class,
]);
```

## 4. The Coupled Pipeline

Putting response generation logic inside a `reportable()` callback, or logging logic inside a `renderable()` callback.

```php
// renderable() that also logs — coupling the pipelines
$exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
    Log::warning('404', ['url' => $request->url()]);
    return response()->view('errors.404', [], 404);
});
```

Always treat reporting and rendering as independent pipelines. An exception may be reported without being rendered (handled at service layer) or rendered without being reported (expected 404). Coupling the two forces unnecessary logging or prevents independent handling:

```php
// Independent pipelines
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

## 5. The Missing Global Context

Failing to override the `context()` method on the exception handler, resulting in exception reports that lack request metadata.

```php
// No context override — error reports have no request metadata
```

Without global context, exception reports lack the metadata needed to reproduce and debug errors. Each report must be individually enriched, which is inconsistent and error-prone. Always override `context()` to include `user_id`, `url`, `method`, `ip`, and `request_id` in every exception report:

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
