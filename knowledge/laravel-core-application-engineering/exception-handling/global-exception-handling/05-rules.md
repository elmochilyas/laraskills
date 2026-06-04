# Rules for Global Exception Handling

---

## Rule: Never Run Production with APP_DEBUG=true

---

## Category

Security

---

## Rule

Always ensure `APP_DEBUG=false` in all production environments. Never set `APP_DEBUG=true` in production, even temporarily for debugging.

---

## Reason

`APP_DEBUG=true` exposes stack traces, environment variables, database credentials, API keys, and query logs to any user who triggers an error. This is the most common Laravel security misconfiguration.

---

## Bad Example

```bash
# .env.production
APP_DEBUG=true
APP_ENV=production
```

---

## Good Example

```bash
# .env.production
APP_DEBUG=false
APP_ENV=production

# For debugging, use:
# 1. Error tracking service (Sentry, Flare)
# 2. Telescope or Debugbar with authentication
# 3. Dedicated staging environment
```

---

## Exceptions

No common exceptions. Never set `APP_DEBUG=true` in production, even temporarily.

---

## Consequences Of Violation

Security risks: full application internals exposed to attackers. Compliance risks: credential leakage. Reputation damage: public disclosure of sensitive configuration.

---

## Rule: Use Environment-Specific Error Pages — Detailed in Local, Generic in Production

---

## Category

Security

---

## Rule

Always render detailed error information (message, trace, context) in local development and generic branded error pages (no internals) in production. Never render the same error page in all environments.

---

## Reason

Developers need full error detail for debugging. Production users should never see internal details. Environment-specific rendering satisfies both requirements without manual toggling.

---

## Bad Example

```php
// Same behavior for all environments — either too detailed for prod or too generic for dev
$exceptions->renderable(function (Throwable $e, Request $request) {
    return response()->json(['error' => $e->getMessage()], 500);
});
```

---

## Good Example

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

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Security risks: production users see internal error details. Developer experience: local debugging lacks sufficient information.

---

## Rule: Register a Catch-All renderable() for Throwable in Production

---

## Category

Reliability

---

## Rule

Always register a catch-all `renderable()` for `Throwable` in production that returns a generic error response. Never rely solely on per-type callbacks to catch all possible exceptions.

---

## Reason

Per-type callbacks miss unexpected exception types (e.g., a new library throwing a custom runtime exception). Without a catch-all, these fall through to Laravel's default handler, which may render HTML for API requests or expose debug details.

---

## Bad Example

```php
// Only handles known exception types — unknown exceptions fall through
$exceptions->renderable(function (ModelNotFoundException $e, Request $request) { ... });
$exceptions->renderable(function (ValidationException $e, Request $request) { ... });
// No catch-all — new RuntimeException from library returns HTML to API
```

---

## Good Example

```php
// Catch-all for any unhandled exception
$exceptions->renderable(function (Throwable $e, Request $request) {
    if (!$request->is('api/*') && !$request->expectsJson()) {
        return;
    }

    return response()->json([
        'error' => [
            'message' => 'An unexpected error occurred.',
            'type' => 'server_error',
            'code' => 500,
        ],
        'request_id' => $request->header('X-Request-Id'),
    ], 500);
});
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Reliability risks: unknown exceptions produce HTML for API clients. Security risks: default debug pages leak internals if `APP_DEBUG` is accidentally true.

---

## Rule: Filter Expected Exceptions from ERROR-Level Reporting

---

## Category

Maintainability

---

## Rule

Always configure expected exceptions (validation errors, 404s, authentication failures, throttled requests) as non-reportable or report at INFO level. Never let expected exceptions reach ERROR-level logs.

---

## Reason

Expected exceptions are normal application flow, not system failures. Reporting them as errors creates log noise, triggers false alerts, and buries real server errors that need attention.

---

## Bad Example

```php
// All exceptions reported at ERROR level — 95% noise
protected $levels = [
    ValidationException::class => LogLevel::ERROR,
    NotFoundHttpException::class => LogLevel::ERROR,
    AuthenticationException::class => LogLevel::ERROR,
];
```

---

## Good Example

```php
// Expected exceptions filtered — only real errors at ERROR level
protected $levels = [
    AuthenticationException::class => LogLevel::INFO,
    ValidationException::class => LogLevel::INFO,
    NotFoundHttpException::class => LogLevel::INFO,
    ThrottleRequestsException::class => LogLevel::WARNING,
    PaymentFailedException::class => LogLevel::ERROR,
    Throwable::class => LogLevel::CRITICAL,
];
```

---

## Exceptions

During security incident investigation, you may temporarily log 404s at WARNING to detect scanning patterns. Revert after investigation.

---

## Consequences Of Violation

Maintenance risks: real server errors are invisible among noise. Reliability risks: false alerts desensitize the team, causing delayed incident response.

---

## Rule: Set Appropriate Log Levels per Exception Type Using the $levels Property

---

## Category

Framework Usage

---

## Rule

Always use the `$levels` property (or equivalent configuration) to map each exception type to its appropriate log level. Never rely on the default log level for all exception types.

---

## Reason

Different exceptions have different severity. A validation error (INFO) is not equivalent to a payment processing failure (ERROR). Using the same log level for all types makes it impossible to distinguish severity in monitoring dashboards.

---

## Bad Example

```php
// All exceptions logged at the same level — no severity distinction
protected $levels = [];
```

---

## Good Example

```php
protected $levels = [
    AuthenticationException::class => LogLevel::INFO,
    ValidationException::class => LogLevel::INFO,
    NotFoundHttpException::class => LogLevel::INFO,
    ThrottleRequestsException::class => LogLevel::WARNING,
    HttpException::class => LogLevel::WARNING,
    PaymentFailedException::class => LogLevel::ERROR,
    Throwable::class => LogLevel::CRITICAL,
];
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: monitoring cannot distinguish severity. Reliability risks: critical errors are hidden among INFO-level noise.

---

## Rule: Add Global Context via context() to Every Exception Report

---

## Category

Maintainability

---

## Rule

Always override the `context()` method on the exception handler to include `user_id`, `url`, `method`, `ip`, and `request_id` in every exception report.

---

## Reason

Exception reports without request context are debugging dead ends. Global context enriches every report automatically, eliminating the need for per-callback duplication and ensuring no report is missing essential metadata.

---

## Bad Example

```php
// No global context — every reportable callback must add context manually
$exceptions->reportable(function (PaymentFailedException $e) {
    Log::error($e->getMessage(), ['user_id' => auth()->id()]); // Easy to forget
});
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

Maintenance risks: individual reportable callbacks must each add context, leading to inconsistency. Reliability risks: some reports lack critical debugging metadata.

---

## Rule: Keep Handler Logic Simple and Free of Complex Dependencies

---

## Category

Reliability

---

## Rule

Never add database queries, HTTP calls, or complex business logic to the exception handler. Keep it limited to exception type mapping, response generation, and context enrichment.

---

## Reason

If the handler itself throws an exception, Laravel's fallback produces a bare 500 response and the original exception is lost. Complex dependencies exponentially increase the risk of handler failure.

---

## Bad Example

```php
// Handler with database call — risk of query failure
$exceptions->reportable(function (Throwable $e) {
    $count = FailedJob::where('type', get_class($e))->count(); // DB query in handler
    if ($count > 10) {
        Alert::notify(new CriticalAlert($e));
    }
});
```

---

## Good Example

```php
// Handler delegates — no complex logic
$exceptions->reportable(function (Throwable $e) {
    Log::channel('critical')->error($e->getMessage(), [
        'exception' => get_class($e),
    ]);
});
```

---

## Exceptions

Error tracking SDK calls (Sentry, Flare, Bugsnag) are designed to be safe from handlers. Use them directly.

---

## Consequences Of Violation

Reliability risks: handler failure causes silent loss of the original exception. Maintenance risks: handler becomes the most fragile code path in production.

---

## Rule: Render Inertia Error Components via the Handler, Not in Controllers

---

## Category

Architecture

---

## Rule

Always render Inertia error components through the exception handler's `renderable()` callbacks. Never return Inertia error responses directly from controllers.

---

## Reason

Controllers should not handle error rendering — that responsibility belongs to the centralized handler. The handler can also serve as a single point for content negotiation between Inertia, JSON, and HTML.

---

## Bad Example

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

---

## Good Example

```php
// Controller throws — handler renders
class UserController
{
    public function show($id)
    {
        return User::findOrFail($id);
    }
}

// Handler manages Inertia rendering
$exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
    if ($request->inertia()) {
        return Inertia::render('Errors/NotFound', [
            'status' => 404,
        ])->toResponse($request);
    }
});
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: error rendering logic is duplicated across controllers. Reliability risks: content negotiation for Inertia, JSON, and HTML is inconsistent.
