# Anti-Patterns: Middleware Lifecycle

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Middleware System |
| Knowledge Unit | Middleware Lifecycle |
| Difficulty | Foundation |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Global Middleware That Needs Route Data | Architecture | High |
| 2 | Route Middleware That Modifies Request Interpretation | Architecture | High |
| 3 | Controller Constructor with Expensive Initialization | Performance | High |
| 4 | Terminable Middleware with Heavy Processing | Performance | Medium |
| 5 | Assuming Controller Runs After Middleware | Architecture | Medium |

---

## Anti-Pattern 1: Global Middleware That Needs Route Data

### Category
Architecture

### Description
Registering middleware that requires access to the matched route, route parameters, or named route data as global middleware, which runs before routing occurs.

### Why It Happens
Developers think of middleware as "code that runs before the controller." They do not distinguish between global (before routing) and route (after routing) pipelines.

### Warning Signs
- Global middleware calls `$request->route()` or accesses route parameters
- Middleware tries to determine the current route name or action
- Route parameters are null in global middleware
- The middleware does not work correctly but does not error (route just has no data)
- Developers add workarounds: checking `$request->path()` or `$request->is()` instead of `$request->route()`

### Why Harmful
Global middleware runs before the Router has matched the request to a route. The route object does not exist yet. Any middleware that needs route context (guard selection, permission checks, parameter-based logic) will receive null or default values. The middleware may silently apply incorrect logic because it cannot determine which route is being accessed.

### Real-World Consequences
- Global auth middleware tries to determine guard from route: `$request->route()->getAction('guard')`
- Route is null; middleware falls back to default guard
- Some routes use a different guard; they get wrong authentication
- No error: auth seems to work but uses incorrect guard
- Bug: routes using `admin` guard authenticated with `web` guard

### Preferred Alternative
Register middleware that needs route context at the route group or route level, not globally.

```php
// Wrong: global middleware needs route data
$middleware->append(SelectAuthGuard::class);
// SelectAuthGuard tries to read $request->route() — it's null!

// Correct: route-level middleware for route-aware concerns
Route::middleware('auth:admin')->group(function () {
    Route::get('/admin', [AdminController::class, 'index']);
});
```

### Refactoring Strategy
1. Identify global middleware that accesses route data
2. Move to route group or route-level registration
3. Update middleware to use route parameters and named routes
4. Test that middleware works correctly with route context
5. Remove workarounds like `$request->path()` or `$request->is()`

### Detection Checklist
- [ ] No global middleware accesses `$request->route()`
- [ ] Route-parameter-aware middleware is not global
- [ ] Route-aware logic uses route data directly, not path string matching
- [ ] Removing workarounds does not break functionality
- [ ] Middleware is registered at correct pipeline tier

### Related Rules/Skills/Trees
- Rule: Do NOT register middleware that needs route context as global — it runs before routing
- Rule: Global middleware cannot access route parameters
- Related KU: Global, Route Group, and Route Middleware (tier selection)

---

## Anti-Pattern 2: Route Middleware That Modifies Request Interpretation

### Category
Architecture

### Description
Registering middleware that modifies how the request should be interpreted (trusted proxies, scheme, method) as route middleware, which runs after routing has already occurred.

### Why It Happens
Route middleware is the default choice for most concerns. Developers do not consider whether the modification needs to happen before or after routing.

### Warning Signs
- Route middleware changes `$request->server->set('HTTPS', ...)` or `$request->setTrustedProxies()`
- Route middleware modifies the request method (`$request->setMethod()`)
- Route middleware changes the request URI after routing has matched
- Routing decisions are based on unmodified request data; middleware changes have no effect on routing
- The middleware "works" but route matching is incorrect (e.g., wrong scheme in generated URLs)

### Why Harmful
The Router has already matched the request to a route using the original request data. If middleware modifies the request scheme, method, or URI after routing, those changes do not affect which route was selected. The route may have been matched incorrectly because the modification happened too late.

### Real-World Consequences
- `TrustProxies` middleware in route pipeline instead of global: request scheme is 'http' during routing
- Route uses `https://` in URL generation; generated URLs are `http://`
- Route was matched against the wrong scheme; no error but wrong URLs generated
- CORS preflight handled after routing; OPTIONS request returns 404 because no route matched
- Bug: login redirect generates `http://` URLs that browsers block as mixed content

### Preferred Alternative
Register request-interpretation middleware (trusted proxies, CORS) globally. Route middleware should only handle application concerns after the route is known.

```php
// Wrong: route middleware for request interpretation
Route::middleware(TrustProxies::class)->group(function () { /* ... */ });

// Correct: global middleware for request interpretation
$middleware->append(TrustProxies::class);
$middleware->append(HandleCors::class);
```

### Refactoring Strategy
1. Identify route middleware that modifies request interpretation (scheme, method, URI, proxies)
2. Move to global middleware registration
3. Verify route matching is correct after the move
4. Test URL generation: generated URLs should use correct scheme
5. Test CORS: OPTIONS preflight should return correct headers

### Detection Checklist
- [ ] Request-interpretation middleware (proxies, CORS, scheme) is global, not route-level
- [ ] Route middleware does not modify request scheme, method, or URI
- [ ] URL generation produces correct scheme
- [ ] CORS preflight (OPTIONS) is handled before routing
- [ ] Route matching uses the correctly interpreted request

### Related Rules/Skills/Trees
- Rule: Do NOT register middleware that modifies request interpretation as route middleware
- Rule: Global pipeline runs before routing; route pipeline runs after
- Related KU: Middleware Fundamentals (two-pipeline architecture)

---

## Anti-Pattern 3: Controller Constructor with Expensive Initialization

### Category
Performance

### Description
Performing expensive operations (database queries, API calls, complex calculations) in a controller's constructor, which executes for every matched route even when middleware later short-circuits the request.

### Why It Happens
Developers assume the controller is instantiated after middleware runs and only for authorized requests. They place initialization logic in the constructor for convenience.

### Warning Signs
- Controller constructor queries the database or calls external APIs
- Performance monitoring shows controller initialization time in response times
- Authentication/authorization middleware runs after expensive constructor logic
- Unauthorized requests (should be fast 401/403) are slow due to constructor work
- Constructor dependencies are expensive to resolve (5+ service classes)

### Why Harmful
The controller constructor executes for every matched route, regardless of whether middleware short-circuits. An expensive constructor (loading billing data, querying user preferences, making API calls) runs even for requests that will return 401. This wastes resources and increases latency for all routes.

### Real-World Consequences
- `DashboardController` constructor loads user billing data, notifications, and team members
- All dashboard routes run this constructor — including endpoints that should be fast (e.g., a simple `GET /dashboard/status`)
- Rate limit middleware blocks the request after constructor has already run expensive queries
- 80% of requests to the controller are "check status" (fast); constructor makes them slow
- Solution: move initialization to lazy-loading methods

### Preferred Alternative
Move expensive initialization from constructor to lazy-loaded methods or middleware. Use the controller methods themselves for initialization that should only run when the method executes.

```php
// Wrong: expensive initialization in constructor
class DashboardController extends Controller {
    private BillingService $billing;
    private array $notifications;
    
    public function __construct(BillingService $billing) {
        $this->billing = $billing;
        $this->notifications = $billing->getUsage(); // Runs for ALL routes!
    }
}

// Correct: lazy initialization
class DashboardController extends Controller {
    public function __construct(
        private BillingService $billing,
    ) {}
    
    public function show(): View {
        $usage = $this->billing->getUsage(); // Only runs for this route
        return view('dashboard', ['usage' => $usage]);
    }
}
```

### Refactoring Strategy
1. Audit controller constructors for expensive operations
2. Move database queries, API calls, and complex calculations to controller methods
3. Use lazy-loading or cached properties instead of constructor initialization
4. Add middleware for operations that must run before the controller (but consider pipeline cost)
5. Test: unauthorized requests should be fast (no constructor initialization)

### Detection Checklist
- [ ] Controller constructors do not perform expensive operations
- [ ] Database queries are in methods, not constructors
- [ ] Unauthorized requests are fast (no constructor work)
- [ ] Lazy initialization is used instead of constructor preloading
- [ ] Middleware short-circuits before expensive initialization

### Related Rules/Skills/Trees
- Rule: Controllers are instantiated BEFORE middleware runs
- Rule: Do NOT assume the controller constructor is safe for expensive initialization
- Related KU: Controller Architecture (dependency injection patterns)

---

## Anti-Pattern 4: Terminable Middleware with Heavy Processing

### Category
Performance

### Description
Implementing heavy operations (API calls, database writes, file processing) in terminable middleware's `terminate()` method, blocking the web process from handling the next request.

### Why It Happens
Developers see `terminate()` as a "background" opportunity and place slow operations there, assuming it runs asynchronously or in the background.

### Warning Signs
- Terminable middleware sends HTTP requests, writes to databases, or processes files
- Response times increase when terminable middleware is active
- Next request on the same worker waits for terminate to finish
- Queue system is not used for operations in terminable middleware
- PHP-FPM process pool shows processes in "terminate" state for extended periods

### Why Harmful
`terminate()` runs synchronously in the same process after `$response->send()`. The web server process (PHP-FPM, Octane worker) cannot handle the next request until `terminate()` completes. Heavy processing blocks the worker, reducing throughput and increasing queue times.

### Real-World Consequences
- Terminable middleware sends a webhook notification for every order (500ms)
- PHP-FPM worker blocked for 500ms after each order, doing nothing
- Peak traffic: 60 orders/minute; each worker blocked 50% of the time
- Request queue grows; response times increase
- Fix: move webhook dispatch to a queued job
- Result: terminate runs in <1ms; worker immediately available for next request

### Preferred Alternative
Use a queued job for heavy processing. Terminable middleware should record the intent and return immediately.

```php
// Wrong: heavy processing in terminable middleware
class WebhookTerminableMiddleware {
    public function terminate(Request $request, Response $response): void {
        Http::post('https://hooks.example.com/notify', [...]); // 500ms blocking
    }
}

// Correct: dispatch to queue
class WebhookTerminableMiddleware {
    public function terminate(Request $request, Response $response): void {
        DispatchWebhookNotification::dispatch([...]); // <1ms
    }
}
```

### Refactoring Strategy
1. Identify terminable middleware with heavy operations
2. Replace synchronous operations with queued job dispatches
3. Ensure the queue worker has capacity and retry logic
4. Test that `terminate()` completes in under 1ms
5. Monitor PHP-FPM worker utilization before and after change

### Detection Checklist
- [ ] Terminable middleware does not perform heavy I/O
- [ ] Heavy operations are dispatched to queue
- [ ] `terminate()` completes in under 1ms
- [ ] PHP-FPM workers are not blocked by termination logic
- [ ] Queue has workers and retry logic for the operations

### Related Rules/Skills/Trees
- Rule: Do NOT rely on terminable middleware for critical operations
- Rule: Terminable middleware with heavy processing blocks the web process
- Related KU: Queue fundamentals (async job dispatch)

---

## Anti-Pattern 5: Assuming Controller Runs After Middleware

### Category
Architecture

### Description
Believing the controller is instantiated and its method is called after all middleware runs, when in fact the controller constructor executes before middleware but after route matching.

### Why It Happens
The mental model of "middleware wraps the controller" suggests middleware runs first. The actual execution order is: route matching → controller instantiation → middleware pipeline → controller method.

### Warning Signs
- Developers express surprise that the controller constructor runs before middleware
- Constructor dependency resolution is expensive and developers wonder why it runs for unauthorized requests
- Middleware is expected to prevent controller instantiation entirely
- Security checks in middleware are seen as "before the controller" but constructor always runs
- Test that middleware short-circuits still shows controller constructor side effects

### Why Harmful
If controller constructors have side effects (sending events, incrementing counters, calling external APIs), those side effects happen even for unauthorized requests that middleware will short-circuit. Expensive constructor resolution wastes resources on every matched route.

### Real-World Consequences
- Controller constructor logs "dashboard accessed" event
- Auth middleware checks permission and returns 403
- Event is logged even though access was denied
- Audit log shows "dashboard accessed" for unauthorized requests
- Security team flags false positives in audit review
- Fix: move logging from constructor to method

### Preferred Alternative
Keep controller constructors lightweight. Move side effects and expensive initialization to methods. Trust middleware for authorization but do not rely on it to prevent constructor execution.

```php
class DashboardController extends Controller {
    // Constructor: lightweight, just accepts dependencies
    public function __construct(
        private DashboardService $service,
    ) {}
    
    public function show(): View {
        // Side effects and expensive operations in the method
        $this->service->logAccess(Auth::user());
        return view('dashboard', ['data' => $this->service->getData()]);
    }
}
```

### Refactoring Strategy
1. Identify controller constructors with side effects or expensive operations
2. Move to controller methods
3. Keep constructors only for dependency injection
4. Test: unauthorized requests should show no constructor side effects
5. Document: controller constructors execute before middleware

### Detection Checklist
- [ ] Controller constructors have no side effects
- [ ] Expensive initialization is in methods, not constructors
- [ ] Unauthorized requests do not trigger constructor side effects
- [ ] Constructor is used only for dependency injection
- [ ] Team understands the actual execution order

### Related Rules/Skills/Trees
- Rule: Controller instantiation happens BEFORE middleware runs
- Rule: Controller constructor executes for every matched route, even if middleware short-circuits
- Related KU: Middleware Lifecycle (controller instantiation timing)
