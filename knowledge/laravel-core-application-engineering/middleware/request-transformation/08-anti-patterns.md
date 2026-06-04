# Anti-Patterns: Request Transformation

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Middleware System |
| Knowledge Unit | Request Transformation |
| Difficulty | Advanced |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Using `$request->merge()` for Non-Sanitization Data | Security | Critical |
| 2 | Global Middleware for Tenant Resolution | Performance | High |
| 3 | TrustedProxies Not Configured Behind a Load Balancer | Security | Critical |
| 4 | Attribute Namespace Collisions | Reliability | High |
| 5 | Not Handling CORS for OPTIONS Preflight Requests | Architecture | High |

---

## Anti-Pattern 1: Using `$request->merge()` for Non-Sanitization Data

### Category
Security

### Description
Using `$request->merge()` in middleware to add resolved data like tenant ID, user ID, or request context to the request object. This pollutes the user input pool, making middleware-added data indistinguishable from data the client sent.

### Why It Happens
`$request->merge()` is the most straightforward method on the Request object for adding data. Developers reach for it by default. The distinction between `merge()` (input pool) and `attributes->set()` (server-side data) is not obvious from the method names — both add data to the request.

### Warning Signs
- Middleware calls `$request->merge(['tenant_id' => ...])` or `$request->merge(['user_id' => ...])`
- Controllers using `$request->all()` return middleware-added data alongside user-provided data
- Form request validation validates middleware-added fields as if they came from the client
- A client sending the same field name can potentially override the middleware's value
- The middleware sets data that should not be modifiable by the client

### Why Harmful
`$request->merge()` adds data to the same pool as `$_GET`, `$_POST`, and `$_REQUEST`. `$request->all()`, `$request->input()`, and `$request->validated()` all return this merged data. A client sending `tenant_id=9999` in the request body can override the middleware's tenant ID if the merge order is not carefully controlled. Mass assignment vulnerabilities become possible through middleware injection.

### Real-World Consequences
- Middleware adds `tenant_id` via `$request->merge(['tenant_id' => $tenant->id])`
- Controller calls `Model::create($request->all())` — includes `tenant_id`
- Client sends POST with `tenant_id=9999` plus legit data
- `$request->merge()` runs after input processing → client value wins
- Record created in tenant 9999 instead of correct tenant
- Tenant isolation breached; cross-tenant data leak

### Preferred Alternative
Use `$request->attributes->set()` for all middleware-to-controller communication. This keeps server-resolved data separate from client-provided data.

```php
// Wrong: pollutes user input
$request->merge(['tenant_id' => $tenant->id]);
$request->merge(['user_id' => Auth::id()]);

// Correct: keeps data separate
$request->attributes->set('tenant', $tenant);
$request->attributes->set('user_id', Auth::id());

// Controller access
$tenant = $request->attributes->get('tenant');
$userId = $request->attributes->get('user_id');

// $request->all() returns only client-supplied data — safe for mass assignment
```

### Refactoring Strategy
1. Audit all `$request->merge()` calls in middleware
2. Replace with `$request->attributes->set()` for any data that did not come from the client
3. Update controllers to read from `$request->attributes` instead of `$request->input()`
4. Verify `$request->all()` returns only client-supplied data after the change
5. Test that client cannot override middleware-set values

### Detection Checklist
- [ ] No `$request->merge()` for middleware-resolved data
- [ ] Middleware uses `$request->attributes->set()` for server-added data
- [ ] `$request->all()` returns only client-supplied input
- [ ] Client cannot override middleware-set values via POST/PUT body
- [ ] Mass assignment is safe with `$request->all()`

### Related Rules/Skills/Trees
- Rule: Use `$request->attributes->set()` for middleware-to-controller communication
- Rule: `$request->merge()` pollutes user input — do not use for resolved data
- Related KU: Middleware Fundamentals, Mass Assignment Protection

---

## Anti-Pattern 2: Global Middleware for Tenant Resolution

### Category
Performance

### Description
Registering tenant resolution middleware globally so it runs on every request, including health checks, static asset delivery, 404 pages, and public routes that do not need tenant context.

### Why It Happens
Global registration is the default in `Kernel.php` — middleware added to the `$middleware` property runs on every request. Developers add tenant resolution there because it is convenient and "the application is multi-tenant, so every request needs a tenant."

### Warning Signs
- Tenant resolution middleware is in `$middleware` (global) instead of a named route group
- Health check URLs trigger tenant database queries
- 404 pages from automated scanners show tenant queries in database monitoring
- Logged-in users on non-tenant routes (profile settings, global pages) trigger tenant lookups
- Database query volume from tenant middleware is a significant percentage of total queries

### Why Harmful
Every request pays the tenant resolution cost — including requests that will never use tenant data. A health check endpoint polled every 5 seconds from 6 servers adds 103,680 tenant queries per day. Bot traffic hitting non-existent URLs adds thousands of unnecessary queries. The database spends cycles on tenant resolution for requests that return 404 before the tenant context is needed.

### Real-World Consequences
- `TenantMiddleware` in global `$middleware`: queries `Tenant::findByDomain($request->getHost())`
- Health check endpoint at `/health` (polled every 5s from 6 servers) → 103,680 queries/day
- 404 bot traffic (40% of requests) → another 50,000+ queries/day
- Database at 70% CPU from tenant resolution; real business queries are slow
- Scaling up database tier to handle middleware query load
- Fix: move tenant middleware to tenant-specific route group → database CPU drops to 20%

### Preferred Alternative
Register tenant resolution middleware on tenant-scoped route groups, not globally. Only routes that actually need tenant context should pay the resolution cost.

```php
// Wrong: global — every request pays tenant cost
// Kernel.php
protected $middleware = [
    \App\Http\Middleware\TenantMiddleware::class,
    // ...
];

// Correct: route group — only tenant routes pay
// routes/tenant.php
Route::domain('{tenant}.example.com')
    ->middleware('tenant')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/settings', [SettingsController::class, 'edit']);
    });

// If global is unavoidable: cache aggressively
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = Cache::remember("tenant:{$request->getHost()}", 3600, function () use ($request) {
            return Tenant::findByDomain($request->getHost());
        });
        $request->attributes->set('tenant', $tenant);
        return $next($request);
    }
}
```

### Refactoring Strategy
1. Audit global middleware for database-querying transformations (tenant, settings, preferences)
2. Move to route group registration — only apply to routes that need the data
3. Implement aggressive caching (long TTL) for data that must be global
4. Monitor middleware query volume before and after
5. Register health check and public routes without tenant middleware

### Detection Checklist
- [ ] Tenant resolution middleware is on route groups, not global
- [ ] Health checks do not trigger tenant lookup
- [ ] 404 pages do not trigger tenant lookup
- [ ] Cache hit rate for tenant data is >95%
- [ ] Database CPU from middleware queries is negligible

### Related Rules/Skills/Trees
- Rule: Do NOT register database-querying middleware globally
- Rule: Tenant resolution belongs on route groups, not global middleware
- Related KU: Global, Route Group, and Route Middleware

---

## Anti-Pattern 3: TrustedProxies Not Configured Behind a Load Balancer

### Category
Security

### Description
Failing to configure `TrustProxies` middleware when the application runs behind a reverse proxy, load balancer, or CDN. Without this configuration, `$request->ip()` returns the proxy's IP address, `$request->getScheme()` returns `http` instead of `https`, and rate limiting/audit logs record incorrect client information.

### Why It Happens
TrustedProxies configuration is environment-specific. In local development (no proxy), it is not needed. Developers deploy to production behind AWS ELB or Cloudflare and forget to configure it. The middleware exists in the framework defaults but requires explicit proxy configuration.

### Warning Signs
- `$request->ip()` returns an internal IP (10.x, 172.x, 192.168.x) instead of the real client IP
- IP-based rate limiting does not work — all requests appear from the same proxy IP
- Audit logs show proxy IPs instead of client IPs
- `$request->getScheme()` returns `http` when the site uses HTTPS
- Mixed content warnings in the browser (links generated with `http://` instead of `https://`)

### Why Harmful
All IP-dependent features are broken: rate limiting (every request looks like it comes from one IP), geo-location, audit trails, and IP-based access controls. The application thinks HTTP is used (not HTTPS), potentially generating insecure URLs, breaking HSTS, and confusing OAuth redirects. Security measures that rely on client IP are completely ineffective.

### Real-World Consequences
- Application behind AWS ELB without TrustedProxies config
- All requests show ELB IP (10.0.1.42) as client IP
- Rate limiter limits 60 requests per IP → 60 requests total for all users
- All users hit rate limit after 60 aggregate requests
- Application unreachable for all users after 60 requests
- Debugging: $request->ip() returns ELB IP, not client IP
- Fix: configure TrustedProxies → rate limiting works per-client-IP

### Preferred Alternative
Configure TrustedProxies explicitly with the actual proxy IP ranges. Never use `*` in production.

```php
// Wrong: not configured — behind load balancer, IP is wrong
// (TrustProxies uses default empty config)

// Correct: explicit proxy IP ranges
// App\Http\Middleware\TrustProxies
protected $proxies = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
];

// Or: trust all proxies of known load balancers (AWS ELB)
protected $proxies = '*';
// WARNING: Only safe if the application is NOT behind additional untrusted proxies

// Better: trust based on request headers
protected $headers = Request::HEADER_X_FORWARDED_FOR |
    Request::HEADER_X_FORWARDED_HOST |
    Request::HEADER_X_FORWARDED_PORT |
    Request::HEADER_X_FORWARDED_PROTO;
```

### Refactoring Strategy
1. Check if application is behind a reverse proxy (AWS ELB, nginx, Cloudflare, etc.)
2. If yes, verify TrustProxies configuration explicitly
3. Test `$request->ip()` and `$request->getScheme()` behind the actual proxy
4. Never trust `*` in environments where external traffic passes through intermediate proxies
5. Add deployment checklist: "Verify TrustedProxies config before production cutover"

### Detection Checklist
- [ ] TrustedProxies is configured for the production proxy environment
- [ ] `$request->ip()` returns the real client IP in production
- [ ] `$request->getScheme()` returns `https` for HTTPS-terminated traffic
- [ ] Rate limiting works per-client, not per-proxy
- [ ] `*` is not used when intermediate proxies exist

### Related Rules/Skills/Trees
- Rule: Configure TrustedProxies explicitly behind any reverse proxy
- Rule: `$request->ip()` returns proxy IP without TrustedProxies
- Related KU: Middleware Fundamentals, Production Deployment

---

## Anti-Pattern 4: Attribute Namespace Collisions

### Category
Reliability

### Description
Two middleware setting the same attribute key on `$request->attributes` with different meanings. For example, one middleware sets `'id'` as the request ID, another sets `'id'` as the user ID. The second middleware's value silently overwrites the first, causing downstream code to use the wrong value.

### Why It Happens
The `$request->attributes` bag is a simple key-value store with no namespacing. Developers choose short, convenient keys without considering collisions across the middleware stack. As the application grows and more middleware is added, the risk of key conflicts increases.

### Warning Signs
- Middleware uses generic attribute keys: `'id'`, `'key'`, `'type'`, `'data'`
- Two different middleware sets the same attribute key with different value types
- Debugging: attribute value is unexpected type or wrong data
- Adding a new middleware breaks existing middleware's behavior silently
- Controllers read attributes by generic keys that could mean anything

### Why Harmful
Data corruption is silent — no error is raised when one middleware overwrites another's attribute. Downstream code receives the wrong data without any indication. The corruption only manifests as a bug in the controller or service that uses the attribute, making it difficult to trace back to the middleware collision.

### Real-World Consequences
- `RequestIdMiddleware` sets `$request->attributes->set('id', $uuid)`
- `CurrentUserMiddleware` sets `$request->attributes->set('id', $userId)`
- Controller reads `$request->attributes->get('id')` expecting request UUID for logging
- Gets user ID instead (CurrentUserMiddleware runs after RequestIdMiddleware)
- Log entries show user IDs instead of request IDs
- Debugging: trace to middleware — collision on key `'id'`

### Preferred Alternative
Use namespaced attribute keys — prefix with the domain or component name — to avoid collisions across the middleware stack.

```php
// Wrong: generic keys that collide
$request->attributes->set('id', $uuid);
$request->attributes->set('id', $userId);

// Correct: namespaced keys
// RequestIdMiddleware
$request->attributes->set('request_id', $uuid);
// CurrentUserMiddleware
$request->attributes->set('current_user_id', $userId);
// Or use dot-notation namespacing
$request->attributes->set('request.id', $uuid);
$request->attributes->set('user.id', $userId);

// Controller access — unambiguous
$requestId = $request->attributes->get('request_id');
$userId = $request->attributes->get('current_user_id');
```

### Refactoring Strategy
1. Audit all `$request->attributes->set()` calls across the middleware stack
2. Identify generic keys that could collide
3. Rename to namespaced keys with descriptive prefixes
4. Update downstream code (controllers, services) to use the new keys
5. Add convention: attribute keys must be namespaced with a prefix

### Detection Checklist
- [ ] No generic attribute keys (`'id'`, `'key'`, `'type'`) in middleware
- [ ] Attribute keys are namespaced (prefixed by component or domain)
- [ ] Two middleware never use the same key for different data
- [ ] Downstream code reads attributes with unambiguous keys
- [ ] Adding new middleware does not risk overwriting existing attributes

### Related Rules/Skills/Trees
- Rule: Use namespaced attribute keys to avoid middleware collisions
- Rule: Generic attribute keys cause silent data corruption
- Related KU: Custom Middleware, Cross-Cutting Concerns

---

## Anti-Pattern 5: Not Handling CORS for OPTIONS Preflight Requests

### Category
Architecture

### Description
Failing to include `HandleCors` middleware in the global stack when the application serves cross-origin requests. Without it, browser OPTIONS preflight requests reach the controller or return a 404/405 because there is no OPTIONS route defined, causing the browser to block the subsequent cross-origin request.

### Why It Happens
CORS is easy to miss in early development because most API testing tools (Postman, curl) do not send preflight requests. The issue only appears when a browser-based client makes cross-origin requests. During initial development, frontend and backend are often on the same origin.

### Warning Signs
- Browser console: "CORS Missing Allow Origin" or "No 'Access-Control-Allow-Origin' header"
- OPTIONS HTTP method requests return 404 or 405
- API calls work in Postman but fail in the browser
- Cross-origin requests fail with "Preflight response does not have HTTP ok status"
- Application logs show OPTIONS requests hitting controllers that do not define OPTIONS routes

### Why Harmful
Without `HandleCors`, browsers block all cross-origin requests. The frontend cannot call the API from a different origin. This blocks all browser-based clients (SPA, mobile web views, browser extensions) from accessing the API. The issue is invisible in non-browser testing, making it a production-only failure.

### Real-World Consequences
- SPA frontend on `app.example.com`, API on `api.example.com`
- User clicks "login" — browser sends OPTIONS preflight
- No `HandleCors` middleware → preflight reaches controller → 404
- Browser blocks POST request: "No 'Access-Control-Allow-Origin' header"
- User sees "login failed" with no useful error
- Developer tests with curl → works fine
- Debugging: 2 hours before discovering missing CORS middleware

### Preferred Alternative
Register `HandleCors` as global middleware for any application that serves cross-origin requests. Configure CORS settings in `config/cors.php`.

```php
// Wrong: missing CORS middleware — preflight requests fail
// Kernel.php — HandleCors not registered

// Correct: global CORS middleware
// Kernel.php
protected $middleware = [
    \Illuminate\Http\Middleware\HandleCors::class,
    // ...
];

// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

### Refactoring Strategy
1. Check if the application serves cross-origin requests
2. Verify `HandleCors` is registered in the global middleware stack
3. Configure CORS settings in `config/cors.php` for the specific origins, methods, and headers
4. Test OPTIONS preflight requests with a browser-based client
5. Add to deployment checklist: "Verify CORS configuration for all frontend origins"

### Detection Checklist
- [ ] `HandleCors` middleware is registered globally
- [ ] OPTIONS preflight requests return 200/204 with CORS headers
- [ ] Cross-origin API calls work in browser-based clients
- [ ] CORS configuration is environment-specific (dev vs production origins)
- [ ] Credentials (cookies, auth headers) are supported if needed

### Related Rules/Skills/Trees
- Rule: Register HandleCors globally for cross-origin applications
- Rule: Without HandleCors, browsers block cross-origin requests
- Related KU: CORS Configuration, API Route Design
