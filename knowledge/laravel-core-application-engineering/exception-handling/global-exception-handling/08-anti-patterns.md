# Anti-Patterns: Production vs Debug Display

## 1. The Debug-in-Production Leak

Running production with `APP_DEBUG=true`, exposing stack traces, environment variables, database credentials, API keys, and query logs to any user who triggers an error.

```bash
# .env.production
APP_DEBUG=true
APP_ENV=production
```

This is the most common Laravel security misconfiguration. `APP_DEBUG=true` exposes full application internals to attackers — DB credentials, API keys, file paths, and query logs. Always ensure `APP_DEBUG=false` in all production environments. Never set it to `true` even temporarily for debugging. Use error tracking services (Sentry, Flare) or a dedicated staging environment instead.

## 2. The Over-Reporting Handler

Reporting every exception including expected 404s, validation errors, and authentication failures at ERROR level.

```php
// All exceptions reported at ERROR level — 95% noise
protected $levels = [
    ValidationException::class => LogLevel::ERROR,
    NotFoundHttpException::class => LogLevel::ERROR,
    AuthenticationException::class => LogLevel::ERROR,
];
```

Expected exceptions are normal application flow, not system failures. Reporting them as errors creates log noise, triggers false alerts, and buries real server errors that need attention. Configure expected exceptions as non-reportable or report at INFO level:

```php
protected $levels = [
    AuthenticationException::class => LogLevel::INFO,
    ValidationException::class => LogLevel::INFO,
    NotFoundHttpException::class => LogLevel::INFO,
    PaymentFailedException::class => LogLevel::ERROR,
    Throwable::class => LogLevel::CRITICAL,
];
```

## 3. The Silent Production Fail

A handler that swallows exceptions in production without logging or alerting — failures go undetected until users report them.

A handler that produces a generic response but never records the error for debugging leaves the team blind to production issues. Always ensure every exception is both reported (logged to appropriate channel) and rendered (appropriate response to client). Use a catch-all `reportable()` for the error tracker and a catch-all `renderable()` for `Throwable` to ensure no exception falls through silently.

## 4. The Complex Handler

A handler with database queries, external API calls, or complex business logic that increases the risk of the handler itself failing.

```php
// Handler with database call — risk of query failure
$exceptions->reportable(function (Throwable $e) {
    $count = FailedJob::where('type', get_class($e))->count(); // DB query in handler
    if ($count > 10) {
        Alert::notify(new CriticalAlert($e));
    }
});
```

If the handler itself throws an exception, Laravel's fallback produces a bare 500 response and the original exception is lost. Complex dependencies exponentially increase the risk of handler failure. Keep the handler limited to exception type mapping, response generation, and context enrichment:

```php
$exceptions->reportable(function (Throwable $e) {
    Log::channel('critical')->error($e->getMessage(), [
        'exception' => get_class($e),
    ]);
});
```

## 5. The One-Size-Fits-All Error Page

Rendering the same error page in all environments — either exposing internals in production or hiding details in development.

```php
// Same behavior for all environments
$exceptions->renderable(function (Throwable $e, Request $request) {
    return response()->json(['error' => $e->getMessage()], 500);
});
```

Developers need full error detail for debugging; production users should never see internal details. Use environment-specific rendering that shows detailed information in local and generic branded messages in production:

```php
$exceptions->renderable(function (Throwable $e, Request $request) {
    if ($request->is('api/*')) {
        $message = app()->environment('local')
            ? $e->getMessage()
            : 'An unexpected error occurred.';
        return response()->json([
            'error' => ['message' => $message, 'type' => 'server_error', 'code' => 500],
        ], 500);
    }
});
```

## 6. The Missing Catch-All in Production

Relying solely on per-type `renderable()` callbacks without a catch-all for `Throwable`, allowing unexpected exception types to fall through to default debug pages.

```php
// Only handles known exception types — unknown exceptions fall through
$exceptions->renderable(function (ModelNotFoundException $e, Request $request) { ... });
$exceptions->renderable(function (ValidationException $e, Request $request) { ... });
// No catch-all — new RuntimeException from library returns HTML to API
```

Per-type callbacks miss unexpected exception types (e.g., a new library throwing a custom runtime exception). Without a catch-all, these fall through to Laravel's default handler, which may render HTML for API requests or expose debug details. Always register a catch-all `renderable()` for `Throwable` in production.

## 7. The Controller Error Renderer

Rendering Inertia error components or error responses directly from controllers instead of through the centralized handler.

```php
// Controller returns Inertia error directly — inconsistent with other error paths
class UserController
{
    public function show($id)
    {
        $user = User::find($id);
        if (!$user) {
            return Inertia::render('Errors/NotFound')->toResponse(request());
        }
    }
}
```

Controllers should not handle error rendering — that responsibility belongs to the centralized handler. The handler can also serve as a single point for content negotiation between Inertia, JSON, and HTML:

```php
$exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
    if ($request->inertia()) {
        return Inertia::render('Errors/NotFound', ['status' => 404])->toResponse($request);
    }
});
```
