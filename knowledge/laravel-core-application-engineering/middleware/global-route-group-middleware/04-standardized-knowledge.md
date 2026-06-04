# ECC Standardized Knowledge — Global, Route Group, and Route Middleware

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Middleware System |
| **Knowledge Unit** | Global, Route Group, and Route Middleware |
| **Difficulty** | Intermediate |
| **Category** | HTTP Pipeline — Middleware |
| **Last Updated** | 2026-06-02 |

---

## Overview

Laravel provides three tiers of middleware registration — global, route group, and route-level — each with different scope and execution timing. Global middleware runs on every HTTP request before routing. Route group middleware runs on all routes within a group. Route-level middleware runs on individual routes after they are matched. These tiers form a hierarchy of scope from application-wide (global) to route-specific (individual).

The engineering significance of the three-tier architecture is that it enables middleware to be applied at the appropriate level of granularity. Infrastructure concerns (trusted proxies, CORS) belong globally. Session and CSRF concerns belong to the `web` group. Specific auth and throttle configurations belong at the route level. Using the wrong tier causes either unnecessary middleware execution or missing middleware execution.

---

## Core Concepts

### The Three Tiers

- **Global**: Every HTTP request. Registration via `$middleware->append()` (Laravel 11+) or `$middleware` array (Laravel 10-). Execution before routing.
- **Group**: Routes in a group. Registration via `$middleware->group('name', [...])` (Laravel 11+) or `$middlewareGroups` array (Laravel 10-). Execution after routing, merged with route/controller middleware.
- **Route**: Individual route. Registration via `->middleware('auth')` on route definition. Execution after routing, merged with group/controller middleware.

### Execution Order

All three tiers are merged into a single pipeline: route middleware ∪ group middleware ∪ controller middleware → aliases resolved → withoutMiddleware applied → sorted by priority → executed as single pipeline. The merging is additive — there is no mechanism to remove middleware inherited from a group (except `withoutMiddleware` which only works on named route middleware, not group or global).

### Default Groups

The `web` group (used by `routes/web.php`) includes EncryptCookies, AddQueuedCookiesToResponse, StartSession, ShareErrorsFromSession, ValidateCsrfToken, and SubstituteBindings. The `api` group (used by `routes/api.php`) includes EnsureFrontendRequestsAreStateful (Sanctum, if installed), throttle:api, and SubstituteBindings.

### Additive-Only Constraint

Middleware registration is additive-only at every level. Global middleware accumulates with group middleware, which accumulates with route middleware. There is no "subtract" operator — once middleware is registered at a higher scope, it cannot be removed at a lower scope.

---

## When To Use

- **Global middleware** for trusted proxies, CORS, maintenance mode, input sanitization, request ID generation — concerns that affect every request and must run before routing.
- **Group middleware** for session management, CSRF, authentication required for a route group, admin-specific middleware — concerns shared by a collection of routes.
- **Route middleware** for per-endpoint auth guard selection, specific rate limits, authorization checks, parameterized middleware — concerns that differ per route.
- **Group-as-domain pattern** for defining custom middleware groups for distinct application domains (admin, api:v2, webhooks).

---

## When NOT To Use

- Do NOT register middleware that needs route context (matched route, parameters) as global — it runs before routing and cannot access route data.
- Do NOT apply the `web` group to API routes — session middleware adds unnecessary overhead to stateless API calls.
- Do NOT use `withoutMiddleware()` to exclude global middleware — it only works on named route middleware, not global.
- Do NOT deeply nest route groups — three levels of nested groups can result in a route inheriting 15+ middleware items with no single source of truth.

---

## Best Practices (WHY)

- **Register middleware at the most restrictive tier possible.** If a concern applies to a specific route, register it at the route level. If it applies to a group, register it at the group level. Only use global for truly application-wide concerns. This prevents unnecessary middleware execution and keeps route definitions precise.
- **Use group modification (Laravel 11+) instead of full group replacement.** `$middleware->web(append: [...])` adds to the default web group without redefining it. Full replacement with `$middleware->group('web', [...])` requires including all default middleware explicitly.
- **Document custom group contents.** Every custom middleware group should be documented. Developers need to know which middleware runs on which routes. A table listing each group and its middleware is essential for team onboarding.
- **Test middleware at each tier.** Global middleware should be tested on all routes (including 404 fallback). Group middleware should be tested on routes in the group and verified absent outside the group. Route middleware should be tested per route.

---

## Architecture Guidelines

- **Global middleware registration (Laravel 11+):** `$middleware->append(...)`, `$middleware->prepend(...)`, `$middleware->use([...])` for full replacement.
- **Global middleware registration (Laravel 10-):** `protected $middleware = [...]` array.
- **Group registration (Laravel 11+):** `$middleware->group('name', [...])`, `$middleware->web(append: [...])`, `$middleware->api(remove: [...])`.
- **Group registration (Laravel 10-):** `protected $middlewareGroups = ['name' => [...]]` array.
- **Route middleware assignment:** `Route::get('/url', ...)->middleware('auth')->middleware('can:update')` — multiple calls append.
- **Nested group middleware:** Inner groups inherit middleware from all ancestor groups. Outermost group first, innermost last.
- **withoutMiddleware behavior:** Only excludes middleware registered as a named route alias or FQCN. Does NOT exclude global middleware.
- **Package registration:** Use `$router->aliasMiddleware()` and `$router->middlewareGroup()` in service providers for cross-version compatibility.

---

## Performance

Global middleware runs on every request, including static assets served through Laravel and health check endpoints. A global middleware that starts a session or queries the database adds overhead to each request. The `web` group includes session middleware — applying it to API routes adds unnecessary cookie encryption, session start, and CSRF protection overhead. The `api` group omits session and cookie middleware for performance.

---

## Security

The additive-only constraint is a safety feature — once middleware is registered at a higher scope, it always runs. This prevents routes from accidentally bypassing security middleware inherited from a group. `withoutMiddleware` only works on named route middleware, not global or group middleware — global security middleware (like maintenance mode) cannot be bypassed. The priority system ensures that security-critical middleware from different tiers runs in the correct order regardless of registration order.

---

## Common Mistakes

- **Adding session middleware to API routes.** Applying the `web` group (including session middleware) to API routes adds overhead and potential session conflicts. API routes should use the `api` group or a custom stateless group.
- **Removing CSRF for API routes at the global level.** Removing CSRF from the `web` group globally affects all routes. Use `withoutMiddleware` on specific API routes instead.
- **Assigning global middleware that needs route context.** A middleware checking the authenticated user's role needs route data. Registered globally, it cannot access what it needs.
- **Forgetting to add middleware to a new route group.** A new route file is registered without applying the correct middleware group. Routes run without authentication or other protections.
- **Nested group middleware proliferation.** Three levels of nested groups each adding middleware results in a route inheriting 15+ items with no single source of truth.

---

## Anti-Patterns

- **Global middleware for application concerns.** Registering auth, throttle, or locale detection as global middleware when they only apply to specific route groups. Every request (including API and health checks) runs unnecessary middleware.
- **Deep nested middleware groups.** Three or more levels of nested groups each appending middleware. The route's effective middleware list is the concatenation of all ancestors — hard to determine and reason about.
- **Using withoutMiddleware to exclude global middleware.** `withoutMiddleware` does not work on global middleware. The workaround is moving the middleware from global to a selectively applied group.
- **Group middleware applied outside the closure.** A route registered after the group closure closing brace does not receive the group's middleware. Middleware is applied by closure scope, not file position.

---

## Examples

### Three-Tier Registration (Laravel 11+)
```php
->withMiddleware(function (Middleware $middleware) {
    // Global: runs on every request
    $middleware->append(\App\Http\Middleware\RequestId::class);

    // Groups: runs on routes in the group
    $middleware->group('admin', [
        'auth', 'verified', 'can:access-admin',
    ]);

    // Group modification: add to existing groups
    $middleware->web(append: [
        \App\Http\Middleware\SetLocale::class,
    ]);
});

// Route-level: runs on individual routes
Route::get('/profile', [ProfileController::class, 'show'])
    ->middleware('auth');

Route::post('/profile', [ProfileController::class, 'update'])
    ->middleware(['auth', 'verified', 'throttle:10,1']);
```

### Three-Tier Registration (Laravel 10-)
```php
class Kernel extends HttpKernel
{
    protected $middleware = [
        \App\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\HandleCors::class,
    ];

    protected $middlewareGroups = [
        'web' => [ /* session, CSRF, bindings */ ],
        'api' => [ 'throttle:api', 'substitute' ],
        'admin' => [ 'auth', 'verified', 'can:access-admin' ],
    ];

    protected $routeMiddleware = [
        'auth' => \Illuminate\Auth\Middleware\Authenticate::class,
        'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
    ];
}
```

---

## Related Topics

- **Middleware Fundamentals** (prerequisite) — understanding the Pipeline pattern and two-pass execution.
- **Middleware Lifecycle** (prerequisite) — how middleware execution flows through global and route pipelines.
- **Route Definition** (prerequisite) — how routes are defined and grouped.
- **Controller Middleware** — the controller-level registration mechanisms.
- **Middleware Ordering and Priority** — how middleware from different tiers is sorted.
- **Laravel 11 vs 10 Registration** — the API differences for middleware registration.
- **Custom Middleware** — creating middleware for registration at any tier.
- **Parameterized Middleware** — middleware that accepts configuration parameters.
- **Cross-Cutting Concerns** — deciding which tier to use for which concern.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Middleware Lifecycle (prerequisite). Serves as prerequisite for middleware-ordering-priority, laravel-11-vs-10-registration.
- **Three tiers:** Global (every request, before routing) → Group (route collections, after routing) → Route (individual routes, after routing).
- **Additive-only constraint:** Once middleware is registered at a higher scope, it cannot be removed at a lower scope. This is a safety feature.
- **withoutMiddleware does not exclude global middleware.** Only works on named route middleware or FQCN.
- **Default groups:** `web` = stateful (cookies, session), `api` = stateless (no cookies, no session, rate-limited).
- **Laravel 11+ group modification** (`$middleware->web(append: [...])`) replaced the Laravel 10- pattern of redefining the entire array.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| Three tiers clearly distinguished | ✓ |
| When to use / when NOT to use each tier | ✓ |
| Best practices with rationale | ✓ |
| Default groups documented | ✓ |
| Additive-only constraint explained | ✓ |
| Performance analysis | ✓ |
| Security considerations | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples | ✓ |
| Related topics mapped | ✓ |
