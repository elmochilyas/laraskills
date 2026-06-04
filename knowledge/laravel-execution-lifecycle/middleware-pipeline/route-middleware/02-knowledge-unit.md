# Route Middleware
## Metadata (Domain: Laravel Execution Lifecycle & Framework Internals, Subdomain: Middleware Pipeline, Last Updated: 2026-06-02)
## Executive Summary
Route-specific middleware is middleware assigned directly to individual routes or route groups, either inline in route definitions, via controller methods, or through route group configuration. This is the most granular level of middleware assignment, allowing developers to attach middleware to specific endpoints. Route middleware runs after global middleware but before the controller method executes. It supports class strings, short aliases, group names, closures, and parameterized middleware.

## Core Concepts
Route middleware is assigned via the `->middleware()` fluent method on route definitions, or via the `$this->middleware()` method in controller constructors. Multiple middleware can be stacked: `->middleware(['auth', 'verified'])`. Middleware can be applied to specific controller methods via `$this->middleware('auth')->only('index')` or excluded via `->except('show')`. Routes inheriting middleware from parent route groups propagate middleware to all nested routes.

## Mental Models
**Route Bouncer:** Each route has its own bouncer (middleware) that checks credentials before letting the request through. The bouncer list is printed on the route definition itself.

**Guard Post:** Middleware on routes is like guard posts at individual building entrances. Global security checks everyone at the main gate; route guards check specifically for that room.

## Internal Mechanics
When the router compiles a route, it stores middleware in `$route->action['middleware']`. During request handling, `Illuminate\Routing\Router::gatherRouteMiddleware()` collects middleware from three sources: the route definition, the route's groups, and the controller constructor. These are merged into a single array, deduplicated via `array_unique`, and sorted by the priority array. The `substituteBindings()` middleware is typically added during this phase if not already present. The `composeMiddleware()` method performs the final resolution and priority sorting before passing to the Pipeline.

```php
// Route with middleware
Route::get('/admin', [AdminController::class, 'index'])
    ->middleware(['auth', 'verified', 'throttle:10,1']);

// Controller middleware
class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('log')->only('index');
    }
}
```

## Patterns
- **Controller Trait Middleware:** `ValidatesRequests` and `AuthorizesRequests` traits use middleware patterns.
- **Fluent Middleware Chaining:** Route definitions use fluent API for clean, readable middleware assignment.
- **Method-Specific Filtering:** Middleware targets specific controller methods using `only`/`except`.

## Architectural Decisions
Laravel supports three levels of middleware assignment (global, group, route) to give developers control over granularity. Route-level middleware is the most explicit and should be preferred for route-specific concerns. Controller middleware (using `$this->middleware()`) exists for backwards compatibility and resource controllers where individual method control is needed.

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Explicit middleware per route | Repetitive if many routes share middleware | Use groups instead for shared middleware |
| Controller middleware keeps logic with controller | Middleware is hidden in constructor, not visible in route file | Developers must inspect controller to see all middleware |
| Supports closures for inline middleware | Closure middleware cannot be cached in route cache | Performance regression on uncached routes |

## Performance Considerations
Route caching serializes route middleware definitions, eliminating runtime resolution overhead. Closure middleware cannot be cached — avoid closures in production for high-traffic routes. Controller middleware is resolved per-request via reflection, adding marginal overhead.

## Production Considerations
Audit route middleware regularly. A common issue is accumulating unnecessary middleware over time. Use `php artisan route:list -v` to see the full middleware stack for each route. For high-traffic public routes, minimize middleware to improve throughput.

## Common Mistakes
**Why it happens:** Developers add middleware to individual routes that are already in the global stack or group. **Why it's harmful:** Middleware runs twice, doubling execution time. **Better approach:** Check `route:list -v` output to verify which middleware is already included.

## Failure Modes
- **Middleware not found:** Route references a non-registered alias or class name.
- **Method-specific middleware mismatch:** `only('store')` on a resource route where the store method doesn't exist.
- **Priority conflicts:** Auth middleware running before session middleware when assigned at route level.

## Ecosystem Usage
- **Laravel Breeze:** Uses `->middleware(['auth', 'verified'])` on dashboard routes.
- **Laravel Horizon:** Uses middleware for authorization on its dashboard routes.
- **Spatie Media Library:** Provides route middleware for signed URLs.

## Related Knowledge Units
### Prerequisites
- Pipeline Pattern Fundamentals (pipe execution model)
- Middleware Groups (group-to-route middleware inheritance)
- Kernel Architecture (route dispatching flow)

### Related Topics
- Middleware Aliases (shorthand names for route middleware)
- Middleware Parameters (colon-delimited parameter passing)

### Advanced Follow-up Topics
- Middleware vs Route Binding Ordering (execution order with SubstituteBindings)
- Middleware Priority (global sort for multi-source middleware)
- Application Bootstrap (route compilation and caching)

## Research Notes
**Source Analysis:** `Illuminate\Routing\Router::gatherRouteMiddleware()` (vendor/laravel/framework/src/Illuminate/Routing/Router.php).
**Key Insight:** Route middleware is merged from three sources: route definition, route group, and controller. The merge respects the `$middlewarePriority` array.
**Version-Specific Notes:** Laravel 11 removes `$routeMiddleware` from Kernel, relying on middleware aliases in `bootstrap/app.php`.
