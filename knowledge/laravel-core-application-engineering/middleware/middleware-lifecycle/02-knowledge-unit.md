# Middleware Lifecycle

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Middleware System
- **Knowledge Unit:** Middleware Lifecycle
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

The middleware lifecycle describes the complete path of an HTTP request from entry point to response delivery, including the two-pass execution through the global and route-specific pipelines. Understanding the lifecycle is critical because the order of execution determines whether middleware can modify the request before routing, whether it can modify the response after the controller, and when terminable middleware fires its post-response logic.

The engineering significance of the lifecycle is that it defines where different kinds of middleware must be registered. Infrastructure middleware (trusted proxies, CORS, maintenance mode) must run globally before routing. Application middleware (auth, throttle, bindings) runs after routing when the route context is known. Misplacing middleware in the wrong pipeline phase causes bugs that are difficult to diagnose because the execution order is not visible in the source code — it is determined by the registration file.

---

## Core Concepts

### The Complete Request Flow
```
1. public/index.php
2. Kernel::handle($request)
   a. Bootstrap application (load providers, config)
   b. Global middleware pipeline (via sendRequestThroughRouter)
   c. Router::dispatch($request)
      i.  Match route (URI + method)
      ii. Gather middleware:
            - Controller middleware (constructor/attribute)
            - Route middleware (->middleware() calls)
            - Group middleware (from route groups)
      iii. Resolve aliases (string -> FQCN)
      iv.  Apply withoutMiddleware exclusions
      v.   Sort by priority (SortedMiddleware)
      vi.  Route middleware pipeline (via runRouteWithinStack)
      vii. Route::run() → ControllerDispatcher::dispatch() → controller method
   d. Response travels back through route pipeline (reverse)
   e. Response travels back through global pipeline (reverse)
3. $response->send()
4. Kernel::terminate() — calls terminate() on terminable middleware
```

### Two Distinct Pipelines
The global pipeline and route pipeline are independent. They are constructed and executed separately by the `Kernel`. The global pipeline runs before routing. The route pipeline runs after routing.

This means:
- Global middleware cannot access route parameters or matched route data.
- Route middleware cannot modify how the request is interpreted for routing.
- Exceptions in global middleware prevent routing entirely.
- Exceptions in route middleware prevent controller execution but are caught by the routing pipeline's exception handler.

### Pre-Middleware vs Post-Middleware Within handle()
Within a single middleware's `handle()` method, the position of code relative to `$next($request)` determines inbound vs outbound execution:

```php
public function handle(Request $request, Closure $next): Response
{
    // PRE: executes inbound (request → controller)
    // Can modify request, short-circuit, or pass through
    
    $response = $next($request);
    
    // POST: executes outbound (controller → response)
    // Can modify response
    
    return $response;
}
```

A middleware can be pre-only (short-circuit before `$next`), post-only (run code after `$next`), both, or pass-through (just `return $next($request)`).

### Short-Circuit Behavior
When a middleware returns a response without calling `$next($request)`:
1. The response propagates back through already-executed middleware's post-processing code.
2. Middleware that has NOT yet executed never runs.
3. The controller never executes.
4. Global middleware that already ran still gets its post-processing code executed.

This is how auth middleware protects routes: `if (!auth()->check()) return redirect('/login')` — the controller never runs.

---

## Mental Models

### The Pipeline as a Stack
Think of middleware as a push-down stack. Each middleware is pushed onto the stack as the request travels inward (pre-processing). When the response travels outward, middleware pops off the stack in reverse order (post-processing). Short-circuiting is like cutting the stack — everything below the cut point never executes.

### The Request as a Baton
The request is a baton passed from middleware to middleware. Each middleware can inspect the baton, modify it, or drop it and return a response. Once a middleware drops the baton, the remaining middleware never touch it — the response goes back up the chain.

### The Lifecycle as a Timeline
The middleware lifecycle is a timeline with four phases:
1. **Pre-routing** (global middleware): Infrastructure setup
2. **Route resolution**: URI matching, middleware gathering, priority sorting
3. **Pre-controller** (route middleware): Application gating (auth, throttle)
4. **Post-controller** (route middleware unwinding): Response transformation

Each phase has different capabilities and constraints.

---

## Internal Mechanics

### Global Pipeline Construction
In `Kernel::sendRequestThroughRouter()`:

```php
protected function sendRequestThroughRouter(Request $request)
{
    $this->bootstrap();
    
    return (new Pipeline($this->app))
        ->send($request)
        ->through($this->app->shouldSkipMiddleware() ? [] : $this->middleware)
        ->then($this->dispatchToRouter());
}
```

The global middleware array (`$this->middleware`) is the list of all middleware that run on every request. If `shouldSkipMiddleware()` returns true (e.g., in testing with `withoutMiddleware()`), an empty array is used.

### Route Middleware Gathering
When the router dispatches a matched route, it gathers middleware in `Router::gatherRouteMiddleware()`:

```
1. Route::gatherMiddleware()
   → Merges controller middleware + route middleware + group middleware
   → Returns array of strings/class names
2. Router::gatherRouteMiddleware(Route $route)
   → Calls gatherMiddleware()
   → Resolves aliases via MiddlewareNameResolver
   → Applies withoutMiddleware exclusions
3. Sort by priority via SortedMiddleware
4. Pipeline::send($request)->through($sorted)->then(fn => $route->run())
```

### Middleware Name Resolution
The `MiddlewareNameResolver` resolves middleware strings:

- `\App\Http\Middleware\Custom::class` → used directly (fully qualified class name)
- `'auth'` → looked up in alias map, resolved to `\Illuminate\Auth\Middleware\Authenticate::class`
- `'auth:sanctum'` → alias resolved, `:sanctum` extracted as parameters

### Controller Middleware Registration
Controller middleware is registered via one of three mechanisms (detailed in the Controller Middleware KU):

1. **Constructor**: `$this->middleware('auth')->except('index')` (Laravel 10- style — requires extending `Illuminate\Routing\Controller`)
2. **Static interface**: Controller implements `HasMiddleware`, defines `public static function middleware(): array` returning middleware configurations
3. **Attribute**: PHP 8 attribute `#[Middleware('auth')]` on controller methods

All three ultimately feed into the same `Route::controllerMiddleware()` array, which is merged with route and group middleware.

### Controller Instantiation Timing
Controllers are instantiated BEFORE middleware runs. This is a known framework behavior (documented in GitHub issue laravel/framework#44177). The controller's constructor executes for every matched route, even if middleware later short-circuits with a 401. Constructor dependencies are resolved regardless of authorization.

### Terminate Phase
After `$response->send()` completes, `Kernel::terminate()` iterates through the middleware that were executed and calls `terminate()` on those that implement the method:

```php
public function terminate($request, $response)
{
    $middlewares = $this->app->shouldSkipMiddleware() ? [] : array_merge(
        $this->gatherRouteMiddleware($request),
        $this->middleware
    );
    
    foreach ($middlewares as $middleware) {
        if (! method_exists($middleware, 'terminate')) {
            continue;
        }
        $this->app->call([$middleware, 'terminate'], [$request, $response]);
    }
}
```

A **new instance** of each terminable middleware is resolved for `terminate()` — NOT the same instance that handled the request (unless registered as a singleton).

---

## Patterns

### Infrastructure-First Pattern
Global middleware handles infrastructure concerns before any application logic:

```
TrustProxies → HandleCors → PreventRequestsDuringMaintenance
→ ValidatePostSize → TrimStrings → ConvertEmptyStringsToNull
```

- **Purpose**: Set up request environment before any application logic runs.
- **Benefits**: Request sanitization prevents downstream errors.
- **Tradeoffs**: Every request pays the cost, including static assets and health checks.

### Application Gating Pattern
Route middleware gates access to the controller:

```
Session → CSRF → Throttle → Auth → Authorize → SubstituteBindings
```

- **Purpose**: Sequentially gate the request with clear failure points.
- **Benefits**: Each gate fails independently; throttle protects auth; auth protects authorize.
- **Tradeoffs**: Order matters — putting throttle after auth allows unauthenticated requests to bypass rate limiting.

### Response Augmentation Pattern
Post-middleware adds to the response after the controller produces it:

```
SetCacheHeaders ← SecurityHeaders ← CORS ← Controller
```

- **Purpose**: Add or modify response attributes without controller awareness.
- **Benefits**: Controllers remain focused on business data, not HTTP formatting.
- **Tradeoffs**: Response modification happens after the controller — the controller cannot know what headers will be added.

---

## Architectural Decisions

### Why Global Middleware Runs Before Routing
Global middleware modifies the request in ways that affect routing. `TrustProxies` corrects the scheme and client IP, which may affect route matching (e.g., routes constrained to HTTPS). `HandleCors` handles OPTIONS preflight before routing since CORS routes may not match the application's route table.

### Why Controller is Instantiated Before Middleware
Controller instantiation before middleware is a design constraint of Laravel's routing system. The `Route` object needs to resolve the controller to call `gatherMiddleware()` for controller-level middleware. Since controller middleware is resolved from the controller instance or class, the controller must be instantiated first. This has the side effect that constructor-injected dependencies are resolved even for unauthorized requests — a known tradeoff.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Two-pass pipeline enables both request and response modification | Pre/post ordering is implicit (code position relative to $next) | Teams must standardize pre vs post convention |
| Global middleware sanitizes request before routing | Global middleware adds latency to every request | Keep global middleware minimal; use route groups for application concerns |
| Controller middleware is per-method configurable | Controller instantiated before middleware runs | Avoid expensive constructor deps in controllers with mixed auth policies |
| Terminable middleware runs after response sent | New instance resolved — handle() and terminate() can't share state | Register as singleton if state sharing is needed |

---

## Performance Considerations

### Pipeline Construction Cost per Request
Each request constructs two pipelines (global + route) with closures. The construction cost is proportional to middleware count. For a typical route with 10 global + 8 route middleware, ~18 closures are created. This adds ~0.02-0.05ms — negligible.

### Container Resolution Cost per Middleware
Each middleware in both pipelines is resolved via the container. 18 middleware = 18 resolutions. If each resolution averages 0.03ms, total middleware resolution adds ~0.5ms per request.

### Short-Circuit Savings
A middleware that short-circuits (e.g., auth redirect) saves the cost of all downstream middleware AND the controller. An unauthenticated request to a protected route saves the cost of 5-8 middleware and controller dispatch — potentially 5-15ms per unauthorized request.

---

## Production Considerations

### Debugging Middleware Lifecycle Issues
When a response is unexpected (missing headers, wrong status, extra processing), trace the middleware that causes the issue by:
1. Adding logging middleware at different pipeline positions.
2. Using `Route::matched` events to identify the resolved route.
3. Checking which middleware short-circuited via the response status and body.

### Middleware Lifecycle in Octane
In Octane, the middleware lifecycle is the same per-request, but:
- The application is not re-bootstrapped per request.
- Middleware instances may persist (singletons violate the "fresh per request" assumption).
- `terminate()` may not fire (depends on Swoole/RoadRunner configuration).

### Testing Lifecycle Behavior
Test middleware lifecycle behavior through feature tests:
- Assert middleware short-circuits with the expected response.
- Assert global middleware modifies the request before it reaches the route.
- Assert terminable middleware's side effects via event faking or mock assertions.

---

## Common Mistakes

### Assuming Controller Instantiation Order
Developers often assume the controller is instantiated AFTER middleware runs, so constructor dependencies are safe from unauthorized access. In reality, the controller constructor executes before middleware. Expensive or security-sensitive constructor dependencies are resolved regardless of authorization.

### Mixing Pre and Post Logic Without Clarity
Putting pre-processing logic after `$next($request)` (which runs during response unwinding, not request inbound) creates bugs that only manifest on the response path. Always place pre-processing before `$next` and post-processing after.

### Forgetting Terminable Middleware Needs Singleton for State
A middleware that stores a start time in `handle()` and reads it in `terminate()` finds the start time missing because `terminate()` receives a fresh instance. Register the middleware as a singleton or use the request attributes to pass data between the two lifecycle phases.

### Modifying Request After Global Pipeline
Modifications made by global middleware (e.g., trusted proxy header resolution) are visible to route middleware and the controller. If a global middleware modifies the request in ways that affect route matching, subsequent middleware must not revert those changes.

---

## Failure Modes

### Middleware Instance Data Leakage in Octane
A middleware that sets `$this->startTime = microtime(true)` in `handle()` leaks the start time across requests when the middleware is reused. The second request reads the first request's start time, producing incorrect timing data.

### Terminable Middleware Not Firing in CLI/Queue
Terminable middleware only fires during HTTP requests through the `Kernel::terminate()` method. Artisan commands and queue workers do not call `terminate()`. Middleware with termination logic (logging, cleanup) does not execute for non-HTTP entry points.

### Controller Instantiation Before Authorization
A controller constructor that performs expensive database queries for dependencies (e.g., loading user billing data) executes those queries even when the route is protected by `auth` middleware. Unauthenticated requests trigger unnecessary database load.

---

## Ecosystem Usage

### Laravel Horizon
Horizon uses the route pipeline for dashboard authentication. It does not use terminable middleware — its metrics collection happens within request handling, not after response.

### Laravel Pulse
Pulse uses route-level middleware for dashboard authentication. Its performance recording happens via Laravel's event system, not terminable middleware.

### Spatie Packages
Spatie's middleware (permission, role) operates in the route pipeline. They use parameterized middleware for configuration and short-circuit with 403 responses for unauthorized access.

### Laravel Jetstream
Jetstream uses constructor middleware extensively for fine-grained controller access. Team management controllers use different middleware combinations per method, leveraging the `only`/`except` filtering.

---

## Related Knowledge Units

### Prerequisites
- Middleware Fundamentals — the Pipeline pattern and two-pass execution model
- Route Definition — how routes are matched and middleware assigned

### Related Topics
- Global, Route Group, and Route Middleware — the three registration tiers
- Middleware Ordering and Priority — how SortedMiddleware determines execution order
- Controller Middleware — the three controller-level registration mechanisms

### Advanced Follow-up Topics
- Terminable Middleware — the post-response lifecycle phase
- Request Transformation — modifying the request during the inbound pass
- Response Transformation — modifying the response during the outbound pass

---

## Research Notes

- Controller instantiation before middleware is a commonly misunderstood behavior. GitHub issue laravel/framework#44177 documents this as "expected behavior" — it stems from how the route resolves the controller to gather middleware. The alternative (resolving middleware first) would require fundamental changes to the routing architecture.
- The two-pipeline architecture is not documented as a architectural concept in the Laravel docs — it emerges from how `Kernel`, `Router`, and `Pipeline` interact. Understanding the two-pipeline model is essential for diagnosing middleware behavior.
- `terminate()` receiving a new instance is a common source of bugs. The Laravel docs mention this but do not emphasize it. Most production middleware that uses `terminate()` for non-trivial work registers as a singleton.
- In Laravel 12+, the middleware lifecycle is unchanged from Laravel 11. The `Pipeline` class has remained stable since Laravel 5. The changes between versions affect middleware registration APIs, not the lifecycle itself.