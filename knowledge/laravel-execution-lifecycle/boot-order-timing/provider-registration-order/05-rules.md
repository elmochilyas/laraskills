# Provider Registration Order Rules

## Rule 1: Order Providers by Dependency Direction
---
## Category
Architecture
---
## Rule
Place foundational service providers (auth, config, logging) before dependent service providers in the `config/app.php` providers array.
---
## Reason
Providers boot in registration order. A provider that depends on another provider's bindings in `boot()` must be registered after that provider. Infrastructure providers should appear first, domain services in the middle, and presentation/UI providers last.
---
## Bad Example
```php
'providers' => [
    App\Providers\RouteServiceProvider::class,     // Depends on Router
    App\Providers\AuthServiceProvider::class,       // Foundation — should be first
    App\Providers\AppServiceProvider::class,
],
```
---
## Good Example
```php
'providers' => [
    // Infrastructure first
    App\Providers\AppServiceProvider::class,
    App\Providers\AuthServiceProvider::class,

    // Domain services
    App\Providers\PaymentServiceProvider::class,

    // Presentation last
    App\Providers\RouteServiceProvider::class,
    App\Providers\EventServiceProvider::class,
],
```
---
## Exceptions
Providers with no cross-provider dependencies have no ordering constraints.
---
## Consequences Of Violation
`BindingResolutionException` in `boot()` when a provider tries to resolve a service whose provider hasn't registered yet. Fragile bootstrap sequence.
---

## Rule 2: Add Package Providers Explicitly for Position Control
---
## Category
Maintainability
---
## Rule
Add package providers explicitly to `config/app.php` when they must interleave between application providers.
---
## Reason
Package discovery providers are appended after all application providers. If a package provider must boot before certain application providers, it must be registered explicitly at the correct position in `config/app.php` rather than relying on auto-discovery.
---
## Bad Example
```php
// Relying on auto-discovery — package provider always boots after all app providers
// Relying on undocumented PackageManifest order
'providers' => [
    // Package provider not listed — discovers automatically
],
```
---
## Good Example
```php
'providers' => [
    App\Providers\AppServiceProvider::class,
    // Debugbar must boot before route registration for accurate profiling
    Barryvdh\Debugbar\ServiceProvider::class,
    App\Providers\RouteServiceProvider::class,
],
```
---
## Exceptions
Package providers that have no boot-time dependencies on application provider order.
---
## Consequences Of Violation
Package provider boots after all app providers regardless of intent. If a package must initialize before an app provider, the initialization happens too late.
---

## Rule 3: Document Provider Ordering Expectations
---
## Category
Maintainability
---
## Rule
Add inline comments in `config/app.php` when a provider's position in the array is semantically significant.
---
## Reason
The ordering of `config/app.php` providers is the primary control point for registration order. Without documentation, future developers may reorder providers arbitrarily, silently breaking dependencies that were not obvious.
---
## Bad Example
```php
'providers' => [
    App\Providers\PaymentServiceProvider::class,
    App\Providers\AnalyticsServiceProvider::class, // Why here? No comment
],
```
---
## Good Example
```php
'providers' => [
    App\Providers\PaymentServiceProvider::class,
    // AnalyticsServiceProvider requires PaymentServiceProvider's bindings in boot()
    App\Providers\AnalyticsServiceProvider::class,
],
```
---
## Exceptions
Providers with no dependencies on other providers' position.
---
## Consequences Of Violation
Silent breakage when providers are reordered. Debugging time wasted on issues caused by ordering changes unrelated to the code being modified.
---

## Rule 4: Avoid Inter-Provider Coupling When Possible
---
## Category
Architecture
---
## Rule
Refactor to remove ordering dependencies between providers instead of relying on manual ordering in `config/app.php`.
---
## Reason
A dependency chain where Provider A requires B, B requires C, all manually ordered, is fragile. Any addition, removal, or reordering risks breaking the chain. Use contextual binding or merge providers whose lifecycle is tightly coupled.
---
## Bad Example
```php
// Three providers, each depending on the previous
'providers' => [
    ProviderA::class, // LoggerService
    ProviderB::class, // Depends on LoggerService
    ProviderC::class, // Depends on ProviderB's services
];
```
---
## Good Example
```php
// Merge tightly coupled providers or use contextual binding
'providers' => [
    ConsolidatedProvider::class, // Registers all three service groups
];
// Or use deferred providers to break the chain
```
---
## Exceptions
Framework core providers that other providers legitimately depend on (e.g., every provider depends on the container and config).
---
## Consequences Of Violation
Brittle provider list that breaks with every change. High maintenance cost. Fear of reordering prevents necessary refactoring.
---

## Rule 5: Group Providers by Layer
---
## Category
Code Organization
---
## Rule
Organize the `config/app.php` providers array by architectural layer: infrastructure first, domain services middle, presentation/UI last.
---
## Reason
Layered ordering creates a predictable dependency direction. Infrastructure providers (logging, error handling) provide foundation services. Domain providers depend on infrastructure. Presentation providers (routes, views) depend on domain services. This organization makes the provider list self-documenting and easier to maintain.
---
## Bad Example
```php
'providers' => [
    App\Providers\EventServiceProvider::class,
    App\Providers\AnalyticsServiceProvider::class,
    App\Providers\AppServiceProvider::class,
    App\Providers\RouteServiceProvider::class,
    App\Providers\PaymentServiceProvider::class,
    // No logical grouping
],
```
---
## Good Example
```php
'providers' => [
    // === Infrastructure ===
    App\Providers\AppServiceProvider::class,
    App\Providers\LoggingServiceProvider::class,

    // === Domain Services ===
    App\Providers\PaymentServiceProvider::class,
    App\Providers\AnalyticsServiceProvider::class,

    // === Presentation ===
    App\Providers\EventServiceProvider::class,
    App\Providers\RouteServiceProvider::class,
],
```
---
## Exceptions
Small applications with fewer than 5 providers where layers are clear without grouping.
---
## Consequences Of Violation
Unordered provider list makes it hard to identify dependencies. New providers added at the end without considering where they belong.
---

## Rule 6: Regenerate Services Cache After Provider Changes
---
## Category
Maintainability
---
## Rule
Always run `php artisan optimize:clear` after adding, removing, or reordering service providers.
---
## Reason
The services cache (`bootstrap/cache/services.php`) caches the provider list and their deferred status. A stale cache will not reflect provider additions, removals, or reordering changes, leading to `BindingResolutionException` or continued use of removed providers.
---
## Bad Example
```php
// Added new provider to config/app.php
// Deployed without clearing cache
// Provider never registered — services it provides not found
```
---
## Good Example
```php
// After modifying config/app.php:
// php artisan optimize:clear
// php artisan optimize
// Verify: inspect bootstrap/cache/services.php for new provider
```
---
## Exceptions
Development environments where Laravel detects provider changes and regenerates automatically.
---
## Consequences Of Violation
New providers silently not registered. Removed providers still resolve from stale manifest. Reordering not reflected.
