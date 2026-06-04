# Anti-Patterns: Custom Middleware

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Middleware System |
| Knowledge Unit | Custom Middleware |
| Difficulty | Intermediate |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Middleware Calling `$next` Twice | Reliability | Critical |
| 2 | Singleton Middleware with Mutable Properties | Reliability | Critical |
| 3 | Middleware That Modifies `$request->merge()` for Non-Sanitization Data | Architecture | High |
| 4 | Middleware with Multiple Responsibilities | Architecture | High |
| 5 | Heavy Database Queries in Global Middleware | Performance | High |

---

## Anti-Pattern 1: Middleware Calling `$next` Twice

### Category
Reliability

### Description
Calling `$next($request)` twice within the same middleware, causing the pipeline to execute remaining middleware and the controller twice while discarding the first response.

### Why It Happens
A developer stores the result of `$next($request)` to inspect it, then accidentally calls `$next($request)` again. Refactoring a middleware from pre-processing to post-processing can introduce this bug.

### Warning Signs
- Double header appending (e.g., CORS headers appear twice on the response)
- Controller executes twice (logs show duplicate entries, side effects fire twice)
- Response times are doubled for routes using this middleware
- Database records created by the controller appear in duplicate
- Middleware code shows repeated calls to `$next($request)` in the same method

### Why Harmful
The pipeline executes the remaining middleware and controller logic a second time. Any side effects (database writes, API calls, email sending) in the controller or downstream middleware fire twice. The first response is discarded silently, so there is no error.

### Real-World Consequences
- A payment processing controller executes twice, charging the customer twice
- Email notification middleware sends two identical emails
- Audit log records duplicate entries for every request through the middleware
- Two identical order records created in the database
- Hard to debug because the middleware appears correct when inspected (both calls look intentional)

### Preferred Alternative
Call `$next($request)` exactly once per middleware execution. Store the response if you need to inspect it, but do not call `$next` again.

```php
// Correct: call $next once, store response, modify, return
public function handle(Request $request, Closure $next): Response {
    $response = $next($request); // Called once
    $response->headers->set('X-Duration', microtime(true) - LARAVEL_START);
    return $response;
}

// Wrong: calling $next twice
public function handle(Request $request, Closure $next): Response {
    $response = $next($request); // First call — discarded
    // ... inspect something ...
    return $next($request); // Second call — used, but controller ran twice
}
```

### Refactoring Strategy
1. Audit all custom middleware for multiple `$next` calls
2. Remove duplicate calls, keeping only the first or last occurrence
3. Store the response from a single `$next` call if modification is needed
4. Add regression tests that verify middleware does not cause duplicate controller execution
5. Review middleware code review checklist to catch double `$next` calls

### Detection Checklist
- [ ] `$next($request)` is called exactly once per middleware
- [ ] Controller-side effects (writes, API calls, email) happen exactly once
- [ ] Response headers are not duplicated by middleware
- [ ] Test verifies singleton execution of downstream pipeline
- [ ] Code review catches double `$next` calls

### Related Rules/Skills/Trees
- Rule: Forgetting the `return` keyword discards the response
- Rule: Calling $next twice causes remaining middleware to execute twice
- Related KU: Middleware Fundamentals (pipeline execution model)

---

## Anti-Pattern 2: Singleton Middleware with Mutable Properties

### Category
Reliability

### Description
Registering custom middleware as a singleton in the container while storing per-request data on `$this` properties, causing data leakage between requests in Octane or long-running processes.

### Why It Happens
Middleware is resolved fresh per request by default. Developers who bind their middleware as singletons (for performance) may store timing or request data on instance properties without realizing the instance is shared.

### Warning Signs
- Middleware stores per-request data on `$this->property` (e.g., `$this->startTime`)
- Middleware is registered as a singleton in the service container
- Running under Octane or Laravel's long-running process mode
- Intermittent bugs: one request's data appears in another request
- Debugging shows stale or incorrect values in middleware properties

### Why Harmful
In Octane, middleware instances persist across requests. If per-request data is stored on `$this`, the next request on the same worker reads the previous request's data. This causes timing values from request A to appear in request B, authentication states to mix, and tenant contexts to leak.

### Real-World Consequences
- `$this->startTime` from request A's middleware is read by request B's middleware; duration calculation is wrong
- Tenant resolution middleware stores tenant on `$this->tenant`; request B uses request A's tenant
- Authenticated user stored on `$this->user`; request B inherits request A's user
- Intermittent auth failures: sometimes user appears authenticated when they shouldn't be
- Security breach: user data leaks across requests

### Preferred Alternative
Store per-request data on `$request->attributes` instead of `$this`. Keep middleware resolved fresh per request (default behavior).

```php
// Wrong: mutable property on singleton middleware
class TenantMiddleware {
    private ?Tenant $tenant = null; // Shared across requests!

    public function handle(Request $request, Closure $next): Response {
        $this->tenant = Tenant::findByDomain($request->getHost());
        app()->instance(Tenant::class, $this->tenant);
        return $next($request);
    }
}

// Correct: use request attributes
class TenantMiddleware {
    public function handle(Request $request, Closure $next): Response {
        $tenant = Tenant::findByDomain($request->getHost());
        $request->attributes->set('tenant', $tenant);
        return $next($request);
    }
}
```

### Refactoring Strategy
1. Audit middleware for mutable `$this` properties storing per-request data
2. Replace `$this->property` assignments with `$request->attributes->set('key', $value)`
3. Replace `$this->property` reads with `$request->attributes->get('key')` or appropriate request method
4. Remove any singleton binding for middleware classes
5. Test under Octane for request isolation

### Detection Checklist
- [ ] No per-request data stored on `$this` properties in middleware
- [ ] All per-request data uses `$request->attributes->set()`
- [ ] Middleware is not registered as singleton
- [ ] Octane/roadrunner testing shows request isolation
- [ ] Timing data is correct across concurrent requests

### Related Rules/Skills/Trees
- Rule: Do not store per-request data on `$this` — use `$request->attributes->set()` instead
- Rule: Instance is not shared across requests unless bound as singleton
- Related KU: Octane safety for middleware, Service Container

---

## Anti-Pattern 3: Middleware That Modifies `$request->merge()` for Non-Sanitization Data

### Category
Architecture

### Description
Using `$request->merge()` to add resolved data (tenant ID, user preferences, request context) to the request input, polluting user-supplied data with application-internal values.

### Why It Happens
`$request->merge()` is the most straightforward way to add data to the request object. Developers use it for convenience without distinguishing between user input and application context.

### Warning Signs
- Middleware calls `$request->merge(['tenant_id' => $tenant->id])` or similar
- Controllers use `$request->all()` or `$request->input('tenant_id')` and receive both user input and middleware-added data
- Form request validation rules validate middleware-added fields as if they came from the client
- Security audit: can a client override middleware-added fields by sending them in the request?
- `$request->except()` is used to filter out middleware-injected fields

### Why Harmful
`$request->merge()` adds data to the same pool as user-supplied input. A client sending `tenant_id` in their request overrides the middleware-set value. Controllers using `$request->all()` cannot distinguish between genuine user input and internal context. This creates a mass-assignment and request-forgery risk.

### Real-World Consequences
- Client sends `tenant_id: 9999` in POST body; middleware merges `tenant_id: 123`
- `$request->merge()` runs after user input, so middleware value wins
- But: if middleware runs before validation, user input overwrites the middleware value
- Tenant isolation broken: user accesses another tenant's data
- Mass assignment via `Model::create($request->all())` includes internal fields
- Validation rules for `tenant_id` accept client-supplied values as legitimate

### Preferred Alternative
Use `$request->attributes->set()` for middleware-to-controller data. This stores data in a separate namespace from user input.

```php
// Wrong: pollutes user input
$request->merge(['tenant_id' => $tenant->id]);

// Correct: keeps data separate
$request->attributes->set('tenant', $tenant);

// Controller access
$tenant = $request->attributes->get('tenant');
// Not:
$tenantId = $request->input('tenant_id');
```

### Refactoring Strategy
1. Audit all `$request->merge()` calls in middleware
2. Replace with `$request->attributes->set()` for non-sanitization data
3. Update controllers to read from `$request->attributes` instead of `$request->input()`
4. Verify `$request->all()` no longer returns middleware-injected fields
5. Add test: client cannot override middleware-set attributes

### Detection Checklist
- [ ] No `$request->merge()` for application-internal data
- [ ] Middleware-to-controller data uses `$request->attributes->set()`
- [ ] `$request->all()` returns only user-supplied input
- [ ] Client cannot override middleware-set values
- [ ] Mass assignment is safe with `$request->all()`

### Related Rules/Skills/Trees
- Rule: Use `$request->attributes->set()` for middleware-to-controller communication
- Rule: Never use `$request->merge()` for data that did not come from the client
- Related KU: Request Transformation, Input Sanitization

---

## Anti-Pattern 4: Middleware with Multiple Responsibilities

### Category
Architecture

### Description
A single middleware class that handles multiple unrelated concerns (auth, profile loading, subscription check, locale setting), violating single responsibility.

### Why It Happens
It feels efficient to group related operations. A middleware named `UserSetupMiddleware` that handles everything a "user" needs runs once instead of chaining multiple middleware.

### Warning Signs
- Middleware named after a usage context (`AdminMiddleware`, `UserMiddleware`, `DashboardMiddleware`) rather than a concern
- `handle()` method has distinct sections separated by comments for each concern
- Middleware constructor has 4+ dependencies from different domains
- Routes cannot selectively apply one concern without running all others
- Tests require setting up data for all concerns even when testing only one

### Why Harmful
Combined middleware cannot be composed selectively. Routes that need locale detection but not subscription checks must run both. A bug in one concern breaks all routes using the middleware. Testing requires fixtures for all concerns.

### Real-World Consequences
- `UserSetupMiddleware` loads profile, checks subscription, and sets locale
- Subscription check fails for a new user without a subscription record; profile page returns error
- Profile page does not need subscription; locale setting also fails
- API routes that need locale but not subscription cannot use the middleware
- Refactoring to separate concerns requires modifying every route definition

### Preferred Alternative
Create one dedicated middleware per cross-cutting concern. Compose them in route groups.

```php
// Separate middleware per concern
class Authenticate { /* auth */ }
class SetLocale { /* locale */ }
class CheckSubscription { /* subscription */ }
class LogRequest { /* logging */ }

// Compose in groups
Route::middleware(['auth', SetLocale::class, CheckSubscription::class])
    ->group(function () { /* ... */ });
```

### Refactoring Strategy
1. Identify each distinct concern within the combined middleware
2. Extract each concern into its own middleware class
3. Replace the combined middleware with the chain in route group definitions
4. Remove original combined middleware
5. Ensure each route group applies only the middleware it needs

### Detection Checklist
- [ ] Each middleware class handles exactly one concern
- [ ] Middleware named by concern, not usage location
- [ ] Constructor has dependencies from only one domain
- [ ] Middleware can be independently enabled/disabled in route groups
- [ ] Tests for one concern do not need fixtures for others

### Related Rules/Skills/Trees
- Rule: One concern per middleware class
- Rule: Name middleware by what it does, not where it is used
- Related KU: Cross-Cutting Concerns (dedicated middleware per concern)

---

## Anti-Pattern 5: Heavy Database Queries in Global Middleware

### Category
Performance

### Description
Executing expensive database queries in global middleware that runs on every request, including 404 pages, static assets served through Laravel, and health check endpoints.

### Why It Happens
Global middleware is convenient: it runs everywhere without requiring route group assignment. Developers add tenant resolution, feature flag checks, or user preference loading globally without considering the request types it executes on.

### Warning Signs
- Global middleware queries the database on every request
- Monitoring shows database queries from middleware for 404 responses
- Health check endpoint triggers tenant resolution queries
- Static assets served through Laravel (not CDN) trigger middleware database queries
- Response time for 404 pages is as high as for real content pages

### Why Harmful
Every request pays the cost of the database query, even requests that will never use the data. A 404 page that returns "not found" still resolves the tenant. A health check still queries feature flags. This multiplies database load by the total request volume, not just the volume of routes that need the data.

### Real-World Consequences
- Tenant resolution global middleware queries `tenants` table on every request
- 30% of requests are 404s (scrapers, bots, old links); each queries the database
- Health check polled every 10 seconds from 5 servers adds 43,200 queries/day for no benefit
- Database CPU at 70% from middleware queries before any business logic runs
- Adding a new global middleware with a database query increases database load by 20%
- Solution: cache aggressively, but caching itself adds Redis calls for every request

### Preferred Alternative
Move database-querying middleware from global to route group registration. Only apply it to routes that need the data. Cache the results aggressively if global registration is unavoidable.

```php
// Wrong: global registration — every request pays the cost
$middleware->append(TenantMiddleware::class);

// Correct: group registration — only tenants.shop routes need it
Route::middleware('tenant')->domain('{tenant}.example.com')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
});

// Or cache aggressively if global is required
class TenantMiddleware {
    public function handle(Request $request, Closure $next): Response {
        $tenant = Cache::remember("tenant:{$request->getHost()}", 3600, function () {
            return Tenant::findByDomain($request->getHost());
        });
        $request->attributes->set('tenant', $tenant);
        return $next($request);
    }
}
```

### Refactoring Strategy
1. Audit global middleware for database queries
2. Move database-querying middleware to route group registration
3. If global is unavoidable, implement aggressive caching (long TTL)
4. Add monitoring to detect database queries from middleware on unexpected routes
5. Review middleware registration tier as part of code review

### Detection Checklist
- [ ] Global middleware does not perform database queries
- [ ] Database-querying middleware is registered at route group level (not global)
- [ ] Caching is implemented for any unavoidable heavy middleware
- [ ] 404 and health check routes do not trigger middleware database queries
- [ ] Middleware registration tier is reviewed for cost

### Related Rules/Skills/Trees
- Rule: Heavy database queries in global middleware adds load to EVERY request
- Rule: Cache expensive middleware resolutions
- Related KU: Global, Route Group, and Route Middleware (tier selection)
