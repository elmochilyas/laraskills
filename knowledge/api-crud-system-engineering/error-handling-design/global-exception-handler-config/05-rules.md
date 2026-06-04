# Phase 5: Rules — Global Exception Handler Configuration

## Rule: Always Use register() Callbacks, Never Override render()
---
## Category
Framework Usage | Maintainability
---
## Rule
Always configure exception handling through `register()` callbacks (`renderable()`, `reportable()`); never override the `render()` or `report()` methods.
---
## Reason
`register()` callbacks are the Laravel 10+ contract for handler customization and ensure framework upgrade compatibility. Overriding `render()` bypasses the callback resolution logic and may break with core changes.
---
## Bad Example
```php
class Handler extends ExceptionHandler
{
    public function render($request, Throwable $e): JsonResponse
    {
        return response()->json(/* ... */); // Overrides parent — breaks upgrade
    }
}
```
---
## Good Example
```php
class Handler extends ExceptionHandler
{
    public function register(): void
    {
        $this->renderable(function (ValidationException $e, $request) {
            return $request->expectsJson() ? $this->handleValidationError($e) : null;
        });
        $this->reportable(function (Throwable $e) {
            // Side effects — Sentry, Slack, etc.
        });
    }
}
```
---
## Exceptions
Extremely complex rendering logic that cannot be expressed as independent callbacks (rare); refactor into a delegation pattern to avoid override.
---
## Consequences Of Violation
Framework upgrade breaks custom rendering; callback ordering and precedence lost; cannot use newer handler features (reportable, contextual info).

---

## Rule: Guard Every Renderable Callback with expectsJson()
---
## Category
Framework Usage | Reliability
---
## Rule
Always guard JSON-rendering `renderable` callbacks with `$request->expectsJson()`; return `null` to let web error handling proceed for non-API requests.
---
## Reason
The same exception class can be thrown from both API and web routes. Returning JSON for a web request breaks session-based auth flows, blade error pages, and debugging tools.
---
## Bad Example
```php
$this->renderable(function (AuthenticationException $e, $request) {
    return response()->json([/* ... */]); // Returns JSON even for web requests
});
```
---
## Good Example
```php
$this->renderable(function (AuthenticationException $e, Request $request) {
    if (! $request->expectsJson()) {
        return null; // Let Laravel handle via redirect
    }
    return response()->json([/* ... */]);
});
```
---
## Exceptions
API-only applications with no web routes; the guard is still harmless and keeps the handler flexible.
---
## Consequences Of Violation
Web auth redirects break; blade error pages show blank screens; session-based authentication flows fail silently.

---

## Rule: Register Specific Exceptions First, General Last
---
## Category
Reliability | Code Organization
---
## Rule
Always register `renderable` callbacks in order from most specific exception type to most general (`Throwable` last); never register the `Throwable` fallback before specific types.
---
## Reason
Renderable callbacks are evaluated in registration order; the first matching callback wins. A generic callback registered before specific ones catches all exceptions and prevents specific handling.
---
## Bad Example
```php
public function register(): void
{
    // Catch-all registered first — catches everything
    $this->renderable(function (Throwable $e, $request) { /* 500 fallback */ });
    $this->renderable(function (AuthenticationException $e, $request) { /* Never reached */ });
}
```
---
## Good Example
```php
public function register(): void
{
    // Specific first
    $this->renderable(function (AuthenticationException $e, $request) { /* 401 */ });
    $this->renderable(function (ValidationException $e, $request) { /* 422 */ });
    $this->renderable(function (ModelNotFoundException $e, $request) { /* 404 */ });
    // General last
    $this->renderable(function (Throwable $e, $request) { /* 500 fallback */ });
}
```
---
## Exceptions
No common exceptions — registration order is critical for correct handling.
---
## Consequences Of Violation
Specific error handlers never execute; all exceptions return 500 generic response; auth, validation, and 404 errors all look like server failures.

---

## Rule: Delegate Renderables to Dedicated Named Methods
---
## Category
Maintainability | Testing
---
## Rule
Always delegate renderable callback logic to dedicated named handler methods (e.g., `handleAuthenticationError()`, `handleValidationError()`); never put complex logic directly in closures.
---
## Reason
Named methods are testable in isolation, readable in stack traces, and reusable across callbacks. Closures with complex logic cannot be tested independently and encourage duplication.
---
## Bad Example
```php
$this->renderable(function (AuthenticationException $e, $request) {
    if (! $request->expectsJson()) return null;
    $code = /* 20 lines of guard resolution logic */;
    $envelope = /* envelope construction */;
    return response()->json($envelope, 401, ['WWW-Authenticate' => 'Bearer']);
    // Not testable — logic buried in closure
});
```
---
## Good Example
```php
$this->renderable(function (AuthenticationException $e, Request $request) {
    return $request->expectsJson()
        ? $this->handleAuthenticationError($e, $request)
        : null;
});

// Testable in isolation:
public function handleAuthenticationError(AuthenticationException $e, Request $request): JsonResponse
{
    $code = $this->resolveAuthErrorCode($e);
    return response()->json(
        new ErrorEnvelope($code, 'Authentication required.', 401),
        401,
        ['WWW-Authenticate' => 'Bearer realm="api"'],
    );
}
```
---
## Exceptions
Trivial callbacks that return a simple constant response; still prefer a named method for consistency.
---
## Consequences Of Violation
Handler logic untestable; closure logic duplicated across callbacks; stack traces show anonymous closures — hard to debug.

---

## Rule: Keep $dontReport Minimal — Only Expected, High-Volume, Non-Actionable Exceptions
---
## Category
Reliability | Maintainability
---
## Rule
Always keep the `$dontReport` list minimal — include only exceptions that are expected, high-volume, and require no developer action. Never add programmer errors or infrastructure errors.
---
## Reason
Overly broad `$dontReport` silences critical errors. Every exception excluded from reporting must be justified as truly non-actionable. If a developer needs to know about it, it should not be in `$dontReport`.
---
## Bad Example
```php
protected $dontReport = [
    AuthenticationException::class,
    AuthorizationException::class,
    ValidationException::class,
    ThrottleRequestsException::class,
    ModelNotFoundException::class,
    QueryException::class, // BAD — DB errors are actionable!
];
```
---
## Good Example
```php
protected $dontReport = [
    AuthenticationException::class,  // Expected — every request may be unauthenticated
    AuthorizationException::class,   // Expected — authenticated but not permitted
    ValidationException::class,      // Expected — user input errors
    ThrottleRequestsException::class, // Expected — rate limit exceeded
    // ModelNotFoundException: Keep — may indicate broken routes or data issues
    // QueryException: DO NOT INCLUDE — DB errors are always actionable
];
```
---
## Exceptions
No common exceptions — regularly audit the list to remove exceptions that have become actionable.
---
## Consequences Of Violation
Critical errors silenced in production; DB connection failures not logged; model 404s due to data corruption go undetected.

---

## Rule: Wrap Renderable Logic in Try/Catch to Prevent Error-During-Error-Handling
---
## Category
Reliability
---
## Rule
Always wrap renderable callback logic in try/catch; if the renderable itself throws, fall back to a hardcoded safe JSON response that contains no exception details.
---
## Reason
A throw during error handling (e.g., serializer failure, missing field) causes a 500 HTML error from the framework, completely hiding the original error and returning a non-JSON response.
---
## Bad Example
```php
$this->renderable(function (Throwable $e, $request) {
    // If this throws, client gets Whoops HTML
    return $this->renderServerError($e, $request);
});
```
---
## Good Example
```php
$this->renderable(function (Throwable $e, Request $request) {
    try {
        return $request->expectsJson()
            ? $this->renderServerError($e, $request)
            : null;
    } catch (Throwable $renderError) {
        Log::emergency('Error-during-error-handling', [
            'original_exception' => $e::class,
            'render_exception' => $renderError::class,
        ]);
        return response()->json(
            ['error' => ['code' => 'SYSTEM.INTERNAL_ERROR', 'message' => 'An internal error occurred.', 'status' => 500]],
            500,
        );
    }
});
```
---
## Exceptions
No common exceptions — this pattern is mandatory for production reliability.
---
## Consequences Of Violation
Infinite error loops; memory exhaustion from recursive error handling; HTML error returned for API request; complete loss of error observability.

---

## Rule: Add Context via context() Method, Not in Each Callback
---
## Category
Code Organization | Maintainability
---
## Rule
Always add shared log context (trace_id, user_id, URL, method, IP) via the `context()` method override; never add the same context in each individual renderable callback.
---
## Reason
`context()` automatically enriches every log entry made within the handler. Adding context in each callback is duplicated, inconsistent, and inevitably missed in new callbacks.
---
## Bad Example
```php
$this->renderable(function (ValidationException $e, $request) {
    Log::warning('Validation failed', [
        'trace_id' => request()->header('X-Trace-ID'),
        'user_id' => request()->user()?->id,
        'url' => request()->fullUrl(),
        // ... repeated in every callback
    ]);
});
```
---
## Good Example
```php
public function context(): array
{
    return [
        'trace_id' => request()->header('X-Trace-ID') ?? Str::uuid()->toString(),
        'user_id' => request()->user()?->id,
        'url' => request()->fullUrl(),
        'method' => request()->method(),
        'ip' => request()->ip(),
    ];
}
// No context needed in individual callbacks — it's automatic
```
---
## Exceptions
Context that is specific to a single exception type (business data added in the exception constructor, not the callback).
---
## Consequences Of Violation
Inconsistent log context across error types; new callbacks miss context; context duplicated across files, causing maintenance burden.

---

## Rule: Use reportable() Callbacks for Side Effects, Separate from Rendering
---
## Category
Code Organization | Maintainability
---
## Rule
Always keep reporting side effects (Sentry, Slack, PagerDuty) in `reportable()` callbacks; never mix reporting logic into `renderable()` callbacks.
---
## Reason
Separation of concerns — rendering produces the HTTP response; reporting sends notifications. Mixed logic makes testing harder and prevents independent customization of rendering vs. reporting for different environments.
---
## Bad Example
```php
$this->renderable(function (Throwable $e, $request) {
    // Renders AND reports in the same callback
    \Sentry\captureException($e); // Side effect mixed with rendering
    return $this->renderServerError($e, $request);
});
```
---
## Good Example
```php
$this->renderable(function (Throwable $e, Request $request) {
    return $request->expectsJson() ? $this->renderServerError($e, $request) : null;
});

$this->reportable(function (Throwable $e) {
    if (app()->isProduction()) {
        \Sentry\captureException($e);
    }
});
```
---
## Exceptions
No common exceptions — rendering and reporting must remain separate concerns.
---
## Consequences Of Violation
Cannot suppress reporting in dev environment; testing renderable logic triggers real side effects; cannot customize reporting per environment independently.

---

## Rule: Register Explicit Renderable Callbacks for Every Framework Exception
---
## Category
Framework Usage | Reliability
---
## Rule
Always register explicit `renderable` callbacks for all framework exceptions that may surface in API routes — `AuthenticationException`, `AuthorizationException`, `ModelNotFoundException`, `ValidationException`, `ThrottleRequestsException`, and `NotFoundHttpException`.
---
## Reason
Each framework exception has a specific default behavior (redirect, HTML error, raw array) that is inappropriate for API JSON responses. Explicit callbacks ensure every framework exception returns the standard envelope.
---
## Bad Example
```php
// Only a Throwable fallback — framework exceptions get generic 500
$this->renderable(function (Throwable $e, $request) {
    return $this->renderServerError($e, $request); // All errors = 500
});
```
---
## Good Example
```php
$this->renderable(function (AuthenticationException $e, $request) { /* 401 */ });
$this->renderable(function (AuthorizationException $e, $request) { /* 403 */ });
$this->renderable(function (ModelNotFoundException $e, $request) { /* 404 */ });
$this->renderable(function (ValidationException $e, $request) { /* 422 */ });
$this->renderable(function (ThrottleRequestsException $e, $request) { /* 429 */ });
$this->renderable(function (NotFoundHttpException $e, $request) { /* 404 */ });
// Then the Throwable fallback: /* 500 */
```
---
## Exceptions
API-only exceptions that are always caught and handled within controllers without reaching the handler.
---
## Consequences Of Violation
Validation exceptions return raw `{"message": "", "errors": {}}` array without envelope; auth exceptions redirect instead of returning JSON; model 404s show Whoops HTML.
