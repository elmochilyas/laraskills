# Entry Point Mechanics

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Request Lifecycle
- **Knowledge Unit:** Entry Point Mechanics
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Entry Point Mechanics covers the first microseconds of a Laravel request: how `public/index.php` bootstraps the framework, creates the Application instance, determines kernel type (HTTP vs Console), captures the incoming request via Symfony's `Request::capture()`, and dispatches to the appropriate handler. This KU establishes the foundation upon which every other lifecycle KU builds — without mastering this, the entire boot sequence is opaque.

The critical engineering decision here is the dual-path dispatch (HTTP vs Console) determined not by URL parsing but by the running environment check `$app->runningInConsole()`. Laravel uses PHP's `php_sapi_name()` and `$_SERVER['argv']` to detect CLI context, which means a misconfigured SAPI or missing `argv` can cause the wrong kernel to resolve. In production deployments running Octane, the entry point shifts entirely — `public/index.php` runs once per worker start, not once per request, fundamentally changing the cost model of every operation that follows.

This topic is the single most important performance lever in Laravel: the bootstrap sequence executed in `bootstrap/app.php` determines which service providers load, which configuration files merge, and which cache files are consulted. A properly cached bootstrap (config cache, route cache, events cache) can reduce request initiation from 80ms+ to under 5ms. Any engineer debugging a slow first-byte response must start here.

---

## Core Concepts

### 1. The Entry Point Contract
`public/index.php` is the only file every HTTP request touches. It requires the Composer autoloader, creates the Application via `bootstrap/app.php`, captures the request, and dispatches. In Laravel 11+, the `bootstrap/app.php` returns an Application instance configured via `ApplicationBuilder`.

```php
// public/index.php (Laravel 11+)
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    Request::capture()
)->send();
$kernel->terminate($request, $response);
```

### 2. Application Instance Creation
`bootstrap/app.php` calls `Application::configure(basePath: dirname(__DIR__))` which creates the Application, registers base bindings, and returns the configured instance via `ApplicationBuilder`.

### 3. HTTP vs Console Dispatch
Laravel checks `$app->runningInConsole()` in `public/index.php` to decide which kernel to resolve. Console commands bypass this file entirely and enter through `artisan`:

```php
// artisan
$app = require __DIR__.'/bootstrap/app.php';
$status = $app->handleCommand(new SymfonyInput(...));
```

### 4. Request Capture via Symfony HttpFoundation
`Request::capture()` reads `$_GET`, `$_POST`, `$_COOKIE`, `$_FILES`, and `$_SERVER` to build a Symfony `Request` object. This is Laravel's adaptation layer between raw PHP superglobals and the object-oriented request abstraction.

### 5. Maintenance Mode Handling
Before dispatch, the framework checks for `storage/framework/down`. If present and the request IP is not in the bypass list, Laravel returns a maintenance mode response without full bootstrap.

---

## Mental Models

**The Theater Usher Model.** `public/index.php` is the usher at the theater door. Every audience member (HTTP request) hands their ticket (the request data) to the same usher. The usher checks if the theater is closed (maintenance mode), then escorts the person to the correct auditorium (HTTP or Console kernel). The usher's job is fast and mechanical — no show logic, just direction.

**The Train Station Switch Track.** The entry point is a railway switch. `bootstrap/app.php` is the switchyard where the Application engine is assembled. Once built, the switch directs the train either to the main line (HTTP kernel → middleware → controller) or to the service track (Console kernel → Artisan command). Both start from the same yard but have completely different routing after the switch.

**The Kernel Factory Pattern.** Think of `bootstrap/app.php` as a factory that produces a configured Application. The entry point doesn't care what configuration the Application has — it only needs the Application to produce a kernel via `$app->make()`. This is the Service Locator pattern at its outermost layer, and it makes the entry point agnostic to the application's internal wiring.

---

## Internal Mechanics

### Complete Boot Sequence

```
┌─────────────────────────────────────────────────────────────┐
│ public/index.php                                            │
│  1. require __DIR__.'/../vendor/autoload.php'                │
│     → Composer PSR-4 autoloader registered                   │
│                                                             │
│  2. $app = require __DIR__.'/../bootstrap/app.php'           │
│     → Application::configure(dirname(__DIR__))               │
│       → new Application($basePath)                           │
│         → registerBaseBindings()                             │
│         → registerBaseServiceProviders()                     │
│         → registerCoreContainerAliases()                     │
│       → ApplicationBuilder fluent config                     │
│         → withRouting(), withMiddleware(), etc.              │
│       → $app->create($app) (if configured)                   │
│     → returns Application instance                           │
│                                                             │
│  3. $kernel = $app->make(HttpKernel::class)                  │
│     → Container resolves Illuminate\Foundation\Http\Kernel   │
│     → Injects Application and Router                         │
│                                                             │
│  4. $request = Request::capture()                            │
│     → Symfony\Component\HttpFoundation\Request::createFromGlobals()
│     → Creates Request from PHP superglobals                  │
│                                                             │
│  5. $response = $kernel->handle($request)                    │
│     → Exception wrapped                                      │
│     → sendRequestThroughRouter()                              │
│       → $this->bootstrap()                                   │
│         → Application::bootstrapWith() with 6 bootstrappers  │
│       → Pipeline through global middleware                   │
│       → $this->dispatchToRouter()                            │
│                                                             │
│  6. $response->send()                                        │
│     → Symfony Response::send()                                │
│     → sendHeaders() → sendContent() → fastcgi_finish_request()
│                                                             │
│  7. $kernel->terminate($request, $response)                  │
│     → Terminable middleware                                  │
│     → Terminating event                                      │
│     → Duration lifecycle handlers                            │
└─────────────────────────────────────────────────────────────┘
```

### Dual-Path Dispatch Decision

```php
// In public/index.php (Laravel 10 pattern)
$kernel = $app->runningInConsole()
    ? $app->make(Illuminate\Contracts\Console\Kernel::class)
    : $app->make(Illuminate\Contracts\Http\Kernel::class);
```

In modern Laravel (11+), `bootstrap/app.php` configures both kernels, and Artisan commands use `$app->handleCommand()` instead of kernel dispatch.

### Octane Lifecycle Difference

Under Octane, `public/index.php` runs once during worker boot:

```php
// Octane entry — runs once per worker
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
// Application stays in memory; subsequent requests
// do NOT re-enter public/index.php
```

This means `public/index.php` bootstrap cost is amortized across thousands of requests. However, any global state initialized in `bootstrap/app.php` persists across all requests handled by that worker.

---

## Patterns

### 1. Conditional Bootstrapper Registration
**When**: You need environment-specific behavior without modifying `public/index.php`.
**How**: Use `$app->bootstrapWith()` in a service provider or `bootstrap/app.php` callback:

```php
// bootstrap/app.php
->withBindings([
    CacheInterface::class => match ($app->environment()) {
        'production' => RedisCache::class,
        default => ArrayCache::class,
    },
])
```

### 2. Maintenance Mode Custom Response
**When**: You need a custom maintenance page or JSON response.
**How**: Use `ApplicationBuilder::withRouting()` with maintenance callbacks or `PreventRequestsDuringMaintenance` middleware customization:

```php
// Exception handler or middleware customization
->withExceptions(function ($exceptions) {
    $exceptions->render(function (HttpException $e, $request) {
        return response('Custom maintenance content', 503);
    });
})
```

### 3. Octane Entry Point Optimization
**When**: Deploying Octane, you want to pre-resolve services at boot time.
**How**: Add initialization in `bootstrap/app.php`:

```php
// bootstrap/app.php
$app = Application::configure(basePath: dirname(__DIR__))
    ->withSingletons([
        HotPathService::class => fn($app) => new HotPathService(
            $app->make(Dependency::class)
        ),
    ])
    ->create(function (Application $app) {
        // Pre-resolve hot-path services
        $app->make(HotPathService::class);
    });
```

---

## Architectural Decisions

**Why `bootstrap/app.php` returns the Application instead of configuring globally.** The return-value approach allows the Application to be fully configured before any kernel dispatch, eliminating the need for the global `$app` variable pattern. This enables testability — you can create and configure a fresh Application per test without global state pollution.

**Why `Request::capture()` is static factory rather than constructor.** Symfony designed `Request` creation as a named constructor (`createFromGlobals()`) wrapped by `capture()` to allow subclass override. Lambda users and console commands can create Request objects from strings or arrays without touching superglobals. This also enables request replay for testing.

**Why the entry point checks `runningInConsole()` rather than the URI.** A Laravel application might run migrations from a web route (rare but possible) or an HTTP request from the console (e.g., Laravel Dusk). The runtime context (SAPI) is the authoritative dispatch axis, not the URL. This prevents edge cases where an Artisan command and a web route share a URI pattern.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single entry point for all requests | Boot script runs on every FPM request | Without config cache, bootstrap adds 30-80ms to every response |
| Dual-path dispatch (HTTP/Console) | SAPI detection can be wrong under some SAPIs (phpdbg, embedded) | Wrong kernel resolves, causing cryptic errors |
| Octane amortizes boot cost | One-time boot means state leaks affect all subsequent requests | Memory growth and cross-request data contamination |
| `bootstrap/app.php` is easily testable | Increased indirection vs. global `$app` | More complex framework bootstrap but cleaner test isolation |

---

## Performance Considerations

- **Bootstrap time dominates cold requests.** Without cache, `bootstrapWith()` runs 6 bootstrappers — `LoadEnvironmentVariables`, `LoadConfiguration`, `HandleExceptions`, `RegisterFacades`, `RegisterProviders`, `BootProviders`. `RegisterProviders` alone iterates ~40+ core providers. With config cache, the configuration merge step drops from ~15ms to ~0.1ms.
- **Octane eliminates bootstrap per-request.** Under Octane, `bootstrap/app.php` runs once. A typical 60ms bootstrap cost becomes zero for 99.9% of requests. This is Octane's primary performance advantage.
- **Composer autoloader is non-trivial.** The `vendor/composer/autoload_real.php` file registers all PSR-4 prefixes. Applications with 200+ packages add 5-15ms to autoloader registration. Using `composer dump-autoload -o` generates optimized classmaps, reducing this to <2ms.
- **Maintenance mode check is a filesystem stat.** `file_exists(storage_path('framework/down'))` is a single stat() call (~0.1ms on SSD). The bypass IP check iterates the bypass list — negligible unless the list grows to thousands of entries.

---

## Production Considerations

- **Run `php artisan optimize` in CI/CD.** This generates config cache, events cache, and route cache, slashing `bootstrap/app.php` execution time. Without this, every request pays the full bootstrap tax.
- **Monitor `laravel.request_duration` timing.** The first byte time (from entry point to `->send()`) should be under 50ms for cached applications. If first-byte time exceeds 200ms, profile bootstrapper timing.
- **Verify `bootstrap/app.php` syntax on deploy.** A syntax error here crashes all workers, returning 500 for every route. Add `php -l bootstrap/app.php` to your deployment pipeline.
- **Under Octane, audit `bootstrap/app.php` for state initialization.** Any closure that captures variables from `bootstrap/app.php` scope shares that state across all requests. Use factory closures or scoped bindings instead.

---

## Common Mistakes

**Why it happens:** Developers add application logic directly in `public/index.php` thinking it runs once.  
**Why it's harmful:** Under FPM, `public/index.php` runs on every request — any logic added here executes unconditionally.  
**Better approach:** All application logic belongs in service providers or middleware, not in the entry point.

**Why it happens:** Confusion about when `bootstrap/app.php` executes vs when kernels are resolved.  
**Why it's harmful:** Code placed in `bootstrap/app.php` runs before the service container is fully configured, causing resolution failures.  
**Better approach:** Use `bootstrap/app.php` only for fluent configuration via `ApplicationBuilder`. Use provider `register()` or `boot()` for application logic.

**Why it happens:** Developers skip `composer dump-autoload -o` in production.  
**Why it's harmful:** Without optimized classmaps, Composer falls back to filesystem lookups, adding 10-30ms per request for autoloader resolution on cold cache.  
**Better approach:** Always run `composer dump-autoload -o` in deployment scripts.

---

## Failure Modes

**Failure: Bootstrap script crashes due to missing `.env` file.** The `LoadEnvironmentVariables` bootstrapper throws if `.env` is absent and `APP_ENV` is not set. Detection: Monitor for `InvalidEnvironmentException`. Mitigation: Set `APP_ENV=production` in server environment variables so Laravel skips `.env` loading.

**Failure: Wrong kernel resolves under non-standard SAPI.** Running Laravel via `phpdbg` or a custom PHP embedding can cause `runningInConsole()` to return incorrect values. Detection: Console commands throw or HTTP routes return CLI output. Mitigation: Set a binding override in `bootstrap/app.php` for the kernel contract.

**Failure: Octane worker memory exhaustion from entry-point state.** Closures in `bootstrap/app.php` capture large data structures that persist across requests. Detection: Octane workers show monotonic memory growth in `top` or `htop`. Mitigation: Audit closures for captured variables; use factory closures that create fresh instances per request.

**Failure: Request capture reads corrupted superglobals.** Under certain server configurations, `$_SERVER` may contain unexpected values (e.g., missing `REQUEST_URI`). Symfony's `Request::createFromGlobals()` assumes these exist. Detection: Requests fail with Symfony `NotFoundHttpException` even for valid routes. Mitigation: Add a trusted proxy middleware or custom request creation logic.

---

## Ecosystem Usage

**Laravel Octane** changes the entry point semantics entirely — `public/index.php` runs once per worker start, not per request. Octane's `server.php` file becomes the actual entry point, which bootstraps Swoole/RoadRunner and creates multiple workers, each running `public/index.php` once.

**Laravel Horizon** launches queue workers via Artisan (`php artisan horizon`), which enters through the Console kernel path. Horizon workers persist the Application across job processing, similar to Octane's lifecycle — bootstrap runs once, then each job is processed in a loop with state reset between jobs.

**Laravel Breeze / Jetstream** use the entry point's middleware configuration in `bootstrap/app.php` to add authentication middleware groups. The `->withMiddleware()` call configures which middleware runs globally vs. on routes, all established before any request enters the pipeline.

**Monica CRM** (open-source Laravel CRM) uses the `bootstrap/app.php` to configure custom exception handling for its API-first architecture, demonstrating how the entry point's exception configuration affects the entire application's error response strategy.

---

## Related Knowledge Units

### Prerequisites
- (none — this is the entry point to the entire hierarchy)

### Related Topics
- HTTP Kernel Dispatch (immediate next step after entry point)
- Console Kernel Dispatch (alternate dispatch path)
- Application Bootstrap (the Application class internals initialized in `bootstrap/app.php`)
- Boot Order & Timing (the bootstrapper sequence triggered by kernel dispatch)

### Advanced Follow-up Topics
- Octane Lifecycle Differences
- Custom Kernel Implementations
- Framework Bootstrap Performance Benchmarking

---

## Research Notes

### Source Analysis
- `public/index.php` — The canonical entry point, ~30 lines. Laravel 11+ removes the kernel resolution logic into `bootstrap/app.php` return pattern.
- `bootstrap/app.php` — Application configuration via `ApplicationBuilder` fluent API. In Laravel 10, this file was ~10 lines; in 11+ it is the central configuration point.
- `Illuminate\Foundation\Application::__construct` — Base bindings, providers, and alias registration. These run before `bootstrap/app.php` configuration.
- `Symfony\Component\HttpFoundation\Request::createFromGlobals` — Static factory that builds Request from PHP superglobals. Uses `duplicate()` internally to apply custom parameter ordering.
- `Illuminate\Foundation\Configuration\ApplicationBuilder` — The fluent API introduced in Laravel 11 for configuring application without a Kernel class.

### Key Insight
The entry point is not a single file — it is a contract between `public/index.php`, `bootstrap/app.php`, and the Application constructor. The performance profile of your entire application is determined in these first 10 lines of execution, before any middleware or routing logic runs.

### Version-Specific Notes
- **Laravel 10**: `public/index.php` resolves kernel explicitly with `$app->runningInConsole()` check. `bootstrap/app.php` returns a simple Application with no configuration.
- **Laravel 11**: Slim skeleton — `App\Http\Kernel` removed. `bootstrap/app.php` becomes the configuration hub with `ApplicationBuilder`. `public/index.php` simplified.
- **Laravel 12**: `ApplicationBuilder` gains `->withSingletons()`, `->withScopedSingletons()`, `->withBindings()` methods. `create()` callback added for post-configuration bootstrapping.
- **Laravel 13**: ApplicationBuilder continuously evolves; Octane entry point becomes the primary path for high-throughput deployments.
