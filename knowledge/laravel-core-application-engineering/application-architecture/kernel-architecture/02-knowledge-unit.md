# Kernel Architecture

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Application Architecture & Structure
- **Knowledge Unit:** Kernel Architecture
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Laravel has two kernel classes — `App\Http\Kernel` (HTTP kernel) and `App\Console\Kernel` (Console/Artisan kernel) — that orchestrate the request lifecycle for HTTP and CLI entry points respectively. The kernel receives an incoming request, bootstraps the application, routes the request through middleware, dispatches to the appropriate handler, and returns a response.

The engineering significance is understanding the kernel as the application's entry point coordinator. Every HTTP request and every Artisan command passes through its kernel. The kernel determines middleware stack, bootstrapper sequence, and exception handling behavior. In Laravel 11+, the kernel's responsibilities have been absorbed into `bootstrap/app.php` with fluent configuration, changing how middleware and bootstrappers are customized.

---

## Core Concepts

### HTTP Kernel

```php
// Laravel 10-: app/Http/Kernel.php
class Kernel extends HttpKernel
{
    protected $middleware = [];            // Global middleware
    protected $middlewareGroups = [];       // Named groups (web, api)
    protected $routeMiddleware = [];        // Named aliases
    protected $middlewarePriority = [];     // Execution order
}
```

The HTTP kernel handles incoming HTTP requests through a pipeline of middleware, then dispatches to the matched route's handler (controller or closure).

```php
// Laravel 11+: bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        EnsureUserIsActive::class,
    ]);
    $middleware->api(prepend: [
        EnsureApiKeyIsValid::class,
    ]);
    $middleware->alias([
        'role' => CheckUserRole::class,
    ]);
})
```

### Console Kernel

```php
// app/Console/Kernel.php
class Kernel extends ConsoleKernel
{
    protected $commands = [];  // Command registrations

    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('inspire')->hourly();
    }
}
```

The console kernel handles Artisan commands and scheduled tasks. It boots the application, resolves the command from the input, executes it, and returns the exit code.

---

## Mental Models

### The Request Funnel

The HTTP kernel is a funnel: the request enters wide (global middleware), narrows through route middleware, reaches the controller (the narrowest point), then expands back through middleware in reverse as the response travels outward. The funnel shape represents the pipeline architecture.

### The Entry Point Gate

Both kernels are the gate through which every request (HTTP or CLI) must pass. Nothing bypasses the kernel — it controls what middleware runs, what bootstrappers fire, and how the application prepares for each request type.

---

## Internal Mechanics

### HTTP Kernel Request Lifecycle

1. `public/index.php` calls `$kernel->handle($request)`
2. `handle()` wraps execution in a `try` block and calls `sendRequestThroughRouter()`
3. `sendRequestThroughRouter()` runs bootstrappers via `$this->bootstrap()`
4. Bootstrappers (in order): `LoadConfiguration`, `HandleExceptions`, `RegisterFacades`, `RegisterProviders`, `BootProviders`
5. After bootstrapping, the request is sent through the middleware pipeline via `Pipeline`
6. The pipeline dispatches to the matched route's handler
7. The handler returns a response
8. The response travels back through the middleware pipeline (outbound pass)
9. `handle()` returns the response to `index.php`
10. `$kernel->terminate($request, $response)` is called for post-response cleanup

### Middleware Pipeline Construction

```php
// Illuminate\Foundation\Http\Kernel
protected function sendRequestThroughRouter($request)
{
    return $this->app->instance('request', $request)
        ->pipeThrough($this->app->make(MiddlewarePipeline::class)
            ->send($request)
            ->through($this->gatherMiddleware())
            ->then($this->dispatchToRouter()));
}
```

The `gatherMiddleware()` method collects global middleware, group middleware (web/api), and route middleware in priority order. In Laravel 10-, this order is defined in the Kernel class properties. In Laravel 11+, it's defined via `withMiddleware()` fluent API.

### Console Kernel Lifecycle

1. Artisan command or schedule triggers the console kernel
2. `handle()` creates an `InputBag` from command arguments
3. Application bootstrappers run (same as HTTP kernel, minus middleware)
4. Command is resolved by name from the Artisan application instance
5. Command's `handle()` method is called
6. Exit code is returned

---

## Patterns

### Middleware Registration (Laravel 10-)

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
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
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
        \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
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
            'subscription' => EnsureActiveSubscription::class,
        ]);
        $middleware->priority([
            HandlePrecognitiveRequests::class,
            EncryptCookies::class,
            StartSession::class,
        ]);
    })
    ->create();
```

### Console Command Registration

```php
// app/Console/Kernel.php
class Kernel extends ConsoleKernel
{
    protected $commands = [
        \App\Console\Commands\GenerateReports::class,
        \App\Console\Commands\CleanupOldRecords::class,
    ];

    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('reports:generate')->dailyAt('02:00');
        $schedule->command('cleanup:old-records')->weekly();
    }
}
```

---

## Architectural Decisions

### Kernel Customization (Laravel 10- vs 11+)

| Concern | Laravel 10- | Laravel 11+ |
|---|---|---|
| Middleware registration | Kernel class properties | Fluent API in bootstrap/app.php |
| Exception handling | Handler class | withExceptions() closure |
| Route loading | RouteServiceProvider | withRouting() fluent API |
| File location | app/Http/Kernel.php | bootstrap/app.php |
| Version upgrade | Modify class | Modify fluent API |

### Middleware Priority Configuration

| Concern | With Priority | Without Priority |
|---|---|---|
| Execution order | Deterministic | Registration-order dependent |
| Framework updates | May need adjustment | Stable |
| Debugging | Predictable | May vary across Laravel versions |
| Maintenance | Additional config | Simpler |

---

## Tradeoffs

| Concern | Kernel Class (10-) | Fluent API (11+) |
|---|---|---|
| Migration effort | None | Requires rewrites for upgrade |
| IDE support | Full (standard class) | Partial (closure in bootstrap) |
| Customization flexibility | Extends framework class | Constrained by fluent API |
| Code organization | Dedicated file | Shared bootstrap file |
| Testability | Extensible for testing | Closure mocking needed |

---

## Performance Considerations

The kernel's bootstrap process accounts for ~10-30ms of every request. Route caching (`php artisan route:cache`) eliminates route registration from bootstrap. Config caching (`php artisan config:cache`) eliminates configuration loading. Event caching (`php artisan event:cache`) eliminates event registration. In production with all caches enabled, bootstrap overhead is minimized to middleware pipeline construction and provider booting.

---

## Production Considerations

- Enable all caches in production: `config:cache`, `route:cache`, `event:cache`
- Keep middleware priority explicit in Laravel 10- and use `->priority()` in Laravel 11+
- Validate middleware order with `php artisan route:list -v` to see applied middleware per route
- Remove unused middleware from the kernel to reduce bootstrap overhead
- Use middleware groups for logical grouping (web, api) rather than applying middleware to individual routes
- Keep the console kernel's schedule lean — use `->withoutOverlapping()` for long-running tasks
- Monitor kernel bootstrap time as part of application performance tracking

---

## Common Mistakes

### Middleware Duplication

Registering the same middleware in `$middleware` (global) and `$middlewareGroups` (group). It runs twice. Check middleware lists carefully when extending or modifying.

### Forgetting Route Caching in Production

Running `php artisan serve` for production (which does not use route caching). The kernel re-registers all routes on every request. Use a production web server (Nginx, Forge) with route caching enabled.

### Console Command Not Registered

A command class exists in `app/Console/Commands/` but is not listed in the kernel's `$commands` array or does not use auto-discovery. Running `php artisan command:name` returns "Command not found."

---

## Failure Modes

### Middleware Order Breakage After Upgrade

Upgrading Laravel changes the framework's default middleware priority. Custom middleware registered in the kernel may run in a different order than expected, causing authentication failures or session issues. Always review middleware priority after major version upgrades.

### Bootstrap Exception in Kernel

An exception thrown during kernel bootstrapping (before middleware runs) prevents the entire application from responding. The exception handler may not be bootstrapped yet, resulting in a generic PHP error. Keep bootstrap logic minimal and well-tested.

### Schedule Overlap

A console kernel scheduled task runs longer than the schedule interval. The next execution starts before the previous one finishes, causing resource contention. Use `->withoutOverlapping()` for all long-running scheduled tasks.

---

## Ecosystem Usage

Laravel's own kernel implementations in `Illuminate\Foundation\Http\Kernel` and `Illuminate\Foundation\Console\Kernel` are the reference architecture — every Laravel project's kernel extends these. Laravel Forge generates optimized server configurations that work with the kernel's bootstrap lifecycle. Laravel Vapor uses a custom kernel wrapper for serverless HTTP handling.

Horizon registers its own console commands via the kernel's command registration. Telescope hooks into the kernel's middleware pipeline for request monitoring. Nova extends the kernel's middleware stack with its own authentication and authorization middleware. Third-party packages like `spatie/laravel-permission` add middleware aliases through the kernel's `$routeMiddleware` property or the `->alias()` fluent method.

---

## Related Knowledge Units

- **Bootstrapping Lifecycle** (this workspace) — what happens during kernel boot
- **Middleware Lifecycle** (this workspace) — the pipeline the kernel constructs
- **Application Class** (this workspace) — how the kernel integrates with the Application
- **Service Provider Strategies** (this workspace) — providers booted by the kernel
- **Route Definition** (this workspace) — dispatched by the kernel after middleware

---

## Research Notes

- HTTP Kernel extends `Illuminate\Foundation\Http\Kernel`; Console Kernel extends `Illuminate\Foundation\Console\Kernel`
- Middleware registration moved from Kernel class to `bootstrap/app.php` in Laravel 11+
- `middlewarePriority` in Laravel 10- controls run order of middleware from different groups
- `$this->bootstrap()` calls bootstrappers in defined order, skipping already-called bootstrappers
- Console kernel schedules use `Illuminate\Console\Scheduling\Schedule` with fluent cron-like API
- Command auto-discovery in `app/Console/Commands/` works since Laravel 8 without explicit registration
- The kernel's `terminate()` method is called AFTER the response is sent to the browser — used for post-response cleanup
- In Laravel 11+, middleware can be excluded per route via `$middleware->remove()` fluent method
- Console kernel supports maintenance mode bypass via `--force` flag
