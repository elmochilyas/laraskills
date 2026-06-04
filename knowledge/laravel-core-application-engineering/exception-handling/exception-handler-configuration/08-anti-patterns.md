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

Always configure handling in the centralized handler. Duplicated error handling creates inconsistency. A centralized handler ensures every error type has the same behavior regardless of which controller threw it.

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

A handler with complex business logic, database calls, and external API requests.

```php
$exceptions->reportable(function (Throwable $e) {
    Http::post('https://monitoring.example.com/alert', [
        'error' => $e->getMessage(),
    ]);
});
```

If the handler throws, the original exception is lost and a bare 500 is returned. Keep handler limited to mapping exceptions to responses and adding context. Error tracking SDKs (Sentry, Flare, Bugsnag) are the designed exception.

```php
$exceptions->reportable(function (Throwable $e) {
    Log::channel('critical')->error($e->getMessage(), [
        'exception' => get_class($e),
    ]);
});
```

## 3. The Over-Reporting Handler

Reporting every exception type including expected exceptions at ERROR level.

```php
protected $dontReport = [];
```

Always add expected exceptions to `dontReport`. Expected exceptions are normal behavior, not errors. Reporting them at ERROR level buries real server errors in noise.

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

Putting response generation inside `reportable()` or logging inside `renderable()`.

```php
$exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
    Log::warning('404', ['url' => $request->url()]);
    return response()->view('errors.404', [], 404);
});
```

Treat reporting and rendering as independent pipelines. An exception may be reported without being rendered or vice versa.

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

## 5. The Missing Global Context

Failing to override `context()` on the handler, resulting in reports that lack request metadata.

Without global context, exception reports lack the metadata needed to reproduce and debug errors. Always override `context()` to include `user_id`, `url`, `method`, `ip`, and `request_id`:

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
