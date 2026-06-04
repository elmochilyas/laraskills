# Middleware Groups

## Metadata
- **ID:** ku-07-route-middleware-groups
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **Last Updated:** 2026-06-02

## Overview
Middleware groups allow developers to assign a named set of middleware to multiple routes without repeating the list. Laravel ships with two default groups — `web` and `api` — which are automatically applied to routes registered in `routes/web.php` and `routes/api.php`. Custom groups can be defined in `bootstrap/app.php`. Groups streamline middleware management by grouping middleware that logically belong together, such as all session-related middleware under the `web` group.

## Core Concepts
- **Group Definition**: An array of middleware class strings assigned to a group name (e.g., `'web' => ['EncryptCookies', ...]`).
- **Route-to-Group Mapping**: Route files are assigned to groups via `RouteServiceProvider` or `routes()` in `bootstrap/app.php`.
- **Nested Groups**: Groups can contain other group names (prefixed with group name) — recursively expanded at runtime.
- **Runtime Expansion**: Groups are expanded into a flat array of middleware classes before pipeline execution.
- **Default Groups**: `web` (session, cookies, CSRF, bindings) and `api` (throttling, bindings).

## When To Use
- **Grouping related middleware**: Session + cookies + CSRF naturally belong together in a `web` group.
- **Route file separation**: Routes in `routes/web.php` get `web` group automatically; `routes/api.php` gets `api`.
- **Custom route groups**: Admin panels, multi-tenant sites, SPA routes — create custom groups.
- **Reusing middleware sets across many routes**: Instead of listing middleware on each route, define a group.

## When NOT To Use
- **Single route exceptions**: Use route-level middleware for one-off middleware on specific routes.
- **Global middleware**: Infrastructure concerns (maintenance mode, trusted proxies) belong in global stack.
- **Over-grouping**: Creating too many groups makes the middleware configuration harder to reason about.

## Best Practices (WHY)
- **Keep default groups intact**: Adding middleware to `web` affects every route in `routes/web.php`. Create custom groups instead. *Why: Modifying default groups has broad, often unexpected impact — custom groups make the intent explicit.*
- **Use `php artisan route:list -v` to verify group expansion**: See exactly which middleware runs on each route from group definitions. *Why: Groups hide middleware behind a name — `route:list -v` reveals the full resolved list.*
- **Place `web` routes in `routes/web.php`, `api` routes in `routes/api.php`**: The file → group mapping is convention-based. Wrong file = wrong middleware. *Why: API routes in `routes/web.php` get session/cookie overhead and CSRF protection — causing 419 errors on POST requests.*
- **Create custom groups for distinct route types**: Admin panel, SPA, public API, internal microservice — each can have its own group. *Why: Different route types have different middleware needs; groups encapsulate those differences cleanly.*

## Architecture Guidelines
- **Two-group default**: Reflects the two dominant Laravel application types — stateful web and stateless API.
- **`web` group includes full session state**: Session, cookies, CSRF for traditional web apps.
- **`api` group excludes session**: Stateless operation via token auth.
- **Group-to-route mapping**: Configured in `RouteServiceProvider` or `bootstrap/app.php`.

## Performance
- **Group expansion**: Happens once per request during route matching. With route caching, serialized expanded list eliminates runtime expansion.
- **Overhead per group**: Minimal — array merge and recursive expansion.
- **Custom groups**: Each additional group adds marginally more memory for middleware list storage.

## Security
- **Wrong group assignment**: API routes placed in `routes/web.php` get CSRF protection — all POST requests return 419 errors.
- **Undefined group name**: Laravel throws `InvalidArgumentException` when group name not in `$middlewareGroups`.
- **Circular group nesting**: Recursive group expansion can cause infinite loops (prevented by framework checks).
- **Hidden middleware**: Groups can obscure which middleware actually runs — audit with `route:list -v`.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Placing API routes in routes/web.php | Not understanding file → group mapping | CSRF errors on POST; session overhead | Always use routes/api.php for API routes |
| Adding middleware to default groups | Convenience | Affects all routes in that group unexpectedly | Create custom group for custom needs |
| Over-grouping | Too many groups | Harder to reason about middleware configuration | Keep groups aligned with route types |
| Forgetting group name registration | Typo in group name reference | InvalidArgumentException | Use constants or config for group names |

## Anti-Patterns
- **Group as catch-all**: Adding every middleware to the `web` group instead of using global or route-level appropriately.
- **Nested group spaghetti**: Deeply nested groups referencing other groups. Makes expansion order unpredictable.
- **Modifying default groups for custom behavior**: Adding admin-specific middleware to the `web` group instead of creating an `admin` group.
- **Relying on group expansion order**: Assuming middleware within a group runs in a specific order that may be overridden by priority.

## Examples

```php
// Laravel 10: Kernel $middlewareGroups property
protected $middlewareGroups = [
    'web' => [
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \App\Http\Middleware\VerifyCsrfToken::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],
    'api' => [
        'throttle:api',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],
];

// Laravel 11+: bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->group('admin', [
        'auth',
        'verified',
        \App\Http\Middleware\LogAdminActions::class,
    ]);
})

// Route file assignment (Laravel 11+, bootstrap/app.php)
->withRouting(
    web: __DIR__ . '/../routes/web.php',
    api: __DIR__ . '/../routes/api.php',
    commands: __DIR__ . '/../routes/console.php',
)
```

## Related Topics
- **Pipeline Pattern Fundamentals**: Pipe chaining and execution order.
- **Global Middleware Stack**: Outermost middleware layer.
- **Route Middleware**: Individual route middleware assignment.
- **Default Middleware Members**: Contents of web/api groups.
- **Middleware Configuration in Bootstrap**: Laravel 11+ group definitions.

## AI Agent Notes
- The `web` and `api` groups map directly to the two most common application architectures — stateful and stateless.
- Laravel 11 moved group definitions to `bootstrap/app.php` using the `Middleware` configuration object.
- Groups can be nested — a group entry starting with a group name recursively expands.
- The `gatherRouteMiddleware()` method on the router merges group middleware and route middleware into a single ordered list.

## Verification
- [ ] List the default middleware in `web` and `api` groups
- [ ] Create a custom `admin` group with auth, verified, and custom middleware
- [ ] Verify `route:list -v` shows expanded group middleware on routes
- [ ] Place an API route in `routes/web.php` — observe CSRF errors
- [ ] Move it to `routes/api.php` — verify errors resolved
- [ ] Test nested groups — create group that references another group
