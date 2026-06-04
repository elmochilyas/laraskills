# Anti-Patterns: Response Transformation

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Middleware System |
| Knowledge Unit | Response Transformation |
| Difficulty | Advanced |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Cache Poisoning via Shared Cache | Security | Critical |
| 2 | Global JSON Envelope Middleware | Architecture | High |
| 3 | HSTS Enabled in Development Environment | Reliability | High |
| 4 | Missing Security Headers on Error Responses | Security | High |
| 5 | Content Modification of Streamed Responses | Reliability | Medium |

---

## Anti-Pattern 1: Cache Poisoning via Shared Cache

### Category
Security

### Description
Setting `Cache-Control: public` on responses that contain authenticated user data. Shared caches (CDN, reverse proxy, gateway cache) store the first user's response and serve it to all subsequent users, exposing one user's private data to others.

### Why It Happens
Developers add cache headers to improve performance without considering the authentication context. A `cache.headers:public;max_age=3600` middleware is applied to a route group containing both public and authenticated endpoints. The `public` directive tells shared caches they can store the response, but the middleware does not check whether the response contains private data.

### Warning Signs
- `Cache-Control: public` is set on responses containing user-specific data (dashboard, profile, settings)
- Cache middleware is applied globally or to route groups without per-route authentication checks
- CDN cache hit ratio is high for authenticated endpoints
- User A sees User B's data (dashboard content, profile information)
- Complaints about "seeing someone else's account" are traced to cache headers

### Why Harmful
Shared caches (CDN, Varnish, nginx microcaching) store the response and serve it to any subsequent request with matching cache keys. If the cache key does not include user identity (session, auth token), all users share the same cached response. An authenticated user's dashboard is cached and served to other users, exposing private data.

### Real-World Consequences
- `DashboardController@index` returns user-specific data
- Route uses `->middleware('cache.headers:public;max_age=300')` for performance
- User A accesses dashboard → response cached in CDN
- User B accesses dashboard 2 minutes later → CDN serves User A's response
- User B sees User A's account data, orders, and personal information
- Data breach notification required; cache immediately purged

### Preferred Alternative
Use `private` cache directive for authenticated responses. Only use `public` for truly public, non-user-specific content. Never apply `public` cache headers globally — apply per-route only when certain the response is identical for all users.

```php
// Wrong: public cache on authenticated route
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware('cache.headers:public;max_age=300'); // Caches user data!
});

// Correct: private cache for authenticated responses
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware('cache.headers:private;max_age=300');
});

// Correct: only public routes use public cache
Route::get('/posts', [PostController::class, 'index'])
    ->middleware('cache.headers:public;max_age=3600;etag'); // Public data — safe

// Conditional: middleware checks authentication
class CachePolicyMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        if ($request->user()) {
            $response->headers->set('Cache-Control', 'private, max_age=60');
        }
        return $response;
    }
}
```

### Refactoring Strategy
1. Audit all routes using `cache.headers:public` middleware
2. Verify each route returns non-user-specific content
3. Replace `public` with `private` for authenticated routes
4. Add conditional cache control middleware that checks authentication state
5. Test cache behavior with multiple authenticated users

### Detection Checklist
- [ ] No `Cache-Control: public` on authenticated routes
- [ ] Authenticated responses use `private` cache directive
- [ ] CDN/Varnish does not cache authenticated responses
- [ ] Cache policy middleware checks authentication state
- [ ] Shared cache is not serving user-specific data

### Related Rules/Skills/Trees
- Rule: Do NOT use `Cache-Control: public` for authenticated responses
- Rule: Shared caches with public directive expose user data
- Related KU: Cache Control, Middleware Ordering and Priority

---

## Anti-Pattern 2: Global JSON Envelope Middleware

### Category
Architecture

### Description
Registering a JSON envelope response transformation middleware globally — applying it to all routes including web routes that return HTML, file downloads, redirects, and streamed responses.

### Why It Happens
Developers want a consistent API response format (success, data, meta) and register the envelope middleware globally for convenience. The assumption is that "the application is an API" — but most Laravel applications have at least some web routes (login, admin panel, status pages).

### Warning Signs
- JSON envelope middleware is in `$middleware` (global) instead of the `api` route group
- HTML pages return JSON instead of rendered HTML
- File downloads have `Content-Type: application/json` instead of the original MIME type
- Redirect responses are wrapped in JSON instead of redirecting
- Error: "Attempt to read property on non-object" or "getData() on non-JsonResponse"

### Why Harmful
The middleware attempts to call `$response->getData()` or `$response->setData()` on responses that are not JSON — HTML responses, file streams, binary downloads, redirects. This throws errors, corrupts file downloads, replaces HTML with JSON, or breaks redirects. Web routes become completely unusable.

### Real-World Consequences
- `JsonEnvelopeMiddleware` registered globally
- User visits `/login` (web route returning HTML)
- Middleware calls `$response->getData(true)` on HTML Response → returns null
- Middleware replaces Response with `JsonResponse` containing null data
- User sees `{"success": true, "data": null}` instead of login form
- Fix: move to `api` middleware group → web routes work, API routes get envelope

### Preferred Alternative
Apply JSON envelope middleware only to the `api` route group. Check the response type before modifying to ensure only JSON responses are enveloped.

```php
// Wrong: global registration
// Kernel.php
protected $middleware = [
    \App\Http\Middleware\JsonEnvelopeMiddleware::class,
    // ...
];

// Correct: api group only
// Kernel.php
protected $middlewareGroups = [
    'api' => [
        \App\Http\Middleware\JsonEnvelopeMiddleware::class,
        // ...
    ],
];

// Defensive: check response type in middleware
class JsonEnvelopeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $response instanceof JsonResponse) {
            return $response; // Skip non-JSON responses
        }

        $response->setData([
            'success' => $response->isSuccessful(),
            'data' => $response->getData(true),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
            ],
        ]);

        return $response;
    }
}
```

### Refactoring Strategy
1. Move JSON envelope middleware from global to the `api` middleware group
2. Add response type check (`instanceof JsonResponse`) for defense in depth
3. Verify web routes return correct content types (HTML, redirect, file)
4. Add test that web routes are not affected by JSON envelope
5. Document: JSON envelope belongs on the `api` group, not globally

### Detection Checklist
- [ ] JSON envelope middleware is in the `api` group, not globally
- [ ] Web routes return HTML, not JSON
- [ ] File downloads have correct Content-Type
- [ ] Redirects are not wrapped in JSON
- [ ] Middleware checks response type before modifying

### Related Rules/Skills/Trees
- Rule: Apply JSON envelope to the `api` group, not globally
- Rule: JSON envelope breaks HTML and file responses
- Related KU: API Resource Design, Route Groups

---

## Anti-Pattern 3: HSTS Enabled in Development Environment

### Category
Reliability

### Description
Setting the `Strict-Transport-Security` (HSTS) header in development or local environments where HTTPS may not be available. Browsers remember the HSTS policy and refuse to connect via HTTP even after switching back to local development.

### Why It Happens
Developers unify response transformation middleware across all environments using `app()->environment('production')` checks but sometimes forget to add the guard. A `SecurityHeadersMiddleware` adds HSTS unconditionally, or the `.env` setting for HSTS is enabled in development.

### Warning Signs
- `Strict-Transport-Security` header appears in local development responses
- Browser refuses to load `http://localhost` or `http://127.0.0.1` for the application
- Error in browser: "ERR_SSL_PROTOCOL_ERROR" when accessing via HTTP
- HSTS preload list includes the local development domain
- Development environment uses HTTP, but middleware adds HTTPS-only headers

### Why Harmful
Once a browser receives an HSTS header, it remembers the policy for the specified `max-age`. When the developer switches from HTTPS to HTTP in local development, the browser refuses to connect — the application becomes inaccessible. Clearing the browser's HSTS cache is required, which is non-obvious and frustrating. If the local domain (e.g., `localhost`) is added to the HSTS preload list, the effect is permanent for all users.

### Real-World Consequences
- `SecurityHeadersMiddleware` sets `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- Developer tests locally via `https://localhost` (Laravel Valet secure)
- Later switches to `http://localhost:8080` (Artisan serve)
- Browser remembers HSTS → refuses HTTP connection
- Developer spends 30 minutes clearing browser HSTS cache
- Fix: wrap HSTS in `app()->environment('production')` guard

### Preferred Alternative
Only set HSTS headers in production environments. Never set them in development, staging, or testing.

```php
class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // HSTS: production only
        if (app()->environment('production')) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );
        }

        return $response;
    }
}
```

### Refactoring Strategy
1. Audit all response transformation middleware for HSTS headers
2. Wrap HSTS in environment check: `app()->environment('production')`
3. Clear browser HSTS caches on development machines
4. Test that HSTS only appears in production responses
5. Add to deployment checklist: "Verify HSTS only in production"

### Detection Checklist
- [ ] HSTS header is only set in production environment
- [ ] Development environment does not include HSTS
- [ ] Browser's HSTS cache does not block local development
- [ ] Environment check guards all HSTS-related code
- [ ] HSTS preload list does not include development domains

### Related Rules/Skills/Trees
- Rule: Only set HSTS headers in production environment
- Rule: HSTS in development makes the application inaccessible via HTTP
- Related KU: Security Headers, Environment Configuration

---

## Anti-Pattern 4: Missing Security Headers on Error Responses

### Category
Security

### Description
Error responses (401, 403, 404, 419, 500) generated by the exception handler after the middleware pipeline completes do not pass through response transformation middleware. Security headers like X-Frame-Options, X-Content-Type-Options, and CSP are missing from these error responses.

### Why It Happens
The middleware pipeline runs before the controller. If the controller throws an exception, the pipeline's response transformations have already been applied to the non-error response path. However, the exception handler generates a NEW response after the pipeline has completed — this new response does not go through middleware. Developers assume error responses inherit the same security headers as successful ones.

### Warning Signs
- Error pages (404, 500) lack `X-Frame-Options` and `X-Content-Type-Options` headers
- Security audit reports missing headers on error responses
- Browser renders 404 page inside an iframe (clickjacking possible on error pages)
- Error responses have different security posture than success responses
- CSP violations captured from error pages that lack proper CSP headers

### Why Harmful
Error responses are the most common entry point for attacks. A 404 page without `X-Frame-Options` can be framed by an attacker for clickjacking. A 500 error without CSP may load attacker scripts. Error responses without security headers create a gap in the application's security posture that automated scanners and attackers will find.

### Real-World Consequences
- Application has robust security headers: XFO, XCTo, CSP, HSTS on all successful responses
- Exception handler renders a custom 404 view without any security headers
- Attacker embeds the 404 page in an iframe on malicious site
- Clickjacking attack via the unprotected 404 page
- Security audit flags "Missing security headers on error responses" as critical finding

### Preferred Alternative
Add security headers in multiple layers — middleware for successful responses and the exception handler for error responses.

```php
// In the exception handler (App\Exceptions\Handler)
protected function registerErrorResponseHeaderMiddleware(): void
{
    $this->respondWithHeaders(function ($request, $response) {
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        // ... other security headers
        return $response;
    });
}

// Or: use a kernel-level middleware (middleware on the exception handler itself)
// Using Laravel 11+ exception handler middleware
public function register(): void
{
    $this->reportable(function (Throwable $e) {
        //
    });

    $this->renderable(function (Throwable $e, Request $request) {
        $response = app(ExceptionHandlerResponse::class)->render($request, $e);
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        return $response;
    });
}
```

### Refactoring Strategy
1. Test all error responses for security headers (404, 403, 401, 500, 419, 503)
2. Add security headers to the exception handler's response
3. Or apply middleware at the kernel level (if possible in the Laravel version)
4. Add automated test that asserts security headers on error responses
5. Include error response headers in security audit scope

### Detection Checklist
- [ ] Error responses (404, 500, 403) include security headers
- [ ] Exception handler adds security headers to error responses
- [ ] Security audit includes error response header testing
- [ ] Clickjacking is prevented on all responses including errors
- [ ] CSP applies to error responses as well as successful ones

### Related Rules/Skills/Trees
- Rule: Error responses from the exception handler bypass middleware
- Rule: Add security headers to error responses at the exception handler level
- Related KU: Exception Handling, Security Headers

---

## Anti-Pattern 5: Content Modification of Streamed Responses

### Category
Reliability

### Description
Attempting to read, modify, or wrap the body of a `StreamedResponse` or `BinaryFileResponse` in response transformation middleware. These response types may have already started sending content or cannot re-read the content after it has been streamed.

### Why It Happens
Developers write response transformation middleware that calls `$response->getContent()` or `$response->setData()` without checking the response type. The code works for standard `Response` and `JsonResponse` types but fails for streamed or file responses. The middleware is tested only with regular responses.

### Warning Signs
- Response middleware calls `$response->getContent()` without a type check
- File downloads via `BinaryFileResponse` cause errors when middleware processes them
- Large CSV streams via `StreamedResponse` produce corrupted output or empty responses
- Error: "Cannot modify header information" or "Contents already sent"
- Middleware works for most routes but crashes on file download or stream endpoints

### Why Harmful
`StreamedResponse` content may have already been flushed to output — calling `getContent()` returns empty or partial data. `BinaryFileResponse` content is a file path, not a string — reading it corrupts the download. The response may have already started sending headers, making modifications impossible. The application crashes for file downloads, report generation, and streamed data endpoints.

### Real-World Consequences
- `JsonEnvelopeMiddleware` is registered globally
- File download route returns `BinaryFileResponse` (PDF invoice)
- Middleware calls `$response->getContent()` → gets file path, not content
- Middleware tries to set `$response->setData([... $content ...])` → BinaryFileResponse has no setData()
- Error: "Call to undefined method BinaryFileResponse::setData()"
- All PDF downloads fail with 500 error
- Fix: add response type check before modification

### Preferred Alternative
Always check the response type before attempting content modification. Use `instanceof` to verify the response supports the operations the middleware intends to perform.

```php
class ResponseEnrichmentMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only modify supported response types
        if ($response instanceof JsonResponse) {
            $data = $response->getData(true);
            $data['_meta'] = ['timestamp' => now()->toIso8601String()];
            $response->setData($data);
        } elseif ($response instanceof Response) {
            // Regular Response — can use getContent() and setContent()
            $content = $response->getContent();
            // ... modify content if needed
        }
        // BinaryFileResponse and StreamedResponse — skip content modification

        // Headers are safe for all response types
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        return $response;
    }
}
```

### Refactoring Strategy
1. Audit response transformation middleware for `getContent()`, `setContent()`, `getData()`, `setData()` calls
2. Add response type checks before content modification
3. Test with each response type: `Response`, `JsonResponse`, `BinaryFileResponse`, `StreamedResponse`
4. Document which response types the middleware supports
5. Add fallback: if response type is not supported, skip content modification

### Detection Checklist
- [ ] Content modification is guarded by `instanceof` response type checks
- [ ] `BinaryFileResponse` and `StreamedResponse` are not modified
- [ ] File downloads work correctly with response middleware enabled
- [ ] Streamed responses are not corrupted by middleware
- [ ] Headers alone are modified for unsupported response types

### Related Rules/Skills/Trees
- Rule: Check response type before modifying content in middleware
- Rule: Streamed and file responses cannot be content-modified
- Related KU: Response Types, Binary File Responses, Streaming Responses
