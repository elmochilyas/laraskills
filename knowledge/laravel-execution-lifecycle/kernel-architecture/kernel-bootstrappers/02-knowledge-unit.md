# Kernel Bootstrappers

## Metadata
**Domain:** Laravel Execution Lifecycle & Framework Internals  
**Subdomain:** Kernel Architecture  
**Last Updated:** 2026-06-02

## Executive Summary
Kernel bootstrappers are the six initialization steps that run once per kernel instance to prepare the Laravel framework for operation. They load environment variables, parse configuration, register error handlers, initialize facades, and boot service providers. Both the HTTP and Console kernels share the same bootstrapper array, making this the universal initialization sequence for every Laravel request.

## Core Concepts
- **Bootstrapper Interface**: Each bootstrapper implements `Illuminate\Contracts\Foundation\Bootstrapper` with a single `bootstrap(Application $app)` method receiving the application container instance.
- **Six Core Bootstrappers**:
  1. `\Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables` — Loads `.env` file via Dotenv library, sets `$_ENV` and `$_SERVER` values.
  2. `\Illuminate\Foundation\Bootstrap\LoadConfiguration` — Reads config files from `/config`, merges with environment overrides, caches to `$app['config']`.
  3. `\Illuminate\Foundation\Bootstrap\HandleExceptions` — Registers custom error/exception handlers using PHP's `set_error_handler`, `set_exception_handler`, `register_shutdown_function`.
  4. `\Illuminate\Foundation\Bootstrap\RegisterFacades` — Alias facade classes to their short names (e.g., `'DB' → Illuminate\Support\Facades\DB`).
  5. `\Illuminate\Foundation\Bootstrap\RegisterProviders` — Registers all service providers listed in `config/app.php` `providers` array into the container.
  6. `\Illuminate\Foundation\Bootstrap\BootProviders` — Calls `boot()` on all registered service providers.
- **Guarded Execution**: The kernel tracks bootstrap completion with `$this->hasBeenBootstrapped` boolean — calling `bootstrap()` a second time is a no-op.

## Mental Models
- **Framework Ignition Sequence**: Like an aircraft pre-flight checklist — each bootstrapper is a sequential step that must complete before the next. Skipping any step means the framework cannot operate.
- **Layered Initialization**: Visualize the bootstrappers as concentric layers: outermost (environment) provides raw inputs, middle layers (config, error handling) build infrastructure, inner layers (facades, providers) provide the framework API.
- **One-Way Gate**: The `hasBeenBootstrapped` flag acts as a one-way gate — once open (true), bootstrap never executes again for the kernel instance's lifetime.

## Internal Mechanics
The `bootstrap()` method in `Illuminate\Foundation\Application` (not the kernel) is the actual implementation. The kernel calls `$app->bootstrapWith($this->bootstrappers)` which iterates over the bootstrapper class names:

```php
// Illuminate\Foundation\Application::bootstrapWith()
foreach ($bootstrappers as $bootstrapper) {
    $this->make($bootstrapper)->bootstrap($this);
}
```

**Execution order and what each does:**

1. **LoadEnvironmentVariables**: Uses `Dotenv\Dotenv::createImmutable()` to parse `.env`. Falls back to `getenv()` lookups. Registers `$_ENV` and `$_SERVER` overwrite behavior.
2. **LoadConfiguration**: Creates `RepositoryInterface` (config repository). Iterates `/config/*.php`, merges with environment overrides. Sets `$app->instance('config', $repository)`.
3. **HandleExceptions**: Creates `Illuminate\Foundation\Exceptions\Handler` for exception reporting/render. Registers `errorHandler()`, `exceptionHandler()`, `shutdownHandler()` for fatal error conversion.
4. **RegisterFacades**: Calls `Facade::clearResolvedInstances()` and `Facade::setFacadeApplication($app)`. Aliases facades from `$app['config']['app.aliases']`.
5. **RegisterProviders**: Iterates `config/app.php providers` array, calls `$app->register($providerClass)` for each.
6. **BootProviders**: Calls `$app->boot()` which iterates all registered providers and calls `boot()`.

## Patterns
- **Chain of Responsibility**: Bootstrappers execute in a fixed sequence where each bootstrapper prepares state for the next. The chain is explicit (array) rather than dynamic.
- **Strategy Pattern**: Each bootstrapper encapsulates a specific initialization strategy. The bootstrapper array implements the strategy selection — different kernels could theoretically use different bootstrapper sets.
- **Guarded Initialization**: The `$app->hasBeenBootstrapped()` check prevents re-execution. This is critical for sub-requests and testing where `bootstrapWith()` might be called manually.
- **Service Location**: Bootstrappers are resolved from the container via `$this->make()` — they can have constructor dependencies injected, allowing customization through the container.

## Architectural Decisions
- **Bootstrap Before Middleware**: Bootstrappers run before any middleware or routing. This ensures configuration, providers, and facades are available to every downstream component without per-component initialization.
- **Framework-Owned Bootstrappers**: The six bootstrappers are defined in `Illuminate\Foundation\Bootstrap`, not in userland. Users can add custom bootstrappers but cannot remove core ones — preventing accidental misconfiguration.
- **Single-Pass Over Event-Driven**: Laravel chose single-pass sequential bootstrapping over an event-driven initialization model. This simplifies debugging (explicit order) at the cost of rigidity (no hook points between bootstrappers).
- **Container Resolution**: Bootstrappers are resolved through the container (not instantiated directly), enabling dependency injection and override via container bindings.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Sequential bootstrap is simple to trace and debug | Rigid ordering — cannot inject custom bootstrappers between core steps | Custom initialization must run after boot or via service provider |
| Bootstrappers are container-resolved (overridable) | Container resolution adds overhead to bootstrap | Each bootstrapper triggers autoloading and instantiation |
| Guarded execution prevents re-bootstrap waste | Guarded check is per-Application, not per-bootstrapper | Cannot selectively re-run a single bootstrapper without full re-bootstrap |
| All kernels share the same bootstrapper set | Console commands bootstrap full framework (including HTTP providers) | CLI commands pay for HTTP-specific provider booting |
| Bootstrappers are framework-owned (cannot be removed) | No mechanism to skip unneeded bootstrappers | Applications that don't need facades still run RegisterFacades |

## Performance Considerations
- **Configuration caching**: `php artisan config:cache` serializes config into a single file. `LoadConfiguration` reads this cached file instead of iterating `/config/*.php`, drastically reducing filesystem I/O.
- **Provider booting cost**: `RegisterProviders` and `BootProviders` are the most expensive bootstrappers. With 30+ providers (common in production), these two account for 60-70% of bootstrap time.
- **Facade alias overhead**: `RegisterFacades` creates class aliases for all facades — typically 60-80 `class_alias()` calls. Each alias adds autoloader resolution overhead.
- **Environment file parsing**: `LoadEnvironmentVariables` reads and parses `.env` on every request unless cached (Laravel does not cache `.env` — use OPcache or server environment variables in production).
- **Bootstrapper optimization**: In Laravel 11+, `Bootstrap\LoadConfiguration` and `Bootstrap\HandleExceptions` were optimized to use pre-computed paths and early binding.

## Production Considerations
- **Config caching is mandatory**: In production, `php artisan config:cache` should be part of deployment. Without it, `LoadConfiguration` reads 30+ files on every request.
- **Environment variables via server**: Use server-level environment variables (nginx/php-fpm `env[]` directives) instead of `.env` files in production — eliminates `LoadEnvironmentVariables` overhead entirely.
- **Provider deferring**: Defer service providers that aren't needed on every request using `\Illuminate\Contracts\Support\DeferrableProvider`. Deferred providers are not booted by `BootProviders`.
- **Error handling in production**: `HandleExceptions` registers debug-friendly error handlers. In production, these should report but not display errors — verify `APP_DEBUG=false` disables detailed error output.
- **Facade optimization**: Unused facades can be removed from `config/app.php` `aliases` to reduce `RegisterFacades` overhead.

## Common Mistakes
- **Assuming bootstrap order is configurable**: The bootstrapper array order is defined in the kernel constructor. Custom bootstrappers cannot be injected between core bootstrappers — they run before or after the entire sequence.
- **Forgetting `parent::bootstrap()`**: When extending the kernel, overriding `bootstrap()` without calling parent prevents the full bootstrapper sequence from executing.
- **Dependency on bootstrapper state in tests**: Unit tests that mock the application may skip bootstrappers entirely — code relying on facades or config will fail without explicit setup.
- **Misunderstanding guarded behavior**: `hasBeenBootstrapped` is per-Application instance, not global. Multiple Application instances each run bootstrappers independently (relevant in multi-tenant setups).

## Failure Modes
- **Missing `.env` file**: `LoadEnvironmentVariables` throws `InvalidArgumentException` if `.env` doesn't exist and `APP_ENV` is not set. This crashes all kernels (HTTP + Console).
- **Config syntax error**: A PHP parse error in a config file causes `LoadConfiguration` to throw. Since error handling isn't yet registered, this results in an uncaught exception with stack trace.
- **Provider boot failure**: `BootProviders` calls all `boot()` methods. If any provider throws, subsequent providers are interrupted and the application state is partially booted.
- **Facade alias collision**: If a facade alias overlaps with an existing class (e.g., a userland `DB` class exists), `class_alias()` fails silently in some PHP versions, leading to unexpected behavior.

## Ecosystem Usage
- **First-party packages**: Horizon bootstrapper (`LoadHorizonVariables`) extends the pattern by loading Horizon-specific environment variables. Telescope's bootstrapper registers debugging filters.
- **Third-party packages**: `Sentry` Laravel SDK registers custom exception handling that integrates with `HandleExceptions`. `Barryvdh\LaravelIdeHelper` registers a bootstrapper for IDE generation.
- **Application code**: Custom bootstrappers for application-specific initialization (loading tenant config, setting timezone from DB, registering domain services).

## Related Knowledge Units

### Prerequisites
- **Service Container** — how `$app->bootstrapWith()` iterates and resolves each bootstrapper from the container
- **Service Providers** — understanding `register()` vs `boot()` phases, provider deferral
- **Facades** — how `RegisterFacades` bootstrapper sets up the facade alias system

### Related Topics
- **HTTP Kernel Internals** — where the bootstrapper array is defined and executed per request
- **Console Kernel Internals** — the console kernel's identical bootstrapper sequence in CLI context
- **Configuration Caching Internals** — how `php artisan config:cache` optimizes `LoadConfiguration`

### Advanced Follow-up Topics
- **Custom Bootstrapper Development** — adding application-specific bootstrappers for multi-tenant or custom setups
- **Deferred Service Providers** — reducing bootstrap overhead by deferring non-essential providers
- **Kernel Version Evolution** — how bootstrappers changed across Laravel versions (optimizations, removals)

## Research Notes
* **Source Analysis:** The six bootstrapper classes live at `src/Illuminate/Foundation/Bootstrap/`. Each is compact (50-100 lines) with a single `bootstrap()` method. `LoadConfiguration` is the most complex — it handles both cached and uncached config loading.
* **Key Insight:** The bootstrapper array is defined in *both* `Http\Kernel::$bootstrappers` and `Console\Kernel::$bootstrappers`. They are identical in modern Laravel, but historically the HTTP kernel had an additional `LoadRoutingMiddleware` bootstrapper that was later removed.
* **Version-Specific Notes:** Laravel 11 introduced `\Illuminate\Foundation\Bootstrap\LoadConfiguration` with pre-computed path resolution for cached config. Laravel 12 added early-binding optimization to `RegisterProviders` — providers known at compile time are resolved immediately rather than on first access.
