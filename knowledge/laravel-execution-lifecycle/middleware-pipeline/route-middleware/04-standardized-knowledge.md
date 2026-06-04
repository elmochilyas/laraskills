# Route Middleware

## Metadata
- **ID:** ku-10-request-lifecycle-middleware / ku-11-response-lifecycle-middleware
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **Last Updated:** 2026-06-02

## Overview
Route-specific middleware is middleware assigned directly to individual routes or route groups, either inline in route definitions, via controller methods, or through route group configuration. This is the most granular level of middleware assignment, allowing developers to attach middleware to specific endpoints. Route middleware runs after global middleware but before the controller method executes. It supports class strings, short aliases, group names, closures, and parameterized middleware.

## Core Concepts
- **Inline Assignment**: `Route::get('/admin', ...)->middleware(['auth', 'verified'])` — most explicit form.
- **Controller Middleware**: `$this->middleware('auth')->only('index')` in controller constructors — for resource controllers.
- **Route Group Middleware**: Middleware defined on a route group propagates to all nested routes.
- **Middleware Merging**: `gatherRouteMiddleware()` collects from three sources: route definition, route groups, and controller constructor.
- **Pre-middleware (inbound)**: Code before `$next($request)` — auth checks, validation, rate limiting, request logging.
- **Post-middleware (outbound)**: Code after `$next($request)` — response headers, compression, response logging.

## When To Use
- **Authentication**: Protect specific routes with `auth` middleware.
- **Rate limiting**: Apply `throttle` to specific API endpoints.
- **Authorization**: Gate checks on specific controller actions.
- **Feature-specific logic**: Middleware that only applies to certain endpoints (e.g., paid-feature gating).
- **Response transformation**: Add headers, compress, or modify responses for specific routes.

## When NOT To Use
- **Infrastructure concerns**: Maintenance mode, trusted proxies — use global middleware.
- **Shared concerns across many routes**: Use middleware groups instead of repeating on each route.
- **Controller-only logic**: Simple checks belong in the controller or form request validation.
- **Closure middleware on cached routes**: Closures cannot be serialized in route cache — use classes.

## Best Practices (WHY)
- **Prefer inline middleware over controller middleware**: Route definitions show all middleware at a glance. Controller middleware is hidden in the constructor. *Why: Visibility — inline middleware is visible in route files; controller middleware requires inspecting the controller class.*
- **Use `only`/`except` for resource controllers**: `$this->middleware('auth')->except('index', 'show')` is cleaner than applying to each method. *Why: Resource controllers have standard CRUD methods; method-specific middleware avoids repetition.*
- **Avoid closure middleware on production routes**: Closures cannot be serialized by route cache. *Why: Route caching is a key performance optimization — closures bypass it entirely.*
- **Verify with `php artisan route:list -v`**: See the full resolved middleware stack including inherited group middleware. *Why: Middleware from multiple sources merges — you may have duplicate or conflicting middleware without realizing it.*

## Architecture Guidelines
- **Three levels of assignment**: Global, group, and route — progressive granularity from most broad to most specific.
- **Controller middleware exists for backwards compatibility**: Resource controllers and legacy patterns. Prefer inline for new code.
- **Middleware merging**: Sources combined, deduplicated, and priority-sorted before pipeline execution.
- **Method-specific filtering**: `only`/`except` enables per-action middleware without per-route duplication.

## Performance
- **Route caching**: Serializes route middleware definitions — eliminates runtime resolution.
- **Closure middleware**: Cannot be cached — avoid on high-traffic routes.
- **Controller middleware resolution**: Resolved per-request via reflection — adds marginal overhead.
- **Route caching with alias middleware**: Aliases are resolved at cache time, eliminating per-request resolution.

## Security
- **Middleware duplication**: Adding middleware at both route level and group level — runs twice, doubling execution time.
- **Priority conflicts**: Auth middleware running before session middleware when assigned at route level.
- **Middleware not found**: Route references a non-registered alias — throws exception.
- **Controller middleware hidden from route listing**: `route:list` shows route-level middleware; controller middleware is less visible.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Duplicating group middleware on routes | Adding middleware already in group | Middles run twice | Check route:list -v to verify |
| Using closures for middleware in production | Convenience during development | Breaks route caching | Use class-based middleware |
| Middleware only/except typo | Method name mismatch | Middleware applies to wrong method | Use `only('store')` — verify method exists |
| Assuming order without priority | Not understanding merge order | Wrong execution sequence | Define order explicitly or use priority |

## Anti-Patterns
- **Middleware spaghetti on every route**: Listing 5+ middleware on every route definition. Use groups for shared middleware.
- **Hiding middleware in controller constructor**: Putting critical security middleware in `$this->middleware()` — invisible in route files.
- **Over-using `except`**: Excluding middleware from most methods but keeping it on the controller — confusing.
- **Route middleware for global concerns**: Adding infrastructure middleware (CORS, trusted proxies) at the route level instead of global.

## Examples

```php
// Inline route middleware
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::post('/reports', [ReportController::class, 'generate'])
        ->middleware('throttle:10,1');
});

// Controller middleware with method filtering
class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('log')->only('index', 'show');
        $this->middleware('throttle:60,1')->only('store', 'update');
    }
}

// Pre-middleware (inbound) and post-middleware (outbound)
class RequestTimer
{
    public function handle($request, $next)
    {
        $start = microtime(true);                     // Pre-middleware (inbound)
        $response = $next($request);
        $duration = (microtime(true) - $start) * 1000; // Post-middleware (outbound)
        $response->headers->set('X-Duration', $duration);
        return $response;
    }
}
```

## Related Topics
- **Pipeline Pattern Fundamentals**: Pipe execution model.
- **Middleware Groups**: Group-to-route middleware inheritance.
- **Middleware Aliases**: Shorthand names for route middleware.
- **Middleware Parameters**: Colon-delimited parameter passing.
- **Middleware vs Route Binding Ordering**: Execution order with SubstituteBindings.

## AI Agent Notes
- `Illuminate\Routing\Router::gatherRouteMiddleware()` merges middleware from three sources: route definition, route group, and controller. The merge respects `$middlewarePriority`.
- Laravel 11 removes `$routeMiddleware` from Kernel, relying on middleware aliases in `bootstrap/app.php`.
- Controller middleware (`$this->middleware()`) is a legacy pattern from Laravel's resource controller architecture. Inline middleware is preferred for new code.
- Route caching serializes the resolved middleware list. Closure middleware cannot be serialized — this is a common gotcha.

## Verification
- [ ] Create a route with inline middleware and verify with `route:list -v`
- [ ] Apply middleware to specific controller methods using `only`/`except`
- [ ] Compare `route:list -v` output before and after route caching
- [ ] Verify pre-middleware and post-middleware execution timing
- [ ] Create a route with 3 middleware sources (group, route, controller) — verify merge order
- [ ] Test middleware short-circuit from route-level middleware
