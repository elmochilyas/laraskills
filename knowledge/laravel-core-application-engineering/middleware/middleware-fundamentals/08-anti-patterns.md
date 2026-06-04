# Anti-Patterns: Middleware Fundamentals

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Middleware System |
| Knowledge Unit | Middleware Fundamentals |
| Difficulty | Foundation |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Middleware as Business Logic Layer | Architecture | Critical |
| 2 | Forgetting to Return `$next($request)` | Reliability | High |
| 3 | Modifying Request Input Without Awareness | Reliability | High |
| 4 | Assuming `$next` Always Returns a Response | Reliability | High |
| 5 | Heavy Database Queries in Global Middleware | Performance | High |

---

## Anti-Pattern 1: Middleware as Business Logic Layer

### Category
Architecture

### Description
Placing business rules, domain calculations, and application-specific logic in middleware instead of services or actions because "it runs before the controller."

### Why It Happens
Middleware is the first code that executes. Developers find it convenient to put checks and logic there, especially for features that "gate" access. Over time, the middleware accumulates domain logic.

### Warning Signs
- Middleware checks discount eligibility, order totals, or subscription features
- Middleware has repository or model dependencies
- Middleware makes decisions based on business state (not just HTTP state)
- Removing the middleware breaks business functionality, not just HTTP flow
- Middleware tests require domain object factories and database seeding

### Why Harmful
Business logic in middleware is tied to the HTTP pipeline. It cannot be reused in console commands, queues, or unit tests without creating an HTTP request. It couples business rules to HTTP infrastructure.

### Real-World Consequences
- "Free shipping if order > $50" rule in middleware; queued order processing never applies it
- New console command for order processing duplicates the business logic
- Coupon validation bypasses middleware; customers get discounts they should not
- Test suite for business rules requires HTTP calls instead of fast unit tests
- Pattern spreads: new developers assume middleware is the place for logic

### Preferred Alternative
Keep HTTP concerns in middleware, business concerns in services/actions. The boundary: middleware operates on HTTP primitives; services operate on domain primitives.

```php
// Middleware: HTTP concern
class ForceJsonMiddleware {
    public function handle(Request $request, Closure $next): Response {
        $request->headers->set('Accept', 'application/json');
        return $next($request);
    }
}

// Service/Action: business concern
class CalculateDiscountAction {
    public function execute(Order $order): DiscountResult {
        // Business logic here
    }
}
```

### Refactoring Strategy
1. Identify all middleware with business logic (model references, services, calculations)
2. Extract business logic into service or action classes
3. Replace middleware business logic with calls from controller
4. Test extracted services independently of HTTP context
5. Code review flag: middleware must not reference domain models

### Detection Checklist
- [ ] Middleware operates only on HTTP primitives
- [ ] No domain models or repositories in middleware
- [ ] Business logic is in services/actions
- [ ] Tests for business logic do not need HTTP context
- [ ] Removing middleware does not break business functionality

### Related Rules/Skills/Trees
- Rule: Do NOT place business logic in middleware — middleware is for cross-cutting HTTP concerns
- Rule: Middleware vs Business Logic Boundary
- Related KU: Service Layer Pattern, Actions Pattern

---

## Anti-Pattern 2: Forgetting to Return `$next($request)`

### Category
Reliability

### Description
Omitting the `return` keyword before `$next($request)`, causing the middleware to discard the controller's response and return null, which Laravel converts to an empty 200 response.

### Why It Happens
The most common middleware bug. Developers write `$next($request);` instead of `return $next($request);`. The syntax is valid PHP, so no error is raised — just missing content.

### Warning Signs
- Routes return empty 200 responses with no body
- Response body is missing but status code is 200
- Console shows no errors or exceptions
- Debugging shows the controller executes and returns data, but the response is empty
- The middleware does not modify the response, just forgets the return

### Why Harmful
The pipeline returns null (the middleware does not return the `$next` result), and Laravel converts null to an empty 200 response. The bug is silent — no error, no log, just missing content. Hardest middleware bug to debug because everything "works" except the response is empty.

### Real-World Consequences
- API endpoints return empty 200 responses after adding a new middleware
- Frontend receives no data; shows "content loading" indefinitely
- Debugging: check controller, check route, check database — all fine
- Hours wasted before noticing the missing `return` keyword
- Fix: add `return` before `$next($request)` — seconds to fix, hours to find

### Preferred Alternative
Always use `return $next($request)`. Never call `$next($request)` without returning its value.

```php
// Wrong: forgetting return
public function handle(Request $request, Closure $next): Response {
    $response = $next($request);
    $response->headers->set('X-Custom', 'value');
    // Missing return! Response discarded.
}

// Correct
public function handle(Request $request, Closure $next): Response {
    $response = $next($request);
    $response->headers->set('X-Custom', 'value');
    return $response;
}
```

### Refactoring Strategy
1. Review all custom middleware for missing `return` before `$next`
2. Add PHPStan or similar static analysis rule to detect missing returns
3. Add integration test that verifies middleware does not empty the response
4. Code review checklist: verify every middleware returns a Response
5. Train team: "every middleware must return a Response"

### Detection Checklist
- [ ] Every middleware `handle()` returns a Response on all code paths
- [ ] `return $next($request)` is used (not bare `$next($request)`)
- [ ] Static analysis detects missing returns
- [ ] Integration test verifies response body is present
- [ ] Short-circuit paths also return responses

### Related Rules/Skills/Trees
- Rule: Forgetting to `return $next($request)` discards the response
- Rule: Every code path must return a Response
- Related KU: Custom Middleware (handle contract)

---

## Anti-Pattern 3: Modifying Request Input Without Awareness

### Category
Reliability

### Description
Using `$request->merge()` in middleware to add data to the request, inadvertently polluting user input and making it indistinguishable from data the client sent.

### Why It Happens
`$request->merge()` is the most straightforward way to add data to the request object. Developers use it for convenience.

### Warning Signs
- Middleware calls `$request->merge(['user_id' => Auth::id()])` or similar
- Controllers use `$request->all()` and receive both client data and middleware-added data
- Form request validation validates middleware-added fields as if from the client
- A client sending the same field name in the request can override the middleware value
- Security concern: can middleware-added fields be exploited via `$request->input()`?

### Why Harmful
`$request->merge()` adds data to the same input pool as user-supplied data. `$request->all()` returns both. `$request->validated()` may include middleware-added fields. A client can potentially override middleware values by sending the same field name (order depends on when merge runs relative to input processing).

### Real-World Consequences
- Middleware adds `tenant_id` via `$request->merge()`
- Client sends `tenant_id=9999` in POST body; overrides middleware value
- Tenant isolation broken
- Controller uses `$request->all()` for mass assignment; `tenant_id` is included
- `Model::create($request->all())` creates records with attacker-controlled tenant

### Preferred Alternative
Use `$request->attributes->set()` for middleware-to-controller communication. This keeps data separate from user input.

```php
// Wrong: pollutes user input
$request->merge(['tenant_id' => $tenant->id]);

// Correct: keeps data separate
$request->attributes->set('tenant', $tenant);

// Controller access
$tenant = $request->attributes->get('tenant');
```

### Refactoring Strategy
1. Audit all `$request->merge()` calls in middleware
2. Replace with `$request->attributes->set()` for non-sanitization data
3. Update controllers to read from `$request->attributes`
4. Verify `$request->all()` returns only user-supplied input
5. Test that client cannot override middleware-set attributes

### Detection Checklist
- [ ] No `$request->merge()` for middleware-to-controller data
- [ ] Middleware uses `$request->attributes->set()` for internal data
- [ ] `$request->all()` returns only client-supplied data
- [ ] Client cannot override middleware-set values
- [ ] Form request validation does not validate internal middleware data

### Related Rules/Skills/Trees
- Rule: Use `$request->attributes->set()` for middleware-to-controller communication
- Rule: Modifying `$request->merge()` pollutes user input
- Related KU: Request Transformation

---

## Anti-Pattern 4: Assuming `$next` Always Returns a Response

### Category
Reliability

### Description
Middleware that manipulates the response object assuming `$next($request)` always returns a `Response`, without considering that it may throw an exception.

### Why It Happens
The `handle()` method's return type is `Response`, and `$next($request)` typically returns a `Response`. Developers write middleware that inspects or modifies `$response` without a try/catch.

### Warning Signs
- Middleware stores `$response = $next($request)` and accesses `$response->headers` or `$response->status()` without checking
- No try/catch around `$next($request)` in middleware that needs to handle errors
- Exception in controller or downstream middleware causes a type error in the post-processing middleware
- Error: "Call to undefined method on non-object" or "Trying to get property 'headers' of non-object"
- Test coverage only covers the happy path, not exception path

### Why Harmful
If the controller or a downstream middleware throws an exception, `$next($request)` propagates it. The middleware never receives a `Response` object. Post-processing code that accesses response properties fails with a type error, obscuring the original exception.

### Real-World Consequences
- Controller throws `ModelNotFoundException`; exception bubbles through `$next`
- Post-processing middleware tries `$response->headers->set()` on null
- TypeError replaces the useful 404 exception, making debugging harder
- Original exception details lost; application returns 500 instead of 404
- Bug report: "impossible" error in response-modifying middleware

### Preferred Alternative
Wrap `$next($request)` in a try/catch if the middleware must handle exceptions. Otherwise, place response-modifying code after the controller handles exceptions naturally.

```php
// Safe: try/catch around response manipulation
public function handle(Request $request, Closure $next): Response {
    try {
        $response = $next($request);
        $response->headers->set('X-Custom', 'value');
        return $response;
    } catch (Throwable $e) {
        // If we need to modify error responses too
        if (app()->bound('exception-handler')) {
            // Re-throw; let exception handler deal with it
        }
        throw $e;
    }
}

// Or simpler: only modify if we get a response
public function handle(Request $request, Closure $next): Response {
    $response = $next($request);
    if ($response instanceof Response) {
        $response->headers->set('X-Custom', 'value');
    }
    return $response;
}
```

### Refactoring Strategy
1. Audit middleware that manipulates `$response` after `$next`
2. Add try/catch or response type check before manipulation
3. Test exception scenarios: controller throws exception, middleware handles gracefully
4. Add logging to catch unexpected types from `$next`
5. Document: post-processing middleware must handle the exception path

### Detection Checklist
- [ ] Middleware handling `$response` after `$next` has exception protection
- [ ] TypeError is not thrown when controller throws exception
- [ ] Exception path is tested
- [ ] Original exception is preserved (not replaced by TypeError)
- [ ] Error responses still pass through response-modifying middleware

### Related Rules/Skills/Trees
- Rule: Do NOT assume `$next($request)` always returns a Response — it can throw an exception
- Rule: `$next($request)` can throw an exception
- Related KU: Exception Handling (middleware interaction)

---

## Anti-Pattern 5: Heavy Database Queries in Global Middleware

### Category
Performance

### Description
Executing expensive database queries in global middleware that runs on every request, including 404 errors, health checks, and static assets.

### Why It Happens
Global registration is convenient — middleware runs everywhere automatically. Developers add queries for tenant resolution, feature flags, or user preferences without considering which requests actually need them.

### Warning Signs
- Global middleware queries the database on every request
- 404 pages trigger tenant resolution or preference loading queries
- Health check endpoint shows database queries in monitoring
- Response time for missing URLs (404) is as high as for real content
- Database load from middleware queries is a significant percentage of total load

### Why Harmful
Every request pays the database cost, even requests that will never use the data. A 404 page from a bot still runs the query. A health check polled every 10 seconds still queries the database. This multiplies database load by total request volume.

### Real-World Consequences
- Tenant resolution global middleware: `Tenant::findByDomain($host)` on every request
- 50% of requests are 404s from automated scanners; each queries the database
- Health check endpoint (polled every 5 seconds from 6 servers) adds 103,680 queries/day
- Database CPU at 80% from middleware queries; real business queries are slow
- Adding caching reduces load but adds Redis calls for every request

### Preferred Alternative
Move database-querying middleware from global to route group registration. Only apply to routes that need the data.

```php
// Wrong: global registration
$middleware->append(TenantMiddleware::class);

// Correct: group registration — only subdomain routes need tenant
Route::domain('{tenant}.example.com')->middleware('tenant')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
});

// If global is unavoidable: cache aggressively
class TenantMiddleware {
    public function handle(Request $request, Closure $next): Response {
        $tenant = Cache::remember("tenant:domain:{$request->getHost()}", 3600, function () {
            return Tenant::findByDomain($request->getHost());
        });
        $request->attributes->set('tenant', $tenant);
        return $next($request);
    }
}
```

### Refactoring Strategy
1. Audit global middleware for database queries
2. Move to route group registration if not all routes need the data
3. Implement aggressive caching (long TTL) if global is unavoidable
4. Monitor database queries originating from middleware
5. Review middleware registration tier during code review

### Detection Checklist
- [ ] Global middleware does not perform database queries
- [ ] Database-querying middleware is at route group level
- [ ] Cache hit rate for middleware data is >95%
- [ ] 404 and health check routes do not trigger database queries
- [ ] Database CPU from middleware is negligible

### Related Rules/Skills/Trees
- Rule: Heavy database queries in global middleware adds database load to every request
- Rule: Cache expensive middleware resolutions
- Related KU: Global, Route Group, and Route Middleware (tier selection)
