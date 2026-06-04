# Deferred Provider Loading Timing

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Boot Order & Timing |
| Knowledge Unit | Deferred Provider Loading Timing |
| Difficulty | Advanced |
| Lifecycle Phase | Provider Initialization |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Deferred providers are service providers that implement `Illuminate\Contracts\Support\DeferrableProvider` (or historically, set `$defer = true`). Unlike eager providers, their `register()` and `boot()` methods are not called during the main bootstrap pipeline. Instead, they are loaded lazily — the first time one of their provided services is resolved from the container. This optimization reduces bootstrap overhead by deferring provider initialization until the service is actually needed.

## Core Concepts
- **DeferrableProvider interface**: A marker interface that signals to the framework that a provider should be deferred.
- **provides() method**: Returns an array of service identifiers (binding names, class names, interfaces) that the provider registers.
- **Deferred manifest**: `bootstrap/cache/services.php` maps service identifiers to their provider. The container uses this map to trigger lazy loading.
- **Lazy registration on resolve**: When `$app->make('service')` is called and no binding exists, the container checks the manifest, finds the deferred provider, calls its `register()`, then immediately calls `boot()` (if the app is already booted).
- **No boot() skip**: Deferred providers that have boot logic cannot be deferred — `boot()` is called on first resolution, not during the main boot phase.
- **Services cache**: Without the services cache, the framework falls back to scanning all providers to determine which are deferred — this is slower but works.

## When To Use
- Providers that only register bindings in `register()` and have no `boot()` method.
- Providers whose services are not needed on every request (e.g., admin panel providers, reporting services).
- Package providers that offer optional features rarely used together.

## When NOT To Use
- Providers with boot() logic that must run on every request (route registration, event listeners, view composers).
- Providers that register middleware, commands, or scheduled tasks — these registrations happen in boot().
- When the provider's services are used on most requests — deferral adds a first-use latency spike without significant savings.

## Best Practices (WHY)
- **Defer providers that only bind**: If a provider has no `boot()` method and only registers bindings, make it deferred. *Why: Saves both register() and boot() overhead on requests that don't use those services.*
- **Audit provider services**: List all services a provider registers and check if they are used on every request. *Why: If most requests use them, deferral provides no benefit and adds complexity.*
- **Clear cache after changes**: Run `php artisan optimize:clear` after changing deferred provider status. *Why: The services manifest caches which providers are deferred — stale manifest means stale deferral behavior.*
- **Test deferred loading**: Ensure services from deferred providers resolve correctly under cache. *Why: Manifest changes can break deferred resolution if the provides() method changes without cache clear.*

## Architecture Guidelines
- Deferred providers are registered in `config/app.php` like eager providers — the framework decides at runtime which behavior applies.
- The `provides()` method must return all services the provider registers — missing a service breaks resolution.
- Deferred providers are resolved when `make()` is called with a service the manifest maps to the provider.
- The `when()` method on deferred providers allows conditional deferral — the provider loads when a specific binding is resolved, not when its own service is resolved.
- In Laravel 8+, `DeferrableProvider` replaces the `$defer` property pattern.

## Performance
- Deferred providers save 100% of their register() and boot() overhead on requests that don't use their services.
- First resolution of a deferred service pays a ~1-5ms penalty for provider loading + service construction.
- The services cache eliminates the need to scan providers for deferral status, saving ~2-10ms per request.
- Without the manifest, every request loads and inspects all providers to check for deferral — this defeats the optimization.

## Security
- Deferred providers register their services lazily — a security service never loaded cannot be exploited, but also cannot protect.
- Ensure authentication and authorization providers are NOT deferred — they must run on every authenticated request.
- Package deferred providers may expose services earlier or later than expected — verify timing in security-critical paths.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Missing service in provides() | Adding a new binding to register() without updating provides() | Service not found — provider never loaded | Keep provides() in sync with registered services |
| Deferring with boot() logic | Provider has route/listener registration in boot() | Boot() still runs on first resolution — no savings | Split bindings into deferred provider, boot logic into eager provider |
| Not clearing services cache | Changing provider's deferral status without clearing cache | Old manifest used — wrong deferral behavior | Run optimize:clear after provider changes |
| Assuming deferred = zero cost | First resolution still pays full registration + boot cost | Latency spike on first use | Pre-resolve during warmup if the service is always needed |
| No boot() in deferred provider | Provider has no boot() but expects register() to handle setup | Setup code that should be in boot() may not execute correctly | Keep register() for bindings only |

## Anti-Patterns
- **Deferring everything**: Making all providers deferred — boot-only logic breaks, and latency spikes affect user-facing services.
- **Hidden boot() in deferred provider**: Having a boot() method in a deferred provider thinking it won't run — it runs on first resolution.
- **Stale manifest blindness**: Not realizing that provider changes require manifest regeneration — troubleshooting "missing service" errors without clearing cache.
- **Over-deferral**: Deferring a provider whose services are used on 90%+ of requests — the optimization gains are marginal.

## Examples
```php
use Illuminate\Contracts\Support\DeferrableProvider;

class AnalyticsServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register()
    {
        $this->app->singleton(AnalyticsService::class, function ($app) {
            return new AnalyticsService($app['config']['analytics.key']);
        });
    }

    public function provides()
    {
        return [AnalyticsService::class];
    }
}
```

## Related Topics
- **Prerequisites:** Register Phase Order — the phase that deferred providers skip.
- **Closely Related:** Eager Providers — the counterpart to deferred providers.
- **Advanced:** Services Cache — the manifest that enables deferred provider resolution.
- **Cross-Domain:** Octane Boot Timing — how deferred providers interact with long-running processes.

## AI Agent Notes
- `DeferrableProvider` is a contract in `Illuminate\Contracts\Support\DeferrableProvider`.
- The manifest is generated by `Illuminate\Foundation\ProviderRepository::createManifest()`.
- To check if a provider is deferred at runtime: `$app->isDeferredService('service-name')`.
- Deferred providers that use `when()` for conditional deferral are stored in the `when` array of the manifest.

## Verification
- [ ] Deferred providers implement `DeferrableProvider` interface (not just `$defer` property)
- [ ] `provides()` method returns ALL services the provider registers
- [ ] No boot() logic that must run on every request for deferred providers
- [ ] Services cache is regenerated after changing deferred provider status
- [ ] First-use latency spike for deferred services is acceptable in production
