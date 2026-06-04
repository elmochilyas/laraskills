# Response Transformation

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Middleware System
- **Knowledge Unit:** Response Transformation
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Response transformation middleware modifies the HTTP response after the controller produces it but before it is sent to the client. These modifications include adding security headers (CSP, HSTS, X-Frame-Options), cache control directives (Cache-Control, ETag), CORS headers, timing information, and response envelope wrapping.

The engineering significance of response transformation is that it decouples HTTP formatting from business logic. Controllers return domain data; middleware handles the HTTP protocol concerns. A controller that returns a Post model does not need to know about Cache-Control directives or Content-Security-Policy headers — those are applied uniformly by middleware. This separation ensures consistent HTTP behavior across all routes and prevents controllers from accidentally misconfiguring response headers.

---

## Core Concepts

### Post-Processing Position
Response transformation code runs AFTER `$response = $next($request)`:

```php
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);  // Controller produces response
    
    // Response transformation begins
    $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
    return $response;
}
```

The position after `$next` means the middleware adds to the response after all downstream middleware and the controller have finished.

### Response Mutability
The Laravel `Response` object (and Symfony's base `Response`) is mutable. Headers can be added, content can be modified, status codes can be changed, and the response object can be replaced entirely. However, certain response types have constraints:

- `BinaryFileResponse`: Content is a file — modifying content is not possible.
- `StreamedResponse`: Content may have started streaming — adding headers before streaming works, modifying content stream does not.
- `RedirectResponse`: Status code and Location header can be modified.
- `JsonResponse`: Data can be read and modified via `getData()`/`setData()`.

### Middleware Order for Response
Response transformation middleware must be ordered correctly in the priority chain. Transformation that adds headers should run AFTER the controller and downstream content middleware but BEFORE the response is finalized. If two middleware add the same header, the one that runs last wins.

---

## Mental Models

### Response as a Package
The controller produces the contents of a package (the business data). Response transformation middleware wraps that package in packing materials (headers), adds shipping labels (CORS, cache directives), and stamps it with security seals (CSP, HSTS). The package contents are unchanged — only the wrapping is modified.

### The Assembly Line in Reverse
On the inbound pass, middleware modifies the request. On the outbound pass, middleware modifies the response. The last middleware on the inbound pass is the first on the outbound pass. This means response transformations added by early middleware (like security headers) are outermost — they represent the final touches before the response leaves the application.

### Convention over Configuration
Response transformation middleware enforces HTTP conventions automatically. A `SecurityHeadersMiddleware` ensures every response has `X-Content-Type-Options: nosniff` regardless of whether the controller developer remembered. A `CacheControlMiddleware` ensures public resources are cached correctly. The middleware acts as a safety net for HTTP best practices.

---

## Internal Mechanics

### SetCacheHeaders Middleware
`Illuminate\Http\Middleware\SetCacheHeaders` (aliased as `cache.headers`) adds cache control headers:

```php
public function handle(Request $request, Closure $next, string ...$options): Response
{
    $response = $next($request);
    
    // Parse options: public, max_age=3600, etag
    foreach ($options as $option) {
        // ... parse and apply cache directives
    }
    
    return $response;
}
```

For `etag` parameter, the middleware generates an MD5 hash of the response content:

```php
if (in_array('etag', $options)) {
    $response->setEtag(md5($response->getContent()));
    $response->isNotModified($request);  // Returns 304 if ETag matches
}
```

The `isNotModified()` method checks the `If-None-Match` header against the generated ETag. If they match, the response is replaced with a 304 Not Modified response with empty content.

### CORS Header Addition
`HandleCors` adds CORS headers to the response for non-OPTIONS requests:

```php
$response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
$response->headers->set('Access-Control-Allow-Methods', $allowedMethods);
$response->headers->set('Access-Control-Allow-Headers', $allowedHeaders);
$response->headers->set('Access-Control-Expose-Headers', $exposedHeaders);
$response->headers->set('Access-Control-Max-Age', $maxAge);
```

For OPTIONS requests, `HandleCors` returns a 204 response with CORS headers without calling `$next`.

### Response Timing Header
A common pattern adds timing information:

```php
$response->headers->set('X-Response-Time', sprintf('%.2f ms', (microtime(true) - LARAVEL_START) * 1000));
```

This requires access to `LARAVEL_START` (defined in `public/index.php`) or a custom start time set by a pre-middleware during the inbound pass.

### Security Headers
Common security headers added by response transformation middleware:

```php
$response->headers->set('X-Frame-Options', 'SAMEORIGIN');
$response->headers->set('X-Content-Type-Options', 'nosniff');
$response->headers->set('X-XSS-Protection', '1; mode=block');
$response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
$response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
$response->headers->set('Content-Security-Policy', "default-src 'self'");
```

These headers are typically added by a dedicated `SecurityHeadersMiddleware`.

---

## Patterns

### Security Headers Pattern
Add security headers to every response:

```php
class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        if (app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
        
        return $response;
    }
}
```

- **Purpose**: Enforce security headers on all responses.
- **Benefits**: Controllers do not need to set security headers — they are applied uniformly.
- **Tradeoffs**: Security headers add bytes to every response (~200-400 bytes for typical headers).

### Cache Control Pattern
Set caching behavior per route:

```php
Route::get('/posts', [PostController::class, 'index'])
    ->middleware('cache.headers:public;max_age=3600;etag');

Route::get('/posts/{post}', [PostController::class, 'show'])
    ->middleware('cache.headers:private;max_age=60');
```

- **Purpose**: Control caching behavior at the route level without controller code.
- **Benefits**: Cache configuration is visible in route definitions, not hidden in controllers.
- **Tradeoffs**: ETag generation requires reading the full response content into memory for hashing.

### Response Timing Pattern
Add performance data to the response:

```php
class ResponseTimingMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        
        $duration = (microtime(true) - LARAVEL_START) * 1000;
        $response->headers->set('X-Response-Time', sprintf('%.2f ms', $duration));
        
        return $response;
    }
}
```

- **Purpose**: Expose response timing for debugging and monitoring.
- **Benefits**: Frontend teams can diagnose slow endpoints without server access.
- **Tradeoffs**: Reveals performance data to clients — may be undesirable in production. Consider only adding in non-production environments.

### JSON Envelope Pattern
Wrap JSON responses in a standardized envelope:

```php
class JsonEnvelopeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        
        if (! $response instanceof JsonResponse) {
            return $response;
        }
        
        $original = $response->getData(true);
        
        $response->setData([
            'success' => $response->isSuccessful(),
            'data' => $original,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->attributes->get('request_id'),
            ],
        ]);
        
        return $response;
    }
}
```

- **Purpose**: Standardize JSON response format across all API routes.
- **Benefits**: Clients receive a predictable response structure.
- **Tradeoffs**: Breaks backward compatibility if existing clients expect the raw format.

---

## Architectural Decisions

### Security Headers in Middleware vs Web Server
Security headers can be added either by Laravel middleware or by the web server (nginx, Apache):

| Approach | Benefit | Cost |
|----------|---------|------|
| Laravel middleware | Consistent across all environments; headers added for all responses including errors | Added by the application layer — headers not present if middleware is disabled |
| Web server (nginx) | Added before the application layers — present in all cases | Requires server configuration per environment |

For most applications, a combination works: nginx adds security headers for static assets and low-level protection; Laravel middleware adds application-specific headers.

### Cache Headers at Route vs Middleware Level
Cache control can be configured:
- At the route level via `->middleware('cache.headers:public;max_age=3600')`.
- In the controller via `$response->setCache()`.
- In a global middleware that applies defaults.

Route-level middleware is preferred because it makes caching behavior visible in route definitions. Controller-level caching mixes HTTP concerns with business logic.

### Response Envelope Only for API
JSON envelope wrapping should be applied only to API routes, not web routes (HTML). Apply the envelope middleware to the `api` group, not globally. Web routes returning HTML do not need JSON wrapping, and applying it to HTML responses would break them.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Security headers applied uniformly | Headers add response size (~200-400 bytes) | Negligible for most responses |
| Cache headers per route without controller code | Cache header middleware must be added per route | Use a group for common cache configurations |
| JSON envelope standardizes API responses | Changes the response format — breaks existing clients | Version the API or communicate the change |
| ETag enables 304 responses (saves bandwidth) | ETag generation reads full response content into memory | Use for small responses; avoid for large streams |

---

## Performance Considerations

### ETag Generation Memory
`SetCacheHeaders` reads the full response content into memory to generate the MD5 hash. For large responses (file downloads, paginated collections), this duplicates the response content in memory during middleware processing. The content is freed after the middleware returns.

### Header Size Overhead
Security headers, CORS headers, and timing headers add approximately 200-800 bytes to each response. For most responses, this is negligible compared to the content size. For responses with extremely tight bandwidth constraints, consider minimizing header count.

### Cache Hit Savings
A 304 Not Modified response (returned by `SetCacheHeaders` when ETags match) has zero content body. This saves bandwidth and reduces response time for cached resources. The savings depend on the cache hit rate and response size.

---

## Production Considerations

### Testing Response Modifications
Test response transformation middleware by asserting on the returned response:

```php
public function test_security_headers_are_added(): void
{
    $response = $this->get('/any-route');
    
    $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    $response->assertHeader('X-Content-Type-Options', 'nosniff');
    $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}
```

### CSP Configuration
Content-Security-Policy headers require careful configuration. A CSP that is too restrictive breaks legitimate scripts and styles. A CSP that is too permissive provides no protection. Test CSP in report-only mode first:

```php
$response->headers->set('Content-Security-Policy-Report-Only', "default-src 'self'; report-uri /csp-report");
```

### HSTS in Production Only
`Strict-Transport-Security` should only be set in production environments. Setting HSTS in development causes browsers to remember the HTTPS requirement even after switching to HTTP.

---

## Common Mistakes

### Double Headers
Two middleware both add the same header (e.g., two CORS middleware instances). The second middleware's value overwrites the first. This is usually harmless but can cause confusion when debugging response headers.

### Setting Headers After Sending
Middleware that modifies the response after `$response->send()` has no effect — the response headers have already been sent. Response modification must happen during the pipeline's outbound pass, before `$response->send()`.

### Content Modifying Streamed Responses
Attempting to read or modify the body of a `StreamedResponse` or `BinaryFileResponse` after `$next($request)` may fail because the content has already been sent or cannot be read back. Check the response type before accessing content:

```php
if ($response instanceof \Illuminate\Http\Response) {
    $content = $response->getContent();
    // Modify content
}
```

### Enveloping Non-JSON Responses
A JSON envelope middleware applied to all responses (not just JSON) attempts to call `getData()` on HTML responses, form responses, or file responses. This causes errors or unexpected behavior. Always check the response type.

---

## Failure Modes

### Missing Headers on Error Responses
A global response middleware adds security headers, but error responses (404, 500) may be generated by the exception handler after the middleware pipeline has already completed. The error response bypasses the middleware, so headers are missing. Solution: add headers in the exception handler or use a kernel-level middleware.

### Cache Poisoning via Shared Cache
A route that sets `Cache-Control: public` but serves authenticated user data causes cache poisoning. Shared caches (CDN, reverse proxy) cache the first user's response and serve it to all subsequent users. Always use `private` for authenticated responses.

### CORS Preflight Caching Stale Configuration
CORS configuration changes require the `Access-Control-Max-Age` to expire before browsers re-fetch the preflight response. If the CORS configuration is updated but the preflight cache has a long TTL, browsers continue using the old configuration.

---

## Ecosystem Usage

### Laravel Framework
The framework provides two built-in response transformation middleware:
- `SetCacheHeaders` (aliased `cache.headers`) — adds cache control headers with optional ETag.
- `HandleCors` — adds CORS headers.

### Laravel Horizon
Horizon does not add response transformation middleware. Its dashboard responses are handled by the web application's middleware stack.

### Spatie Packages
Spatie's `laravel-cors` (pre-Laravel 9) provided CORS middleware. Spatie's `laravel-responsecache` caches full responses but is not a transformation middleware — it works at a higher level.

### Third-Party Security Packages
Packages like `league/common` and custom security middleware add comprehensive security headers (CSP, HSTS, XFO, XCTO). These are typically registered as global middleware.

---

## Related Knowledge Units

### Prerequisites
- Middleware Fundamentals — the Pipeline pattern and handle() contract
- Middleware Lifecycle — where response transformation occurs in the outbound pass

### Related Topics
- Request Transformation — the inbound counterpart to response transformation
- Parameterized Middleware — configuring cache headers via parameters
- Middleware Ordering and Priority — where response transformation middleware should be positioned

### Advanced Follow-up Topics
- Cross-Cutting Concerns — deciding whether a response transformation belongs in middleware
- Cache Control — deep dive into HTTP caching strategies

---

## Research Notes

- `SetCacheHeaders` generates an ETag by hashing the entire response content. For responses from paginated Eloquent collections, the content includes the JSON serialization of all models. For large collections, this consumes significant memory during hashing.
- Response modification after `$next($request)` is the ONLY way to modify responses uniformly across all routes. Controllers cannot opt out of response middleware — the middleware runs on all routes in its scope.
- The `X-Response-Time` header is commonly added by response timing middleware but should be used carefully. In production, it reveals server-side performance data to clients. Most production applications restrict it to internal routes or remove it entirely.
- `HandleCors` is both a request transformation (handles OPTIONS) and a response transformation (adds CORS headers). It is the only built-in middleware that performs both transformations in a single class.