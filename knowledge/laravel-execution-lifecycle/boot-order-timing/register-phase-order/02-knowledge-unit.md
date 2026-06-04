# Register Phase Order

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **Last Updated:** 2026-06-02

## Executive Summary
The `register()` phase is the first half of Laravel's two-phase service provider initialization. During this phase, all registered providers (core, application, and package) have their `register()` method called in a deterministic order that ensures bindings are available before any provider boots. The order is determined by a merge of three provider sources: framework default providers, the `config/app.php` providers array, and package discovery providers. Understanding this ordering is essential for debugging binding conflicts, ensuring dependency availability, and optimizing provider loading.

## Core Concepts

### Provider Registration Flow
The `RegisterProviders` bootstrapper invokes `$app->registerConfiguredProviders()`, which:

1. **Collects all provider classes** from three sources:
   - `config/app.php` → `providers` array (application-defined providers)
   - Framework default providers (defined in `Application::registerCoreProviders()`)
   - Package discovery providers (loaded via `PackageManifest::providers()`)

2. **Creates a `ProviderRepository`** that manages the list and deferred detection

3. **Iterates and instantiates each provider**, calling `register()`:

```php
public function registerConfiguredProviders()
{
    $providers = Collection::make($this->config['app.providers'])
        ->merge(ProviderRepository::manifestProviderPaths(
            $this->getCachedServicesPath()
        ));

    $repository = new ProviderRepository($this, new Filesystem, $this->getCachedServicesPath());

    $repository->load($providers->toArray());
}
```

### The `ProviderRepository::load()` Method
```php
public function load(array $providers)
{
    // Load cached manifest if exists
    if ($this->app->runningInConsole() && $this->app->configurationIsCached()) {
        $manifest = $this->getManifest();
        foreach ($manifest['when'] as $provider => $events) {
            $this->app->make($provider)->register();
        }
    }

    // Register each provider
    foreach ($providers as $provider) {
        $this->registerProvider($provider);
    }
}
```

### Order Determination Rules
The final provider registration order is:

1. **Framework core providers** (registered first in `Application` constructor):
   - `Illuminate\Log\LogServiceProvider`
   - `Illuminate\Events\EventServiceProvider`
   - `Illuminate\Routing\RoutingServiceProvider`

2. **`config/app.php` providers** — in the exact order listed

3. **Package discovery providers** — appended after app providers, preserving the order from `PackageManifest`

Within each group, deferred providers are skipped during registration (they register only when their deferred binding is first resolved via `make()`).

### Deferred Provider Detection
During `registerConfiguredProviders()`, `ProviderRepository` checks if a provider has a `$defer` property:
```php
public function isDeferred($provider)
{
    return $provider->isDeferred() ?? false;
}
```
Deferred providers are collected into a manifest and their `register()` is NOT called during this phase. Instead, their bindings and `provides()` method define which services trigger lazy loading (handled in the Deferred Provider Loading Timing KU).

## Mental Models

### The Priority Queue
Think of provider registration like boarding an airplane:
- **Group 1 (Framework):** First class—boards first, sets up the cabin
- **Group 2 (config/app.php):** Business class—boards in ticket-order
- **Group 3 (Packages):** Economy—boards last, no guaranteed seat order within the group

### The Dependency Inversion
If Provider A in `register()` binds a service that Provider B needs to bind something related, A must appear before B in the providers array. This is not a framework guarantee—it's a configuration responsibility.

## Internal Mechanics

### `Application::register()` — The Core Method
```php
public function register($provider, $force = false)
{
    if (($registered = $this->getProvider($provider)) && ! $force) {
        return $registered;
    }

    if (is_string($provider)) {
        $provider = $this->resolveProvider($provider);
    }

    $provider->register();

    if (property_exists($provider, 'bindings')) {
        foreach ($provider->bindings as $key => $value) {
            $this->bind($key, $value);
        }
    }

    if (property_exists($provider, 'singletons')) {
        foreach ($provider->singletons as $key => $value) {
            $this->singleton($key, $value);
        }
    }

    $this->markAsRegistered($provider);

    if ($this->isBooted()) {
        $this->bootProvider($provider);
    }

    return $provider;
}
```

This method is called for each provider. After `register()`, it processes any `$bindings` and `$singletons` properties automatically, then marks the provider as registered. If the app is already booted (e.g., manually registering a provider later), it immediately boots the provider too.

### Binding Processing Order
Within a single provider's `register()`:
1. Developer's custom `register()` logic runs
2. Laravel processes `$provider->bindings` array
3. Laravel processes `$provider->singletons` array
4. Provider is added to `$this->serviceProviderList`

### Core Provider Registration Order
In `Illuminate\Foundation\Application::__construct()`:
```php
$this->register(new PathServiceProvider($this));
$this->register($this->coreAliases = [
    'app'           => [\Illuminate\Contracts\Container\Container::class],
    'container'     => [\Illuminate\Container\Container::class],
]);
$this->registerBaseBindings();
$this->registerCoreContainerAliases();
```
These are registered before `registerConfiguredProviders()` is called, ensuring the container is minimally operational.

## Patterns

### Ordered Registration
When a provider depends on bindings from another provider, ensure the dependency appears earlier:
```php
// config/app.php
'providers' => [
    App\Providers\DependencyProvider::class,  // Must register first
    App\Providers\MyProvider::class,          // Can use DependencyProvider's bindings
],
```

### Automatic Bindings Property
Use the `$bindings` and `$singletons` properties for simple bindings:
```php
class SimpleProvider extends ServiceProvider
{
    public $bindings = [
        SomeContract::class => SomeImplementation::class,
    ];

    public $singletons = [
        LoggerInterface::class  => FileLogger::class,
        CacheInterface::class   => RedisCache::class,
    ];

    public function register()
    {
        // Only for complex bindings that need closures
    }
}
```
These are processed automatically after `register()` completes, in a consistent order.

### Conditional Registration
```php
public function register()
{
    if ($this->app->environment('production')) {
        $this->app->singleton(Reporter::class, ProductionReporter::class);
    } else {
        $this->app->singleton(Reporter::class, DebugReporter::class);
    }
}
```

## Architectural Decisions

### Why separate `register()` from provider source collection?
Decoupling the collection of provider classes (`registerConfiguredProviders`) from the actual registration (`Application::register()`) allows the system to analyze all providers before executing any, enabling deferred provider detection and manifest caching.

### Why merge providers from three sources?
Framework providers must be registered first to set up core services (routing, events, logging). Application providers configure the user's app logic. Package providers are additive and belong last to allow app providers to override package bindings if needed.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Deterministic order within config/app.php | Package providers always last, cannot be interleaved | App providers cannot inject bindings between package providers |
| Automatic bindings/singletons properties | Simple bindings look like magic; devs may not notice they're processed after register() | Register logic that overrides bindings properties will be overwritten |
| Deferred detection during registration | Deferred providers' register() is skipped entirely | If a deferred provider has non-deferred dependencies, they must be resolved in boot() or make() |
| Manifest caching speeds up registration | Stale manifest causes incorrect provider lists | Must clear cache when changing provider structure |

## Performance Considerations

- **Manifest caching:** `php artisan optimize` generates a services manifest that maps providers to their deferred services. This eliminates the iteration of provider classes and reflection-based deferred detection.
- **Deferred providers:** Every non-deferred provider calls `register()` on every request. Marking providers as deferred moves their `register()` cost to the first `make()` of a service they provide.
- **Package discovery overhead:** `PackageManifest::providers()` reads the `vendor/composer/installed.json` file. This file is large and its parsing adds ~2-10ms to registration.
- **Binding overhead:** Simple bindings (`$bindings` property) are faster than closure bindings because they skip closure compilation.

## Production Considerations

- **Order in `config/app.php` matters:** When two providers bind the same abstract, the last registered provider wins (Laravel's container overwrites rebinds by default). Place higher-priority providers later.
- **Config caching:** `config:cache` does not affect provider registration order—it only caches config values. Provider lists still come from `config/app.php`.
- **Service caching:** `php artisan optimize` should run after every deployment. The cached services manifest skips the `PackageManifest` scan on every request.
- **Automatic bindings vs closure bindings:** `$bindings` properties are resolved immediately during registration. Closure bindings are lazy. Use closures for expensive instantiation.

## Common Mistakes

- **Assuming `register()` order matches `config/app.php` order exactly:** Package discovery providers are appended after all app providers. A package provider appearing early in the app's `providers` array will still be ordered after all app providers.
- **Calling `$this->app->make()` in `register()`:** The provider may call `make()` on a service that hasn't been registered yet because the other provider appears later in the list. Use `boot()` for resolution.
- **Expecting deferred providers to register:** A deferred provider's `register()` is never called until someone touches one of its provided services. If you add a listener in `register()` on a deferred provider, it won't register without the correct trigger.
- **Rebinding without checking:** If two providers bind the same abstract, the second silently overwrites the first. This can cause hard-to-debug issues when packages update.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Binding not found | `Target [Interface] is not instantiable` | Provider A registers binding, Provider B tries to resolve it in `register()` but A is deferred | Make provider B's dependency non-deferred, or move resolution to `boot()` |
| Package provider not registered | Features missing | `PackageManifest` not rebuilt after `composer install` | Run `composer dump-autoload` or `php artisan package:discover` |
| Service manifest stale | `Class not found` errors | `bootstrap/cache/services.php` references old classes | Run `php artisan optimize:clear` |
| Multiple bindings to same abstract | Unexpected implementation used | Two providers bind same interface; order determines winner | Explicitly choose which provider runs last, or use contextual binding |

## Ecosystem Usage

- **Laravel Horizon:** Registers queue-related bindings in `register()`. Its position in `config/app.php` ensures it runs after framework providers but Horizon's deferred monitoring worker is booted separately.
- **Laravel Passport:** In `register()`, Passport merges its configuration with `config/app.php` passport settings. It must run after `LoadConfiguration` but before any provider that reads passport config.
- **Spatie Media Library:** Registers bindings for media conversion managers in `register()`. Because it uses `$singletons`, these are available to all later providers.
- **Laravel Debugbar:** Registers its data collectors in `register()` and is typically placed near the end of `providers[]` to ensure it captures all other providers' registrations.

## Related Knowledge Units

### Prerequisites
- [Complete Boot Sequence](../complete-boot-sequence/02-knowledge-unit.md) — the full pipeline showing where registration fits.
- [Application Class Construction](../application-bootstrap/application-class-construction/02-knowledge-unit.md) — the base service providers registered in the constructor before the register phase.

### Related Topics
- [Boot Phase Order](../boot-phase-order/02-knowledge-unit.md) — the second half of the two-phase initialization.
- [Deferred Provider Loading Timing](../deferred-provider-loading-timing/02-knowledge-unit.md) — how deferred providers are detected and skipped during registration.
- [Lifecycle Callback Hooks](../lifecycle-callback-hooks/02-knowledge-unit.md) — callbacks that can be registered during the register phase.
- [Bootstrap with Event System](../bootstrap-with-event-system/02-knowledge-unit.md) — events dispatched around the RegisterProviders bootstrapper.

### Advanced Follow-up Topics
- [Services Cache](../caching-optimization/services-cache/02-knowledge-unit.md) — how the services manifest caches provider registration metadata.
- [Octane Boot Timing](../octane-boot-timing/02-knowledge-unit.md) — how registration phase behavior changes under long-running processes.
- [Config Caching](../caching-optimization/config-caching/02-knowledge-unit.md) — how config caching interacts with provider registration order.

## Research Notes
- Laravel 11 removed several core providers that were historically registered in `registerConfiguredProviders()`, instead moving them to the Application constructor as explicit `$this->register()` calls.
- The `$bindings` and `$singletons` automatic processing was introduced in Laravel 5.7. Prior to that, all bindings had to be explicitly written in `register()`.
- Future versions may merge `PackageManifest` more tightly with Composer's autoloader to reduce file I/O during the registration phase.
