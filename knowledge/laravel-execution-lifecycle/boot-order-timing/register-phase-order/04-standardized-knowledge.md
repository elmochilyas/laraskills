# Register Phase Order

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Boot Order & Timing |
| Knowledge Unit | Register Phase Order |
| Difficulty | Intermediate |
| Lifecycle Phase | Provider Initialization |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
The `register()` phase is the first half of Laravel's two-phase service provider initialization. During this phase, all registered providers have their `register()` method called in a deterministic order that ensures bindings are available before any provider boots. The order is determined by a merge of three provider sources: framework core providers, the `config/app.php` providers array, and package discovery providers.

## Core Concepts
- **Three provider sources**: Framework core (registered in Application constructor), `config/app.php` providers (in listed order), package discovery providers (appended last).
- **Deterministic ordering**: Within each source group, registration order is deterministic. Framework core runs first, then app providers in array order, then package providers.
- **No boot() during register()**: Providers may only add bindings during `register()`. Resolving services here is unsafe because later providers haven't registered yet.
- **Provider merge mechanism**: `Application::registerConfiguredProviders()` merges the three source lists and deduplicates them before iterating.
- **Framework core providers**: `LogServiceProvider`, `EventServiceProvider`, `RoutingServiceProvider` are registered first in `Application::__construct()`.
- **$defer behavior**: Deferred providers skip `register()` until their first service resolution.

## When To Use
- Understanding the order in which your provider's bindings become available.
- Debugging "service not found" errors where a binding is registered after it's first resolved.
- Designing cross-provider dependency chains that must execute in a specific sequence.

## When NOT To Use
- Providers with no cross-provider dependencies can ignore registration order.
- Deferred providers are unaffected by registration order — they register lazily.
- Never call `register()` manually; let the framework orchestrate the phase.

## Best Practices (WHY)
- **Place foundational providers first**: Auth, config, and logging providers should appear early in `config/app.php`. *Why: Bindings from early providers are available to all later providers.*
- **Document ordering expectations**: If a provider requires a specific position, add a comment in `config/app.php`. *Why: Future developers may reorder and break the dependency.*
- **Keep register() minimal**: Only add bindings and set properties. *Why: Heavy operations in register() delay the entire boot sequence.*
- **Avoid inter-provider coupling in register()**: If Provider A must run before B, consider merging or using contextual binding instead. *Why: Order dependencies make the provider list fragile.*

## Architecture Guidelines
- Register providers in dependency order in `config/app.php`: infrastructure first, domain services middle, presentation last.
- Package providers that must interleave with app providers should be added explicitly to `config/app.php` rather than relying on auto-discovery.
- Framework core providers are registered before app providers — this cannot be changed.
- `Application::register()` returns the existing provider instance if already registered, preventing duplicates.
- The services cache (`bootstrap/cache/services.php`) preserves registration order.

## Performance
- Provider iteration during registration is O(n). 50 providers add ~0.5-2ms overhead.
- Deferred providers skip `register()` entirely until their service is first resolved, reducing bootstrap overhead.
- Package provider discovery via `PackageManifest` adds ~2-10ms for reading `installed.json`, eliminated by services cache.
- Framework core providers always execute `register()` — they are never deferred.

## Security
- A provider registered later can override bindings from an earlier provider. Be aware of which provider "wins" when two bind the same abstract.
- Package discovery providers run after app providers — a malicious package cannot override app bindings unless explicitly configured.
- Ensure sensitive service bindings are registered in earlier providers to prevent accidental override by package providers.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Assuming config/app.php order is final | Not knowing package providers append after | Package provider runs after all app providers | Add package provider explicitly at correct position |
| Not ordering dependencies | Provider A depends on B's binding but A listed before B | Binding not found in A's register() or boot() | Place B before A in providers array |
| Overriding without intent | Two providers bind same abstract; last one wins | Wrong implementation used silently | Use contextual binding or check before binding |
| Provider not registered at all | Services cache is stale | Manifest references old provider list | Run `optimize:clear` after provider changes |
| Resolving in register() | `app()->make()` inside register() | BindingResolutionException if provider not yet registered | Move resolution to boot() |

## Anti-Patterns
- **Order spaghetti**: Constantly reordering providers to fix runtime errors instead of decoupling them.
- **Accidental override**: Binding the same abstract in multiple providers without coordination — the last registered wins.
- **Provider dependency chain**: Provider A requires B, B requires C, all manually ordered — fragile and hard to maintain.
- **Fat register()**: Extensive file parsing, network calls, or I/O in register() delays the entire boot sequence.

## Examples
```php
// config/app.php — dependency-aware ordering
'providers' => [
    // Infrastructure first
    App\Providers\AppServiceProvider::class,
    App\Providers\AuthServiceProvider::class,

    // Domain services
    App\Providers\PaymentServiceProvider::class,
    App\Providers\AnalyticsServiceProvider::class,

    // Package providers that must interleave
    Barryvdh\Debugbar\ServiceProvider::class,

    // Event/route providers last
    App\Providers\EventServiceProvider::class,
    App\Providers\RouteServiceProvider::class,
],
```

## Related Topics
- **Prerequisites:** Complete Boot Sequence — the overall 16-step pipeline this phase is part of.
- **Closely Related:** Boot Phase Order — the second phase that runs after all register() calls complete.
- **Advanced:** Deferred Provider Loading Timing — how deferred providers bypass registration order entirely.
- **Cross-Domain:** Service Provider Fundamentals, Provider Organization Strategies.

## AI Agent Notes
- When debugging "service not found" errors, check provider positions in `config/app.php` and remember package providers are appended.
- The `$this->serviceProviderList` on the Application tracks registration order as an array.
- To see actual registration order, add debug logging in `Application::register()` or use Telescope.
- Framework core providers are hardcoded in `Application::__construct()` — they cannot be reordered.

## Verification
- [ ] Provider order respects dependency direction (dependencies before dependents)
- [ ] No two providers bind the same abstract without explicit intent
- [ ] Package providers with specific ordering needs are added explicitly
- [ ] Services cache is regenerated after adding/removing providers
- [ ] No resolution calls in any register() method
