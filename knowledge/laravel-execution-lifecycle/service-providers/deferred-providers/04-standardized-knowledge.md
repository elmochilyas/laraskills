# Deferred Providers

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Deferred Providers |
| Difficulty | Intermediate |
| Lifecycle Phase | Bootstrap (Optimization) |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Deferred providers delay provider instantiation and booting until one of their declared services is actually requested from the container. Implemented via the `DeferrableProvider` interface and the `provides()` method, this optimization eliminates unnecessary provider overhead from every request where the provider's services aren't used. The deferred provider manifest (`bootstrap/cache/services.php`) maps service identifiers to provider classes for on-demand loading. The critical engineering tradeoff is bootstrap speed vs. first-use latency and manifest management complexity.

## Core Concepts
- **`DeferrableProvider` Interface** — Marks a provider as deferred; container skips it during normal boot.
- **`provides()` Method** — Returns array of service identifiers (class/interface names, aliases) the provider registers.
- **Deferred Manifest** — `bootstrap/cache/services.php` maps services → provider classes.
- **On-Demand Loading** — When `$app->make('service')` is called and service is in manifest, provider is instantiated, `register()` and `boot()` run, then resolution completes.
- **Eager vs Deferred** — Eager providers run on every request; deferred providers run only when their services are requested.

## When To Use
- Providers that register services used on a subset of routes (e.g., notification, mail, hash services).
- Packages providing optional functionality not needed on every request.
- Performance optimization when provider count is high and many providers are rarely needed.

## When NOT To Use
- Providers that register routes, event listeners, middleware, or views in `boot()` (these must run at boot time).
- Providers that have side effects in `register()` that must happen at startup.
- Providers whose services are used on most requests (the deferred overhead outweighs the savings).

## Best Practices
- **Implement `DeferrableProvider` and `provides()` together** — Missing `provides()` means the provider never loads.
- **Return all service identifiers from `provides()`** — Every binding registered in `register()` must be listed; otherwise some services silently never resolve.
- **Rebuild manifest after changes** — Always run `php artisan optimize` after adding/changing deferred providers.
- **Do not defer providers with `boot()` side effects** — If `boot()` registers routes, views, or listeners, the provider cannot be deferred.
- WHY: Deferred providers are the most impactful bootstrap optimization — they eliminate provider overhead entirely for routes that don't use the provider's services.

## Architecture Guidelines
- The manifest is built by `ProviderRepository::loadManifest()` scanning all providers for `isDeferred()`.
- Deferred providers are never instantiated during normal boot — they exist only as entries in the manifest.
- When a deferred service is resolved, the provider is registered via `$app->register()` which calls `register()` and `boot()`.
- After first load, the provider remains registered for subsequent resolutions — no repeat overhead.

## Performance Considerations
- Deferred providers add zero bootstrap time until their services are first requested.
- First resolution of a deferred service is slightly slower (provider must load + register + boot on-demand).
- Manifest is a single file read with a small array — negligible overhead.
- A provider used on 10% of routes saves 90% of its overhead on those other routes.

## Security Considerations
- Stale manifest after code changes can cause silent resolution failures — always rebuild in deployment.
- Manifest file (`bootstrap/cache/services.php`) should not be writable by web server in production.
- Deferred provider loading occurs mid-request — if the provider throws, it produces a 500 error on specific pages while other routes work.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Forgetting `provides()` or returning empty array | Missing interface implementation | Provider never loads; services silently unavailable | Always implement `provides()` with all service IDs |
| Listing services in `provides()` that aren't registered in `register()` | `provides()` out of sync with code | Manifest includes stale entries | Keep `provides()` in sync with `register()` bindings |
| Deferring provider with route/event registration | `boot()` has side effects needed at startup | Routes/listeners not registered until first service resolution | Make provider eager, or split into eager + deferred |
| Not rebuilding manifest after changes | Unaware of manifest caching | Stale manifest — changes not reflected | Run `php artisan optimize` in deployment |

## Anti-Patterns
- **Deferring Everything** — Making every provider deferred without considering boot-time registration requirements.
- **Stale Manifest** — Deploying code changes without rebuilding the manifest.
- **Partial provides()** — Listing some but not all registered services in `provides()`.

## Examples

### Deferred provider implementation
```php
class MailServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register(): void
    {
        $this->app->singleton(MailManager::class);
        $this->app->bind(Mailer::class, MailManager::class);
    }

    public function provides(): array
    {
        return [
            MailManager::class,
            Mailer::class,
            'mailer',
        ];
    }
}
```

## Related Topics
- **Prerequisites:** Provider Fundamentals, Service Container
- **Closely Related:** Eager Providers, Register vs Boot Methods
- **Advanced:** Boot Order Timing, Provider Sprawl and Governance
- **Cross-Domain:** Caching (manifest regeneration in deployment)

## AI Agent Notes
- When debugging "service not resolving" with deferred providers, check: (1) does `provides()` include the service? (2) is manifest rebuilt? (3) delete `bootstrap/cache/services.php` and re-run `optimize`.
- Deferred providers are the first thing to check when provider changes don't take effect after deployment.
- `provides()` must match what `register()` registers — not what `boot()` does.

## Verification
- [ ] Can implement `DeferrableProvider` and `provides()` correctly
- [ ] Understand when a provider cannot be deferred (boot-time registrations)
- [ ] Know how the deferred manifest works and when to rebuild it
- [ ] Can diagnose stale manifest issues
- [ ] Can decide whether a given provider should be eager or deferred
