# Deferred Provider Loading Timing

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **Last Updated:** 2026-06-02

## Executive Summary
Deferred service providers are a performance optimization that postpones both `register()` and `boot()` execution until the first time a service they provide is actually resolved from the container. Instead of loading every provider on every request, only the providers whose services are actually used are loaded. This mechanism is transparent to application code—calling `app()->make(Service::class)` automatically triggers the correct deferred provider. Understanding deferred provider mechanics is essential for optimizing cold-start performance and avoiding subtle timing bugs where deferred providers load later than expected.

## Core Concepts

### What Makes a Provider Deferred
A service provider is deferred when its `$defer` property is `true` and it implements `provides()`. The framework checks these during the registration phase:

```php
class ExampleDeferredProvider extends ServiceProvider
{
    protected $defer = true;

    public function provides()
    {
        return [ExampleService::class];
    }

    public function register()
    {
        $this->app->singleton(ExampleService::class, function () {
            return new ExampleService();
        });
    }
}
```

### How Deferred Providers Are Identified
During `ProviderRepository::load()`, each provider is inspected:

```php
foreach ($providers as $provider) {
    $this->registerProvider($provider);
}

protected function registerProvider($provider)
{
    if ($this->isDeferred($provider)) {
        // Don't register now; add to deferred manifest
        $this->addToManifest($provider);
    } else {
        $this->app->register($provider);
    }
}

protected function isDeferred($provider)
{
    if (is_string($provider)) {
        $provider = new $provider($this->app);
    }
    return $provider->isDeferred();
}
```

### The Deferred Manifest
```php
// Stored in bootstrap/cache/services.php
[
    'deferred' => [
        'ExampleService' => 'App\Providers\ExampleDeferredProvider',
        'AnotherService' => 'App\Providers\AnotherProvider',
    ],
    'providers' => [...],
    'eager' => [...],
]
```

### Lazy Loading Trigger
When `$app->make(ExampleService::class)` is called, the container doesn't find a binding. The Application intercepts this miss via `__call` magic or direct override:

```php
// In Application (inherits Container)
public function make($abstract, array $parameters = [])
{
    if (! $this->isDeferredService($abstract) && ! $this->bound($abstract)) {
        // Not deferred and not bound—let container throw BindingResolutionException
    }

    if ($this->isDeferredService($abstract)) {
        $this->loadDeferredProvider($abstract);
    }

    return parent::make($abstract, $parameters);
}

public function isDeferredService($abstract)
{
    if (! isset($this->deferredServices)) {
        return false;
    }

    if (isset($this->deferredServices[$abstract])) {
        return true;
    }

    // Check manifest
    return false;
}
```

### The Loading Process
```php
public function loadDeferredProvider($service)
{
    if (! isset($this->deferredServices[$service])) {
        return;
    }

    $provider = $this->deferredServices[$service];
    
    if (! isset($this->loadedProviders[$provider])) {
        $this->registerDeferredProvider($provider);
    }
}

protected function registerDeferredProvider($provider)
{
    if (! isset($this->loadedProviders[$provider])) {
        $this->register($provider);  // Calls register() then auto-boots
        $this->markAsBooted($provider);
    }
}
```

**Critical detail:** When a deferred provider loads, `register()` runs and then the provider is immediately booted (if the app is already booted, which it almost always is by the time `make()` is called in user code).

## Mental Models

### The Lazily Loaded Library
Think of deferred providers like JavaScript modules loaded via dynamic `import()`. The library sits on disk (the provider class file) but isn't fetched or executed until your code actually calls `import('library')` (calls `make(Service::class)`).

### The Parachute Pack
Non-deferred providers are like a parachute you pack before takeoff (always deployed during boot). Deferred providers are like emergency parachutes: they're registered in the manifest but only opened (booted) when you actually pull the cord (call `make()`).

## Internal Mechanics

### Deferred Services Manifest Structure
```php
// bootstrap/cache/services.php (full example)
return [
    'providers' => [
        0 => 'Illuminate\Auth\AuthServiceProvider',
        1 => 'Illuminate\Broadcasting\BroadcastServiceProvider',
        // ... 30+ non-deferred providers
    ],
    'eager' => [
        'Illuminate\Auth\AuthServiceProvider',
        // ... all eager providers
    ],
    'deferred' => [
        'App\Contracts\ReportingService' => 'App\Providers\ReportingServiceProvider',
        'App\Contracts\Analytics' => 'App\Providers\AnalyticsServiceProvider',
        'SomePackage\SomeService' => 'SomePackage\SomeServiceProvider',
    ],
    'when' => [
        // Event-based deferred loading conditions
    ],
];
```

### The `when()` Method
```php
class EventDrivenProvider extends ServiceProvider
{
    protected $defer = true;
    
    public function when()
    {
        return [
            SomeEvent::class,
        ];
    }
    
    public function provides()
    {
        return [Analytics::class];
    }
}
```
When an event fires, the `when()` list is checked and matching deferred providers are loaded preemptively, before any `make()` call.

### Auto-Boot After Registration
```php
public function register($provider, $force = false)
{
    // ... registration ...
    
    if ($this->isBooted()) {
        $this->bootProvider($provider);
    }
    
    return $provider;
}
```
When `registerDeferredProvider()` calls `$this->register($provider)`, and the app is already booted (which it is for any deferred provider triggered after the boot phase), the provider is immediately booted as part of registration.

### Service Provider Cache
The `bootstrap/cache/services.php` file is generated by `php artisan optimize`. It contains:
- `providers`: All non-deferred providers (registered on every request)
- `eager`: Same as `providers` (legacy field)
- `deferred`: Map of abstract → provider class
- `when`: Event-based deferred loading triggers

Without this cache, `ProviderRepository` must inspect each provider class via reflection to determine if `$defer` is true.

## Patterns

### Standard Deferred Provider
```php
class ReportingServiceProvider extends ServiceProvider
{
    protected $defer = true;

    public function register()
    {
        $this->app->singleton(ReportingService::class, function ($app) {
            return new ReportingService(
                $app->make(ConnectionManager::class)
            );
        });
    }

    public function provides()
    {
        return [ReportingService::class];
    }
}
```

### Event-Triggered Deferred Loading
```php
class AnalyticsProvider extends ServiceProvider
{
    protected $defer = true;

    public function when()
    {
        return [
            RequestHandled::class,
            JobProcessed::class,
        ];
    }

    public function provides()
    {
        return [AnalyticsService::class];
    }
}
```

### Multiple Services, One Provider
```php
class MailServiceProvider extends ServiceProvider
{
    protected $defer = true;

    public function register()
    {
        $this->app->singleton('mailer', function ($app) {
            return new Mailer($app->make('mail.manager'));
        });
        $this->app->singleton('mail.manager', function ($app) {
            return new MailManager($app);
        });
    }

    public function provides()
    {
        return ['mailer', 'mail.manager'];
    }
}
```
When either `mailer` or `mail.manager` is resolved, the whole provider loads.

## Architectural Decisions

### Why not make all providers deferred by default?
Eager providers are simpler—they always load, always boot, and their bindings are always available. Making all providers deferred would mean every `make()` call potentially triggers a provider load, introducing non-deterministic latency spikes and making the boot sequence unpredictable.

### Why use `when()` instead of always relying on `make()`?
If a deferred provider registers an event listener in `boot()`, it must load before the first event fires. `when()` ensures the provider loads as soon as the matched event is dispatched, before any listener execution. Without `when()`, the listener would miss the first event dispatch.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Services not used on a request skip register+boot entirely | First `make()` of a deferred service incurs provider load latency | Cold requests with many deferred services may see higher peak latency |
| Reduced memory per request (fewer provider objects instantiated) | Deferred provider classes must still be autoloaded if type-hinted | Autoloader still loads the class file; memory saved is the provider instance |
| Cleaner `provides()` contract makes dependencies explicit | Developers must maintain `provides()` list; missing entries cause bugs | Forgotten entries cause `BindingResolutionException` at runtime |
| Event-triggered loading (`when()`) preloads before needed | `when()` adds complexity; the event check runs on every dispatch | Every event dispatch checks the `when` manifest for matching providers |

## Performance Considerations

- **Manifest cache is essential:** Without `bootstrap/cache/services.php`, every request must reflect on every provider class to determine deferred status. This adds 5-20ms per request depending on provider count.
- **First `make()` penalty:** The first call to `make(DeferredService::class)` triggers both `register()` and `boot()` synchronously. For heavy providers (e.g., mail, notifications), this can add 10-50ms to the first usage.
- **Memory per deferred provider:** When a deferred provider is loaded, it adds ~2-5KB for the provider instance plus any singletons it registers. This is still less than loading all providers eagerly.
- **`when()` check cost:** Every event dispatch checks the `when` manifest. With 10+ deferred providers using `when()`, each event dispatch adds ~5-10µs for the check.
- **Late autoloading:** PHP's autoloader must load the provider class file when the deferred provider is triggered. With OPcache, this is a single `include()`; without, it's disk I/O.

## Production Considerations

- **Run `php artisan optimize` after every deployment:** This generates the services manifest. Without it, every request reflects providers.
- **Monitor deferred provider loads:** Unexpected deferred loads indicate missing `provides()` entries or type-hints that trigger resolution. Use Telescope to track `make()` calls.
- **Manage `when()` carefully:** Each entry in `when()` adds overhead to every event dispatch. Only use it when the provider must load before an event listener executes.
- **Octane and deferred providers:** Under Octane, a deferred provider loaded on the first request remains loaded for the worker's lifetime. Subsequent requests skip the `make()` penalty. This is a net positive but means provider memory is allocated per-worker.
- **Config caching interaction:** `config:cache` doesn't affect deferred provider resolution. Config values used inside deferred providers' `register()` are always available because config is loaded by the `LoadConfiguration` bootstrapper (which runs before any provider loads).

## Common Mistakes

- **Forgetting `provides()`:** A deferred provider without `provides()` will never be triggered by `make()`. The service will not be registered, and `BindingResolutionException` is thrown.
- **Using type-hints that trigger early loading:** If a controller's constructor type-hints a deferred service, the provider loads at controller resolution, not when the service is first used. This defeats the purpose of deferring.
- **Assuming deferred = never loaded:** Deferred providers still load when their service is resolved. They're not "optional"—they're "lazy."
- **Missing providers() for facade aliases:** If you register an alias in `register()`, the alias must also be in `provides()` or the alias resolution won't trigger the deferred provider.
- **Using `$defer = true` with `boot()` logic that must run early:** If your `boot()` registers event listeners that must catch early events, the provider might load too late. Use `when()` instead.
- **Not clearing the service cache:** After modifying `provides()`, the old services manifest prevents the updated list from taking effect. Run `php artisan optimize:clear`.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Binding not found | `Target [Service] is not instantiable` | `provides()` list doesn't include the resolved abstract | Ensure every binding in register() is in provides() |
| Deferred provider never loads | Service always null | Deferred provider never triggered because no make() call | Manually resolve in boot() or remove defer |
| Event listener in deferred provider doesn't fire | Listener callback never executes | Provider loads after event already dispatched | Use `when()` to trigger provider load on event dispatch |
| Manifest cache stale after provider changes | Old bindings; missing services | `bootstrap/cache/services.php` references old provider class | Run `php artisan optimize:clear` and re-optimize |
| Deferred provider loaded on every request anyway | No performance benefit | Type-hint in widely-used class (e.g., middleware constructor) triggers make() | Audit type-hints; use lazy resolution ($proxy) |

## Ecosystem Usage

- **Laravel Mail:** `Illuminate\Mail\MailServiceProvider` is deferred. It provides `mailer` and `mail.manager`. It only loads when the Mail facade or `mailer()` helper is called.
- **Laravel Notifications:** `Illuminate\Notifications\NotificationServiceProvider` is deferred. It provides `NotificationChannelManager` and only loads when notifications are sent.
- **Laravel Horizon:** Horizon's own service providers are typically deferred. They load when queue monitoring is triggered, not on every request.
- **Socialite Providers (Laravel Socialite):** Socialite is deferred—it provides `Laravel\Socialite\Contracts\Factory` and only loads when OAuth authentication is initiated.
- **Spatie Media Library:** Not deferred by default because it registers route macros in `boot()`. If you don't need URL generation, you can defer it manually.
- **Barryvdh DomPDF:** Typically deferred because PDF generation is an infrequent operation. It provides the `pdf` singleton.

## Related Knowledge Units

### Prerequisites
- [Register Phase Order](../register-phase-order/02-knowledge-unit.md) — how deferred providers are detected and skipped during the register phase.
- [Complete Boot Sequence](../complete-boot-sequence/02-knowledge-unit.md) — the full pipeline where deferred loading fits.

### Related Topics
- [Boot Phase Order](../boot-phase-order/02-knowledge-unit.md) — how deferred providers boot lazily rather than during the main boot phase.
- [Lifecycle Callback Hooks](../lifecycle-callback-hooks/02-knowledge-unit.md) — callbacks that may be missed if deferred providers load unexpectedly.
- [Services Cache](../caching-optimization/services-cache/02-knowledge-unit.md) — the manifest that enables deferred resolution without provider scanning.

### Advanced Follow-up Topics
- [Octane Boot Timing](../octane-boot-timing/02-knowledge-unit.md) — how deferred providers behave under long-running processes with amortized boot costs.
- [Console vs HTTP Boot Differences](../console-vs-http-boot-differences/02-knowledge-unit.md) — how deferred providers affect console command performance.
- [Bootstrap Warmup in CI/CD](../caching-optimization/bootstrap-warmup-in-cicd/02-knowledge-unit.md) — warmup strategies for deferred provider manifests.

## Research Notes
- Laravel 5.5 introduced the `$defer` property. Prior to 5.5, deferred providers were marked by implementing `DeferrableProvider` contract.
- Laravel 11 added the `DeferrableProvider` interface as the primary mechanism, deprecating `$defer` property. The interface approach enables IDE autocompletion and static analysis.
- The `when()` method was added in Laravel 5.8 to solve the problem of deferred providers needing to respond to events.
- Future Laravel versions may implement "auto-deferred" providers that detect whether `boot()` and `register()` have side effects and automatically defer if they don't.
- Octane's per-worker memory model makes deferred providers less critical for performance (boot cost is amortized), but they still help reduce per-request memory footprint.
