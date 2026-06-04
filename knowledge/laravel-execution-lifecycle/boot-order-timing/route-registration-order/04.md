# ku-07: Route Registration Order

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **KU:** ku-07-route-registration-order
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Route registration order determines which route matches a given URL — Laravel's router returns the first route that matches the request method and URI. Routes are registered during service provider `boot()` methods, typically in `RouteServiceProvider`. The order of route registration, the order of route files loaded, and the position of wildcard routes all affect matching behavior.

## Core Concepts
- **First-match wins**: The Router iterates the route collection in registration order and returns the first matching route.
- **Route file loading order**: `RouteServiceProvider::boot()` loads route files in a specific order — typically `web.php` then `api.php`, plus any package routes.
- **Route caching**: `route:cache` serializes the route collection in registration order. The cache preserves the load order.
- **Route groups**: Routes within a group inherit the group's attributes (prefix, middleware, namespace). Group ordering also matters.
- **Route patterns**: `Route::pattern()` constraints are applied at registration time and affect matching behavior.
- **Fallback routes**: `Route::fallback()` must be registered last — it catches unmatched requests.

## When To Use
- When you have wildcard routes that must match after specific routes.
- When route caching is used — order is locked at cache time.
- When registering routes from packages that must load after or before application routes.
- When using fallback routes for custom 404 handling.

## When NOT To Use
- Do not rely on route order for RESTful API design — each endpoint should have a unique, unambiguous URL.
- Do not register duplicate routes with different handlers — the first match always wins, which may not be what you intend.
- Do not register routes in `register()` methods — routes should be registered in `boot()` when all services are available.

## Best Practices (WHY)
- **Specific routes before wildcard routes**: Place `/users/create` before `/users/{user}` to prevent `{user}` from matching "create".
- **Cache routes in production**: Route caching freezes the registration order and eliminates the need to re-register routes on every request.
- **Group related routes**: Use route groups with consistent prefixes and middleware for cohesive API sections.
- **Use named routes**: Named routes (`->name('users.show')`) prevent URL generation collisions regardless of registration order.

## Architecture Guidelines
- Define routes in dedicated files by purpose: `web.php`, `api.php`, `channels.php`, custom admin routes.
- Load routes from `RouteServiceProvider::boot()` — the order of `$this->loadRoutesFrom()` calls determines file loading order.
- Package routes load during package provider `boot()` — they register after application routes unless explicitly controlled.
- For large applications, split routes into multiple files and load them in a defined order (e.g., auth routes first, resource routes next, fallback last).

## Performance
- Route registration time is proportional to the number of registered routes. 500 routes ≈ 20-40ms uncached.
- Route caching reduces registration time to zero — the compiled matcher uses a prefix tree for O(log n) matching.
- Wildcard routes with regex constraints are slightly slower than literal routes — the compiled matcher handles this efficiently.
- Route caching requires controller strings (not closures). Closures cannot be serialized.

## Security
- Route order affects auth middleware coverage. Ensure authenticated routes are registered before any catch-all that might bypass auth.
- Fallback routes that log all unmatched requests should be registered last to avoid interfering with normal routing.
- Route patterns that validate parameters (e.g., `whereNumber('id')`) should be applied at registration time to prevent injection.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Wildcard before specific | `/{any}` defined before `/about` | Alphabetical route ordering | `/about` never matches — caught by wildcard | Order specific routes before wildcard routes |
| Closure routes blocking cache | Using `fn() => view(...)` as route handler | Convenience during development | `route:cache` throws LogicException | Use controller classes for all routes |
| Inconsistent group order | Middleware groups loaded in wrong order | Not understanding group inheritance | Middleware applied out of order | Audit group ordering in RouteServiceProvider |
| Package routes overriding app | Package registers a catch-all route | Package route registered last | Application routes beneath package route are shadowed | Load package routes explicitly before fallback |
| Route caching order mismatch | Routes work uncached but fail cached | Route file loading order differs between cache build and runtime | 404 errors on cached deployment | Verify route:list output matches expectations |

## Anti-Patterns
- **Alphabetical route ordering**: Sorting routes alphabetically creates ordering bugs with wildcard routes.
- **Route-in-register()**: Registering routes in `register()` of a provider — routes should be in `boot()`.
- **Duplicate route definitions**: Two routes with the same method and URL — only the first is used.

## Examples
```php
// RouteServiceProvider::boot()
public function boot()
{
    // Specific routes first
    Route::middleware('web')->group(function () {
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
    });

    // Wildcard route last
    Route::fallback(function () {
        return response()->view('errors.404', [], 404);
    });
}
```

## Related Topics
- Route Caching — how `route:cache` serializes route registration order
- Middleware Registration Order (ku-06) — middleware applied during route registration
- Boot Phase Order — where route registration happens in the lifecycle
- Register vs Boot (ku-01) — why routes must be registered in boot(), not register()

## AI Agent Notes
- The Router stores routes in a `RouteCollection` object — routes are appended in registration order.
- After `route:cache`, the `CompiledUrlMatcher` uses a prefix-compiled regex tree — order is baked into the compiled format.
- For debugging route order, use `php artisan route:list` to see the resolved order.
- Package routes typically register after application routes — control this by ordering provider registration.

## Verification
- [ ] Specific routes are defined before wildcard routes
- [ ] All route handlers use controller classes (not closures) if route caching is used
- [ ] Fallback routes are registered last (after all other routes)
- [ ] Route groups have consistent, non-conflicting prefixes
- [ ] Route caching works without errors (`php artisan route:cache`)
