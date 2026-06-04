# Register Phase Order Rules

## Rule 1: Never Resolve Services in register()
---
## Category
Framework Usage
---
## Rule
Never call `$this->app->make()` or `resolve()` inside any service provider's `register()` method.
---
## Reason
During the register phase, not all providers have registered their bindings. Resolving a service whose provider hasn't registered yet throws `BindingResolutionException`. The two-phase design guarantees all register() calls complete before any boot() call starts.
---
## Bad Example
```php
public function register()
{
    $this->app->bind(Logger::class, FileLogger::class);
    $logger = $this->app->make(Logger::class); // MAY FAIL — Logger may not be registered
}
```
---
## Good Example
```php
public function register()
{
    $this->app->bind(Logger::class, FileLogger::class);
}

public function boot()
{
    $logger = $this->app->make(Logger::class); // Safe — all providers registered
}
```
---
## Exceptions
Resolving `$this->app['config']` is safe because Config is a framework core provider registered before any app provider.
---
## Consequences Of Violation
`BindingResolutionException` during bootstrap. Non-deterministic failures depending on provider order in `config/app.php`.
---

## Rule 2: Know the Three Provider Source Merge Order
---
## Category
Architecture
---
## Rule
Understand that providers are registered in this merge order: framework core → `config/app.php` array → package discovery (appended last).
---
## Reason
Package discovery providers always boot after all application providers, regardless of their position in `config/app.php`. Framework core providers always boot first, before any application provider. This merge order is immutable and must be considered when designing cross-provider dependencies.
---
## Bad Example
```php
// Assumes package provider can be positioned before app provider in the array
'providers' => [
    SomePackage\ServiceProvider::class,  // Still runs after all app providers
    App\Providers\MyProvider::class,     // because auto-discovery appends it last
],
```
---
## Good Example
```php
// Add package provider explicitly — still runs after app providers
// Document this behavior
'providers' => [
    App\Providers\MyProvider::class,
    // Package providers always append — use explicitly for clarity
    SomePackage\ServiceProvider::class, // Still registered via auto-discovery too
],
// To control position, disable auto-discovery and register manually
```
---
## Exceptions
Framework core providers — they are always first and cannot be moved.
---
## Consequences Of Violation
Surprise when a package provider's `boot()` runs after all app providers. Undocumented ordering assumptions break when package providers are added or removed.
---

## Rule 3: Place Framework Core Providers First, Infrastructure Next
---
## Category
Code Organization
---
## Rule
Order `config/app.php` providers with infrastructure providers first, domain services in the middle, and presentation/UI providers last.
---
## Reason
Layered ordering creates predictable dependency direction. Infrastructure providers (logging, config, error handling) must register their bindings before domain services that depend on them. Domain services must register before presentation providers that consume them.
---
## Bad Example
```php
'providers' => [
    App\Providers\RouteServiceProvider::class,
    App\Providers\AnalyticsServiceProvider::class,
    App\Providers\AppServiceProvider::class,
],
```
---
## Good Example
```php
'providers' => [
    // Infrastructure
    App\Providers\AppServiceProvider::class,
    App\Providers\LoggingServiceProvider::class,

    // Domain
    App\Providers\PaymentServiceProvider::class,
    App\Providers\AnalyticsServiceProvider::class,

    // Presentation
    App\Providers\EventServiceProvider::class,
    App\Providers\RouteServiceProvider::class,
],
```
---
## Exceptions
Small applications (under 5 providers) where the layering is obvious without explicit grouping.
---
## Consequences Of Violation
Provider list is hard to audit. New providers are added at the end without considering dependency direction, leading to ordering bugs.
---

## Rule 4: Add Package Providers Explicitly for Position Control
---
## Category
Maintainability
---
## Rule
Disable auto-discovery and register package providers explicitly when precise interleaving with application providers is required.
---
## Reason
By default, package discovery providers are appended after all application providers. If a package must initialize (e.g., register bindings or boot logic) before specific application providers, auto-discovery must be disabled and the package provider added at the correct position in `config/app.php`.
---
## Bad Example
```php
// Relying on auto-discovery — package always runs last
'providers' => [
    ApplicationProvider::class,  // Wants package bindings available
    // Package not listed — auto-discovered after
];
```
---
## Good Example
```php
// Disable auto-discovery for the package in composer.json
// "extra": { "laravel": { "dont-discover": ["package/name"] } }

// Register explicitly at the correct position
'providers' => [
    Package\ServiceProvider::class,  // Now runs before ApplicationProvider
    ApplicationProvider::class,
],
```
---
## Exceptions
Package providers with no ordering dependencies relative to application providers.
---
## Consequences Of Violation
Package bindings unavailable when application providers boot. Fragile ordering that breaks when packages are updated or added.
---

## Rule 5: Keep register() Minimal — Bindings and Properties Only
---
## Category
Performance
---
## Rule
Limit each provider's `register()` method to container bindings, `$bindings`/`$singletons` properties, and config merging.
---
## Reason
Every non-deferred provider's `register()` runs on every request. Heavy operations (file parsing, network calls, complex logic) here delay the entire boot sequence for all providers. The register phase is O(n) on provider count — each provider's execution time compounds.
---
## Bad Example
```php
public function register()
{
    $data = file_get_contents(storage_path('app/init.json')); // I/O in register
    $config = json_decode($data, true);
    $this->app->bind(Service::class, fn() => new Service($config));

    $this->app->singleton(Logger::class, fn() => new Logger());
    $this->callExternalApi(); // Network call in register
}
```
---
## Good Example
```php
public function register()
{
    $this->app->singleton(Logger::class, fn() => new Logger());
    $this->mergeConfigFrom(__DIR__.'/../config/service.php', 'service');
}

public function boot()
{
    // Heavy initialization moved here
    app(Service::class)->initialize();
}
```
---
## Exceptions
`mergeConfigFrom()` calls — these are lightweight and must run in `register()` to be available to other providers.
---
## Consequences Of Violation
Every request pays for I/O and computation that should run once. Bootstrap time increases linearly with provider complexity.
---

## Rule 6: Regenerate Services Cache After Provider Changes
---
## Category
Maintainability
---
## Rule
Run `php artisan optimize:clear` after adding, removing, or reordering providers in `config/app.php`.
---
## Reason
The services cache (`bootstrap/cache/services.php`) caches the provider list and deferred provider manifests. A stale cache will not reflect provider additions, removals, or reordering, leading to `BindingResolutionException` or continued use of removed providers.
---
## Bad Example
```php
// Removed a provider from config/app.php
// Deployed without clearing cache
// Old provider still referenced in stale manifest — resolution errors
```
---
## Good Example
```php
// After provider changes:
// php artisan optimize:clear
// php artisan optimize
// Verify: check bootstrap/cache/services.php
```
---
## Exceptions
Development environments where the services cache is not used.
---
## Consequences Of Violation
New providers silently not registered. Removed providers still resolve from stale manifest. Reordering not reflected in boot order.
