# Global Middleware Stack

## Metadata
- **ID:** ku-06-global-middleware
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **Last Updated:** 2026-06-02

## Overview
The global middleware stack is the set of middleware classes that run on every HTTP request, regardless of route, group, or HTTP verb. Defined in `Illuminate\Foundation\Http\Kernel` (or `bootstrap/app.php` in Laravel 11+), these middleware handle cross-cutting infrastructure concerns: trusted proxy configuration, CORS headers, request size limits, and maintenance mode detection. Every request passes through these middleware before any route-specific or group middleware executes.

## Core Concepts
- **Registration**: Global middleware is registered in the `$middleware` property of the HTTP Kernel (Laravel <11) or via `->withMiddleware()` in `bootstrap/app.php` (Laravel 11+).
- **Outermost Layer**: Global middleware wraps all other middleware — they are the first to handle the request and the last to process the response.
- **Default Set**: `PreventRequestsDuringMaintenance`, `EncryptCookies`, `AddQueuedCookiesToResponse`, `StartSession`, `ShareErrorsFromSession`, `ValidateCsrfToken`, `SubstituteBindings`, `HandleCors`, `TrustProxies`, `TrustHosts`, `ValidatePostSize`, `TrimStrings`, `ConvertEmptyStringsToNull`.
- **Non-Bypassable**: Global middleware cannot be bypassed by route configuration — infrastructure concerns must apply everywhere.

## When To Use
- **Infrastructure concerns**: Middleware that must apply to every request (maintenance mode, trusted proxies, CORS).
- **Security defaults**: CSRF protection, encryption, session initialization.
- **Request normalization**: Trimming strings, converting empty strings to null.
- **Any middleware that should never be skippable**: Infrastructure that protects the application integrity.

## When NOT To Use
- **Route-specific logic**: If middleware only applies to certain routes, use group or route middleware.
- **Performance-sensitive endpoints**: Adding heavy middleware to the global stack affects 100% of traffic.
- **API-only applications**: Session and cookie middleware are unnecessary for stateless APIs — move them to the `web` group.
- **Health check endpoints**: Consider excluding health check routes from global middleware that may fail (e.g., database-dependent middleware).

## Best Practices (WHY)
- **Audit global middleware before production**: The default stack includes session middleware which performs file/Redis I/O on every request. API-only apps should remove session middleware from global. *Why: Unnecessary middleware on every request wastes resources — global middleware affects 100% of traffic.*
- **Add middleware at the most specific level possible**: Route > group > global. Ask "does every single request need this?" before adding to global. *Why: Global middleware runs on health checks, webhooks, and API routes that may not need it — increasing latency and resource usage.*
- **Use `php artisan route:list -v` to verify per-route middleware**: This shows the full resolved stack including global, group, and route middleware. *Why: Developers often don't realize which global middleware is running on their routes — this command makes it visible.*
- **Keep global middleware order predictable**: The order in `$middleware` determines execution order. Infrastructure middleware (trust proxies, maintenance mode) should be first. *Why: Trust proxies must run before any middleware that inspects the request IP; maintenance mode must block before any processing.*

## Architecture Guidelines
- **Global vs group vs route**: Laravel provides three levels of middleware granularity. Global handles infrastructure, groups handle contextual concerns (session for web, throttling for API), routes handle endpoint-specific logic.
- **Predictable execution order**: Global middleware runs first, then groups, then route middleware. Priority can reorder across boundaries.
- **Default set is ordered**: `EncryptCookies` runs before `StartSession` because session IDs are stored in encrypted cookies.

## Performance
- **Default global stack**: Includes session-starting middleware which performs I/O on every request.
- **API optimization**: For stateless APIs, move session and cookie middleware from global to the `api` group.
- **Middleware resolution overhead**: Each global middleware adds pipeline resolution overhead (~0.1-0.5ms).
- **Bug in global middleware**: Takes down the entire application — affects 100% of traffic.

## Security
- **Missing TrustProxies**: Behind a load balancer, all IPs resolve to the proxy IP — breaks rate limiting, logging, and geo-location.
- **PreventRequestsDuringMaintenance failure**: Application becomes inaccessible even during maintenance mode.
- **EncryptCookies failure**: Encrypted cookies cannot be decrypted — causes session loss for all users.
- **CSRF protection is global by default**: All routes must handle CSRF tokens unless explicitly excluded — important for webhook routes.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Adding custom middleware to global unnecessarily | Not considering route-specificity | Unnecessary middleware runs on API routes, health checks | Use route groups or individual routes |
| Removing default global middleware without understanding | Assuming it's optional | Breaks session-based auth, CSRF protection | Add custom middleware instead of removing defaults |
| Heavy middleware in global stack | Placing DB-dependent middleware globally | Health check failures if DB is down | Keep global stack lightweight |
| Not ordering global middleware correctly | Trust proxies after IP-dependent middleware | Wrong IP resolution | Order infrastructure first |

## Anti-Patterns
- **Global stack as dumping ground**: Adding every new middleware to the global stack because "it's needed somewhere." Becomes impossible to remove later.
- **Ignoring the API group**: Adding session middleware to global when API routes don't need it. Creates unnecessary session I/O overhead.
- **Middleware that depends on services that may be down**: Adding database-dependent middleware to global — health checks fail when DB is down.
- **No route:list verification**: Assuming global middleware composition without verifying with `route:list -v`.

## Examples

```php
// Laravel 10: Kernel $middleware property
protected $middleware = [
    \Illuminate\Http\Middleware\TrustProxies::class,
    \Illuminate\Http\Middleware\HandleCors::class,
    \Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance::class,
    \Illuminate\Http\Middleware\ValidatePostSize::class,
    \App\Http\Middleware\TrimStrings::class,
    \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
];

// Laravel 11+: bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(\App\Http\Middleware\TrustProxies::class);
    $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
    // Remove session from global for API-only app
    $middleware->remove(\Illuminate\Session\Middleware\StartSession::class);
})
```

## Related Topics
- **Pipeline Pattern Fundamentals**: Onion model and pipe chaining.
- **Middleware Groups**: Named middleware collections applied to route files.
- **Default Middleware Members**: Individual middleware class responsibilities.
- **Middleware Configuration in Bootstrap**: Laravel 11+ centralized config.
- **Kernel Architecture**: HTTP kernel request handling flow.

## AI Agent Notes
- Global middleware is analogous to Java Servlet Filters or ASP.NET Core Middleware — the outermost pipeline wrapping the application.
- Laravel 11 moved middleware configuration from Kernel properties to `bootstrap/app.php` using the `Middleware` config object.
- The default set is carefully ordered: `EncryptCookies` before `StartSession` because session IDs are stored in encrypted cookies.
- `php artisan optimize` caches middleware configuration.

## Verification
- [ ] List all default global middleware and understand each one's purpose
- [ ] Run `php artisan route:list -v` and identify global middleware on a sample route
- [ ] Add custom global middleware and verify it runs on every route
- [ ] Remove a global middleware and verify the effect (e.g., remove session middleware, test auth)
- [ ] For an API-only app, move session/cookie middleware from global to api group
- [ ] Verify maintenance mode middleware blocks all requests
