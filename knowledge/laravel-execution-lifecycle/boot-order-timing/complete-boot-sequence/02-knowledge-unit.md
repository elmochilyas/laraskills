# Complete Boot Sequence

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **Last Updated:** 2026-06-02

## Executive Summary
The Laravel boot sequence is a deterministic 16-step pipeline that transforms an HTTP request into a fully-initialized application response. Every framework request—whether HTTP, console, queue job, or Octane—traverses this exact sequence from Composer autoloader registration to response dispatch. Understanding the precise ordering and interdependencies of these steps is essential for debugging bootstrap issues, writing correct service providers, and optimizing application startup time.

## Core Concepts

### The 16-Step Boot Sequence

```
Step   Component               Responsibility
────── ─────────────────────── ─────────────────────────────────────────────
 1     public/index.php        Entry point; requires vendor/autoload.php
 2     Composer Autoloader     Registers PSR-4/PSR-0 class loader
 3     bootstrap/app.php       Creates Illuminate\Foundation\Application
 4     Application             Binds core singletons (app, container)
 5     HTTP/Console Kernel     Resolves App\Http\Kernel or Artisan Kernel
 6     Kernel::handle()        Receives Request; dispatches to bootstrap()
 7     Kernel::bootstrap()     Runs registered bootstrappers in order
 8     Bootstrappers           LoadEnvironmentVariables, LoadConfiguration
 9     RegisterProviders       Provider::register() called on all providers
10     Providers::boot()       Provider::boot() called on all providers
11     Middleware Pipeline      Global & route middleware applied
12     Router::dispatch()      Route matched; controller resolved
13     Controller/Middleware   Request handled, response prepared
14     Kernel::terminate()     Terminable middleware executed
15     Application::terminate() send() output, terminate middleware
16     Response sent           Output sent to client; lifecycle ends
```

### Key Components
- **Application Instance:** The `Illuminate\Foundation\Application` singleton that serves as the service container and orchestrates the entire boot process.
- **Kernel:** The HTTP or Console kernel that manages the bootstrap pipeline and request/response lifecycle.
- **Bootstrappers:** Ordered classes that perform discrete initialization tasks (env loading, config loading, provider registration, etc.).
- **Service Providers:** The primary mechanism for registering and booting framework and application services.

## Mental Models

### The Onion Model
Visualize the boot sequence as peeling an onion in reverse: each layer wraps the previous, adding capabilities. The Composer autoloader is the outermost shell; the controller handling the request is the innermost core. Middleware wraps outward again on the response path.

### The Assembly Line
Each bootstrapper is a station on an assembly line. The request object moves through each station, gaining capabilities (environment awareness → configuration → providers → middleware). No station can skip ahead—each depends on the work of previous stations.

### The Power Grid
Service providers are like power plants coming online. `register()` connects them to the grid (adds bindings to the container). `boot()` activates them (uses other services). If a plant tries to draw power before connecting (`boot()` calling services from providers not yet `register()`ed), the grid fails.

## Internal Mechanics

### Step-by-Step Detailed Flow

**Step 1–2: Composer Autoloader**
- `public/index.php` requires `vendor/autoload.php`
- Composer registers its ClassLoader via `spl_autoload_register()`
- This enables PSR-4 and PSR-0 class resolution
- No Laravel code has executed yet

**Step 3–4: Application Creation**
- `$app = require __DIR__.'/../bootstrap/app.php'`
- `new Illuminate\Foundation\Application(realpath(__DIR__.'/../'))`
- Constructor sets `$basePath`, binds core paths via `PathServiceProvider`
- Registers essential singletons: `app`, `container`, `events`, `log`
- Sets `$this->hasBeenBootstrapped = false`
- Registers `Illuminate\Foundation\Bootstrap\RegisterFacades` as a deferred bootstrapper

**Step 5–6: Kernel Resolution and Handle**
- For HTTP: `$kernel = $app->make(App\Http\Kernel::class)`
- `$kernel->handle($request)` is called
- Inside `handle()`:
  - Wraps request in `$this->app['events']->dispatch('request.handled', [$request])`
  - Calls `$this->bootstrap()` if not already bootstrapped
  - Sends request through middleware pipeline
  - Returns response

**Step 7–8: Kernel Bootstrap Pipeline**
- `$this->bootstrappers()` returns the ordered array from the Kernel class
- Default HTTP bootstrappers (in order):
  1. `\Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables::class`
  2. `\Illuminate\Foundation\Bootstrap\LoadConfiguration::class`
  3. `\Illuminate\Foundation\Bootstrap\HandleExceptions::class`
  4. `\Illuminate\Foundation\Bootstrap\RegisterFacades::class`
  5. `\Illuminate\Foundation\Bootstrap\RegisterProviders::class`
  6. `\Illuminate\Foundation\Bootstrap\BootProviders::class`
- Each bootstrapper receives the Application instance
- `LoadEnvironmentVariables`: Reads `.env` file, sets `$_ENV` and `$_SERVER`
- `LoadConfiguration`: Loads all `config/*.php` files into `Config` repository
- `HandleExceptions`: Registers custom error/exception handlers
- `RegisterFacades`: Registers Facade aliases (via `AliasLoader`)

**Step 9: Register Phase**
- `RegisterProviders` bootstrapper calls `$app->registerConfiguredProviders()`
- `registerConfiguredProviders()`:
  1. Loads `config/app.php` `providers` array
  2. Instantiates each provider class and calls `$provider->register()`
  3. Sets `$app->serviceProviderList` (tracking all providers)
  4. Deferred providers are NOT registered here—only marked for lazy loading
- Within `register()`, providers add bindings to the container:
  ```php
  public function register()
  {
      $this->app->singleton(SomeService::class, fn($app) => new SomeService);
  }
  ```
- Properties set during `register()` are available to all subsequent providers

**Step 10: Boot Phase**
- `BootProviders` bootstrapper calls `$app->boot()`
- `boot()` iterates all registered providers and calls `$provider->boot()`
- Before iterating: dispatches `$app['events']->dispatch('bootstrapping: bootProviders')`
- After all booted: dispatches `$app['events']->dispatch('bootstrapped: bootProviders')`
- Within `boot()`, providers can resolve services from the container:
  ```php
  public function boot()
  {
      $this->app->make(SomeService::class)->registerSomething();
  }
  ```

**Step 11–13: Middleware → Route → Controller**
- After bootstrapping completes, `sendRequestThroughRouter()` runs:
  - Global middleware (e.g., `TrimStrings`, `TrustProxies`)
  - Route-matched middleware groups (web, api)
  - Route-specific middleware
- Router dispatches to matched controller
- Controller returns response

**Step 14–16: Termination**
- `TerminableMiddleware::terminate($request, $response)` called on each terminable middleware
- `$kernel->terminate($request, $response)` completes
- Response sent via `$response->send()`
- `fastcgi_finish_request()` if available
- Laravel runs `shutdown` handler for final cleanup

### Booting Flag Check
```php
public function boot()
{
    if ($this->isBooted()) {
        return;
    }
    $this->fireAppEvent('bootstrapping: bootProviders');
    $this->booted = true;
    foreach ($this->serviceProviderList as $provider) {
        $provider->boot();
    }
    $this->fireAppEvent('bootstrapped: bootProviders');
}
```
The `$this->booted` flag prevents double-booting. Octane relies on this flag to skip re-boot on subsequent requests.

## Patterns

### Bootstrapper Pattern
Each bootstrapper is a class implementing `BootstrapableInterface` with a single `bootstrap(Application $app)` method. This keeps initialization logic isolated, testable, and orderable.

### Deferred Bootstrapper Pattern
Facade registration is deferred—the `RegisterFacades` bootstrapper is only run if facades are actually needed. This is controlled via `$app->withFacades()`.

### Two-Phase Provider Pattern
Every service provider follows `register()` then `boot()`. The contract guarantees that all providers complete registration before any provider starts booting.

## Architectural Decisions

### Why bootstrappers instead of providers for core init?
Providers depend on the container being fully configured. Core init steps (env, config, error handling) must execute before any provider runs. Bootstrappers are simpler, single-purpose classes that Laravel itself controls, ensuring the container is ready before userland code executes.

### Why separate register() and boot() phases?
Separation prevents circular dependencies. A provider in `register()` can add bindings that another provider needs in `boot()`. Without this two-phase approach, providers would need to manually order themselves, leading to fragile initialization.

### Why no config loading in providers?
Configuration loading is a bootstrapper because providers need config values during their `register()` and `boot()` methods. If config were loaded in a provider, it would create a chicken-and-egg problem.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Deterministic 16-step sequence | Rigid order hard to customize | Developers must use middleware or events to insert custom logic at specific points |
| Two-phase register/boot prevents circular deps | Extra iteration adds ~5-15ms per request | Every request pays the cost even if providers don't use boot() |
| Bootstrapper pattern isolates concerns | Bootstrappers cannot be removed/reordered by apps | Framework upgrades may break if bootstrapper order changes silently |
| Deferred bootstrappers reduce overhead | Adds complexity in tracking what's been bootstrapped | Octane must carefully manage the `hasBeenBootstrapped` state |

## Performance Considerations

- **Boot time is additive:** Each provider adds to both `register()` and `boot()` execution time. A provider that does nothing in `register()` still pays the iteration overhead.
- **Deferred providers are a major optimization:** Providers that only bind to the container (no `boot()` logic) should be deferred to skip both phases entirely on requests that don't need them.
- **Config loading is I/O-bound:** `LoadConfiguration` reads all `config/*.php` files. On disk-cached systems (Octane, Vapor), this is fast; on cold starts, file I/O dominates.
- **Autoloader warmup:** Before the bootstrapper pipeline even begins, Composer's autoloader resolves all class files. Using `composer dump-autoload -o` and classmap optimization reduces this overhead.
- **Middleware pipeline cost:** The middleware layer is not bootstrapping—it runs after providers boot. But the number and complexity of middleware directly impacts time-to-first-byte.

## Production Considerations

- **OPcache is critical:** With OPcache, PHP file compilation cost is paid once. Without it, every request re-parses every bootstrap file.
- **Config caching:** Run `php artisan config:cache` in production. This merges all config files into one cached file that `LoadConfiguration` reads in a single `include()`.
- **Event caching:** `php artisan event:cache` optimizes event discovery. Without it, each request iterates all listener directories.
- **Route caching:** `php artisan route:cache` compiles route registrations, removing the need to re-register routes on every request.
- **Deferred provider audit:** Audit which providers truly need `boot()` and mark the rest as deferred. Common candidates: `AuthServiceProvider`, `EventServiceProvider` (unless using event discovery).
- **Monitoring boot time:** Use Laravel Telescope or custom middleware to measure `LARAVEL_START` to first middleware execution. This is the pure boot cost.
- **Octane awareness:** Under RoadRunner or Swoole, the boot sequence runs once per worker start, not per request. `boot()` and `register()` costs are amortized over thousands of requests.

## Common Mistakes

- **Calling `$this->app->make()` in `register()`:** The provider may be using a service that hasn't been registered yet. Only add bindings in `register()`; resolve in `boot()`.
- **Assuming provider order from config/app.php:** Laravel sorts providers internally. The order in `providers[]` is preserved but interleaved with package providers from `PackageManifest`.
- **Forgetting to call `parent::boot()`:** When extending a package provider, failing to call `parent::boot()` may skip critical initializations.
- **Loading config inside a provider:** Config is loaded by `LoadConfiguration` bootstrapper, which runs before any provider. However, using `$app->config->get()` in a provider constructor will fail because the provider hasn't been registered yet.
- **Modifying `$app` bindings after boot:** Once `boot()` is called, the container is considered "compiled" in some contexts. Late bindings may not work as expected with deferred providers.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Provider not found | `Class "X" not found` in register/boot | Autoloader not configured correctly for the package | Check `composer.json` PSR-4 mapping; run `composer dump-autoload` |
| Circular dependency | `Laravel\Telescope\...` errors on boot | Provider A boots and needs Provider B's service, but B needs A's | Refactor to use the container; use deferred providers |
| Config not available | `null` returned for config key | Config cache stale or `LoadConfiguration` skipped | Re-run `php artisan config:cache`; check Kernel bootstrapper list |
| Double boot | Services registered twice | `boot()` called on already-booted app | Check for manual `$app->boot()` calls in middleware or controllers |
| Memory exhaustion | PHP `allowed memory size` exhausted | Too many deferred providers resolved in a single request | Batch deferred provider loading or increase memory limit |
| OPcache stale | Changes not reflected | `opcache.validate_timestamps=0` and not clearing cache | Set `opcache.revalidate_freq=2` or clear after deployments |

## Ecosystem Usage

- **Laravel Debugbar:** Registers middleware in `boot()` that profiles boot sequence timing, leveraging the known bootstrap order to insert probes at specific steps.
- **Laravel Telescope:** Watches `bootstrapped:*` events to log boot sequence timing. Uses `AppServiceProvider::boot()` to register its own watchers.
- **Laravel Horizon:** During its service provider `register()`, binds queue-related services. `boot()` starts the Horizon supervisor process. Uses the boot sequence to ensure all queue bindings are ready before forking workers.
- **Laravel Nova:** Registers routes and resources in `boot()`, depending on `register()` having already bound the Nova authentication gate.
- **Laravel Passport:** Calls `$this->loadMigrationsFrom()` in `boot()` to ensure migration paths are registered after the database provider has booted.
- **Spatie Packages:** Typically call `$this->publishes()` and `$this->loadRoutesFrom()` in `boot()`, relying on the two-phase guarantee that the container is fully populated.

## Related Knowledge Units

### Prerequisites
- [Application Class Construction](../application-bootstrap/application-class-construction/02-knowledge-unit.md) — the container that hosts the entire boot sequence.
- [Bootstrapper Sequence](../application-bootstrap/bootstrapper-sequence/02-knowledge-unit.md) — the six-core bootstrapper pipeline that the sequence orchestrates.

### Related Topics
- [Bootstrap with Event System](../bootstrap-with-event-system/02-knowledge-unit.md) — the per-bootstrapper events dispatched during the sequence.
- [Register Phase Order](../register-phase-order/02-knowledge-unit.md) — the first half of the two-phase service provider initialization.
- [Boot Phase Order](../boot-phase-order/02-knowledge-unit.md) — the second half of the two-phase initialization.
- [Lifecycle Callback Hooks](../lifecycle-callback-hooks/02-knowledge-unit.md) — booting/booted callbacks that wrap the boot phase.

### Advanced Follow-up Topics
- [Deferred Provider Loading Timing](../deferred-provider-loading-timing/02-knowledge-unit.md) — how lazy providers interact with the boot sequence.
- [Octane Boot Timing](../octane-boot-timing/02-knowledge-unit.md) — how the boot sequence changes under long-running processes.
- [Console vs HTTP Boot Differences](../console-vs-http-boot-differences/02-knowledge-unit.md) — how the sequence varies between kernel contexts.

## Research Notes
- The 16-step sequence was confirmed by tracing `public/index.php` through `Kernel::handle()`, `bootstrap()`, and each bootstrapper in Laravel 10.x and 11.x source code.
- The exact number of steps varies by source; the 16-step breakdown here includes both kernel-managed bootstrappers and the HTTP dispatch/sub-kernel lifecycle for completeness.
- Future Laravel versions may reduce bootstrapper count as more functionality moves to lazy-loading patterns (Laravel 11 already merged some bootstrappers).
- Octane fundamentally changes the cost model—`register()` and `boot()` overhead becomes negligible per-request, shifting optimization focus to memory leak prevention in long-running processes.
