# Anti-Patterns: Global, Route Group, and Route Middleware

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Middleware System |
| Knowledge Unit | Global, Route Group, and Route Middleware |
| Difficulty | Intermediate |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Global Middleware for Application-Specific Concerns | Performance | High |
| 2 | Deep Nested Middleware Groups | Architecture | Medium |
| 3 | Using `withoutMiddleware` to Exclude Global Middleware | Architecture | High |
| 4 | Adding Session Middleware to API Routes | Performance | High |
| 5 | Group Middleware Applied Outside the Closure | Reliability | Critical |

---

## Anti-Pattern 1: Global Middleware for Application-Specific Concerns

### Category
Performance

### Description
Registering middleware that should apply only to specific route groups (auth, throttle, locale detection) as global middleware, causing unnecessary execution on every request.

### Why It Happens
Global registration is simpler — it requires no group definitions or route assignments. Developers prioritize convenience over precision.

### Warning Signs
- Auth, throttle, or locale detection middleware in the global middleware list
- Every request (including API calls, 404s, asset requests) runs auth checks or locale resolution
- Performance monitoring shows middleware overhead on routes that do not need those concerns
- Health check endpoint triggers session start or locale resolution
- API routes run through middleware that assumes browser context (cookies, session)

### Why Harmful
Global middleware adds latency and resource consumption to every request, even requests that should never run that middleware. A 404 page served to a scraper still resolves the authenticated user, starts the session, and detects the locale. This multiplies infrastructure costs and slows response times for all routes.

### Real-World Consequences
- Auth middleware registered globally; every 404 and health check runs authentication queries
- API routes (stateless) run through session middleware; session storage grows with every API call
- Locale detection queries the database globally; 60% of requests are cached assets that don't need locale
- Response times for 404 pages are 200ms because they run through 10 middleware that do nothing
- Database connection pool exhausted by global middleware queries on high-traffic static asset requests

### Preferred Alternative
Register middleware at the most restrictive tier possible: global only for truly application-wide concerns (CORS, trusted proxies, maintenance mode, input sanitization). Move application-specific concerns to group or route level.

```php
// Wrong: application-specific middleware as global
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(SetLocale::class);
    $middleware->append(ThrottleRequests::class);
    $middleware->append(CheckSubscription::class);
});

// Correct: global for infrastructure, group/route for application concerns
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(TrustProxies::class);   // Infrastructure — every request
    $middleware->append(HandleCors::class);     // Infrastructure — every request
});

// Group registration for application concerns
Route::middleware(['auth', SetLocale::class, CheckSubscription::class])
    ->group(function () { /* ... */ });
```

### Refactoring Strategy
1. Audit the global middleware list for application-specific concerns
2. Move each one to the appropriate route group or route-level registration
3. Create custom middleware groups for common combinations
4. Verify that the middleware does not run on unintended routes (API, 404, health checks)
5. Monitor response time improvement after moving middleware out of global

### Detection Checklist
- [ ] Global middleware contains only infrastructure concerns (proxies, CORS, maintenance)
- [ ] Application-specific middleware (auth, throttle, locale) is at group or route level
- [ ] API and health check routes do not run unnecessary middleware
- [ ] 404 responses do not run application middleware
- [ ] Response times improved after middleware tier correction

### Related Rules/Skills/Trees
- Rule: Register middleware at the most restrictive tier possible
- Rule: Global middleware for application concerns
- Related KU: Cross-Cutting Concerns (tier selection decision framework)

---

## Anti-Pattern 2: Deep Nested Middleware Groups

### Category
Architecture

### Description
Creating three or more levels of nested route groups, each adding middleware, resulting in routes with an opaque and unmanageable middleware stack.

### Why It Happens
Groups are added incrementally as new requirements emerge. Each group adds a layer, and over time the nesting deepens without anyone noticing the cumulative complexity.

### Warning Signs
- Route definitions have 3+ levels of middleware group nesting
- Determining what middleware applies to a route requires traversing all ancestor groups
- Group middleware is inherited from outer scopes with no single source of truth
- Adding middleware to an outer group unexpectedly affects inner routes
- New developers cannot predict what middleware runs on a given route

### Why Harmful
Deep nesting obscures the effective middleware stack. A route may inherit 15+ middleware items across 3 group levels, making it impossible to reason about what protections, transformations, or side effects apply. This leads to security gaps (missing middleware thought to be present) and performance issues (duplicate or unnecessary middleware).

### Real-World Consequences
- Three levels of nesting: `web → auth → verified → admin` each adding middleware
- A route at the innermost level inherits 18 middleware items
- Security audit cannot determine if CSRF protection applies (it was added at level 1, but is it still there at level 3?)
- Performance analysis: most middleware runs unnecessarily on routes that don't need it
- Bug fix: adding throttle at level 2 unexpectedly throttles all level 3 routes, breaking an unthrottled endpoint

### Preferred Alternative
Use flat group structures with explicit compositions. Prefer named middleware groups over deep nesting.

```php
// Wrong: deep nesting
Route::middleware('web')->group(function () {
    Route::middleware('auth')->group(function () {
        Route::middleware('verified')->group(function () {
            Route::middleware(['can:access-admin'])->group(function () {
                Route::get('/admin/dashboard', ...);
            });
        });
    });
});

// Correct: flat named group
$middleware->group('admin', ['web', 'auth', 'verified', 'can:access-admin']);
Route::middleware('admin')->group(function () {
    Route::get('/admin/dashboard', ...);
});
```

### Refactoring Strategy
1. Map all route groups and their nesting structure
2. Create flat named middleware groups for each distinct stack
3. Replace nested groups with the flat group in route definitions
4. Remove redundant nested group structures
5. Document each group's middleware stack explicitly

### Detection Checklist
- [ ] No more than 2 levels of middleware group nesting
- [ ] Route groups are flat with explicit middleware composition
- [ ] Effective middleware stack is apparent from route definition
- [ ] Adding middleware to one group does not unpredictably affect others
- [ ] Group contents are documented

### Related Rules/Skills/Trees
- Rule: Do NOT deeply nest route groups — three levels of nested groups results in 15+ middleware items
- Rule: Group-as-domain pattern for flat group structures
- Related KU: Route Definition (group structure best practices)

---

## Anti-Pattern 3: Using `withoutMiddleware` to Exclude Global Middleware

### Category
Architecture

### Description
Attempting to use the `withoutMiddleware()` method on a route to exclude a middleware registered at the global level, discovering it does not work.

### Why It Happens
Developers need a specific route to bypass a middleware, and `withoutMiddleware` seems like the right tool. They do not realize it only works on named route middleware, not global.

### Warning Signs
- Code comments saying "withoutMiddleware doesn't remove global middleware"
- Routes that need to bypass global middleware use workarounds (conditionals inside the middleware)
- `withoutMiddleware` calls on routes with no effect because the middleware is global
- Confusion during code review: "why does this route still run this middleware?"
- Developer moves middleware from global to route level after discovering the limitation

### Why Harmful
`withoutMiddleware` has no effect on global middleware. The route still runs the global middleware, potentially breaking functionality or security expectations. The workaround (conditionals inside the middleware) adds complexity and couples the middleware to specific routes.

### Real-World Consequences
- `withoutMiddleware('auth')` on the login page does nothing because auth is global
- Auth middleware still redirects login page to login page (infinite redirect)
- Fix: conditional inside auth middleware checks for login route — couples middleware to specific routes
- Another developer adds a public route and uses `withoutMiddleware` assuming it works
- Security audit: route thought to bypass middleware actually does not

### Preferred Alternative
Keep global middleware minimal (infrastructure only). Move application-specific middleware to route groups so `withoutMiddleware` can exclude them when needed.

```php
// Wrong: trying to exclude global middleware
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(CheckSubscription::class); // Global
});

// Route (has no effect — global middleware not excluded)
Route::get('/pricing', [PricingController::class, 'index'])
    ->withoutMiddleware(CheckSubscription::class);

// Correct: register at route group level instead
$middleware->group('authenticated', [
    'auth',
    CheckSubscription::class,
]);

Route::middleware('authenticated')->group(function () {
    Route::get('/dashboard', ...);
});

Route::get('/pricing', [PricingController::class, 'index']); // No subscription check
```

### Refactoring Strategy
1. Identify all `withoutMiddleware` calls that attempt to bypass global middleware
2. Move the middleware from global to a selectively applied group
3. Remove `withoutMiddleware` calls — they are no longer needed
4. Update route definitions to use the group where the middleware is needed
5. Verify the middleware still runs on routes that need it and does NOT run on excluded routes

### Detection Checklist
- [ ] `withoutMiddleware` is not used to exclude global middleware (it has no effect)
- [ ] Global middleware contains only infrastructure concerns (not bypassed)
- [ ] Application middleware is at group/route level and can be selectively applied
- [ ] Routes that need to bypass middleware are structurally excluded (different group)
- [ ] No workaround conditionals inside middleware for route-specific bypass

### Related Rules/Skills/Trees
- Rule: Do NOT use `withoutMiddleware()` to exclude global middleware — it only works on named route middleware
- Rule: withoutMiddleware does not exclude global middleware
- Related KU: Route Definition (middleware assignment)

---

## Anti-Pattern 4: Adding Session Middleware to API Routes

### Category
Performance

### Description
Applying the `web` middleware group (which includes session, cookie, and CSRF middleware) to API routes that should be stateless.

### Why It Happens
New developers apply the same middleware group to all routes. API routes are added to the `web` group file, inheriting all its middleware.

### Warning Signs
- API routes are defined in `routes/web.php` instead of `routes/api.php`
- API routes inherit session, cookie, and CSRF middleware from the web group
- Session files or cookies are created for every API request
- CSRF token mismatch errors on API POST requests using cookie-based CSRF
- API response times are higher due to session read/write overhead
- Session storage grows with every stateless API call

### Why Harmful
Session middleware adds cookie handling, session start/read/write, and CSRF protection to every request. For stateless API routes, this is pure overhead — no session data is needed, no CSRF protection is applicable (API uses tokens), and cookie management adds latency.

### Real-World Consequences
- API routes using web group: each request reads and writes session data
- Session driver is file; 10,000 API requests/minute create 10,000 session file reads/writes
- Disk I/O increases by 300% from unnecessary session handling
- CSRF middleware rejects API POST requests that lack CSRF tokens
- API clients must send cookies with every request to maintain session
- Performance fix: move API routes to `api` group, reduce response times by 30%

### Preferred Alternative
Use the `api` middleware group for API routes. It is stateless, has no session or CSRF, and includes only rate limiting and route model binding.

```php
// Wrong: API routes using web group
// routes/web.php
Route::get('/api/users', [UserController::class, 'index']); // Has session, CSRF, cookies

// Correct: use api.php file with api group
// routes/api.php
Route::middleware('api')->group(function () {
    Route::get('/users', [UserController::class, 'index']); // Stateless, rate-limited
});
```

### Refactoring Strategy
1. Identify API routes incorrectly using the web middleware group
2. Move them to `routes/api.php` (uses `api` group by default)
3. If API routes must stay in web group, override middleware on each route to exclude session
4. Remove any CSRF token handling from API clients
5. Verify session storage stops growing after the fix

### Detection Checklist
- [ ] API routes use the `api` middleware group (stateless)
- [ ] No session middleware runs on API requests
- [ ] No CSRF protection on API requests
- [ ] API response times do not include session overhead
- [ ] Session storage is not affected by API traffic

### Related Rules/Skills/Trees
- Rule: Do NOT apply the `web` group to API routes — session middleware adds unnecessary overhead
- Rule: Adding session middleware to API routes
- Related KU: API route design (stateless API patterns)

---

## Anti-Pattern 5: Group Middleware Applied Outside the Closure

### Category
Reliability

### Description
Registering a route after the closing brace of a `Route::group()` block but inside the same file, assuming the route inherits the group's middleware.

### Why It Happens
File indentation and grouping visually suggest that routes after the closing brace belong to the group. Developers add new routes at the end of the file without noticing they are outside the group scope.

### Warning Signs
- Routes registered after a group closing brace appear visually "inside" the group due to file organization
- New routes added at the end of a grouped route file do not behave as expected (no auth, no throttle)
- Bug report: "new route returns data without authentication, even though it's in the admin section"
- Group middleware was intended for all routes in the file, but only routes inside the closure have it
- File has a comment like "// Admin routes below" but the group was closed above

### Why Harmful
Middleware is applied by closure scope, not by file position or visual grouping. A route outside the group closure does not receive the group's middleware. If the route was intended to be protected (auth, admin, throttle), it is exposed without protection.

### Real-World Consequences
- Admin routes are inside `Route::middleware('admin')` group
- New developer adds a route after the closing brace thinking it's "still in the admin section"
- Route has no auth, no admin role check, no audit logging
- Sensitive admin endpoint is publicly accessible for 3 weeks before discovery
- Security incident: customer data exposed through unprotected route

### Preferred Alternative
Always verify route position relative to group closures. Use explicit group middleware assignment on individual routes if they must be outside the group block.

```php
// Wrong: route outside the group
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'show']);
});

Route::get('/admin/users', [UserController::class, 'index']); // NOT protected!

// Correct: route inside the group
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'show']);
    Route::get('/admin/users', [UserController::class, 'index']); // Protected
});

// Alternative: explicit middleware on route
Route::get('/admin/users', [UserController::class, 'index'])->middleware('auth');
```

### Refactoring Strategy
1. Audit all route files for routes registered outside intended group closures
2. Move routes inside the correct group or add explicit middleware
3. Enforce coding standard: group files are structured so all routes are inside the group
4. Add automated test that verifies routes in intended groups have the expected middleware
5. Review new route definitions in pull requests for correct group placement

### Detection Checklist
- [ ] All routes intended to be in a group are inside its closure
- [ ] Routes outside groups have explicit middleware if they need protection
- [ ] Group scope is verified by automated tests
- [ ] Code review catches routes outside intended groups
- [ ] File structure makes group boundaries visually clear

### Related Rules/Skills/Trees
- Rule: Middleware is applied by closure scope, not file position
- Rule: Route registered after group closure does not receive group middleware
- Related KU: Route Definition (group scoping)
