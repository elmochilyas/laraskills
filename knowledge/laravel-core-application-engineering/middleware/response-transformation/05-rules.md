# Phase 5: Rules — Response Transformation

---

## Rule Name

Add Security Headers in Middleware, Not in Controllers

---

## Category

Security

---

## Rule

Security headers (X-Frame-Options, X-Content-Type-Options, Content-Security-Policy, Strict-Transport-Security, Referrer-Policy) must be added by middleware, not by individual controllers. Create a dedicated `SecurityHeadersMiddleware` that applies to the appropriate route groups.

---

## Reason

Controllers cannot be relied upon to consistently add security headers. A new controller created without header-adding logic produces responses missing critical security protections. Middleware ensures every response in the group receives the same security headers regardless of which controller produced it. This is the most reliable enforcement point for HTTP security posture.

---

## Bad Example

```php
class DashboardController extends Controller
{
    public function show(): View
    {
        $response = response()->view('dashboard');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        return $response;
    }
}

class ReportController extends Controller
{
    public function show(): View
    {
        return view('reports.show'); // No security headers!
    }
}
```

---

## Good Example

```php
class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        return $response;
    }
}
```

---

## Exceptions

Headers that must vary per-route (e.g., cache headers) should be set at the route level via `cache.headers` middleware, not in a global security middleware.

---

## Consequences Of Violation

Security risks: responses lack critical security headers. Inconsistency: some responses have headers, others do not. Compliance risks: security audits require consistent header application.

---

---

## Rule Name

Check Response Type Before Modifying Content

---

## Category

Reliability

---

## Rule

Before modifying response content in middleware (enveloping, transforming body, reading data), check the response type. Only modify responses whose type supports the intended operation. Never attempt to read or modify content of `BinaryFileResponse` or `StreamedResponse`.

---

## Reason

Different response types have different mutability characteristics. `BinaryFileResponse` content cannot be re-read. `StreamedResponse` may have already started sending content. A middleware that calls `$response->getData()` on a non-JSON response will fail with a `BadMethodCallException`. Checking the type ensures the middleware only operates on responses it can safely handle.

---

## Bad Example

```php
class JsonEnvelopeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $response->setData([
            'success' => $response->isSuccessful(),
            'data' => $response->getData(true),
        ]);
        return $response;
    }
}
```

---

## Good Example

```php
class JsonEnvelopeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $response instanceof JsonResponse) {
            return $response;
        }

        $response->setData([
            'success' => $response->isSuccessful(),
            'data' => $response->getData(true),
        ]);
        return $response;
    }
}
```

---

## Exceptions

Middleware that only adds headers (not modifying body content) does not need response type checking. Headers can be set on any response type.

---

## Consequences Of Violation

Reliability risks: `BadMethodCallException` on HTML or redirect responses. Data corruption: wrong data read from incompatible response types.

---

---

## Rule Name

Test CSP in Report-Only Mode Before Enforcing

---

## Category

Security

---

## Rule

When implementing a Content-Security-Policy header, first deploy with `Content-Security-Policy-Report-Only` and monitor violation reports. Only switch to `Content-Security-Policy` (enforcement) after confirming no legitimate resources are blocked.

---

## Reason

A restrictive CSP blocks legitimate scripts, styles, images, and fonts — breaking the application in ways that may not be immediately visible (third-party widgets, analytics, CDN resources). Report-only mode collects violation reports without blocking resources, allowing the team to identify and whitelist all legitimate origins before enforcing.

---

## Bad Example

```php
$response->headers->set('Content-Security-Policy',
    "default-src 'self'; script-src 'self' cdn.example.com"
);
```

---

## Good Example

```php
$csp = "default-src 'self'; script-src 'self' cdn.example.com";
$response->headers->set('Content-Security-Policy-Report-Only', $csp);
// After monitoring reports, switch to:
// $response->headers->set('Content-Security-Policy', $csp);
```

---

## Exceptions

Applications with a well-known, fixed set of resources (internal enterprise apps with no third-party integrations) may skip report-only mode.

---

## Consequences Of Violation

Reliability risks: legitimate features break silently. User experience: interactive elements, images, or fonts fail to load.

---

---

## Rule Name

Use Private Cache for Authenticated Responses

---

## Category

Security

---

## Rule

Never set `Cache-Control: public` on responses that contain authenticated user data. Always use `private` for authenticated responses. Only use `public` for truly public, anonymous responses.

---

## Reason

Public cache directives allow shared caches (CDN, reverse proxy) to serve the response to any user. If an authenticated response containing user-specific data is cached as public, the shared cache serves the first user's data to all subsequent users — a direct data exposure vulnerability.

---

## Bad Example

```php
Route::get('/dashboard', [DashboardController::class, 'show'])
    ->middleware(['auth', 'cache.headers:public;max_age=3600']);
```

---

## Good Example

```php
Route::get('/dashboard', [DashboardController::class, 'show'])
    ->middleware(['auth', 'cache.headers:private;max_age=300']);

Route::get('/posts', [PostController::class, 'index'])
    ->middleware('cache.headers:public;max_age=3600;etag');
```

---

## Exceptions

Public routes that serve the same content to all users (landing pages, blog posts, public API endpoints) correctly use `public` cache directives.

---

## Consequences Of Violation

Security risks: authenticated user data exposed to other users through shared cache. Compliance risks: personal data served to unauthorized users.

---

---

## Rule Name

Apply JSON Envelope Wrapping Only to API Routes

---

## Category

Design

---

## Rule

JSON envelope middleware (wrapping response data in `{ "success": true, "data": ... }`) must be applied only to API route groups. Never apply it globally.

---

## Reason

JSON envelope middleware operates on the response body. Applied globally, it attempts to modify HTML responses, file downloads, and redirect responses, causing errors or corrupting non-JSON content. Even if the middleware checks for `JsonResponse` type, the global registration adds unnecessary processing to every web route. Enveloping is an API convention, not an application-wide concern.

---

## Bad Example

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(JsonEnvelopeMiddleware::class);
});
```

---

## Good Example

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(append: [
        \App\Http\Middleware\JsonEnvelopeMiddleware::class,
    ]);
});
```

---

## Exceptions

Single-format applications that exclusively serve JSON (SPA-only API backends) may apply globally, but must verify no routes return non-JSON responses.

---

## Consequences Of Violation

Reliability risks: HTML and file responses are corrupted or throw errors. Maintenance risks: web route modifications require envelope middleware awareness.

---

---

## Rule Name

Do Not Set HSTS in Development Environments

---

## Category

Security

---

## Rule

Never set the `Strict-Transport-Security` header in development or local environments. Only enable HSTS in production after verifying HTTPS is properly configured.

---

## Reason

Browsers remember the `Strict-Transport-Security` policy and refuse to connect via HTTP for the duration of `max-age`. If HSTS is set during development (when the application may be served over HTTP or localhost), the browser remembers the HTTPS requirement even after switching back to HTTP. This makes the application inaccessible from the browser until the `max-age` expires or the HSTS cache is manually cleared.

---

## Bad Example

```php
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);
    $response->headers->set('Strict-Transport-Security', 'max-age=31536000');
    return $response;
}
```

---

## Good Example

```php
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);

    if (app()->environment('production')) {
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return $response;
}
```

---

## Exceptions

No common exceptions. HSTS must always be conditional on production environment.

---

## Consequences Of Violation

Accessibility risks: application becomes inaccessible via HTTP in the browser. Developer frustration: must manually clear browser HSTS cache. Environment confusion: local development becomes difficult after HSTS is cached.

---

---

## Rule Name

Add Security Headers to Exception Handler Error Responses

---

## Category

Security

---

## Rule

When the exception handler generates error responses (404, 500, 403), ensure they include the same security headers that middleware adds to normal responses. Register security header logic in the exception handler's `register()` method or use a dedicated error response middleware.

---

## Reason

Error responses generated by the exception handler bypass the middleware pipeline entirely — the pipeline has already completed when the exception is caught. Security headers added by middleware (X-Frame-Options, CSP, HSTS) are missing from error responses. A 404 page served without X-Frame-Options is vulnerable to clickjacking. A 500 response without HSTS leaks security posture gaps in error scenarios.

---

## Bad Example

```php
// Security headers are added by middleware
// But the exception handler generates error responses AFTER the pipeline
// Error responses (404, 500, 403) have no security headers

class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        return $response;
    }
}
```

---

## Good Example

```php
class ExceptionHandler extends Handler
{
    protected function register(): void
    {
        $this->renderable(function (NotFoundHttpException $e, Request $request) {
            $response = response()->view('errors.404', [], 404);
            $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
            $response->headers->set('X-Content-Type-Options', 'nosniff');
            return $response;
        });
    }
}
```

---

## Exceptions

Applications that use the same kernel for all response types and ensure the pipeline completes before exception handling may not need this. Verify by testing error response headers in CI.

---

## Consequences Of Violation

Security risks: error responses lack security headers, creating exploitation vectors for clickjacking and MIME-type sniffing. Compliance risks: security audits flag missing headers on error pages. Inconsistent posture: normal responses are hardened, error responses are not.
