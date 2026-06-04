# Application Builder Configuration

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Application Bootstrap |
| Knowledge Unit | Application Builder Configuration |
| Difficulty | Intermediate |
| Lifecycle Phase | Construction |
| Framework Version | Laravel 11+ |
| Last Updated | 2026-06-02 |

## Overview
Introduced as a first-class API in Laravel 11, the `ApplicationBuilder` provides a fluent, chainable configuration surface as an alternative to modifying `bootstrap/app.php` with manual kernel swaps or config file edits. It wraps the `Application` instance and exposes domain-specific methods — `withRouting()`, `withMiddleware()`, `withExceptions()`, `withBroadcasting()`, `withEvents()`, `withCommands()`, `withProviders()`, `withSingletons()`, `withScopedSingletons()`, `withBindings()` — along with lifecycle hooks `booting()` and `booted()`. Each method mutates the underlying Application's bindings or registers deferred callbacks that execute at the appropriate lifecycle phase. The builder eliminates the fragile practice of kernel binding overwrites that plagued pre-Laravel 11 bootstrap files.

## Core Concepts
- **Fluent Configuration API** — Every `with*()` method returns `$this`, enabling chaining. Methods either register a callback (`$this->app->callAfterResolving(...)`, `$this->app->booting(...)`) or directly set a binding/alias.
- **Method Categories** — Kernel configuration (`withRouting()`, `withMiddleware()`, `withExceptions()`), service registration (`withProviders()`, `withEvents()`, `withBroadcasting()`, `withCommands()`), container manipulation (`withSingletons()`, `withScopedSingletons()`, `withBindings()`), lifecycle hooks (`booting()`, `booted()`).
- **Configurator Object Pattern** — Methods like `withMiddleware()` and `withExceptions()` return dedicated configuration objects (`MiddlewareConfigurator`, `ExceptionsConfigurator`) that are passed to the kernel or exception handler.
- **Deferred Execution** — Most configuration is queued as lifecycle callbacks, not executed eagerly, permitting declarative intent without worrying about execution order.
- **create() Method** — Called at the end of the chain; returns the configured Application without triggering bootstrappers.

## When To Use
- Configuring routing, middleware, and exception handling in Laravel 11+ applications
- Registering custom Artisan commands, broadcasting channels, or event discovery paths
- Pre-configuring container bindings (singletons, scoped singletons, bindings) at bootstrap time
- Adding lifecycle hooks (`booting()`, `booted()`) that must run during application initialization

## When NOT To Use
- Adding application business logic inside builder closures — closures capture scope and persist in Octane
- Configuring services that depend on environment variables before `LoadEnvironmentVariables` runs
- Calling `withMiddleware()` or `withExceptions()` in environment-specific blocks that depend on resolved services
- Using `withSingletons()` for bindings that need to be re-resolved per request (use `scoped()` instead)

## Best Practices
- **Call `withRouting()` before `withMiddleware()`** if middleware configuration depends on route configuration — the builder does not enforce ordering.
- **Use conditional logic with `$app->runningInConsole()`** inside `bootstrap/app.php` for environment-specific builder configuration.
- **Keep `withSingletons()` lean** — only register bindings that genuinely need cross-request persistence; prefer service provider registration for complex bindings.
- **Avoid capturing request-scoped variables** in `booting()` or `booted()` closures — these persist across requests in Octane and cause memory leaks.
- WHY: The builder runs during construction, before any request handling. Deferred callbacks capture the scope at registration time, not execution time.

## Architecture Guidelines
- The builder wraps a fresh Application instance created via `Application::configure()` — it never modifies an externally-provided instance.
- Deferred callbacks registered via `booting()` and `afterResolving()` are stored in SplObjectStorage or arrays; the memory cost scales with the number of `with*()` calls.
- Configurator objects (`RoutingConfigurator`, `MiddlewareConfigurator`, `ExceptionsConfigurator`) are themselves fluent builders, creating a "builder of builders" hierarchy.
- All `with*()` methods are compile-time configuration tools, not runtime ones — they run before any request handling begins.

## Performance Considerations
- Builder overhead: ~0.2ms per request (FPM) or per worker (Octane) for method chaining and configurator object creation.
- Deferred callbacks add memory proportional to the number of `with*()` calls — negligible for typical ~5-10 method chains.
- Configurator objects are serialized into the container; in Octane they persist across requests — ensure no request-scoped state is captured.
- Builder-configured routes, middleware, and exceptions are cached by `php artisan optimize` and `php artisan route:cache`.

## Security Considerations
- Builder closures that capture secrets (API keys, passwords) in `booting()` or `booted()` preserve those secrets in memory across all Octane requests.
- `withExceptions()` configurator captures exception handling callbacks — ensure these do not leak sensitive information in error responses.
- The `MiddlewareConfigurator` accepts middleware classes and parameters — validate that all registered middleware is trusted and properly namespaced.
- Environment-specific builder branches using `$app->environment()` can accidentally expose configuration environments if the environment name check is misspelled.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Calling `withSingletons()` with keys already bound by providers | Registration order race | Last binding wins; unpredictable behavior | Register shared bindings solely in one place (builder or provider) |
| Expecting `withRouting()` to load routes | Confusing configuration with execution | Routes not loaded — errors on first request | Understand routes load during `RouteServiceProvider::boot()`, not during builder chain |
| Capturing `$request` in `booting()` closure | Convenience copy-paste | Memory leak in Octane — closure persists across requests | Use middleware or request-scoped lifecycle hooks instead |
| Using `withMiddleware()` after kernel already instantiated | Assuming order independence | Middleware config not applied to kernel | Ensure `withMiddleware()` is called before kernel resolution |
| Forgetting `->create()` at end of chain | Missing chain termination | Builder returned instead of Application — type error | Always terminate the builder chain with `->create()` |

## Anti-Patterns
- **Business logic in bootstrap** — Adding validation, API calls, or heavy computation inside builder closures or `bootstrap/app.php`.
- **Global state in builder closures** — Modifying global variables or static properties inside `with*()` callbacks.
- **Duplicate registration** — Using both `withSingletons()` and a service provider to register the same binding, causing race conditions.
- **Over-chaining** — Calling every `with*()` method even when not needed; builder chains should be minimal and explicit.

## Examples

### Standard Builder Chain (Laravel 11+)
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->dontReport([
            \Illuminate\Auth\AuthenticationException::class,
        ]);
    })
    ->withCommands([
        \App\Console\Commands\ProcessReports::class,
    ])
    ->withSingletons([
        \App\Services\PaymentGateway::class => \App\Services\StripeGateway::class,
    ])
    ->withBindings([
        \App\Contracts\Reporting::class => \App\Services\ReportService::class,
    ])
    ->booting(function ($app) {
        // Runs during the booting lifecycle phase
    })
    ->create();
```

### Conditional Builder Configuration
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
    )
    ->withMiddleware()
    ->withExceptions()
    ->when(\Illuminate\Foundation\Application::runningInConsole(), function ($builder) {
        return $builder->withCommands([
            \App\Console\Commands\ProcessReports::class,
        ]);
    })
    ->create();
```

## Related Topics
- **Prerequisites:** Application Class Construction, Service Container Fundamentals
- **Closely Related:** Bootstrap App PHP File, Bootstrapper Sequence, Kernel Architecture
- **Advanced:** Middleware Configuration in Bootstrap, Deferred Provider Loading Timing
- **Cross-Domain:** Route Registration, Exception Handling Configuration

## AI Agent Notes
The `ApplicationBuilder` is a compile-time configuration tool — all `with*()` methods run during application construction, before any request handling. This is fundamentally different from runtime configuration (e.g., middleware groups in `App\Http\Kernel`). The builder uses deferred execution: most methods register callbacks via `$app->afterResolving()` or `$app->booting()` rather than executing immediately. The `create()` method at approximately line 180 calls `$this->app->booting(...)` for each deferred callback, then returns `$this->app`. Configurator objects are serialized/bound into the container and later injected into kernel constructors via container resolution.

## Verification
- [ ] Builder chain terminates with `->create()` returning an Application instance
- [ ] `withRouting()` configures route file paths but does not load routes
- [ ] `withMiddleware()` configures global middleware stack
- [ ] `withExceptions()` configures exception handling callbacks
- [ ] `withSingletons()` binds entries as true singletons in the container
- [ ] `booting()` callback executes during the bootstrapper sequence
- [ ] No request-scoped variables are captured in builder closures (Octane safety)
- [ ] Builder configuration is serializable (no resource handles in closures)
