# Request Transformation

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Middleware System
- **Knowledge Unit:** Request Transformation
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Request transformation middleware modifies the incoming HTTP request before it reaches the controller. These modifications include sanitizing input (trimming strings, converting empty strings), enriching the request with resolved data (tenant context, request IDs), correcting request metadata (trusted proxies), and handling cross-origin preflight requests (CORS).

The engineering significance of request transformation is that it centralizes request normalization so that controllers and services receive a consistent, enriched request regardless of how the client sent it. Without this middleware layer, every controller would independently sanitize input, resolve tenant context, and generate request IDs — duplicating logic and increasing the risk of inconsistent behavior across routes. Global middleware handles transformations that apply to all routes; route-group middleware handles transformations specific to route collections.

---

## Core Concepts

### Request as Passable Object
In Laravel, the `$request` object is passed through the pipeline by reference. Middleware receives the same `$request` instance that was sent through the pipeline. Modifications made by one middleware are visible to all subsequent middleware and the controller.

This shared mutability is by design — it allows middleware to enrich the request as it travels inward, with each layer adding data for the layers below.

### Attributes vs Input
The `$request` object has two distinct storage areas for data:

- **Input** (`$request->input()`, `$request->all()`, `$request->get()`): User-provided data from query string, POST body, or route parameters. This is what the client sent.
- **Attributes** (`$request->attributes->set()`, `$request->attribute()`): Server-side data added by middleware. This is NOT user-provided — it is data the application resolves and attaches.

Middleware should use attributes for data it adds to the request. Modifying user input (`$request->merge()`) is appropriate only for sanitization (trimming, type casting), not for adding new data.

### Immutability of the Original Request
The original request (as sent by the client) is available via the underlying Symfony `Request` object. Middleware modifications affect the Laravel `$request` object that is passed through the pipeline. The request's underlying server parameters (`$_SERVER`, `$_GET`, `$_POST`) are not modified — only Laravel's wrapper around them.

---

## Mental Models

### Request as a Blank Canvas
The incoming request is a blank canvas. Each middleware layer paints a part of the picture before passing it to the next artist. The TrustedProxies layer corrects the perspective, the CORS layer prepares the frame, the InputSanitization layer cleans the canvas, and the TenantResolution layer adds the background. The controller completes the painting with the enriched canvas.

### Request as a Passport
The request is a passport that gets stamped at each checkpoint. The first checkpoint stamps the request ID. The second stamps the tenant. The third stamps the locale. By the time it reaches the controller, the passport carries all the data needed to process the request.

### Transformation vs Gating
Request transformation middleware differs from gating middleware (auth, throttle) in purpose: transformation middleware enriches the request, it does not block it. Transformation middleware should not short-circuit (unless the transformation is impossible and the request should be rejected).

---

## Internal Mechanics

### TrustedProxies Mechanics
`Illuminate\Http\Middleware\TrustProxies` configures which proxies are trusted and which headers to trust:

```php
class TrustProxies
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->setTrustedProxies(
            $this->proxies ?? $this->proxiesFromConfig(),
            $this->headers ?? Request::HEADER_X_FORWARDED_FOR |
                Request::HEADER_X_FORWARDED_HOST |
                Request::HEADER_X_FORWARDED_PORT |
                Request::HEADER_X_FORWARDED_PROTO |
                Request::HEADER_X_FORWARDED_AWS_ELB
        );
        return $next($request);
    }
}
```

This modifies the Symfony `Request`'s trusted proxy configuration, which affects:
- `$request->ip()` — returns the real client IP (not the proxy IP).
- `$request->getScheme()` — returns `https` if behind HTTPS-terminating proxy.
- `$request->getHost()` — returns the original host header.
- `$request->getPort()` — returns the original port.

Without TrustedProxies, all requests behind a load balancer appear to come from the load balancer's IP address.

### HandleCors Mechanics
`Illuminate\Http\Middleware\HandleCors` handles CORS preflight and adds CORS headers:

```php
public function handle(Request $request, Closure $next): Response
{
    if ($request->isMethod('OPTIONS')) {
        return $this->buildCorsResponse($request);
    }
    
    $response = $next($request);
    return $this->addCorsHeaders($request, $response);
}
```

For OPTIONS requests (preflight), the middleware returns a response immediately without calling `$next`. This is the correct behavior — preflight requests should never reach the controller. For non-OPTIONS requests, the middleware adds CORS headers to the response.

### Input Sanitization Mechanics
`TrimStrings` and `ConvertEmptyStringsToNull` modify the request's input data:

```php
// TrimStrings
public function handle(Request $request, Closure $next): Response
{
    if (! $this->shouldSkip($request)) {
        $request->merge($this->clean($request->all()));
    }
    return $next($request);
}

protected function clean(array $data): array
{
    return array_map(function ($value) {
        return is_string($value) ? trim($value) : $value;
    }, $data);
}
```

These middleware use `$request->merge()` to replace the input data with sanitized versions. The merge affects `$request->all()`, `$request->input()`, and `$request->get()`.

### Request Attribute Setting
Middleware adds data to the request using the `attributes` bag:

```php
$request->attributes->set('tenant', $tenant);
$request->attributes->set('request_id', (string) Str::uuid());
$request->attributes->set('locale', $locale);
```

Attributes are accessible downstream:
- `$request->attribute('tenant')` — middleware to middleware.
- `$request->attributes->get('tenant')` — in controllers and services.
- The `attributes` bag is serialized when the request is serialized (for queue jobs).

---

## Patterns

### Request ID Generation Pattern
Add a unique identifier to every request for tracing:

```php
class RequestIdMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $request->headers->get('X-Request-Id') ?? (string) Str::uuid();
        $request->attributes->set('request_id', $requestId);
        
        $response = $next($request);
        $response->headers->set('X-Request-Id', $requestId);
        
        return $response;
    }
}
```

- **Purpose**: Provide a traceable identifier for every request.
- **Benefits**: Correlates logs, errors, and metrics across services.
- **Tradeoffs**: Requires the client to pass the ID on subsequent requests for end-to-end tracing.

### Tenant Resolution Pattern
Identify the current tenant from the request:

```php
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = Tenant::findByDomain($request->getHost());
        
        if (! $tenant) {
            abort(404, 'Tenant not found');
        }
        
        $request->attributes->set('tenant', $tenant);
        app()->instance(Tenant::class, $tenant);
        
        return $next($request);
    }
}
```

- **Purpose**: Set up tenant context for multi-tenant applications.
- **Benefits**: Controllers and services receive tenant context without resolving it themselves.
- **Tradeoffs**: The tenant query runs on EVERY request. Cache aggressively.

### Locale Detection Pattern
Set the application locale based on request data:

```php
class LocaleMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->header('Accept-Language', config('app.locale'));
        
        if (in_array($locale, config('app.supported_locales'))) {
            app()->setLocale($locale);
        }
        
        $request->attributes->set('locale', app()->getLocale());
        
        return $next($request);
    }
}
```

- **Purpose**: Automatically configure locale per request.
- **Benefits**: Controllers do not need to handle locale detection.
- **Tradeoffs**: Accept-Language header may not match user preference for authenticated users.

### Force JSON Pattern
Ensure API routes receive JSON responses:

```php
class ForceJsonMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');
        return $next($request);
    }
}
```

- **Purpose**: Force JSON responses for API routes to avoid HTML error pages.
- **Benefits**: Consistent JSON error responses even for authorization failures and validation errors.
- **Tradeoffs**: Overrides the client's Accept header — the client cannot request a different format.

---

## Architectural Decisions

### Global vs Group for Request Transformation
| Transformation | Tier | Reason |
|---------------|------|--------|
| TrustedProxies | Global | Affects request interpretation for all routes |
| HandleCors | Global | Preflight must be handled before routing |
| TrimStrings | Global | Applies to all input |
| ConvertEmptyStringsToNull | Global | Applies to all input |
| Request ID | Global | Useful for all requests |
| Tenant Resolution | Route Group | Only needed for tenant-scoped routes |
| Locale Detection | Route Group | May need different logic for API vs web |
| Force JSON | Route Group (api) | Only needed for API routes |

### Input Modification vs Attribute Addition
Use `$request->merge()` ONLY for sanitization (modifying input format, not adding new data). Use `$request->attributes->set()` for adding resolved data. This separation ensures that controllers can distinguish between "what the user sent" and "what the system resolved."

### Caching Transformed Data
Middleware that resolves data from databases (tenant, user preferences, feature flags) should cache results. A tenant resolution middleware that queries the database on every 404 page adds unnecessary load. Use Laravel's cache with a TTL appropriate for the data.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Centralized request normalization | Middleware runs on every request in its scope | Keep transformations lightweight; cache expensive resolutions |
| Shared mutability — all middleware see modifications | Accidental modification — one middleware can corrupt another's data | Use attributes for new data; use merge only for sanitization |
| TrustedProxies fixes IP/scheme behind load balancers | Requires configuration — wrong config causes wrong IP/scheme | Test behind actual load balancer in staging environment |
| HandleCors intercepts OPTIONS before controller | CORS configuration must be maintained per environment | Use environment-specific CORS configs for development vs production |

---

## Performance Considerations

### TrustedProxies Overhead
`TrustedProxies` sets configuration on the Symfony Request object. It does not make network calls or external requests. Overhead is ~0.001ms — negligible.

### HandleCors Overhead
For OPTIONS requests, `HandleCors` returns immediately without executing controller or other middleware. For non-OPTIONS requests, it adds CORS headers to the response. Overhead is ~0.01ms for the header setting.

### Tenant/Locale Resolution Overhead
Database-backed resolution (tenant, user preferences) adds real latency. A tenant query per request adds 2-10ms of database time. For applications with 100+ requests/second, this becomes significant. Cache aggressively or move resolution to DNS/subdomain level.

### Input Sanitization Overhead
`TrimStrings` and `ConvertEmptyStringsToNull` iterate through all input fields. For a request with 100 fields, this adds ~0.05ms. For requests with large arrays (1000+ fields), this adds ~0.5ms.

---

## Production Considerations

### TrustedProxies Configuration
Behind a load balancer, configure trusted proxies explicitly:

```php
// In TrustProxies middleware or config/trustedproxy.php
protected $proxies = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
];
```

Using `*` trusts ALL proxies, which is insecure in environments where external traffic passes through intermediate proxies.

### Testing Request Transformations
Test request transformation middleware by:
1. Creating a request with specific input/headers.
2. Passing through the middleware.
3. Asserting the modified request has the expected data.

```php
public function test_trim_strings_middleware_trims_input(): void
{
    $request = Request::create('/test', 'POST', ['name' => '  John  ']);
    $middleware = new TrimStrings();
    $response = $middleware->handle($request, fn ($req) => response('OK'));
    
    $this->assertEquals('John', $request->input('name'));
}
```

### Attribute Leakage in Octane
In Octane, `$request->attributes` is a per-request bag — it does not persist across requests. However, if middleware stores data on a singleton service and references it by request attributes, ensure the singleton clears per-request data after use.

---

## Common Mistakes

### Modifying Input Instead of Attributes
Middleware that uses `$request->merge()` to add data like tenant ID pollutes the user input. Controllers using `$request->all()` or `$request->validated()` will include the tenant ID as if it came from the user.

### TrustedProxies Not Configured
Behind any reverse proxy (AWS ELB, nginx, Cloudflare), without TrustedProxies, `$request->ip()` returns the proxy IP, `$request->getScheme()` returns `http` instead of `https`, and `$request->getHost()` may return incorrect values.

### Not Handling CORS for OPTIONS
Without `HandleCors` middleware, OPTIONS preflight requests reach the controller, which typically returns a 404 or 405 because there is no OPTIONS route defined. The browser receives no CORS headers and blocks the subsequent request.

### Heavy Database Queries in Global Middleware
A global middleware that queries the database for every request (e.g., loading site settings, feature flags) adds database load to static asset requests, health checks, and 404 pages. Cache or defer.

---

## Failure Modes

### Request Modification After Short-Circuit
A middleware that short-circuits (returns a response without calling `$next`) does not prevent upstream middleware's modifications from being visible. If middleware A modifies the request and middleware B short-circuits, the controller does not see A's modifications — but that is correct because the controller never runs.

### Attribute Namespace Collisions
Two middleware setting `$request->attributes->set('id', ...)` with different meanings (one sets request ID, another sets user ID) cause silent data corruption. Use namespaced attribute keys: `'request_id'`, `'tenant.id'`, `'user.locale'`.

### Input Sanitization Breaking Expected Types
`ConvertEmptyStringsToNull` converts `''` to `null`. If a controller expects an empty string, it receives `null` instead. This can cause type errors in strict types or unexpected behavior in nullable fields.

---

## Ecosystem Usage

### Laravel Framework
The framework ships with several built-in request transformation middleware:
- `TrustProxies` — proxy configuration.
- `HandleCors` — CORS handling.
- `TrimStrings` — input trimming.
- `ConvertEmptyStringsToNull` — empty string normalization.
- `PreventRequestsDuringMaintenance` — maintenance mode (transforms to response).

### Laravel Jetstream
Jetstream does not add custom request transformation middleware. It uses the framework defaults.

### Spatie Packages
Spatie's `laravel-cookie-consent` provides middleware that checks cookie consent and modifies the request accordingly. Spatie's packages generally avoid request transformation middleware — they prefer configuration-based solutions.

### Third-Party Tenant Packages
Multi-tenant packages (stancl/tenancy, hyn/multi-tenant) provide tenant resolution middleware that identifies the tenant from the request domain and sets up tenant-scoped database connections.

---

## Related Knowledge Units

### Prerequisites
- Middleware Fundamentals — the Pipeline pattern and handle() contract
- Middleware Lifecycle — where request transformation occurs in the flow

### Related Topics
- Custom Middleware — creating request transformation middleware
- Global, Route Group, and Route Middleware — where to register transformation middleware
- Cross-Cutting Concerns — deciding whether a transformation belongs in middleware

### Advanced Follow-up Topics
- Response Transformation — the outbound counterpart to request transformation
- Parameterized Middleware — passing configuration to transformation middleware
- Service Container — how resolved data is bound into the container for downstream use

---

## Research Notes

- The `$request->attributes` bag is serialized when the request is serialized (for queue or session serialization). Attributes set by middleware persist through serialization — they are available on the deserialized request.
- `TrimStrings` and `ConvertEmptyStringsToNull` are registered as global middleware in all Laravel installations. They run on every request, including API routes and 404 responses. These are the most universally applied request transformations.
- TrustedProxies configuration is environment-specific. In development (no proxy), no configuration is needed. In production (behind AWS ELB, nginx, Cloudflare), configuration is required. Forgetting this in production is one of the most common deployment issues.
- The `HandleCors` middleware was added to the framework in Laravel 9 (from the `fruitcake/laravel-cors` package). Before Laravel 9, CORS was handled by a third-party package.