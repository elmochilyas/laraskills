# Phase 5: Rules — Request Transformation

---

## Rule Name

Use $request->attributes for Resolved Data, $request->merge Only for Sanitization

---

## Category

Framework Usage

---

## Rule

When middleware resolves or generates data (tenant, request ID, user preferences), store it via `$request->attributes->set('key', $value)`. Use `$request->merge()` exclusively for input sanitization — trimming strings, converting empty strings to null, or casting types. Never use `$request->merge()` to add data that did not originate from the client.

---

## Reason

`$request->merge()` modifies the user input bag. Controllers using `$request->all()`, `$request->validated()`, or `$request->input()` receive merged data as if the client sent it. This contaminates validation, form request logic, and serialization. The attributes bag is request-scoped, serialization-safe, and provides a clean separation between client input and system-enriched data. Using the wrong storage corrupts the separation of concerns between client data and server data.

---

## Bad Example

```php
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->merge(['tenant' => Tenant::current()]); // Pollutes user input
        return $next($request);
    }
}

// Controller — $request->validated() includes 'tenant' key
```

---

## Good Example

```php
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('tenant', Tenant::current());
        return $next($request);
    }
}

// Controller — clean separation: $request->attributes->get('tenant')
```

---

## Exceptions

`$request->merge()` is the correct method for input sanitization only: trimming whitespace, converting empty strings to null, casting string numbers to integers. The intent must be to normalize existing input, not to add new data.

---

## Consequences Of Violation

Security risks: system data enters validated fields, potentially bypassing intended constraints. Reliability risks: validation rules may reject system-added data. Maintenance risks: controllers cannot distinguish client-provided data from middleware data.

---

---

## Rule Name

Configure TrustedProxies Explicitly — Never Use Wildcard in Production

---

## Category

Security

---

## Rule

Configure `TrustedProxies` with explicit IP ranges or CIDR notations (e.g., `'10.0.0.0/8'`, `'172.16.0.0/12'`, `'192.168.0.0/16'`). Never use `*` (trust all proxies) in production environments.

---

## Reason

Without `TrustedProxies` configuration behind a load balancer, `$request->ip()` returns the proxy IP, making IP-based access controls, rate limiting, and geolocation ineffective. However, using `*` trusts ALL proxies including intermediate ones that external traffic passes through. An attacker behind an intermediate proxy can spoof their IP address by sending `X-Forwarded-For` headers. Explicit IP ranges restrict trust to known infrastructure proxies.

---

## Bad Example

```php
// Trusts ALL proxies — allows IP spoofing
'proxies' => '*',
```

---

## Good Example

```php
// Trust only known infrastructure proxies
'proxies' => [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
],
```

---

## Exceptions

Local development environments may use `*` for simplicity. Production, staging, and CI must use explicit ranges.

---

## Consequences Of Violation

Security risks: IP spoofing through intermediate proxies bypasses IP-based controls. Reliability risks: without any TrustedProxies config, `$request->ip()` returns the load balancer IP, breaking IP-dependent features.

---

---

## Rule Name

Cache Expensive Request Transformations

---

## Category

Performance

---

## Rule

Request transformation middleware that performs database queries, API calls, or computationally expensive operations must cache results. Use in-memory caching for request-scoped deduplication and your application cache (Redis, Memcached) for cross-request caching.

---

## Reason

Request transformation middleware (tenant resolution, feature flag checks, user preference loading) often runs on every request in a group or globally. A tenant resolution middleware that queries the database on every request adds 2-10ms of latency and database load to each request, including health checks and 404 pages. Caching reduces this to a single query per cache interval, dramatically reducing database load and response time.

---

## Bad Example

```php
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = Tenant::where('domain', $request->getHost())->first(); // DB every request
        // ...
        return $next($request);
    }
}
```

---

## Good Example

```php
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = Cache::remember("tenant:{$request->getHost()}", 3600, function () use ($request) {
            return Tenant::where('domain', $request->getHost())->first();
        });
        $request->attributes->set('tenant', $tenant);
        return $next($request);
    }
}
```

---

## Exceptions

Transformations that need real-time data (e.g., checking current subscription status) may skip caching. Document why caching is not used and consider moving the middleware from global/group to route-level registration to limit its execution scope.

---

## Consequences Of Violation

Performance risks: database load multiplied by every request hitting the middleware. Scalability risks: database connection pool exhaustion under traffic spikes. Latency risks: each request pays 2-10ms of database time.

---

---

## Rule Name

Register HandleCors Globally — Never as Route Middleware

---

## Category

Code Organization

---

## Rule

`HandleCors` middleware must be registered as global middleware. Never register it at the group or route level.

---

## Reason

CORS handles OPTIONS preflight requests that browsers send before cross-origin requests. These preflight requests must be intercepted before routing — the OPTIONS request path may not match any application route. If `HandleCors` runs as route middleware, the OPTIONS request reaches the router, no route matches, and the application returns a 404 without CORS headers. The browser sees no CORS headers and blocks the subsequent request. Global registration ensures CORS intercepts OPTIONS before routing.

---

## Bad Example

```php
// Route-level — OPTIONS preflight returns 404 without CORS headers
Route::get('/api/data', [DataController::class, 'index'])
    ->middleware(\Illuminate\Http\Middleware\HandleCors::class);
```

---

## Good Example

```php
->withMiddleware(function (Middleware $middleware) {
    // Global — OPTIONS preflight is handled before routing
    $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
});
```

---

## Exceptions

Applications that do not serve cross-origin requests (same-origin only) do not need `HandleCors`.

---

## Consequences Of Violation

Reliability risks: CORS preflight requests fail, blocking legitimate cross-origin requests. Debugging difficulty: the browser shows a CORS error but the application logs show a 404, leading developers to look for routing issues instead of middleware registration issues.

---

---

## Rule Name

Apply Force JSON Middleware Only to API Route Groups, Not Globally

---

## Category

Design

---

## Rule

`ForceJsonMiddleware` (which sets `Accept: application/json` header) must be applied only to API route groups. Never register it as global middleware.

---

## Reason

Setting `Accept: application/json` globally causes Laravel to return JSON error responses for all requests, including web routes that expect HTML. A 404 on a web route would return `{"message": "Not Found"}` instead of an HTML error page. Web routes returning HTML views may also return unexpected JSON wrapping. The middleware is only appropriate for API routes where JSON responses are the expected format.

---

## Bad Example

```php
->withMiddleware(function (Middleware $middleware) {
    // Global — breaks web routes
    $middleware->append(ForceJsonMiddleware::class);
});
```

---

## Good Example

```php
->withMiddleware(function (Middleware $middleware) {
    // API group only — preserves HTML for web routes
    $middleware->api(append: [
        \App\Http\Middleware\ForceJsonMiddleware::class,
    ]);
});
```

---

## Exceptions

Single-format applications that exclusively serve JSON (SPA-only API backends) may apply Force JSON globally, but must verify that no routes expect HTML responses.

---

## Consequences Of Violation

Reliability risks: web routes return unexpected JSON responses. User experience: error pages are unreadable JSON instead of formatted HTML. Maintenance risks: team members expecting HTML responses from web routes encounter format mismatch bugs.

---

---

## Rule Name

Use Namespaced Keys in Request Attributes to Prevent Collisions

---

## Category

Maintainability

---

## Rule

When multiple middleware set data on `$request->attributes`, use namespaced keys to prevent collisions. Prefix keys with the middleware's concern domain (e.g., `'tenant.id'`, `'request.trace_id'`, `'auth.guard'`). Never use generic keys like `'id'`, `'key'`, or `'data'`.

---

## Reason

The request attributes bag is shared across all middleware and the controller. Two middleware setting `$request->attributes->set('id', ...)` with different meanings (one sets tenant ID, another sets request ID) will silently overwrite each other's data. The last middleware to execute wins, and the overwritten data is lost with no error. Namespaced keys prevent collisions and communicate the data's origin to consumers.

---

## Bad Example

```php
// Middleware A
$request->attributes->set('id', Tenant::current()->id);

// Middleware B (runs after A)
$request->attributes->set('id', (string) Str::uuid()); // Overwrites tenant ID silently
```

---

## Good Example

```php
// Middleware A
$request->attributes->set('tenant.id', Tenant::current()->id);

// Middleware B
$request->attributes->set('request.trace_id', (string) Str::uuid());

// Controller accesses: $request->attributes->get('tenant.id')
```

---

## Exceptions

Trivial middleware stacks where only one middleware sets attributes and no collisions are possible may use simple keys. As the middleware count grows, namespacing should be introduced.

---

## Consequences Of Violation

Reliability risks: attribute collisions cause silent data corruption — the last writer wins. Debugging difficulty: the overwritten data is lost with no error or warning. Maintenance risks: adding a new middleware may silently break an existing middleware's data.
