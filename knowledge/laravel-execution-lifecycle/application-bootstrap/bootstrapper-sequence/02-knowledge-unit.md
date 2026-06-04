# Knowledge Unit: Bootstrapper Sequence

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Application Bootstrap
- **Target Audience:** Framework engineers, performance optimizers, developers debugging bootstrap-order issues
- **Last Updated:** 2026-06-02
- **Source File:** `Illuminate\Foundation\Application::bootstrapWith()`, `Illuminate\Foundation\Http\Kernel::bootstrappers()`

## Executive Summary
The bootstrapper sequence is the ordered pipeline of six classes that transform the bare `Application` container — which has only base bindings and aliases — into a fully operational Laravel application with environment, configuration, error handling, facades, and service providers. The sequence is: `LoadEnvironmentVariables` → `LoadConfiguration` → `HandleExceptions` → `RegisterFacades` → `RegisterProviders` → `BootProviders`. Each bootstrapper performs a well-defined initialization step, and the sequence is hardcoded (not configurable) in the kernel. The `bootstrapWith()` method orchestrates execution and toggles the `hasBeenBootstrapped` guard to prevent double execution.

## Core Concepts
- **The Six Bootstrappers (exact order):**
  1. `Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables` — loads `.env` file using `Dotenv\Dotenv`.
  2. `Illuminate\Foundation\Bootstrap\LoadConfiguration` — loads config files from `config/` into a `Repository` bound as `'config'`.
  3. `Illuminate\Foundation\Bootstrap\HandleExceptions` — sets custom error/exception handlers via `set_error_handler`, `set_exception_handler`, and registers the `whoops`/Ignition debug page.
  4. `Illuminate\Foundation\Bootstrap\RegisterFacades` — instantiates `AliasLoader` and registers facades defined in `config/app.php 'aliases'`.
  5. `Illuminate\Foundation\Bootstrap\RegisterProviders` — iterates `config/app.php 'providers'` and calls `$app->register()` on each.
  6. `Illuminate\Foundation\Bootstrap\BootProviders` — calls `$provider->boot()` on every registered provider.
- **`bootstrapWith(array $bootstrappers)`:** This method on `Application` accepts an array of bootstrapper class names, instantiates each, and calls `$bootstrapper->bootstrap($this)`. It sets `$this->hasBeenBootstrapped = true` before execution and `$this->bootstraped = true` after.
- **Kernel-specific bootstrappers:** The HTTP kernel (`Http\Kernel`) and console kernel (`Console\Kernel`) each define their own `$bootstrappers` array. While the six core bootstrappers are present in both, the HTTP kernel adds `LoadEnvironmentVariables` first, while the console kernel may substitute or omit certain bootstrappers (e.g., `HandleExceptions` is different for CLI).

## Mental Models
Picture the bootstrapper sequence as a **factory assembly line**. Each station (bootstrapper) adds a critical capability to the raw container. Station 1 installs the environment reader. Station 2 loads configuration into memory. Station 3 puts safety guards on. Station 4 wires up convenience shortcuts (facades). Station 5 loads all third-party providers. Station 6 starts all those providers. The line runs once and locks after completion (the `hasBeenBootstrapped` guard).

## Internal Mechanics
`bootstrapWith()` iterates over the bootstrapper array using a `foreach` loop. For each class:
1. It resolves the bootstrapper from the container (via `$this->make($class)`), allowing dependency injection for bootstrapper constructors.
2. It calls `$bootstrapper->bootstrap($app)`.
3. If a bootstrapper throws an exception, the exception propagates up through `bootstrapWith()`. The `HandleExceptions` bootstrapper is designed to catch and render exceptions that occur during later bootstrappers.

After `bootstrapWith()` completes, `$this->bootstraped = true`. All subsequent calls to `$this->bootstrapWith()` (e.g., from a second request in Octane) are short-circuited by `$this->hasBeenBootstrapped()`, which throws `LogicException` if a re-bootstrap is attempted.

## Patterns
- **Pipeline Pattern:** The bootstrappers form a linear pipeline where each stage's output is the input for the next. No branching, no skipping.
- **Strategy Pattern:** Each bootstrapper implements `BootstrapableInterface` (contract: `bootstrap(Application $app)`). The kernel selects which strategies to run via its `$bootstrappers` array.
- **Guard Pattern:** `hasBeenBootstrapped` is a boolean gate that prevents re-execution, protecting against accidental double initialization in Octane and other long-running contexts.

## Architectural Decisions
- **Why hardcode the sequence?** Bootstrapper ordering is critical — `LoadConfiguration` must run before `RegisterFacades` because facades depend on config. Making the order configurable would introduce unresolvable dependency ordering bugs. Hardcoding eliminates a class of configuration errors.
- **Why are bootstrappers not service providers?** Bootstrappers run before service providers are even registered. They set up the infrastructure (environment, config, error handling) that providers depend on. Service providers are a higher-level concept built on top of bootstrapper-completed infrastructure.
- **Why two separate phases: Register and Boot?** The Register phase runs all `register()` methods on all providers first, then the Boot phase runs all `boot()` methods. This two-phase approach allows providers to register bindings in their `register()` that other providers can consume during `boot()`. Without this separation, provider interdependency would require explicit ordering.

## Tradeoffs
| Tradeoff | Decision | Rationale |
|---|---|---|
| Hardcoded vs configurable order | Hardcoded in kernel | Prevents misconfiguration at cost of flexibility |
| Sequential vs parallel bootstrapping | Sequential (foreach) | Each step depends on previous; parallelism would require dependency graph |
| One guard vs per-bootstrapper guards | Single `hasBeenBootstrapped` gate | Simpler; if one runs, all run |
| Bootstrapper array vs separate methods | Array iteration | Allows kernel-specific customization without code duplication |

## Performance Considerations
- Total bootstrapper CPU cost: ~5–15ms per request in FPM (dominated by config file parsing and provider registration). In Octane, this cost is paid once per worker.
- `LoadConfiguration` is the most expensive bootstrapper: it reads all `config/*.php` files (typically 20–40 files) using `file_get_contents()` and `array_replace_recursive()` for environment overrides.
- `RegisterProviders` cost scales linearly with the number of service providers. A typical application with 30–50 providers adds 2–5ms.
- `BootProviders` triggers each provider's `boot()` method, which may include database queries, route registrations, and view composers — this is often the heaviest phase but is application-specific.
- **Config caching:** `php artisan config:cache` serializes the config repository. When cached, `LoadConfiguration` reads a single cached file instead of parsing all config files — a 10x–50x speedup.

## Production Considerations
- **Config caching is essential in production.** Without it, `LoadConfiguration` reads and merges every `.php` file in `config/` on every request. Always run `php artisan config:cache` in your deployment pipeline.
- **Environment detection is not cached.** `LoadEnvironmentVariables` reads `.env` on every request unless you use server-level environment variables instead.
- **Provider deferral:** Use `DeferrableProvider` on providers that are only needed when their bound service is resolved. This moves them from the `RegisterProviders` bootstrapper to lazy resolution, reducing boot time.
- **Facade alias caching:** `RegisterFacades` reads `config/app.php 'aliases'`. If you have many custom facades, consider using `AliasLoader::setInstance()` to pre-load cached alias maps.

## Common Mistakes
- Expecting `config()` to work before `LoadConfiguration` runs. This is the #1 bootstrap-order mistake — typically in service provider `register()` methods that access `config()` before the provider is properly booted.
- Adding bootstrappers to the kernel's `$bootstrappers` array. This is not a supported extension point. Use service providers, booting callbacks, or middleware instead.
- Ignoring the `HandleExceptions` bootstrapper: if it runs and your `.env` has `APP_DEBUG=true`, detailed error output is enabled. This can leak sensitive configuration in production if `APP_DEBUG` is accidentally left on.

## Failure Modes
- **Missing `.env` file:** `LoadEnvironmentVariables` throws `Dotenv\Exception\InvalidPathException` if `.env` is absent and the application is not in production mode. In production, the bootstrapper gracefully skips and relies on server environment variables.
- **Syntax error in config file:** `LoadConfiguration` includes each config file via `require`. A PHP parse error in a config file crashes the entire framework with a fatal error. This is why `php artisan config:cache` validates syntax.
- **Provider circular dependency:** If provider A's `register()` calls `$this->app->make(B::class)` where B's `register()` calls `$this->app->make(A::class)`, the container detects the circular reference and throws `CircularDependencyException`.
- **Boot-time exception not caught:** If a provider's `boot()` throws an uncaught exception, it propagates through `bootstrapWith()` and is handled by the exception handler (which was set up by `HandleExceptions`). If `HandleExceptions` itself throws, the application crashes without error handling.

## Ecosystem Usage
- **Laravel Horizon:** Adds a custom bootstrapper for the Horizon worker context to load Redis config and monitor connections before providers boot.
- **Laravel Telescope:** Adds middleware (not a bootstrapper) to tag requests, but uses `RegisterProviders` to register its custom providers.
- **Laravel Octane:** Replaces the entire bootstrapper sequence with a single `bootstrapApp()` call that runs the sequence once per worker, then relies on `flush()` for request state reset.
- **Swoole/RoadRunner:** These integrations recreate the bootstrapper order in their worker initialization, ensuring compatibility with Laravel's assumed execution order.

## Related Knowledge Units

### Prerequisites
- [Application Class Construction](./application-class-construction/02-knowledge-unit.md) — the container that bootstrappers act upon.
- [Application Builder Configuration](./application-builder-configuration/02-knowledge-unit.md) — lifecycle callbacks that run during the bootstrapper sequence.

### Related Topics
- [Kernel HTTP / Console] — where the `$bootstrappers` array is defined.
- [Service Provider Lifecycle] — the two-phase register/boot mechanism.
- [Bootstrap App PHP File](./bootstrap-app-php-file/02-knowledge-unit.md) — the entry point that triggers the bootstrapper chain.

### Advanced Follow-up Topics
- [Config Caching Mechanics](../caching-optimization/config-caching/02-knowledge-unit.md) — how `LoadConfiguration` is optimized via caching.
- [Octane Request Lifecycle](../boot-order-timing/octane-boot-timing/02-knowledge-unit.md) — how the bootstrapper guard works across concurrent requests.
- [Complete Boot Sequence](../boot-order-timing/complete-boot-sequence/02-knowledge-unit.md) — the full 16-step pipeline with bootstrapper context.

## Research Notes

### Source Analysis
`bootstrapWith()` is defined in `Illuminate\Foundation\Application::bootstrapWith()` (~line 250). Each bootstrapper class is in `Illuminate\Foundation\Bootstrap\*`. The kernel's `$bootstrappers` array is defined in `Http\Kernel` (~line 30) and `Console\Kernel` (~line 25).

### Key Insight
The bootstrapper sequence is the framework's only opportunity to initialize itself before user code runs. Every bootstrapper is designed to be safely idempotent for Octane — they create state that survives across requests via the `hasBeenBootstrapped` guard. Any bootstrapper that creates request-scoped state would be a bug in the Octane model.

### Version-Specific Notes
- **Laravel 5–8:** Bootstrapper sequence included `LoadClassLoader` (for Composer ClassLoader) — removed when Composer's autoloader became the universal standard.
- **Laravel 9:** `HandleExceptions` was updated to support Ignition v2, adding enhanced error page rendering during bootstrap.
- **Laravel 10:** `LoadConfiguration` now respects the `config:cache` atomic write pattern, preventing partial cache reads during deployment.
- **Laravel 11:** The bootstrapper sequence was formally documented as immutable. The `hasBeenBootstrapped` guard was hardened to throw `LogicException` instead of silently returning.
