# Middleware Registration Order

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **Last Updated:** 2026-06-02

## Executive Summary
Middleware registration order determines the sequence in which middleware executes around the core application logic. Laravel registers middleware from multiple sources — global middleware array, middleware groups (web, api), route-specific middleware, and middleware priority overrides. Understanding this registration and execution order is critical for debugging middleware that doesn't run when expected, or for ensuring security middleware (auth, throttle) executes before request-handling middleware.

## Core Concepts
- **Global middleware**: Registered in the kernel's `$middleware` property — runs on every request. Executed first in the pipeline.
- **Middleware groups**: `web`, `api`, and custom groups defined in the kernel. Whole groups are assigned to routes via `Route::group()` or `Route::middleware()`.
- **Route middleware**: Named middleware aliases applied per-route via `Route::get('/path', ...)->middleware('auth')`. Execute after global and group middleware.
- **Execution order**: Global → group → route middleware. Within each category, order follows registration order.
- **Middleware priority**: The `$middlewarePriority` array (or `priority()` method) reorders middleware across categories — it overrides the default global → group → route stacking.
- **$middlewareGroups**: Defines named groups of middleware e.g., `'web' => [\App\Http\Middleware\EncryptCookies::class, ...]`.
- **$routeMiddleware**: Maps short aliases to middleware classes e.g., `'auth' => \App\Http\Middleware\Authenticate::class`.

## Mental Models
- **Onion Layers Model**: The request passes through middleware layers like an onion — outermost (global) first, through groups, then route middleware (innermost). The response travels back out through the same layers in reverse.
- **Conveyor Belt Model**: Middleware are stations on a conveyor belt. The request travels from Station 1 (global) to Station N (route), gets processed by the controller, then travels back through stations in reverse for post-processing.
- **Priority Override Model**: If priority is set, it's like having express lanes on the conveyor belt — certain middleware jump ahead of others regardless of which "section" they were placed in.

## Internal Mechanics
1. Middleware registration happens in `sendRequestThroughRouter()` inside the HTTP Kernel.
2. The kernel builds the middleware array by merging global middleware, extracting group middleware from the matched route, and appending route-specific middleware.
3. The pipeline iterates through the combined middleware stack, calling `handle()` on each.
4. `$middlewarePriority` is a global array that reorders the merged middleware stack. The entire list is sorted: middleware appearing earlier in the priority array moves earlier in execution order.
5. The priority reordering uses a stable sort — middleware with the same priority level maintain their original relative order.
6. `syncMiddlewareToRouter()` (Laravel 10) or `->withMiddleware()` (Laravel 11+) bridges the kernel's middleware config to the router.

## Patterns
- **Stack/Pipeline Pattern**: Middleware is structured as a pipeline — each middleware calls `$next($request)`, passing control to the next layer.
- **Grouping Pattern**: Related middleware (e.g., all web-related) are grouped together for easy route assignment.
- **Priority Override Pattern**: A global mechanism to reorder middleware across categories when the default order doesn't work for specific middleware.
- **Alias Pattern**: Short, descriptive names for middleware classes, making route definitions more readable.

## Architectural Decisions
- **Why global → group → route order?** This order reflects the principle of least surprise — broad-scope middleware (CORS, TrimStrings) runs first, followed by group-scope (web session, CSRF), followed by route-specific (auth, throttle).
- **Why a priority system?** Some middleware must run in a specific position regardless of whether it's global, group, or route (e.g., `SubstituteBindings` must run after `StartSession`). Priority provides cross-category ordering without forcing all middleware into a single global list.
- **Why middleware groups?** Groups reduce repetition — instead of listing 8 middleware on every web route, you define a `web` group once and apply it to all web routes.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Predictable global → group → route order | Priority system adds complexity | Developers may not understand why middleware reorders unexpectedly |
| Groups reduce route boilerplate | Group assignment is static in kernel config | Dynamic middleware per-request requires route-level middleware |
| Route middleware enables per-action control | Route middleware must be explicitly listed per-route | Easy to forget middleware on a new route |
| Priority enables fine-grained ordering | Priority affects ALL routes globally | A change to priority affects every route, not just the target |

## Performance Considerations
- Middleware array merging happens on every request — the combined stack is rebuilt fresh each time.
- Priority reordering uses a sort operation — O(n log n) on middleware count, but n is typically <30 so negligible.
- Each middleware layer adds at least two method calls (handle() entry, $next() return).
- Global middleware runs on 100% of requests — minimize the global stack for performance.

## Production Considerations
- Verify middleware execution order with `php artisan route:list -v` in production.
- Keep global middleware minimal — each global middleware runs on every request, affecting 100% of traffic.
- Document custom middleware groups and priority overrides — implicit ordering can cause subtle bugs.
- In Octane, middleware is resolved per-request — ensure middleware resolution is fast (avoid expensive constructor logic).
- Test middleware order explicitly — write integration tests that verify middleware executes in the correct sequence.

## Common Mistakes
- **Assuming route middleware runs before group middleware**: Route middleware runs AFTER group middleware — it's the innermost layer.
- **Forgetting priority affects everyone**: Adding a middleware to `$middlewarePriority` changes its position globally, not just for the intended routes.
- **Duplicate middleware in multiple groups**: A middleware assigned to both `web` and `api` groups may run twice if a route has both groups.
- **Non-terminable in route middleware**: `TerminableMiddleware` only works on global and group middleware — route middleware does NOT get terminate() calls.
- **Middleware registration before framework setup**: Trying to add middleware in `register()` or early `boot()` before the kernel config is available.

## Failure Modes
- **Middleware never runs**: The middleware is registered but not assigned to any route or group. Check `$middleware`, `$middlewareGroups`, or route `->middleware()` assignment.
- **Middleware runs in wrong order**: Priority reorder moved it unexpectedly. Check `$middlewarePriority` and trace the final sorted list.
- **Middleware short-circuits expected middleware**: A middleware returns a redirect before downstream middleware runs — logging middleware after it in the stack never fires.
- **Middleware resolved but not terminable**: Terminable middleware registered as route middleware does not receive terminate() call.

## Ecosystem Usage
- **Laravel core**: Default web group includes `EncryptCookies`, `AddQueuedCookiesToResponse`, `StartSession`, `ShareErrorsFromSession`, `VerifyCsrfToken`, `SubstituteBindings`.
- **Laravel API group**: Default includes `ThrottleRequests:api`.
- **Spatie packages**: `laravel-permission` registers middleware that checks permission/role — runs in the route middleware layer.
- **Common custom middleware**: CORS, request logging, JSON API formatting, locale detection — typically added to global or group middleware.

## Related Knowledge Units

### Prerequisites
- [Pipeline Pattern Fundamentals](../../middleware-pipeline/pipeline-pattern-fundamentals/02-knowledge-unit.md) — the Pipeline class that executes middleware.

### Related Topics
- [Middleware Configuration in Bootstrap](../../middleware-pipeline/middleware-configuration-in-bootstrap/02-knowledge-unit.md) — how Laravel 11+ configures middleware in bootstrap/app.php.
- [Middleware Priority](../../middleware-pipeline/middleware-priority/02-knowledge-unit.md) — the priority system in detail.

### Advanced Follow-up Topics
- [Middleware vs Route Binding Ordering](../../middleware-pipeline/middleware-vs-route-binding-ordering/02-knowledge-unit.md) — how SubstituteBindings middleware interacts with other middleware.
- [Kernel Version Evolution](../../kernel-architecture/kernel-version-evolution/02-knowledge-unit.md) — how middleware registration changed from Laravel 10 to 11+.

## Research Notes
- In Laravel 11+, middleware is configured via `->withMiddleware()` in `bootstrap/app.php`, replacing the kernel's `$middleware` property.
- The `syncMiddlewareToRouter()` bridge was the Laravel 10 mechanism — it's been replaced by the ApplicationBuilder's `withMiddleware()` fluent API.
- `$middlewarePriority` is checked in `Kernel::sortMiddleware()` — it creates a sorted list using the priority array as a ranking system.
- The execution order for a typical web route: global → web group → auth (route) → controller.
- Future direction: More middleware configuration moving to attributes and the ApplicationBuilder, away from kernel properties.
