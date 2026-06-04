# ku-02: Provider Registration Order

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **KU:** ku-02-provider-registration-order
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
The order in which service providers are registered determines the order in which they boot. Providers are merged from three sources: framework core providers, the `config/app.php` providers array, and package discovery providers. Understanding this merge order is essential for resolving binding conflicts and ensuring dependencies are available when needed.

## Core Concepts
- **Three provider sources**: Framework core (registered in Application constructor), `config/app.php` providers array (in listed order), package discovery providers (appended last).
- **Framework core providers**: `LogServiceProvider`, `EventServiceProvider`, `RoutingServiceProvider` — registered first in `Application::__construct()`.
- **config/app.php providers**: Registered in exact array order. This is the primary control point for registration order.
- **Package discovery providers**: Appended after all app providers, loaded via `PackageManifest::providers()` from `vendor/composer/installed.json`.
- **Deterministic within groups**: Registration order within the framework and config/app.php groups is deterministic. Package discovery order depends on the manifest file.
- **Boot order mirrors register order**: Providers boot in the exact order they were registered. The `$serviceProviderList` preserves insertion order.

## When To Use
- Explicit order control in `config/app.php` when one provider's `boot()` depends on another provider's bindings.
- Adding package providers explicitly to `config/app.php` when interleaving is needed between app and package providers.
- Debugging binding-not-found errors by checking if the registering provider appears before the resolving provider.

## When NOT To Use
- Do not rely on package discovery order for critical dependencies — it's an implementation detail of `PackageManifest`.
- Do not reorder framework core providers — they are hardcoded in `Application::__construct()`.
- Do not register the same provider twice — `Application::register()` returns the existing instance if already registered.

## Best Practices (WHY)
- **Place foundational providers first**: Auth, config, and logging providers should appear early in the array.
- **Place dependent providers later**: Providers that use other services in `boot()` should appear after the providers that register those services.
- **Document ordering expectations**: If a provider requires a specific position, add a comment in `config/app.php`.
- **Avoid inter-provider coupling**: If Provider A must come before Provider B, consider merging the providers or using contextual binding instead.

## Architecture Guidelines
- Group providers by layer in `config/app.php`: infrastructure first, domain services middle, presentation/UI last.
- Use explicit `providers` array ordering for app providers — never rely on alphabetical or filesystem ordering.
- Package providers that must interleave with app providers should be added explicitly rather than relying on auto-discovery.
- Consider using `DeferrableProvider` for providers that only bind — registration order matters less if they boot lazily.

## Performance
- Provider iteration during registration is O(n). 50 providers add ~0.5-2ms overhead regardless of order.
- Reordering does not affect registration speed — the cost is per-provider, not positional.
- Package provider discovery adds ~2-10ms for reading `installed.json`. Eliminated by services cache.

## Security
- A provider registered later can override bindings from an earlier provider. Be aware of which provider "wins" when two bind the same abstract.
- Package discovery providers run after app providers — a malicious package cannot override app bindings unless explicitly configured.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Assuming config/app.php order is final | Package discovery providers appended after app providers | Not understanding the three-source merge | Package provider boots after all app providers regardless of config order | Add package provider explicitly in config/app.php at the correct position |
| Not ordering dependencies | Provider A depends on B's binding but A is listed before B | Assuming autoload handles it | Binding not found in A's boot() | Place B before A in providers array |
| Overriding without intent | Two providers bind same abstract; last one wins | Packages registering conflicting bindings | Wrong implementation used silently | Use contextual binding or check for existing bindings before binding |
| Provider not registered at all | New provider not taking effect | Services cache is stale | Manifest references old provider list | Run `php artisan optimize:clear` after provider changes |

## Anti-Patterns
- **Accidental override**: Binding the same abstract in multiple providers without coordination — the last registered wins, which may not be what you expect.
- **Order spaghetti**: Constantly reordering providers to fix runtime errors instead of decoupling the providers.
- **Provider dependency chain**: Provider A requires B, B requires C, all manually ordered — fragile and hard to maintain.

## Examples
```php
// config/app.php
'providers' => [
    // Infrastructure first
    App\Providers\AppServiceProvider::class,
    App\Providers\AuthServiceProvider::class,

    // Domain services
    App\Providers\PaymentServiceProvider::class,
    App\Providers\AnalyticsServiceProvider::class,

    // Package providers that must interleave
    Barryvdh\Debugbar\ServiceProvider::class, // Must boot near the end

    // Event/route providers last
    App\Providers\EventServiceProvider::class,
    App\Providers\RouteServiceProvider::class,
],
```

## Related Topics
- Register vs Boot (ku-01) — the two-phase lifecycle that order controls
- Deferred Providers (ku-03) — providers that skip registration order entirely
- Service Provider Organization — strategies for grouping providers
- Services Cache — how the manifest preserves registration order

## AI Agent Notes
- When debugging "service not found" errors, check the provider positions in `config/app.php` and remember package providers are appended.
- The `$this->serviceProviderList` on the Application tracks registration order.
- To see the actual registration order, add debug logging in `Application::register()` or use Telescope.

## Verification
- [ ] Provider order in `config/app.php` respects dependency direction (dependencies before dependents)
- [ ] No two providers bind the same abstract without explicit intent
- [ ] Package providers that need specific positioning are added explicitly to `config/app.php`
- [ ] Services cache is regenerated after adding/removing providers
- [ ] Framework core providers are never reordered or removed
