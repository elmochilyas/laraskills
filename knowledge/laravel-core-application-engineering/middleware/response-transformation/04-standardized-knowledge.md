# ECC Standardized Knowledge — Response Transformation

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Middleware System |
| **Knowledge Unit** | Response Transformation |
| **Difficulty** | Advanced |
| **Category** | HTTP Pipeline — Middleware |
| **Last Updated** | 2026-06-02 |

---

## Overview

Response transformation middleware modifies the HTTP response after the controller produces it but before it is sent to the client. These modifications include adding security headers (CSP, HSTS, X-Frame-Options), cache control directives (Cache-Control, ETag), CORS headers, timing information, and response envelope wrapping.

The engineering significance of response transformation is that it decouples HTTP formatting from business logic. Controllers return domain data; middleware handles the HTTP protocol concerns. A controller that returns a Post model does not need to know about Cache-Control directives or Content-Security-Policy headers — those are applied uniformly by middleware.

---

## Core Concepts

### Post-Processing Position

Response transformation code runs AFTER `$response = $next($request)`. The middleware adds to the response after all downstream middleware and the controller have finished. The position after `$next` ensures the middleware operates on the final response.

### Response Mutability by Type

The Laravel `Response` object is mutable — headers can be added, content modified, status codes changed. However, `BinaryFileResponse` content cannot be modified (file-based). `StreamedResponse` may have started streaming — headers can be added before streaming, but content modifications may not work. `JsonResponse` data can be read and modified via `getData()`/`setData()`. `RedirectResponse` status and Location can be modified.

### SetCacheHeaders Middleware

`SetCacheHeaders` (aliased `cache.headers`) adds cache control directives. For `etag`, it generates an MD5 hash of the full response content and checks `If-None-Match` against it. If they match, the response is replaced with a 304 Not Modified response.

### CORS Header Addition

`HandleCors` adds CORS headers to responses for non-OPTIONS requests (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, etc.). For OPTIONS requests, it returns a 204 response with CORS headers without calling `$next`.

### Security Headers

Common headers: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Strict-Transport-Security`, `Referrer-Policy`, `Content-Security-Policy`. These are typically added by a dedicated `SecurityHeadersMiddleware`.

---

## When To Use

- **Security headers middleware** to enforce security headers on all responses uniformly — X-Frame-Options, X-Content-Type-Options, CSP, HSTS, Referrer-Policy.
- **Cache control middleware** (`cache.headers`) to set caching behavior per route without controller code.
- **CORS middleware** to add CORS headers for cross-origin requests.
- **Response timing middleware** to add `X-Response-Time` header for debugging and monitoring.
- **JSON envelope middleware** to standardize JSON response format for API routes.
- **Any response standardization** that should apply uniformly across routes.

---

## When NOT To Use

- Do NOT use response transformation middleware to modify content that controllers intentionally set to specific values — the middleware override may violate the controller's contract.
- Do NOT apply JSON envelope wrapping globally — only apply to API routes. HTML and file responses should not be enveloped.
- Do NOT set `Strict-Transport-Security` in development environments — browsers remember HSTS even after switching to HTTP.
- Do NOT attempt to modify response content of `BinaryFileResponse` or `StreamedResponse` — the content may have been sent or cannot be re-read.

---

## Best Practices (WHY)

- **Add security headers in middleware, not in controllers.** This ensures every response gets the same security headers regardless of which controller produced it. Controllers should not need to remember to set security headers.
- **Use `cache.headers` middleware at the route level.** Cache configuration is visible in route definitions, not hidden in controllers. Route-level middleware documents caching intent alongside the route itself.
- **Use private cache for authenticated responses.** A route that sets `Cache-Control: public` but serves authenticated user data causes cache poisoning. Shared caches serve the first user's data to all subsequent users.
- **Test CSP in report-only mode first.** Content-Security-Policy headers require careful configuration. A CSP that is too restrictive breaks legitimate scripts. Use `Content-Security-Policy-Report-Only` before enforcing.
- **Only add response timing headers in non-production environments.** `X-Response-Time` reveals server-side performance data to clients — useful for debugging but potentially undesirable in production.

---

## Architecture Guidelines

- **Middleware execution order:** Response transformation middleware runs in reverse pipeline order. The last middleware on the inbound pass is the first on the outbound pass.
- **Security headers in middleware vs web server:** nginx adds headers for static assets. Laravel middleware adds application-specific headers. A combination approach is recommended.
- **Cache headers location:** Route-level via `->middleware('cache.headers:public;max_age=3600')` is preferred over controller-level `$response->setCache()`.
- **JSON envelope:** Apply only to the `api` group, not globally. Web routes returning HTML do not need wrapping.
- **HandleCors:** Both request transformation (intercepts OPTIONS) and response transformation (adds CORS headers). The only built-in middleware that does both.
- **ETag generation:** Reads full response content into memory for MD5 hashing. For large responses (file downloads, paginated collections), this duplicates memory consumption.

---

## Performance

ETag generation reads the full response content into memory for hashing — large responses consume double memory during processing. Security headers add ~200-800 bytes to each response. A 304 Not Modified response (from matching ETags) saves bandwidth by returning zero content body. HandleCors for OPTIONS requests returns a 204 without executing the controller — a net performance gain.

---

## Security

Response transformation middleware is critical for security posture. `X-Frame-Options` prevents clickjacking. `X-Content-Type-Options` prevents MIME-type sniffing. `Content-Security-Policy` prevents XSS and data injection. `Strict-Transport-Security` enforces HTTPS. `Referrer-Policy` controls referrer header leakage. Cache control prevents sensitive data from being cached by shared caches. However, security headers applied by middleware may be missing on error responses produced by the exception handler after the pipeline completes.

---

## Common Mistakes

- **Double headers.** Two middleware both add the same header (e.g., two CORS middleware instances). The second overwrites the first. Usually harmless but confusing during debugging.
- **Setting headers after sending.** Middleware that modifies the response after `$response->send()` has no effect — headers have already been sent.
- **Content modifying streamed responses.** Attempting to read or modify the body of a `StreamedResponse` or `BinaryFileResponse` after `$next($request)` may fail because content has already been sent.
- **Enveloping non-JSON responses.** A JSON envelope middleware applied to all responses attempts to call `getData()` on HTML, form, or file responses, causing errors. Always check the response type.
- **Missing headers on error responses.** Error responses (404, 500) generated by the exception handler after the pipeline completes bypass middleware. Security headers are missing from error responses.

---

## Anti-Patterns

- **Cache poisoning via shared cache.** Setting `Cache-Control: public` on authenticated responses allows shared caches to serve authenticated data to all users. Always use `private` for authenticated responses.
- **CORS preflight caching stale configuration.** After updating CORS configuration, browsers continue using the old config until `Access-Control-Max-Age` expires. Version CORS endpoints or use short max-age during configuration changes.
- **Global JSON envelope.** Applying JSON envelope middleware to all routes (including web routes returning HTML) breaks all HTML responses. Apply only to the `api` group.
- **HSTS in development.** Setting `Strict-Transport-Security` in development causes browsers to remember the HTTPS requirement. When switching back to local HTTP, the browser refuses to connect.

---

## Examples

### Security Headers Middleware
```php
class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        if (app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
```

### Cache Control via Route
```php
Route::get('/posts', [PostController::class, 'index'])
    ->middleware('cache.headers:public;max_age=3600;etag');

Route::get('/posts/{post}', [PostController::class, 'show'])
    ->middleware('cache.headers:private;max_age=60');
```

### JSON Envelope (API Only)
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
            'meta' => [
                'timestamp' => now()->toIso8601String(),
            ],
        ]);

        return $response;
    }
}
```

---

## Related Topics

- **Middleware Fundamentals** (prerequisite) — the Pipeline pattern and handle() contract.
- **Middleware Lifecycle** (prerequisite) — where response transformation occurs in the outbound pass.
- **Request Transformation** — the inbound counterpart to response transformation.
- **Parameterized Middleware** — configuring cache headers via parameters.
- **Middleware Ordering and Priority** — where response transformation middleware should be positioned.
- **Cross-Cutting Concerns** — deciding whether a response transformation belongs in middleware.
- **Cache Control** — deep dive into HTTP caching strategies.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Custom Middleware (prerequisite). Serves as prerequisite for cross-cutting-concerns.
- **Post-processing position:** Code runs AFTER `$response = $next($request)`. Modifications apply to the final response.
- **Response type constraints:** BinaryFileResponse, StreamedResponse, JsonResponse, RedirectResponse each have different mutability characteristics.
- **ETag generation:** Reads full response content into memory for MD5 hashing. Memory concern for large responses.
- **Security headers on errors:** Error responses from the exception handler may bypass middleware. Add headers in the exception handler too.
- **HandleCors** is both a request transformation (OPTIONS handling) and response transformation (CORS headers).

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| Post-processing position documented | ✓ |
| Response type constraints explained | ✓ |
| When to use / when NOT to use | ✓ |
| Best practices with rationale | ✓ |
| Security headers, cache, CORS documented | ✓ |
| Performance analysis | ✓ |
| Security considerations | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples | ✓ |
| Related topics mapped | ✓ |
