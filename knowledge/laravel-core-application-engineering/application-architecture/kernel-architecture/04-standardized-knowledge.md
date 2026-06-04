# Kernel Architecture

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Application Architecture & Structure
- **Knowledge Unit:** Kernel Architecture
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02
- **ECC Phase:** 4

---

## Overview

Laravel has two kernel classes — `App\Http\Kernel` (HTTP kernel) and `App\Console\Kernel` (Console/Artisan kernel) — that orchestrate the request lifecycle for HTTP and CLI entry points. The HTTP kernel receives an incoming request, bootstraps the application, routes the request through a middleware pipeline, dispatches to the matched handler, and returns a response. The Console kernel handles Artisan commands and scheduled tasks. In Laravel 11+, kernel responsibilities have been partially absorbed into `bootstrap/app.php` with fluent configuration methods (`withMiddleware`, `withRouting`, `withExceptions`), changing how middleware, bootstrappers, and exceptions are customized.

---

## Core Concepts

1. **HTTP Kernel Request Lifecycle** — `index.php` calls `$kernel->handle($request)`, which wraps execution in a try block, runs bootstrappers via `sendRequestThroughRouter()`, sends the request through the middleware pipeline (global → group → route), dispatches to the matched route's handler, and returns the response. After response sending, `$kernel->terminate()` is called for post-response cleanup.

2. **Middleware Pipeline Construction** — The kernel collects global middleware, group middleware (web/api), and route middleware in priority order via `gatherMiddleware()`. In Laravel 10-, this order is defined in Kernel class properties (`$middleware`, `$middlewareGroups`, `$routeMiddleware`, `$middlewarePriority`). In Laravel 11+, it's defined via `->withMiddleware()` fluent API.

3. **Kernel Bootstrap Sequence** — `$this->bootstrap()` runs bootstrappers in order via `$app->bootstrapWith()`: `LoadConfiguration` → `HandleExceptions` → `RegisterFacades` → `RegisterProviders` → `BootProviders`. The `bootstrap/app.php` file configures which bootstrappers run.

4. **Console Kernel Lifecycle** — Artisan resolves the console kernel, creates an `InputBag` from command arguments, runs application bootstrappers (same sequence minus middleware), resolves the command by name, executes its `handle()` method, and returns the exit code.

5. **Laravel 10- Kernel Class** — All middleware registration and bootstrapper configuration lives in `app/Http/Kernel.php` and `app/Console/Kernel.php`. Properties define global middleware, middleware groups, route middleware aliases, and middleware priority.

6. **Laravel 11+ Fluent API** — Middleware registration moves to `bootstrap/app.php` with `->withMiddleware()` accepting a closure. Exception handling moves to `->withExceptions()`. Route loading moves to `->withRouting()`. The kernel class remains but its configuration surface is reduced.

---

## When To Use

- **Middleware registration** — Add global, group, and route middleware via Kernel class (10-) or `withMiddleware()` fluent API (11+)
- **Middleware priority configuration** — Define execution order for middleware from different groups
- **Console command registration** — Register Artisan commands and define the task schedule
- **Scheduled task definition** — Define cron-like scheduled tasks in the Console kernel's `schedule()` method
- **Custom kernel behavior** — Override kernel methods for specialized request handling (API-only kernels, multi-tenant dispatch)

---

## When NOT To Use

- **Business logic** — Do NOT put business logic in kernel classes; the kernel orchestrates infrastructure, not application behavior
- **Service registration** — Do NOT register container bindings in the kernel; use service providers
- **Route definitions** — Do NOT define routes in kernel files; use dedicated route files (`routes/web.php`, `routes/api.php`)
- **Complex middleware implementation** — Do not implement middleware logic inside the kernel; create dedicated middleware classes

---

## Best Practices (WHY)

1. **Enable all caches in production** — `php artisan config:cache`, `php artisan route:cache`, and `php artisan event:cache` eliminate bootstrap steps that the kernel would otherwise perform on every request. Without caching, every request re-registers all routes and re-processes all config files.

2. **Keep middleware priority explicit** — In Laravel 10-, define `$middlewarePriority` explicitly rather than relying on registration order. In Laravel 11+, use `->priority()` on the middleware fluent API. Explicit priority ensures deterministic execution order regardless of Laravel version changes.

3. **Use middleware groups, not individual application** — Register middleware in groups (web, api) rather than applying them to individual routes. Group registration makes middleware visible in one place, consistent across routes, and easier to audit.

4. **Keep the console schedule lean** — Scheduled tasks should use `->withoutOverlapping()` for long-running tasks to prevent resource contention. Monitor schedule execution times and adjust intervals as tasks grow slower.

5. **Remove unused middleware** — Every middleware in the global stack runs on every request. Remove framework defaults that your application does not need (e.g., `EncryptCookies` for API-only applications).

6. **Validate middleware order after upgrades** — Laravel version upgrades can change the framework's default middleware priority. After upgrading, verify that custom middleware runs at the correct position relative to framework middleware.

---

## Architecture Guidelines

### Middleware Pipeline Order

```
Inbound request
  ↓
Global middleware ($middleware) — runs on all routes
  ↓
Group middleware (web/api group) — runs on grouped routes
  ↓
Route middleware (per-route) — runs on individual routes
  ↓
Controller/Handler
  ↑
Route middleware (outbound pass)
  ↑
Group middleware (outbound pass)
  ↑
Global middleware (outbound pass)
  ↑
Response
```

### Laravel 10- vs 11+ Registration

| Concern | Laravel 10- | Laravel 11+ |
|---|---|---|
| Middleware registration | Kernel class properties (`$middleware`, `$middlewareGroups`, `$routeMiddleware`) | Fluent API in `bootstrap/app.php` (`->withMiddleware()`) |
| Exception handling | Handler class (`app/Exceptions/Handler`) | `->withExceptions()` closure |
| Route loading | `RouteServiceProvider` | `->withRouting()` fluent API |
| File location | `app/Http/Kernel.php`, `app/Exceptions/Handler.php` | `bootstrap/app.php` |
| Version upgrade | Modify class properties | Modify fluent API calls |

### Console Kernel Schedule Best Practices

| Pattern | Method | When |
|---|---|---|
| Prevent overlap | `->withoutOverlapping()` | Long-running tasks (>schedule interval) |
| Run on one server | `->onOneServer()` | Multi-server deployments |
| Maintenance mode | `->evenInMaintenance()` | Critical tasks that must run during maintenance |
| Task output | `->emailOutputTo()` | Monitoring and debugging |
| Background | `->runInBackground()` | Tasks that should not delay the schedule |

---

## Performance

- Kernel bootstrap accounts for ~10-30ms per request (without caching)
- Route caching (`route:cache`) eliminates route registration from bootstrap
- Config caching (`config:cache`) eliminates configuration loading
- Event caching (`event:cache`) eliminates event registration
- In production with all caches enabled, bootstrap overhead is minimized to middleware pipeline construction and provider booting
- The middleware pipeline itself adds ~0.1-0.5ms per middleware (negligible for most applications)

---

## Security

- Middleware registered in the kernel (especially global middleware) defines the application's security perimeter — authentication, encryption, CORS, and rate limiting all run through the kernel pipeline
- Middleware priority determines the order of security checks: authentication before authorization, session before CSRF protection
- In Laravel 11+, `withMiddleware()` configuration is in `bootstrap/app.php`, which is harder to accidentally misconfigure than class properties
- The console kernel's `--force` flag bypasses maintenance mode — restrict its use in production scripts
- Validate that `withoutMiddleware()` is never used in production — it removes security middleware from individual routes

---

## Common Mistakes

### Middleware Duplication
- **Description:** Registering the same middleware in both global `$middleware` and group `$middlewareGroups`
- **Cause:** Copying middleware between registration lists without checking for duplicates
- **Consequence:** The middleware runs twice on every request in that group
- **Better:** Check middleware lists carefully; a middleware should appear in exactly one registration point

### Forgetting Route Caching in Production
- **Description:** Running `php artisan serve` for production or deploying without `route:cache`
- **Cause:** Assuming development setup is production-ready
- **Consequence:** The kernel re-registers all routes on every request, increasing bootstrap time
- **Better:** Use a production web server (Nginx, Forge) and run `php artisan route:cache` in the deploy script

### Console Command Not Registered
- **Description:** A command class exists in `app/Console/Commands/` but is not discoverable
- **Cause:** Not registering the command in `$commands` array and not using auto-discovery (or command is in a subdirectory not scanned by auto-discovery)
- **Consequence:** `php artisan command:name` returns "Command not found"
- **Better:** Register commands in `$commands` property or ensure auto-discovery covers the directory

### Bootstrap Exception in Kernel
- **Description:** An exception thrown during kernel bootstrapping, before middleware runs
- **Cause:** Error in a bootstrapper or service provider boot method
- **Consequence:** The exception handler may not be bootstrapped yet, resulting in a generic PHP error (white screen, no HTTP response)
- **Better:** Keep bootstrap logic minimal and well-tested; use try/catch in service provider boot methods

---

## Anti-Patterns

- **Fat Kernel** — Adding business logic, complex commands, or container configuration to the kernel. The kernel should only orchestrate the request lifecycle; service providers handle container config, controllers handle HTTP logic, commands handle CLI logic.
- **Middleware in Kernel Class** — Implementing middleware logic directly inside the kernel class instead of creating dedicated middleware classes. Every new middleware should be its own class.
- **Schedule Overload** — Defining dozens of scheduled tasks in the console kernel without monitoring execution times. Tasks pile up, causing resource contention and missed intervals. Consolidate related tasks.
- **Ignoring Framework Upgrade Changes** — Assuming kernel middleware priority stays the same across Laravel versions. Each major version may reorder or rename middleware. Always review middleware configuration after upgrading.

---

## Examples

### HTTP Kernel (Laravel 10-)
```php
// app/Http/Kernel.php
class Kernel extends HttpKernel
{
    protected $middleware = [
        \App\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\HandleCors::class,
    ];

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

    protected $routeMiddleware = [
        'auth' => \App\Http\Middleware\Authenticate::class,
        'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
    ];

    protected $middlewarePriority = [
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Session\Middleware\StartSession::class,
    ];
}
```

### Middleware Registration (Laravel 11+)
```php
// bootstrap/app.php
return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(TrustProxies::class);
        $middleware->web(append: [
            EnsureUserIsActive::class,
        ]);
        $middleware->api(prepend: [
            'throttle:60,1',
        ]);
        $middleware->alias([
            'role' => CheckUserRole::class,
        ]);
        $middleware->priority([
            EncryptCookies::class,
            StartSession::class,
        ]);
    })
    ->create();
```

### Console Kernel Schedule
```php
// app/Console/Kernel.php
class Kernel extends ConsoleKernel
{
    protected $commands = [
        \App\Console\Commands\GenerateReports::class,
    ];

    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('reports:generate')
            ->dailyAt('02:00')
            ->withoutOverlapping()
            ->onOneServer()
            ->emailOutputTo('admin@example.com');
    }
}
```

---

## Related Topics

- **Bootstrapping Lifecycle** — what happens during kernel boot before middleware runs
- **Middleware Lifecycle** — the pipeline the kernel constructs and processes
- **Application Class** — how the kernel integrates with and is resolved from the Application
- **Service Provider Strategies** — providers booted by the kernel during bootstrap
- **Route Definition** — dispatched by the kernel after middleware pipeline completes
- **Maintenance Mode** — kernel middleware that checks for maintenance mode

---

## AI Agent Notes

- HTTP Kernel extends `Illuminate\Foundation\Http\Kernel`; Console Kernel extends `Illuminate\Foundation\Console\Kernel`
- Middleware registration moved from Kernel class to `bootstrap/app.php` in Laravel 11+
- The kernel's `terminate()` method is called AFTER the response is sent to the browser — used for post-response cleanup
- In Laravel 11+, middleware can be removed per route via `$middleware->remove()` fluent method
- Console kernel supports maintenance mode bypass via `--force` flag
- When asked about kernel configuration, always ask which Laravel version (10- vs 11+) first
- Route caching and config caching are assumed in production; suggest them in any deployment discussion
- Default recommendation: use `bootstrap/app.php` fluent API for Laravel 11+, Kernel class properties for 10-

---

## Verification

- [ ] Can describe the full HTTP request lifecycle from `index.php` to response
- [ ] Understands the difference between Laravel 10- and 11+ kernel configuration
- [ ] Can configure middleware at global, group, and route levels
- [ ] Knows how middleware priority affects execution order
- [ ] Can define and register console commands and scheduled tasks
- [ ] Understands the kernel's role in bootstrapping the application
- [ ] Can identify and fix common mistakes (middleware duplication, missing route cache)
- [ ] Knows the performance implications of caching on kernel bootstrap
