# Phase 5: Rules — Global, Route Group, and Route Middleware

---

## Rule Name

Register Middleware at the Most Restrictive Tier

---

## Category

Code Organization

---

## Rule

Choose the most restrictive registration tier that covers all required routes. Use global only for infrastructure concerns that must run before routing (trusted proxies, CORS, maintenance mode). Use group middleware for concerns shared by a route collection (session, CSRF, locale). Use route middleware for per-endpoint concerns (guard selection, rate limits, authorization). Never register at a broader tier than necessary.

---

## Reason

Global middleware runs on every request, including health checks, static assets, and OPTIONS preflight. A globally registered concern that only applies to API routes wastes resources on web routes. The most-restrictive-tier rule minimizes the performance surface of each middleware concern and documents the concern's scope in the registration itself.

---

## Bad Example

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(ForceJsonMiddleware::class); // Global — affects web routes too
});
```

---

## Good Example

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(RequestIdMiddleware::class); // Global — applies everywhere

    $middleware->api(append: [ForceJsonMiddleware::class]); // Group — API only
});
```

---

## Exceptions

Infrastructure concerns (TrustedProxies, HandleCors, PreventRequestsDuringMaintenance) must be global because they affect request interpretation before routing. These have no restrictive-tier alternative.

---

## Consequences Of Violation

Performance risks: every request pays the cost of unnecessary middleware. Scalability risks: globally registered database-querying middleware adds load to every endpoint. Maintenance risks: broad registration obscures which middleware actually applies to a given route.

---

---

## Rule Name

Never Remove Middleware from a Higher Tier at a Lower Tier

---

## Category

Architecture

---

## Rule

Accept that middleware registration is additive-only. Middleware registered at the global level always runs. Middleware inherited from a group always runs on routes in that group. Do not attempt to exclude global or group middleware using `withoutMiddleware()` — it only works on named route middleware. If middleware must be selectively excluded, register it at a lower tier instead.

---

## Reason

The additive-only constraint is a deliberate safety feature that prevents routes from accidentally bypassing security middleware inherited from a higher tier. Attempting to bypass this constraint (e.g., by removing CSRF from the web group globally instead of excluding specific routes) creates security risks. Understanding and working with the additive constraint leads to a more secure and predictable pipeline.

---

## Bad Example

```php
->withMiddleware(function (Middleware $middleware) {
    // Removing CSRF globally because one route needs it disabled — affects all routes
    $middleware->web(remove: [ValidateCsrfToken::class]);
});
```

---

## Good Example

```php
// Route-level exclusion — only affects this route
Route::post('/webhook', [WebhookController::class, 'handle'])
    ->withoutMiddleware([ValidateCsrfToken::class]);
```

---

## Exceptions

When migrating middleware from a higher to a lower tier (e.g., moving a middleware from global to a specific group), the middleware can be removed from the higher tier and added to the lower tier as a single change.

---

## Consequences Of Violation

Security risks: removing global security middleware exposes all routes to bypass. Maintenance risks: workarounds for the additive constraint (e.g., conditionals inside middleware) create hidden complexity. Operational risks: `withoutMiddleware()` silently does nothing on global middleware, leading developers to believe it is excluded when it is not.

---

---

## Rule Name

Use Group Modification Instead of Full Group Replacement

---

## Category

Maintainability

---

## Rule

When modifying default middleware groups (web, api) in Laravel 11+, use the modification methods `$middleware->web(append: [...])`, `$middleware->api(prepend: [...])`, or `$middleware->web(remove: [...])`. Never use `$middleware->group('web', [...])` to redefine the entire group unless you intend to override all default middleware.

---

## Reason

Full group replacement with `$middleware->group('web', [...])` requires listing every default middleware explicitly. If a future Laravel upgrade adds a new middleware to the default `web` group (e.g., a new security middleware), applications using full replacement will not receive it. Modification methods (`append`, `prepend`, `remove`) preserve the default group contents while making targeted changes.

---

## Bad Example

```php
->withMiddleware(function (Middleware $middleware) {
    // Full replacement — omits any future default middleware
    $middleware->group('web', [
        EncryptCookies::class,
        StartSession::class,
        SubstituteBindings::class,
        SetLocale::class, // Custom addition
    ]);
    // CSRF, ShareErrorsFromSession, QueuedCookies are missing
});
```

---

## Good Example

```php
->withMiddleware(function (Middleware $middleware) {
    // Modification — preserves all defaults, adds custom middleware
    $middleware->web(append: [
        SetLocale::class,
    ]);
});
```

---

## Exceptions

Full replacement is acceptable when the application intentionally removes default middleware and the team has explicitly documented which defaults were removed and why. This decision must be reviewed whenever upgrading Laravel.

---

## Consequences Of Violation

Security risks: omitting default middleware (CSRF, session) during full replacement creates security vulnerabilities. Maintenance risks: upgrading Laravel requires comparing the new default groups with the full replacement to identify missing middleware.

---

---

## Rule Name

Document Every Custom Middleware Group

---

## Category

Maintainability

---

## Rule

Every custom middleware group must be documented with a table listing all middleware in the group, the purpose of each middleware, and which route files use the group. Include this documentation in a project README or a dedicated middleware documentation file.

---

## Reason

Custom groups are the composition mechanism for middleware. Without documentation, developers must read the group definition, trace each middleware class, and infer the group's purpose from usage. This creates onboarding friction and increases the risk of incorrect group application. Explicit documentation makes the middleware stack transparent and auditable.

---

## Bad Example

```php
// No documentation exists. New team members must trace every class.
->withMiddleware(function (Middleware $middleware) {
    $middleware->group('admin-portal', [
        'auth',
        'verified',
        'role:admin',
        SetLocale::class,
        AuditLog::class,
        RequestId::class,
    ]);
});
```

---

## Good Example

```php
/*
 * Group: admin-portal
 * Routes: admin/*, admin/settings/*
 * 
 * auth          — Authenticate (redirect to login if unauthenticated)
 * verified      — Require email verification
 * role:admin    — Check user role is 'admin' (403 if not)
 * SetLocale     — Set locale from user preference (DB query, cached)
 * AuditLog      — Log admin actions (deferred via terminate)
 * RequestId     — Attach X-Request-Id header
 */
->withMiddleware(function (Middleware $middleware) {
    $middleware->group('admin-portal', [
        'auth',
        'verified',
        'role:admin',
        SetLocale::class,
        AuditLog::class,
        RequestId::class,
    ]);
});
```

---

## Exceptions

No common exceptions. Even a single-custom-group application benefits from documentation.

---

## Consequences Of Violation

Maintenance risks: unknown middleware behavior leads to incorrect modifications. Onboarding friction: new developers cannot understand the pipeline without reading every middleware source. Security risks: undocumented middleware may be assumed to protect routes when it does not.

---

---

## Rule Name

Keep Nested Route Groups Flat to Limit Inherited Middleware

---

## Category

Architecture

---

## Rule

Avoid nesting route groups more than two levels deep. At three levels of nesting, a single route inherits middleware from all ancestor groups, creating a merged list that is difficult to determine, reason about, and test.

---

## Reason

Nested group middleware is additive — each ancestor group contributes its middleware to the final merged list. At three levels of nesting, the effective middleware stack is the concatenation of three independent group definitions. A developer modifying the innermost route must trace all three groups to understand which middleware runs. This creates a maintenance burden and increases the risk of incorrect assumptions about which middleware applies.

---

## Bad Example

```php
Route::middleware('api')->group(function () {
    Route::middleware('auth')->group(function () {
        Route::middleware('throttle:admin')->group(function () {
            Route::get('/admin/reports', [ReportController::class, 'index']); // 3 groups deep
        });
    });
});
```

---

## Good Example

```php
// Define the combined group explicitly
->withMiddleware(function (Middleware $middleware) {
    $middleware->group('admin-api', [
        'auth',
        'throttle:admin',
        ForceJson::class,
    ]);
});

// Single flat group
Route::middleware('admin-api')->group(function () {
    Route::get('/admin/reports', [ReportController::class, 'index']);
    Route::get('/admin/stats', [StatsController::class, 'index']);
});
```

---

## Exceptions

Two levels of nesting (e.g., a prefix group wrapping an auth group) are acceptable and common. The rule activates at three or more levels.

---

## Consequences Of Violation

Maintenance risks: changing an ancestor group's middleware affects all nested routes in unexpected ways. Testing risks: the effective middleware stack for deeply nested routes is hard to enumerate. Debugging difficulty: tracing which middleware applies requires examining all nesting levels.

---

---

## Rule Name

Do Not Register Global Middleware That Requires Route Context

---

## Category

Architecture

---

## Rule

Never register middleware that needs route data (matched route, route parameters, resolved bindings) as global middleware. Global middleware runs before routing and cannot access route context. Register route-context-dependent middleware at the group or route level.

---

## Reason

Global middleware executes in the global pipeline, which runs before `Router::dispatch()`. At that point, no route has been matched — `$request->route()` returns null. A middleware that checks route parameters or uses route model bindings will fail with a runtime error or silently produce incorrect results. This is a fundamental architectural constraint of the two-pipeline lifecycle.

---

## Bad Example

```php
->withMiddleware(function (Middleware $middleware) {
    // Global — will fail because route is not yet matched
    $middleware->append(CheckRoleMiddleware::class);
});

class CheckRoleMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $role = $request->route()->parameter('role'); // $request->route() is null!
        // ...
    }
}
```

---

## Good Example

```php
// Route-level — route is matched before this runs
Route::get('/admin', [AdminController::class, 'index'])
    ->middleware('role:admin');
```

---

## Exceptions

Middleware that checks the request path via `$request->path()` or `$request->is()` for path-based routing decisions can be global, since it does not use the matched route object.

---

## Consequences Of Violation

Reliability risks: middleware crashes with a null reference on the route object. Debugging difficulty: the error occurs on every request and may be mistaken for a routing issue. Security risks: middleware intended to protect routes silently fails to execute its check.

---

---

## Rule Name

Do Not Apply the Web Group to API Routes

---

## Category

Performance

---

## Rule

API routes must use the `api` middleware group or a custom stateless group. Never apply the `web` group (which includes session, cookie encryption, and CSRF middleware) to API routes.

---

## Reason

The `web` group includes session middleware (cookie encryption, session start, CSRF token validation) that is unnecessary for stateless API routes. Session middleware adds ~5-20ms per request and consumes server memory. CSRF validation on API routes using token-based auth (Sanctum, Passport, JWT) is redundant. The `api` group is intentionally stateless for performance and correct API behavior.

---

## Bad Example

```php
Route::middleware('web')->group(function () {
    Route::get('/api/user', [UserApiController::class, 'show']);
    // Session and CSRF middleware runs on every API call
});
```

---

## Good Example

```php
Route::middleware('api')->group(function () {
    Route::get('/api/user', [UserApiController::class, 'show']);
    // No session, no CSRF — API routes are stateless
});
```

---

## Exceptions

API routes that require session state (e.g., Sanctum SPA authentication uses the session for CSRF protection) may need selected web group middleware. Apply only the required middleware individually, not the full group.

---

## Consequences Of Violation

Performance risks: every API request pays session and CSRF overhead. Reliability risks: session conflicts between API and web requests cause authentication failures. Scalability risks: stateful sessions prevent horizontal scaling of API servers.
