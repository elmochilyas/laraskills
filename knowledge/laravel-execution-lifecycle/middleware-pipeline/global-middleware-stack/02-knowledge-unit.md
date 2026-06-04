# Global Middleware Stack
## Metadata (Domain: Laravel Execution Lifecycle & Framework Internals, Subdomain: Middleware Pipeline, Last Updated: 2026-06-02)
## Executive Summary
The global middleware stack is the set of middleware classes that run on every HTTP request to a Laravel application, regardless of route, group, or HTTP verb. Defined in `Illuminate\Foundation\Http\Kernel` (or `bootstrap/app.php` in Laravel 11+), these middleware handle cross-cutting infrastructure concerns: trusted proxy configuration, CORS headers, request size limits, and maintenance mode detection. Every request passes through these middleware before any route-specific or group middleware executes.

## Core Concepts
Global middleware is registered in the `$middleware` property of the HTTP Kernel. In Laravel 11+, it is registered via the `->withMiddleware()` method in `bootstrap/app.php`. These middleware wrap all other middleware — they are the outermost layers of the pipeline onion. The default set includes `PreventRequestsDuringMaintenance`, `EncryptCookies`, `AddQueuedCookiesToResponse`, `StartSession`, `ShareErrorsFromSession`, `ValidateCsrfToken`, `SubstituteBindings`, `HandleCors`, `TrustProxies`, and `TrustHosts`. They handle infrastructure concerns that must be present for every request.

## Mental Models
**Security Gate:** Global middleware is the outermost checkpoint. Every visitor must pass through before reaching any route-specific areas. Like airport security — every passenger goes through the same scanners before proceeding to their gate.

**Infrastructure Layer:** Think of global middleware as the plumbing of the building. It runs regardless of which room (route) the request visits. It handles ventilation (CORS), water pressure (request limits), and fire alarms (maintenance mode).

## Internal Mechanics
In `Illuminate\Foundation\Http\Kernel`, the `$middleware` property holds an array of class strings. When the kernel handles a request, it merges global middleware with route middleware into a combined pipeline. The `sendRequestThroughPipeline()` method instantiates `Illuminate\Pipeline\Pipeline`, calls `send($request)`, `through($this->middleware)`, and `then($this->dispatchToRouter())`. In Laravel 11, `bootstrap/app.php` returns an `Application` instance, and middleware is configured via the `withMiddleware()` method that returns a `Middleware` config object.

```php
// Laravel 11 bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(TrustProxies::class);
})
```

## Patterns
- **Global Filter:** All requests pass through the same filter set before reaching any route.
- **Layer Supertype:** Global middleware defines the base processing context that all requests share.
- **Decorator:** Each global middleware decorates the request/response without the route knowing about it.

## Architectural Decisions
The decision to keep global middleware separate from route/group middleware was deliberate: infrastructure concerns (maintenance mode, trusted proxies) must never be bypassed by route configuration. `EncryptCookies` and `StartSession` are global because the session and encrypted cookies are fundamental to the framework's operation across all routes. `SubstituteBindings` is global by default to ensure route model binding works everywhere.

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Every request gets essential infrastructure | Global middleware runs on routes that may not need it | Performance overhead on API-only applications |
| Secure by default (CSRF protection is global) | All routes must handle CSRF tokens unless explicitly excluded | Developers must remember to exclude webhook routes |
| Predictable execution order | Hard to modify globally without affecting all routes | Priority array must manage ordering conflicts |

## Performance Considerations
The default global stack includes session-starting middleware which performs file/redis I/O on every request. For stateless API applications, consider moving session and cookie middleware from global to the `api` middleware group. Each global middleware adds pipeline resolution overhead.

## Production Considerations
Carefully consider which middleware is truly global. Adding a heavy middleware to the global stack affects 100% of traffic. Use `php artisan optimize` to cache middleware configuration. A bug in global middleware takes down the entire application.

## Common Mistakes
**Why it happens:** Developers add custom middleware to the global stack without considering route-specificity. **Why it's harmful:** Unnecessary middleware runs on API routes, health checks, and webhooks, slowing down critical paths. **Better approach:** Add middleware to route groups or individual routes unless it truly applies to every request.

## Failure Modes
- **Missing TrustProxies:** Behind a load balancer, all IPs resolve to the proxy IP, breaking rate limiting and logging.
- **PreventRequestsDuringMaintenance failure:** The application becomes inaccessible even during maintenance mode.
- **EncryptCookies failure:** Encrypted cookies cannot be decrypted, causing session loss.

## Ecosystem Usage
- **Forge/Envoyer:** Deploy scripts rely on `php artisan down` which activates `PreventRequestsDuringMaintenance`.
- **Laravel Vapor:** TrustProxies is critical for correct IP detection behind AWS CloudFront.
- **Laravel Sanctum:** SPA authentication relies on session and cookie middleware being globally available.

## Related Knowledge Units
### Prerequisites
- Pipeline Pattern Fundamentals (onion model and pipe chaining)
- Kernel Architecture (HTTP kernel request handling flow)

### Related Topics
- Middleware Groups (named middleware collections applied to route files)
- Default Middleware Members (individual middleware class responsibilities)

### Advanced Follow-up Topics
- Middleware Configuration in Bootstrap (Laravel 11+ centralized config)
- TrustProxies Deep Dive (proxy header handling internals)
- Boot Order Timing (when global middleware is assembled relative to kernel boot)

## Research Notes
**Source Analysis:** `Illuminate\Foundation\Http\Kernel::$middleware` (vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php).
**Key Insight:** Global middleware is analogous to Java Servlet Filters or ASP.NET Core Middleware — the outermost pipeline wrapping the application.
**Version-Specific Notes:** Laravel 11 moved middleware configuration from Kernel properties to `bootstrap/app.php` using the `Middleware` config object.
