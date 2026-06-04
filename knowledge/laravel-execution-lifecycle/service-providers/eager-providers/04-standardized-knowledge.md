# Eager Providers

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Eager Providers |
| Difficulty | Intermediate |
| Lifecycle Phase | Bootstrap |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Eager providers are registered and booted on every request. All providers listed in `bootstrap/providers.php` are eager unless they implement `DeferrableProvider`. Eager providers are suitable for services needed on every request (logging, error handling, routing, events) and providers that register boot-time artifacts (routes, event listeners, middleware). The critical tradeoff is predictability vs. performance: eager providers maximize determinism (they always run at known times) but add overhead to every request.

## Core Concepts
- **Always-On Registration** — `register()` and `boot()` execute on every request for eager providers.
- **Default Behavior** — Any provider not implementing `DeferrableProvider` is eager.
- **Boot-Time Registration** — Eager providers suitable for routes, event listeners, middleware, view composers.
- **Provider List** — `bootstrap/providers.php` contains all eager providers (Laravel 11+).

## When To Use
- Foundational services needed on every request (config, events, routing, database, logging).
- Providers that register boot-time artifacts (routes, event listeners, middleware, Blade directives).
- Providers that merge configuration that other providers depend on.

## When NOT To Use
- Services used on a small subset of routes (use deferred providers instead).
- Packages providing optional functionality rarely needed.
- Development-only tooling deployed to production (use environment-specific registration).

## Best Practices
- **Keep eager providers lightweight** — `register()` and `boot()` run on every request; minimize their work.
- **Audit eager provider count** — Each eager provider adds ~0.1-0.5ms bootstrap time; monitor cumulative impact.
- **Prefer deferred for rarely-used services** — If a provider's services are used on <30% of routes, consider deferred.
- **Profile bootstrap time** — Use Laravel Debugbar or Xdebug to measure each provider's contribution.
- WHY: Eager is the default for predictability, but every provider should justify its eagerness. The performance cost is linear: more providers = slower boots.

## Architecture Guidelines
- All core framework providers are eager: `FoundationServiceProvider`, `AuthServiceProvider`, `EventServiceProvider`, etc.
- `Application::registerConfiguredProviders()` reads `bootstrap/providers.php`, filters out deferred providers, and registers the rest as eager.
- Eager provider registration order is the order in `bootstrap/providers.php` — dependent providers must come after their dependencies.
- Auto-discovered packages are eagerly registered unless they implement `DeferrableProvider`.

## Performance Considerations
- Cumulative eager provider cost is linear: each provider = constructor + `register()` + `boot()`.
- 30 eager providers add ~10-30ms bootstrap time depending on provider workload.
- Deferred providers are the primary optimization strategy for reducing eager overhead.
- Config cache serializes provider registration but does not eliminate eager provider iteration.

## Security Considerations
- An eager provider crash prevents the entire application from booting — all requests fail.
- Development-only eager providers (Debugbar, Telescope) deployed to production increase attack surface.
- Eager providers have full access to the container during boot — audit for security-sensitive registrations.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Making every provider deferred for "optimization" | Not understanding boot-time registration needs | Routes/listeners not registered | Keep boot-time registration providers eager |
| Multiple tiny providers when one suffices | SRP over-application | Exacerbated eager overhead | Consolidate related bindings |
| Assuming a provider is deferred when it's actually eager | Not checking `DeferrableProvider` | Unexpected bootstrap overhead | Verify with `php artisan about` |
| Eager provider crash prevents app boot | Unhandled exception in `register()`/`boot()` | All requests fail | Add error handling in critical providers |

## Anti-Patterns
- **Unintentional Eager Provider** — Package that should be deferred doesn't implement `DeferrableProvider`, causing unnecessary overhead.
- **Eager Provider Loading Large Datasets** — Loading all permissions/rules from database in `boot()` creates memory pressure on every request.
- **God Eager Provider** — Single provider registering everything, impossible to selectively defer.

## Examples

### Typical core eager provider
```php
class FoundationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(ExceptionHandler::class, Handler::class);
        // Core bindings needed by all other providers
    }

    public function boot(): void
    {
        MacroService::boot();
        // Boot-time setup required by the entire framework
    }
}
```

## Related Topics
- **Prerequisites:** Provider Fundamentals, Register vs Boot Methods
- **Closely Related:** Deferred Providers, Environment-Specific Providers
- **Advanced:** Provider Sprawl and Governance, Boot Order Timing
- **Cross-Domain:** Caching (config cache and eager provider interaction)

## AI Agent Notes
- When profiling slow bootstrap, identify eager providers with heavy `boot()` methods.
- Check `php artisan about` for full provider list — spot unexpected eager providers from packages.
- For high-throughput applications, minimize eager provider count aggressively.

## Verification
- [ ] Can distinguish eager vs deferred providers and their tradeoffs
- [ ] Know which providers must be eager (boot-time registrations)
- [ ] Can profile eager provider overhead using Debugbar or Xdebug
- [ ] Understand the default behavior (eager unless `DeferrableProvider`)
- [ ] Can audit provider list for unnecessarily eager providers
