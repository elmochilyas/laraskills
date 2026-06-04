## Make every custom service provider implement DeferrableProvider unless it has boot-time side effects
---
Category: Framework Usage
---
Apply the DeferrableProvider interface to all custom service providers by default, and only keep providers non-deferred when they register event listeners, middleware, or route models in their boot() method.
---
Reason: In Octane, provider boot() runs once per worker start, not per request. Deferred providers are not loaded until their bound service is first requested, saving worker startup time and memory. A provider that only registers container bindings (no boot-time side effects) costs memory and CPU on every worker start for zero benefit. Making deferral the default ensures every provider justifies its non-deferred status.
---
Bad Example:
```php
// Non-deferred provider with no boot-time side effects — wastes worker resources
class AnalyticsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AnalyticsService::class);
    }
    // No boot() method — no side effects, should be deferred
}
```

Good Example:
```php
// Deferred provider — loaded only when AnalyticsService is resolved
class AnalyticsServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register(): void
    {
        $this->app->singleton(AnalyticsService::class);
    }
    public function provides(): array
    {
        return [AnalyticsService::class];
    }
}
```
---
Exceptions: Service providers that register event listeners, middleware, route model bindings, or perform database migrations in boot() must remain non-deferred.
---
Consequences Of Violation: Unnecessary worker startup time and memory consumption, slower worker boot during rolling deployments, wasted resources for rarely-used services.

## Never pre-resolve services used in fewer than 50% of requests
---
Category: Performance
---
Add custom bindings to the pre_resolved list in config/octane.php only when the service is used on a majority of requests — defer rarely-used services to lazy resolution.
---
Reason: Pre-resolving a service resolves it once at worker boot and shares it across all requests. This saves 1-5ms per request but adds 1-5ms to worker boot time per service. For a service used in 5% of requests, pre-resolving adds boot time for every worker start while benefiting only 5% of requests. The default pre-resolved list covers the most common services — adding niche services worsens the boot time/resolution time tradeoff.
---
Bad Example:
```php
// Pre-resolving a rarely-used service — wasted boot time
'pre_resolved' => [
    // ... defaults ...
    'App\Services\ExportService', // Used in 2% of requests — should be lazy
]
```

Good Example:
```php
// Only pre-resolve services used on most requests
'pre_resolved' => [
    'auth', 'cache', 'config', 'db', 'encrypter', 'events', 'files',
    'log', 'queue', 'redirect', 'router', 'session', 'validator', 'view',
    // Custom: only if used in >50% of requests
]
```
---
Exceptions: Services whose resolution cost is very high (>50ms) may justify pre-resolution even with moderate usage.
---
Consequences Of Violation: Increased worker boot time with no measurable request-time benefit, slower rolling deployments, wasted CPU on pre-resolving rarely-used services.

## Never defer a service provider that registers event listeners, middleware, or route models in boot()
---
Category: Framework Usage
---
Audit every deferred provider candidate to confirm its boot() method has no side effects — event listener registrations, middleware, and route model bindings must not be deferred.
---
Reason: Deferred providers skip boot() entirely until one of their bound services is resolved. If boot() registers an event listener, that listener is never registered if the bound service is never resolved — causing silent failures. Middleware and route model bindings registered in a deferred provider's boot() will also be missing, potentially opening security holes where authentication middleware is not applied.
---
Bad Example:
```php
// Event listener in boot() — deferral prevents registration
class AuditServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function boot(): void
    {
        Event::listen(UserCreated::class, fn($e) => Log::audit($e));
        // This listener is NEVER registered if provider is deferred!
    }
}
```

Good Example:
```php
// Non-deferred — boot() side effects execute correctly
class AuditServiceProvider extends ServiceProvider // No DeferrableProvider
{
    public function boot(): void
    {
        Event::listen(UserCreated::class, fn($e) => Log::audit($e));
    }
}
```
---
Exceptions: Deferred providers that also register event listeners should be split into two providers — one deferred for bindings, one non-deferred for listeners.
---
Consequences Of Violation: Missing event listeners, unregistered middleware, broken route model bindings, silent functional failures in production.

## Run php artisan optimize after every service provider change in the deployment pipeline
---
Category: Maintainability
---
Include `php artisan optimize` (or individual route:cache, config:cache, event:cache) in the deployment pipeline after any service provider modification.
---
Reason: The optimize command compiles service container definitions, route registrations, config files, and event discovery into cached files. Without this, service provider resolution occurs on every worker start, adding 10-50ms to boot time. In rolling deployments where workers start sequentially, this adds minutes to deployment duration. Cached definitions reduce boot time to milliseconds.
---
Bad Example:
```bash
# Deploy without caching — every worker re-resolves providers
# 16 workers × 50ms each = 800ms added to deployment time
```

Good Example:
```bash
# Cache after provider changes
php artisan optimize  # ~2s total, saves 800ms per deploy cycle
```
---
Exceptions: Development environments where rapid iteration is prioritized over boot performance may skip the optimization step.
---
Consequences Of Violation: Slower worker boot, longer deployment times, unnecessary CPU load from repeated provider resolution on each worker start.
