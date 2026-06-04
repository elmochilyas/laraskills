# Global, Route Group, and Route Middleware

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Middleware System
- **Knowledge Unit:** Global, Route Group, and Route Middleware
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Laravel provides three tiers of middleware registration — global, route group, and route-level — each with different scope and execution timing. Global middleware runs on every HTTP request before routing. Route group middleware runs on all routes within a group. Route-level middleware runs on individual routes after they are matched. These tiers form a hierarchy of scope from application-wide (global) to route-specific (individual).

The engineering significance of the three-tier architecture is that it enables middleware to be applied at the appropriate level of granularity. Infrastructure concerns (trusted proxies, CORS) belong globally because they affect how every request is interpreted. Session and CSRF concerns belong to the `web` group because they only apply to browser-based requests. Specific auth and throttle configurations belong at the route level because they differ per endpoint. Using the wrong tier causes either unnecessary middleware execution (global middleware on API routes that do not need sessions) or missing middleware execution (forgetting to add auth to a protected route).

---

## Core Concepts

### The Three Tiers
| Tier | Scope | Registration (Laravel 11+) | Registration (Laravel 10-) | Execution |
|------|-------|---------------------------|---------------------------|-----------|
| Global | Every HTTP request | `$middleware->append()` | `$middleware` array | Before routing |
| Group | Routes in a group | `$middleware->group('name', [...])` | `$middlewareGroups` array | After routing, merged with route/controller middleware |
| Route | Individual route | On route definition: `->middleware('auth')` | On route definition: `->middleware('auth')` | After routing, merged with group/controller middleware |

### Execution Order Within the Route Pipeline
When a route is matched, all three tiers are merged into a single pipeline:

```
route middleware ∪ group middleware ∪ controller middleware
→ aliases resolved → withoutMiddleware applied → sorted by priority
→ executed as single pipeline
```

The merging is additive — middleware from all tiers accumulate. There is no mechanism to remove middleware inherited from a group (except via `withoutMiddleware` which only works on named route middleware, not group or global).

### Default Groups
Laravel ships with two default middleware groups:

**web group** (used by `routes/web.php`):
- `EncryptCookies` / `AddQueuedCookiesToResponse`
- `StartSession`
- `ShareErrorsFromSession`
- `ValidateCsrfToken` (formerly `VerifyCsrfToken`)
- `SubstituteBindings`

**api group** (used by `routes/api.php`):
- `EnsureFrontendRequestsAreStateful` (Sanctum, if installed)
- `throttle:api`
- `SubstituteBindings`

The `web` group is stateful (cookies, session). The `api` group is stateless (no cookies, no session, rate-limited).

---

## Mental Models

### The Scope Pyramid
Picture a pyramid: global middleware at the base (applies everywhere), group middleware in the middle (applies to route collections), route middleware at the top (applies to individual endpoints). A middleware higher in the pyramid overrides or augments lower levels, but nothing from the base can be removed.

### The Additive-Only Constraint
Middleware registration is additive-only at every level. Global middleware accumulates with group middleware, which accumulates with route middleware. There is no "subtract" operator — once middleware is registered at a higher scope, it cannot be removed at a lower scope. This forces middleware to be registered at the most restrictive tier possible.

### Group as Configuration Set
A middleware group is a configuration set that bundles related middleware together. The `web` group is "browser application middleware." The `api` group is "REST API middleware." Defining a custom group is equivalent to saying "all routes in this section require these middleware."

---

## Internal Mechanics

### Global Middleware Resolution
In the `Kernel::sendRequestThroughRouter()` method:

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

Global middleware runs on every request, always, regardless of whether a route matches. A 404 page still runs through global middleware.

### Route Group Middleware Inheritance
Route groups support nesting. When groups are nested, middleware is merged additively:

```php
Route::middleware(['auth'])->group(function () {
    Route::middleware(['verified'])->group(function () {
        Route::get('/dashboard', ...); // Middleware: auth + verified
    });
});
```

The inner route inherits middleware from all ancestor groups. The order is: outermost group first, innermost last (after merging).

### Route Middleware Assignment
Route-level middleware is assigned via chainable methods:

```php
Route::get('/admin', ...)->middleware('auth')->middleware('can:access-admin');
```

Multiple calls to `middleware()` append to the route's middleware array. Middleware can also be assigned as an array:

```php
Route::get('/admin', ...)->middleware(['auth', 'can:access-admin']);
```

### Controller Middleware Integration
Controller middleware (via `HasMiddleware`, `#[Middleware]`, or constructor) is merged with route and group middleware in `Route::gatherMiddleware()`. The merge order is: controller middleware → route middleware → group middleware. After merging, `SortedMiddleware` reorders based on priority.

### withoutMiddleware Behavior
The `withoutMiddleware()` method on Route excludes middleware from the route:

```php
Route::get('/login', ...)->withoutMiddleware('auth');
```

This only excludes middleware that was registered as a named route alias or FQCN — it does NOT exclude global middleware. Global middleware always runs regardless of `withoutMiddleware`:

```php
// In Route.php
public function withoutMiddleware($middleware)
{
    $this->excludedMiddleware = array_merge(
        (array) $this->excludedMiddleware,
        (array) $middleware
    );
    return $this;
}
```

The exclusion is applied in `Router::gatherRouteMiddleware()` by filtering the resolved middleware array.

---

## Patterns

### Group-as-Domain Pattern
Define custom middleware groups for distinct application domains:

```php
$middleware->group('admin', [
    'auth',
    'verified',
    'can:access-admin',
    EnsureTwoFactorAuth::class,
]);

$middleware->group('api:v2', [
    'auth:sanctum',
    'throttle:200,1',
    'substitute',
]);
```

- **Purpose**: Bundle domain-specific middleware for reuse across routes.
- **Benefits**: One middleware assignment per group per route file; domain-specific configuration is centralized.
- **Tradeoffs**: Group definitions spread across bootstrap/app.php and route files — documentation is essential.

### Selective Route Middleware Pattern
Assign middleware at the most granular level that makes sense:

```php
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::get('/settings', [SettingsController::class, 'edit'])->middleware('verified');
    Route::post('/settings', [SettingsController::class, 'update'])->middleware(['verified', 'throttle:10,1']);
});
```

- **Purpose**: Avoid applying middleware to routes that do not need it by assigning at the route level, not the group level.
- **Benefits**: Each route has exactly the middleware it needs.
- **Tradeoffs**: More verbose route definitions; middleware assignments are scattered across route files.

### Group Modification Pattern (Laravel 11+)
Modify existing groups without redefining them:

```php
$middleware->web(append: [
    App\Http\Middleware\AddToWeb::class,
]);

$middleware->api(prepend: [
    App\Http\Middleware\BeforeApi::class,
]);

$middleware->web(remove: [
    \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
]);
```

- **Purpose**: Extend or reduce default groups without copying the entire group definition.
- **Benefits**: Declarative group changes; default group contents are inherited from the framework, not duplicated.
- **Tradeoffs**: Group modifications are harder to discover than explicit group definitions — developers must check both the group definition AND all modifications.

---

## Architectural Decisions

### Global vs Group vs Route: the Decision Framework
| Concern | Tier | Reason |
|---------|------|--------|
| Trusted proxies | Global | Affects request interpretation — must run before routing |
| CORS handling | Global | OPTIONS preflight must be handled before routing |
| Maintenance mode | Global | Must block all requests, including 404s |
| Input sanitization | Global | Prevents downstream processing of malformed input |
| Session management | Group (web) | Only needed for browser-based routes |
| CSRF protection | Group (web) | Only needed for stateful routes |
| Rate limiting | Route | Differs per endpoint (10/min for login, 60/min for API) |
| Authentication | Route | Differs per endpoint (public vs protected) |
| Authorization | Route | Differs per resource (can:update, can:delete) |

### Why Global Middleware Cannot Use Route Data
Global middleware runs before routing, so it has no access to matched route parameters, named routes, or route-level configuration. If a middleware needs route context (e.g., which guard to use for auth), it must be registered as route-level middleware, not global.

### Additive-Only Design Rationale
The additive-only constraint (cannot remove middleware at a lower tier) is intentional. If middleware could be removed, a route could accidentally bypass security middleware inherited from a group. The constraint provides safety: once middleware is registered at a higher scope, it always runs. To exclude a route, use `withoutMiddleware` for named middleware or restructure the route hierarchy.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Global middleware ensures infrastructure runs everywhere | Global middleware adds latency to every request | Keep global middleware minimal; move to groups when possible |
| Groups bundle related middleware for reuse | Groups are additive-only — cannot exclude inherited middleware | Use withoutMiddleware only for named route middleware |
| Route-level middleware is precise | Route definitions become verbose with many middleware | Use groups for the common case; individual middleware for exceptions |
| Group modification (Laravel 11+) keeps definitions DRY | Modifications are harder to discover than explicit definitions | Document group modifications in the team's middleware reference |

---

## Performance Considerations

### Global Middleware on Asset Requests
Global middleware runs on requests to static assets served through Laravel (not via nginx/CDN). A global middleware that starts a session or queries the database adds overhead to each asset request. For high-traffic applications, serve static assets from a CDN or web server separate from the Laravel pipeline.

### Group Middleware on API Routes
The `web` group includes session middleware (cookie encryption, session start, session share, CSRF). Applying `web` middleware to API routes adds unnecessary session overhead (cookie handling, session read/write) to every API call. API routes should use the `api` group or a custom stateless group.

### Rate Limiting Before Auth
Rate limiting is typically registered after auth in middleware priority, but at the route level, rate limiting should be applied BEFORE auth on authentication endpoints to prevent brute force attacks on the login form.

---

## Production Considerations

### Documenting Group Contents
Every custom middleware group and modification should be documented. Developers need to know which middleware runs on which routes. A table in the project README or architecture docs listing each group and its middleware is essential for team onboarding.

### Testing Middleware at Each Tier
- **Global middleware**: Test that the middleware modifies all routes, including 404 fallback routes.
- **Group middleware**: Test that routes in the group receive the middleware; routes outside the group do not.
- **Route middleware**: Test that the specific route receives the middleware; sibling routes without the middleware do not.

### Middleware Registration in Packages
Packages that provide middleware should register it in the service provider, not in `bootstrap/app.php` or `Kernel.php`. Use `$router->aliasMiddleware()`, `$router->middlewareGroup()`, or `$kernel->pushMiddleware()` for global registration.

---

## Common Mistakes

### Adding Session Middleware to API Routes
Applying the `web` group (which includes session middleware) to API routes adds cookie encryption, session start, and CSRF protection to every API call. Session middleware in a stateless API causes performance degradation and potential session conflicts.

### Removing CSRF for API Routes at the Global Level
Using `withoutMiddleware` on the route definition is the correct way to exclude CSRF for API-only routes. Removing CSRF from the `web` group globally affects all routes, including browser-based POST forms that need CSRF protection.

### Assigning Global Middleware That Needs Route Context
A middleware that checks the authenticated user's role must know which route is being accessed (to determine required permissions). If registered as global, it cannot access route data. This middleware should be route-level or group-level, not global.

### Forgetting to Add Middleware to a New Route Group
A developer creates a new route file (`routes/admin.php`) and registers it in `RouteServiceProvider` but forgets to apply the `admin` middleware group. The routes run without authentication. Always verify that new route files have the correct middleware group applied.

---

## Failure Modes

### Nested Group Middleware Proliferation
Three levels of nested groups each adding middleware results in a route inheriting 15+ middleware items. The developer has no single source of truth for what middleware applies to the route. Restructure groups to avoid deep nesting — prefer flat group structures with route-level additions.

### Global Middleware Causing Route Not Found
A global middleware that modifies the request URI or method (e.g., transforming GET to POST) can cause routes to not match. The router sees the modified request after global middleware, not the original request. Global middleware that modifies routing parameters must be carefully tested.

### Group Middleware Not Applied to Route Registration
A route registered inside a `Route::group()` block after the closing brace does not receive the group's middleware. Middleware is applied by the group closure scope, not by file position.

---

## Ecosystem Usage

### Laravel Horizon
Horizon registers its dashboard routes with middleware in its service provider: `Route::middleware('web', 'auth', 'can:viewHorizon')`. It uses route-level middleware, not group or global.

### Laravel Sanctum
Sanctum adds `EnsureFrontendRequestsAreStateful` to the `api` group via `install:api`. It uses group modification to integrate with the default route structure.

### Spatie Laravel Permission
Spatie's middleware is registered as aliases (`role`, `permission`, `role_or_permission`) and applied at the route level: `Route::middleware('role:admin')`.

### Laravel Cashier
Cashier does not register middleware. Its webhook handling routes are defined without additional middleware — they skip CSRF and session by design (webhooks are stateless).

---

## Related Knowledge Units

### Prerequisites
- Middleware Fundamentals — understanding the Pipeline pattern and two-pass execution
- Middleware Lifecycle — how middleware execution flows through global and route pipelines
- Route Definition — how routes are defined and grouped

### Related Topics
- Controller Middleware — the controller-level registration mechanisms
- Middleware Ordering and Priority — how middleware from different tiers is sorted
- Laravel 11 vs 10 Registration — the API differences for middleware registration

### Advanced Follow-up Topics
- Custom Middleware — creating middleware for registration at any tier
- Parameterized Middleware — middleware that accepts configuration parameters
- Cross-Cutting Concerns — deciding which tier to use for which concern

---

## Research Notes

- The additive-only constraint is a safety feature, but it surprises developers accustomed to "override" semantics. The lack of a middleware removal mechanism (except `withoutMiddleware` for named route middleware) forces middleware to be registered at the most restrictive tier possible.
- `withoutMiddleware` does not work on global middleware. This is documented but frequently rediscovered when developers try to exclude global middleware for specific routes. The workaround is to move the middleware from global to a group that is applied selectively.
- In Laravel 11+, group modification (`$middleware->web(append: [...])`) replaced the Laravel 10- pattern of redefining the entire `$middlewareGroups` array. This is more maintainable but less discoverable.
- The `api` group in new Laravel installations includes `throttle:api` (a named limiter) and `SubstituteBindings` only. It does NOT include session or cookie middleware. The `EnsureFrontendRequestsAreStateful` middleware is added by Sanctum only if installed.