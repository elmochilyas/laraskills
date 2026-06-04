# Phase 5: Rules — Middleware Fundamentals

---

## Rule Name

Always Return the Result of $next($request)

---

## Category

Reliability

---

## Rule

Every path in a middleware `handle()` method must call `return $next($request)` to continue the pipeline or `return response(...)` to short-circuit. Never call `$next($request)` without the `return` keyword.

---

## Reason

Forgetting `return` is the most common middleware bug. Without the keyword, `$next($request)` invokes the next middleware but discards its response. The current middleware returns `null`, and Laravel silently converts `null` to an empty 200 response. The controller output and all downstream middleware modifications are lost without any error.

---

## Bad Example

```php
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request); // No return — response is discarded
    $response->headers->set('X-Custom', 'value');
    return $response; // Actually returns the unwrapped 200 from below
}
```

---

## Good Example

```php
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);
    $response->headers->set('X-Custom', 'value');
    return $response;
}
```

---

## Exceptions

No common exceptions. Every code path must return a `Response`.

---

## Consequences Of Violation

Reliability risks: controller output and downstream middleware transformations are silently lost. Debugging difficulty: the bug produces "blank page" symptoms with no error.

---

---

## Rule Name

Place Pre-Processing Code Before $next and Post-Processing Code After

---

## Category

Design

---

## Rule

Code that modifies the request or checks preconditions must appear before `$next($request)`. Code that modifies the response must appear after `$next($request)`. Never mix pre and post logic across the `$next` boundary without clear separation.

---

## Reason

Code before `$next($request)` runs during the inbound pass (request travels inward toward the controller). Code after `$next($request)` runs during the outbound pass (response travels outward in reverse middleware order). Placing pre-processing code after `$next` causes it to execute on the response path, not the request path, producing incorrect behavior that only manifests on the response unwinding.

---

## Bad Example

```php
public function handle(Request $request, Closure $next): Response
{
    // This runs on the outbound pass — too late for request modification
    $request->attributes->set('start', microtime(true));
    $response = $next($request);
    // Intended pre-processing runs after the controller has already executed
    return $response;
}
```

---

## Good Example

```php
public function handle(Request $request, Closure $next): Response
{
    $start = microtime(true); // Pre: inbound — before controller
    $response = $next($request);
    $response->headers->set('X-Duration', (microtime(true) - $start) * 1000); // Post: outbound
    return $response;
}
```

---

## Exceptions

Middleware that only logs or measures (no modification) may place all logic after `$next` since it does not affect the inbound pass.

---

## Consequences Of Violation

Reliability risks: request modifications intended for the controller never take effect. Debugging difficulty: the bug is timing-dependent and only manifests when the specific middleware runs.

---

---

## Rule Name

Never Place Business Logic in Middleware

---

## Category

Architecture

---

## Rule

Middleware must only contain HTTP-level cross-cutting concerns. Never place domain business logic — eligibility checks, calculations, side effects, or business rule enforcement — in middleware. Business logic belongs in services, actions, or domain classes.

---

## Reason

Middleware exists in the HTTP pipeline and couples its behavior to HTTP constructs (requests, responses, status codes). Business logic placed in middleware becomes coupled to the HTTP layer, making it untestable without HTTP simulation, unreusable outside the web context (queues, CLI commands), and invisible to developers modifying domain rules. The middleware/business boundary is the most frequently violated architectural boundary in Laravel applications.

---

## Bad Example

```php
class DiscountEligibilityMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $order = Order::find($request->route('order'));
        if ($order->items->sum('price') < 100 || $order->user->isNewCustomer()) {
            abort(403, 'Not eligible for discount');
        }
        return $next($request);
    }
}
```

---

## Good Example

```php
class DiscountService
{
    public function isEligible(Order $order): bool
    {
        return $order->items->sum('price') >= 100 && ! $order->user->isNewCustomer();
    }
}
```

---

## Exceptions

Middleware may call a read-only service for lightweight lookups (resolving a tenant from domain, loading user preferences) when the result is used for HTTP-level decisions (setting locale, redirecting). The service call must be the middleware's only non-HTTP operation.

---

## Consequences Of Violation

Maintenance risks: business rules hidden in middleware are missed during domain refactoring. Testing risks: business logic tests require HTTP simulation. Reusability risks: business rules cannot be called from queues or CLI commands.

---

---

## Rule Name

Use $request->attributes->set() for Middleware-to-Controller Communication

---

## Category

Framework Usage

---

## Rule

When middleware resolves or generates data for downstream use, store it via `$request->attributes->set('key', $value)`. Controllers access it via `$request->attributes->get('key')`. Never use `$request->merge()` for data that did not come from the client.

---

## Reason

`$request->merge()` modifies user input. Controllers using `$request->all()`, `$request->validated()`, or `$request->input()` receive the merged data as if the client sent it. This pollutes validation, form requests, and serialization. The attributes bag is the designated channel for server-enriched data — it is request-scoped, serialization-safe, and keeps a clean separation between client input and system data.

---

## Bad Example

```php
public function handle(Request $request, Closure $next): Response
{
    $request->merge(['tenant_id' => Tenant::current()->id]);
    return $next($request);
}

// Controller — $request->validated() now includes 'tenant_id'
```

---

## Good Example

```php
public function handle(Request $request, Closure $next): Response
{
    $request->attributes->set('tenant_id', Tenant::current()->id);
    return $next($request);
}

// Controller — $request->attributes->get('tenant_id') is clean
```

---

## Exceptions

`$request->merge()` is acceptable only for input sanitization (trimming strings, converting empty strings, casting types). It must never be used to add data that did not come from the client.

---

## Consequences Of Violation

Security risks: middleware-added data bypasses validation rules. Reliability risks: validated data is contaminated with system values. Maintenance risks: controllers cannot distinguish client-provided data from system data.

---

---

## Rule Name

Do Not Store Per-Request State on Middleware Instance Properties

---

## Category

Reliability

---

## Rule

Never store per-request data as instance properties (`$this->property`) in middleware. Use local variables within `handle()` for data needed only during execution. Use `$request->attributes->set()` for data that must be available downstream.

---

## Reason

In Octane and other long-lived process servers, middleware instances persist across requests. An instance property set during one request will contain stale data when the next request hits the same worker. This causes request-order-dependent bugs that are extremely difficult to reproduce and debug. Even in PHP-FPM (where instances are per-request), instance properties create the habit of shared state that causes problems when migrating to Octane.

---

## Bad Example

```php
class TimingMiddleware
{
    private float $startTime;

    public function handle(Request $request, Closure $next): Response
    {
        $this->startTime = microtime(true); // Leaks to next request in Octane
        return $next($request);
    }
}
```

---

## Good Example

```php
class TimingMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true); // Local variable — always fresh
        $response = $next($request);
        $response->headers->set('X-Duration', (microtime(true) - $startTime) * 1000);
        return $response;
    }
}
```

---

## Exceptions

Singleton-registered terminable middleware that explicitly manages shared state (e.g., keyed by `spl_object_id($request)`) may use instance properties, but must clear per-request data in `terminate()`.

---

## Consequences Of Violation

Reliability risks: data leakage across requests in Octane causes incorrect behavior. Debugging difficulty: intermittent, concurrency-dependent bugs. Migrating to Octane requires auditing all middleware for instance state.

---

---

## Rule Name

Keep Global Middleware Minimal

---

## Category

Performance

---

## Rule

Register only infrastructure middleware (trusted proxies, CORS, maintenance mode, input sanitization) at the global level. Every other concern should be registered at the group or route level. Never register database-querying or I/O middleware globally.

---

## Reason

Global middleware runs on every HTTP request, including health checks, asset requests, and OPTIONS preflight. A globally registered middleware that queries the database (tenant resolution, feature flags, user preferences) adds database load to every request regardless of whether the request needs the data. In high-traffic applications, this multiplies database connections and latency.

---

## Bad Example

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(TenantMiddleware::class); // DB query on every request
    $middleware->append(FeatureFlagMiddleware::class); // DB query on every request
    $middleware->append(SetLocaleMiddleware::class); // DB query on every request
});
```

---

## Good Example

```php
->withMiddleware(function (Middleware $middleware) {
    // Global: infrastructure only
    $middleware->append(TrustProxies::class);
    $middleware->append(HandleCors::class);

    // Group: database-dependent middleware scoped appropriately
    $middleware->web(append: [SetLocaleMiddleware::class]);
    $middleware->group('tenant', [TenantMiddleware::class, FeatureFlagMiddleware::class]);
});
```

---

## Exceptions

Request ID generation and request logging are acceptable as global middleware if they are purely in-memory (no I/O) and apply to every request for observability purposes.

---

## Consequences Of Violation

Performance risks: every request incurs unnecessary database or I/O overhead. Scalability risks: database connection pool exhaustion from global middleware queries. Reliability risks: a globally registered middleware that throws an exception takes down every endpoint.

---

---

## Rule Name

Understand Controller Instantiation Happens Before Middleware

---

## Category

Architecture

---

## Rule

Never rely on middleware short-circuiting to prevent controller constructor execution. The controller is instantiated before middleware runs. Keep controller constructors lightweight — they execute even for unauthorized requests.

---

## Reason

The framework instantiates the controller during route dispatch to gather controller middleware (via `HasMiddleware` or `#[Middleware]`) — this happens before the route pipeline executes. If middleware then short-circuits with a 401 or 403, the controller constructor has already executed. Expensive dependency resolution, database queries, or side effects in the constructor run regardless of authorization.

---

## Bad Example

```php
class HeavyController extends Controller
{
    public function __construct(
        private AnalyticsService $analytics // Expensive to resolve
    ) {
        $this->analytics->load(); // DB query — runs even for unauthorized requests
    }
}
```

---

## Good Example

```php
class LightController extends Controller
{
    public function __construct(
        private AnalyticsService $analytics // Resolved lazily
    ) {
        // No side effects in constructor
    }

    public function show(Request $request): View
    {
        $data = $this->analytics->load(); // Only runs if middleware passes
        return view('dashboard', $data);
    }
}
```

---

## Exceptions

Controllers that have no middleware (public routes) and are guaranteed to execute on every match have no constraint on constructor weight.

---

## Consequences Of Violation

Performance risks: expensive initialization runs on every matched route regardless of authorization. Reliability risks: side effects in constructors (DB writes, API calls) execute even for blocked requests. Testing complexity: controller tests must mock constructor dependencies even for unauthorized scenarios.
