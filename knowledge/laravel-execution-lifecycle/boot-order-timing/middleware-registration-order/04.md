# ku-06: Middleware Registration Order

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **KU:** ku-06-middleware-registration-order
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Middleware registration order defines the sequence in which global, group, and route-specific middleware execute during request processing. The order is determined by the `$middleware`, `$middlewareGroups`, `$routeMiddleware`, and `$middlewarePriority` properties on the HTTP Kernel. Understanding this order is essential for correct request handling — middleware that modifies the request must run before middleware that consumes the request.

## Core Concepts
- **Global middleware**: `$middleware` array on the HTTP Kernel — runs on every request in the defined order.
- **Middleware groups**: `$middlewareGroups` (e.g., `web`, `api`) — applied to routes assigned to the group. Group members run after global middleware.
- **Route middleware**: Route-specific middleware applied to individual routes — runs within the group pipeline.
- **Middleware priority**: `$middlewarePriority` array — determines the order when middleware from different sources (global, groups, route) would otherwise conflict.
- **Three-phase pipeline**: Request passes through global middleware first, then the matched group's middleware, then route-specific middleware.

## When To Use
- Registering custom middleware for specific route groups (web, api) or globally.
- Controlling the execution order when middleware has dependencies on each other.
- Adding middleware aliases for convenient route assignment.
- Overriding middleware priority when a framework-provided order is incorrect for your application.

## When NOT To Use
- Do not reorder framework-provided middleware arbitrarily — the default order is designed for correct framework operation.
- Do not register middleware in the wrong group — CORS middleware should not be in the `web` group (runs after session start).
- Do not use global middleware for route-specific concerns — register route middleware instead to avoid unnecessary overhead.

## Best Practices (WHY)
- **Least-privilege middleware placement**: Only add middleware globally if it must run on every route. Route-specific middleware should be applied per-route or per-group.
- **Order by dependency**: If Middleware A modifies the request and Middleware B reads it, A must run before B.
- **Use middleware aliases**: Short aliases (e.g., `'auth'`, `'throttle'`) make route definitions cleaner and reduce repetition.
- **Leverage middleware groups**: Group related middleware (web or api) and assign groups to route files rather than applying middleware per-route.

## Architecture Guidelines
- Global middleware in `$middleware` runs first (top of array runs first).
- Group middleware runs in the order listed in `$middlewareGroups`.
- Route middleware runs after group middleware, in the order specified in the route definition.
- `$middlewarePriority` resolves ordering conflicts when middleware from different categories intersect.
- In Laravel 11+, middleware is configured via `bootstrap/app.php` using the ApplicationBuilder's `withMiddleware()` method.

## Performance
- Each middleware adds ~10-50µs per request for middleware resolution and execution.
- Global middleware runs on EVERY request — keep this list minimal.
- Route middleware runs only on matched routes — use route-specific middleware for expensive operations.
- Middleware that makes external calls (API authentication, rate limiting) dominates request time.

## Security
- Auth middleware must run before any middleware that exposes user data.
- CORS middleware should run early (before auth) to return proper headers on preflight OPTIONS requests.
- CSRF protection (`VerifyCsrfToken`) must run after session start and before any state-modifying controller.
- Rate limiting middleware should wrap auth to prevent unauthenticated requests from consuming rate limits.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Wrong group assignment | Auth-required middleware in `api` group without auth | Forgetting that API routes need separate auth | Unauthenticated access to API endpoints | Add `auth:api` middleware to routes or group |
| Reverse priority | Middleware runs in wrong order | Not understanding array order vs execution order | First middleware listed runs first — opposite of nested expectations | Draw the pipeline order before configuring |
| Over-globalization | All middleware registered globally | Convenience during development | Every request pays for unnecessary middleware | Audit global middleware; move route-specific ones |
| Forgetting substitute bindings | Route model binding doesn't work | Route registered middleware runs before `SubstituteBindings` | Model binding fail in middleware | Ensure `SubstituteBindings` runs after auth but before custom middleware that uses models |

## Anti-Patterns
- **Monolithic global middleware**: 20+ global middleware entries — move group-specific and route-specific middleware out.
- **Priority abuse**: Relying on `$middlewarePriority` to fix ordering that should be correct by group assignment.
- **Dead middleware**: Route middleware that's defined but never used — remove it.

## Examples
```php
// Laravel 11+ (bootstrap/app.php)
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(LogRequestDuration::class);

    $middleware->web(prepend: [
        EnsureUserIsActive::class,
    ]);

    $middleware->alias([
        'check.role' => CheckUserRole::class,
        'throttle.api' => ThrottleRequests::class,
    ]);

    $middleware->priority([
        \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
    ]);
})
```

## Related Topics
- Bootstrapper Sequence — where middleware registration fits in the boot pipeline
- HTTP Kernel Internals — how the kernel manages middleware stacks
- Route Registration (ku-07) — how routes reference middleware aliases
- Middleware Pipeline — the Pipeline class that executes middleware

## AI Agent Notes
- The middleware execution order is: global → group → route-specific middleware.
- `SubstituteBindings` middleware runs model binding — custom middleware that uses models must run AFTER this.
- In Laravel 11+, the `$middleware`, `$middlewareGroups`, and `$routeMiddleware` properties moved to `bootstrap/app.php`.
- For debugging middleware order, add logging middleware at different positions in the pipeline.

## Verification
- [ ] Global middleware list is minimal and necessary for all routes
- [ ] Group middleware order respects dependency direction
- [ ] Route-specific middleware is not accidentally registered globally
- [ ] `SubstituteBindings` runs before any middleware that uses route model binding
- [ ] Middleware aliases are documented and consistently used
