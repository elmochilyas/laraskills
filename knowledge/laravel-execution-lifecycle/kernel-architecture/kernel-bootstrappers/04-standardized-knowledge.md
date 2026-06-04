# Kernel Bootstrappers Array

## Metadata
- **ID:** ku-05-bootstrappers-array
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Kernel Architecture
- **Last Updated:** 2026-06-02

## Overview
Kernel bootstrappers are the six initialization steps that run once per kernel instance to prepare the Laravel framework for operation. They load environment variables, parse configuration, register error handlers, initialize facades, register all service providers, and boot them. Both the HTTP and Console kernels share the identical bootstrapper array, making this the universal initialization sequence for every Laravel request or command.

## Core Concepts
- **Bootstrapper Interface**: Each implements `Illuminate\Contracts\Foundation\Bootstrapper` with a single `bootstrap(Application $app)` method.
- **Six Core Bootstrappers** (exact order):
  1. `LoadEnvironmentVariables` — Parses `.env` via Dotenv, sets `$_ENV` and `$_SERVER`.
  2. `LoadConfiguration` — Reads `/config/*.php`, merges with environment overrides, caches to `$app['config']`.
  3. `HandleExceptions` — Registers custom error/exception handlers via `set_error_handler`, `set_exception_handler`, `register_shutdown_function`.
  4. `RegisterFacades` — Aliases facade classes to short names via `class_alias()`.
  5. `RegisterProviders` — Calls `$app->register()` for all providers in `config/app.php`.
  6. `BootProviders` — Calls `$app->boot()` which iterates all registered providers and calls `boot()`.
- **Guarded Execution**: `$app->hasBeenBootstrapped()` check prevents re-execution. Once bootstrapped, the flag remains true for the Application instance lifetime.
- **`bootstrapWith()` method**: `Application::bootstrapWith($bootstrappers)` iterates the array: `$this->make($bootstrapper)->bootstrap($this)`.

## When To Use
- **Every request**: Bootstrappers run on every HTTP request and every Artisan command automatically.
- **Custom bootstrappers**: When you need initialization logic that runs before service providers boot (e.g., loading tenant configuration from a database).
- **Testing setup**: When writing integration tests that need the full framework booted.

## When NOT To Use
- **Service provider `register()` or `boot()`**: Use providers for most service initialization. Bootstrappers are for framework-level concerns.
- **Middleware**: Request-specific logic belongs in middleware, not bootstrappers. Bootstrappers run before middleware.
- **Composer autoloader configuration**: The autoloader is loaded before bootstrappers in `public/index.php`.

## Best Practices (WHY)
- **Keep bootstrappers pure and fast**: Each bootstrapper delays the first byte of the response. Config caching eliminates filesystem I/O in `LoadConfiguration`. *Why: Bootstrappers run on every request; their cumulative cost directly impacts Time to First Byte (TTFB).*
- **Never resolve services in bootstrappers that depend on other bootstrappers**: Bootstrappers run in fixed order. `RegisterProviders` must complete before any providers are registered. *Why: Bootstrapper order is rigid — resolving a service before its provider is registered causes resolution failure.*
- **Use config caching in production**: `php artisan config:cache` serializes config into a single file, drastically reducing `LoadConfiguration` overhead. *Why: Without caching, LoadConfiguration reads 30+ files on every request via filesystem I/O.*
- **Defer providers that only bind**: If a provider only registers container bindings, implement `DeferrableProvider` — it won't be booted by `BootProviders`. *Why: Deferred providers reduce bootstrap time by only loading when actually resolved.*

## Architecture Guidelines
- **Bootstrappers are framework-owned**: Defined in `Illuminate\Foundation\Bootstrap`, not in userland. Users can add custom bootstrappers but cannot remove core ones — prevents accidental misconfiguration.
- **Container-resolved**: Bootstrappers are resolved via `$this->make()` (not instantiated directly), enabling dependency injection and override via container bindings.
- **Single-pass sequential**: Laravel chose sequential bootstrapping over event-driven initialization. This simplifies debugging (explicit order) at the cost of rigidity (no hooks between bootstrappers).
- **Before middleware**: Bootstrappers run before any middleware or routing. Configuration, providers, and facades are available to every downstream component.

## Performance
- **Config caching**: Critical in production. Without it, `LoadConfiguration` reads filesystem on every request.
- **Provider booting cost**: `RegisterProviders` + `BootProviders` account for 60-70% of bootstrap time with 30+ providers.
- **Facade alias overhead**: `RegisterFacades` creates 60-80 `class_alias()` calls. Each alias adds autoloader resolution overhead.
- **Environment file parsing**: `.env` is read and parsed on every request unless using server-level environment variables.
- **Bootstrapper optimization**: Laravel 11+ optimized `LoadConfiguration` with pre-computed paths and early binding.

## Security
- **Error handling order**: `HandleExceptions` registers error handlers after config is loaded. If a config file has a parse error, it crashes before error handlers are active — results in uncaught exception with stack trace.
- **Missing .env file**: `LoadEnvironmentVariables` throws if `.env` doesn't exist and `APP_ENV` is not set. This crashes all kernels.
- **Provider boot failure**: `BootProviders` calls all `boot()` methods sequentially. If one throws, subsequent providers are interrupted and state is partially booted.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming bootstrap order is configurable | Thinking custom bootstrappers can be injected between core steps | Custom bootstrappers run before or after entire sequence, not between | Use service providers for initialization that needs specific ordering |
| Forgetting `parent::bootstrap()` | Overriding `bootstrap()` in kernel without calling parent | Full bootstrapper sequence never executes | Always call `parent::bootstrap()` |
| Dependency on bootstrapper state in tests | Mocking Application and skipping bootstrappers | Facades or config not available — code fails | Explicitly set up required state in test setUp() |
| Misunderstanding guarded behavior | Assuming `hasBeenBootstrapped` is global | Multiple Application instances each run bootstrappers independently | Understand it's per-Application instance |

## Anti-Patterns
- **Bootstrapper as service provider**: Putting provider-registration logic in bootstrappers instead of using the proper Service Provider base class.
- **Heavy bootstrapper**: Adding heavy initialization (HTTP calls, complex computations) to a bootstrapper. This delays every request.
- **Custom bootstrapper that duplicates core bootstrapper**: Creating a bootstrapper that loads configuration or environment, duplicating existing framework bootstrappers.
- **Removing core bootstrappers**: Attempting to skip `RegisterFacades` or other bootstrappers to "optimize" — this breaks framework functionality.

## Examples

```php
// Core bootstrapper structure
class LoadConfiguration implements Bootstrapper
{
    public function bootstrap(Application $app): void
    {
        $items = [];
        if (file_exists($cached = $app->getCachedConfigPath())) {
            $items = require $cached;
            $app->instance('config', $repository = new Repository($items));
        } else {
            // Load from /config/*.php files
            $app->instance('config', $repository = new Repository($items));
            $this->loadConfigurationFiles($app, $repository);
        }
        $app->instance('config', $repository);
    }
}

// Custom bootstrapper
class LoadTenantConfig implements Bootstrapper
{
    public function bootstrap(Application $app): void
    {
        $tenantId = $_SERVER['HTTP_X_TENANT_ID'] ?? null;
        if ($tenantId) {
            $config = $app->make('config');
            $tenantSettings = Tenant::find($tenantId)->settings;
            $config->set('app.tenant', $tenantSettings);
        }
    }
}

// Registration in kernel
protected $bootstrappers = [
    \Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables::class,
    \Illuminate\Foundation\Bootstrap\LoadConfiguration::class,
    \App\Bootstrap\LoadTenantConfig::class, // after config loaded
    \Illuminate\Foundation\Bootstrap\HandleExceptions::class,
    \Illuminate\Foundation\Bootstrap\RegisterFacades::class,
    \Illuminate\Foundation\Bootstrap\RegisterProviders::class,
    \Illuminate\Foundation\Bootstrap\BootProviders::class,
];
```

## Related Topics
- **HTTP Kernel Internals**: Where the bootstrapper array is defined and executed.
- **Console Kernel Internals**: Identical bootstrapper sequence in CLI context.
- **Configuration Caching Internals**: How `php artisan config:cache` optimizes `LoadConfiguration`.
- **Deferred Service Providers**: Reducing bootstrap overhead by deferring non-essential providers.
- **Service Providers**: Understanding `register()` vs `boot()` phases.

## AI Agent Notes
- The six bootstrapper classes live at `src/Illuminate/Foundation/Bootstrap/`. Each is compact (50-100 lines) with a single `bootstrap()` method.
- The bootstrapper array is defined in *both* `Http\Kernel::$bootstrappers` and `Console\Kernel::$bootstrappers` — they are identical in modern Laravel.
- Historically, HTTP kernel had an additional `LoadRoutingMiddleware` bootstrapper that was later removed.
- Laravel 11+ optimized `LoadConfiguration` with pre-computed path resolution. Laravel 12 added early-binding optimization to `RegisterProviders`.

## Verification
- [ ] Read `Illuminate\Foundation\Application::bootstrapWith()` source
- [ ] List all six bootstrappers in exact order
- [ ] Understand what each bootstrapper does internally
- [ ] Compare HTTP and Console kernel bootstrapper arrays — verify they are identical
- [ ] Test with `php artisan config:cache` — verify LoadConfiguration reads cached file
- [ ] Create a custom bootstrapper and verify it runs at the expected position in the sequence
