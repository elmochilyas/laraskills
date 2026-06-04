# Middleware Groups
## Metadata (Domain: Laravel Execution Lifecycle & Framework Internals, Subdomain: Middleware Pipeline, Last Updated: 2026-06-02)
## Executive Summary
Middleware groups allow developers to assign a named set of middleware to multiple routes without repeating the list. Laravel ships with two default groups — `web` and `api` — which are automatically applied to routes registered in `routes/web.php` and `routes/api.php` respectively. Custom groups can be defined in `bootstrap/app.php`. Groups streamline middleware management by grouping middleware that logically belong together, such as all session-related middleware under the `web` group.

## Core Concepts
A middleware group is an array of middleware class strings assigned to a group name (e.g., `'web' => ['EncryptCookies', ...]`). Route files are assigned to groups via the `RouteServiceProvider` or the `routes()` method in `bootstrap/app.php`. Groups support nesting and can contain other group names via the `$middlewareGroups` array. In Laravel 11, group definitions happen in `bootstrap/app.php` using the `->withMiddleware()` callback. Groups are expanded at runtime into a flat array of middleware classes before pipeline execution.

## Mental Models
**Tool Belt:** Each group is a tool belt with a specific set of tools (middleware). The `web` belt carries session, cookie, and CSRF tools for traditional web apps. The `api` belt is leaner — just rate limiting and API auth tools.

**Route Neighborhood:** Routes are houses on streets (route files). The `web` street has all houses equipped with cookie/session infrastructure. The `api` street has houses without cookies but with throttling.

## Internal Mechanics
In `Illuminate\Foundation\Http\Kernel`, the `$middlewareGroups` property defines groups. When the kernel builds the pipeline for a request, it reads the route's assigned groups and expands each group name into its constituent middleware array. Groups can be nested — a group entry starting with a group name recursively expands. The `gatherRouteMiddleware()` method on the router merges group middleware and route middleware into a single ordered list before pipeline execution, then applies `$middlewarePriority` sorting.

```php
// In Laravel <11, Kernel property:
protected $middlewareGroups = [
    'web' => [
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Session\Middleware\StartSession::class,
    ],
    'api' => [
        'throttle:api',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],
];
```

## Patterns
- **Grouping Pattern:** Logically related middleware is packed into named groups.
- **Convention over Configuration:** Default groups (`web`, `api`) pre-configure common middleware stacks.
- **Composite:** A group name acts as a composite representing multiple middleware classes.

## Architectural Decisions
The two-group default (`web`/`api`) reflects the two dominant Laravel application types. The `web` group includes full session state; the `api` group excludes session middleware for stateless operation. Stateless API routes automatically avoid session overhead. Custom groups support single-page applications, admin panels, and multi-tenant configurations.

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Centralized middleware management | Group definitions are far from route definitions | Developers must check bootstrap/app.php to understand per-route middleware |
| Groups can be reused across many routes | Group expansion happens at runtime (cached with route cache) | Minimal performance impact |
| Concise route registration | Over-grouping can mask unnecessary middleware on specific routes | Debugging becomes harder when many middleware are hidden behind group names |

## Performance Considerations
Group expansion happens once per request during route matching. With `php artisan route:cache`, the expanded group list is serialized, eliminating runtime expansion overhead. Custom groups with many middleware may marginally increase memory usage.

## Production Considerations
Use route caching in production to freeze group assignments. Be careful when modifying default groups — adding middleware to the `web` group affects every route in `routes/web.php`. Consider creating custom groups for features like "admin" rather than altering defaults.

## Common Mistakes
**Why it happens:** Developers don't understand that `web` routes automatically include session middleware. **Why it's harmful:** API routes accidentally placed in `routes/web.php` get cookie/session overhead and CSRF protection. **Better approach:** Always use `routes/api.php` for API routes; create custom groups for non-standard needs.

## Failure Modes
- **Undefined group name:** Laravel throws `InvalidArgumentException` when a group name is not in `$middlewareGroups`.
- **Circular group nesting:** Recursive group expansion causes infinite loops (prevented by framework checks).
- **Group applied to wrong route file:** Misconfigured RouteServiceProvider or bootstrap/app.php.

## Ecosystem Usage
- **Laravel Breeze & Jetstream:** Both use the `web` group for all their routes, relying on session/auth middleware.
- **Laravel Sanctum:** Adds middleware to the `api` group for SPA authentication.
- **Laravel Nova:** Registers its own middleware group for admin panel routes.

## Related Knowledge Units
### Prerequisites
- Pipeline Pattern Fundamentals (pipe chaining and execution order)
- Global Middleware Stack (outermost middleware layer)
- Kernel Architecture (how groups map to route files)

### Related Topics
- Route Middleware (individual route middleware assignment)
- Default Middleware Members (contents of web/api groups)

### Advanced Follow-up Topics
- Middleware Configuration in Bootstrap (Laravel 11+ group definitions)
- Middleware Priority (group-vs-route middleware ordering)
- Application Bootstrap (route-to-group mapping in RouteServiceProvider)

## Research Notes
**Source Analysis:** `Illuminate\Foundation\Http\Kernel::$middlewareGroups` (vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php).
**Key Insight:** The `web` and `api` groups map directly to the two most common application architectures — stateful and stateless.
**Version-Specific Notes:** Laravel 11 moved group definitions to `bootstrap/app.php` using the `Middleware` configuration object.
