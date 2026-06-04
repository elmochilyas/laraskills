# Provider Registration Order

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **Last Updated:** 2026-06-02

## Executive Summary
The order in which service providers are registered determines the order in which they boot. Providers are merged from three sources: framework core providers, the `config/app.php` providers array, and package discovery providers. Understanding this merge order is essential for resolving binding conflicts, ensuring dependencies are available when needed, and debugging "service not found" errors that occur due to misordered provider registration.

## Core Concepts
- **Three provider sources**: Framework core (registered in Application constructor), `config/app.php` providers array (in listed order), package discovery providers (appended last).
- **Framework core providers**: `LogServiceProvider`, `EventServiceProvider`, `RoutingServiceProvider` — registered first in `Application::__construct()`.
- **config/app.php providers**: Registered in exact array order. This is the primary control point for registration order.
- **Package discovery providers**: Appended after all app providers, loaded via `PackageManifest::providers()` from `vendor/composer/installed.json`.
- **Deterministic within groups**: Registration order within framework and config/app.php groups is deterministic. Package discovery order depends on the manifest file.
- **Boot order mirrors register order**: Providers boot in the exact order they were registered. The `$serviceProviderList` preserves insertion order.

## Mental Models
- **Assembly Line Analogy**: Providers are stations on an assembly line. Station 1 (first registered) runs its `register()`, then Station 2, etc. `boot()` runs the same order. If Station 5 needs output from Station 3, Station 3 must be earlier in the line.
- **Playlist Model**: The provider list is a playlist — the order you add songs determines the order they play. Framework providers are the opening act, config/app.php is the main set, package providers are the encore.
- **Dependency Chain Model**: Each provider may declare a dependency on earlier providers' bindings. The registration order is a linearized dependency graph — providers assume earlier providers' bindings are available.

## Internal Mechanics
1. `Application::registerConfiguredProviders()` is called by the `RegisterProviders` bootstrapper.
2. It collects providers from three sources: `$this->serviceProviders` (framework), `config('app.providers')` (application), and `$this->make(PackageManifest::class)->providers()` (packages).
3. Providers are deduplicated — the first occurrence wins. Framework core providers cannot be overridden.
4. Each provider class is instantiated via `$provider = new $class($app)`. The constructor receives the Application.
5. `Application::register($provider)` is called: the provider's `register()` runs, `$bindings`/`$singletons` are processed, and the provider is added to `$serviceProviderList`.
6. Deferred providers implementing `DeferrableProvider` are separated — they are NOT added to the `$serviceProviderList` at this point. They are stored in a deferred mapping.
7. After all providers are registered, `Application::boot()` iterates `$serviceProviderList` in order, calling `boot()` on each.

## Patterns
- **Three-Source Merge Pattern**: Provider lists from different sources (framework, app, packages) are merged deterministically. This pattern separates concerns while maintaining predictable ordering.
- **Deduplication Pattern**: When the same provider appears in multiple sources, the first occurrence is kept. This prevents double-registration and allows app config to override package discovery.
- **Deferred Provider Separation Pattern**: Providers marked as deferred are extracted from the registration list and stored separately. They register lazily only when their services are first resolved.

## Architectural Decisions
- **Why three sources?** Framework providers must always be registered (they provide core services). Application providers are user-configurable. Package providers are automatically discovered — this three-source approach gives users control without manual maintenance.
- **Why deduplicate?** A provider may appear in both config/app.php and package discovery (e.g., if explicitly listed). Deduplication prevents double-registration, which would cause duplicate bindings.
- **Why append package providers?** Package providers are discovered automatically and should not override app provider order without explicit configuration. Appending keeps app config in control.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Deterministic registration order within sources | Package providers always append — cannot interleave without explicit config | Package provider that must boot early must be added to config/app.php explicitly |
| Framework core providers always first | Core providers cannot be reordered or skipped | Framework initialization order is fixed |
| Deduplication prevents double-registration | First occurrence wins — framework overrides cannot be achieved | To override framework bindings, must bind after boot in a boot() method |
| Deferred providers separate early | Deferred providers don't appear in serviceProviderList order | Providers registered after boot can be deferred — register() + boot() on first resolution |

## Performance Considerations
- Provider iteration during registration is O(n). 50 providers add ~0.5-2ms overhead regardless of order.
- Reordering does not affect registration speed — the cost is per-provider, not positional.
- Package provider discovery adds ~2-10ms for reading `installed.json`. Eliminated by services cache.
- Deferred provider extraction during registration adds minimal overhead but saves significant time on requests that don't use those services.

## Production Considerations
- Order providers in `config/app.php` with dependency direction: foundational providers first, dependent providers later.
- Package providers that need specific positioning should be added explicitly to `config/app.php`.
- After adding/removing providers, run `php artisan optimize:clear` to regenerate the services cache.
- Use Telescope to verify the actual registration order matches expectations.
- Document ordering expectations with comments in `config/app.php`.

## Common Mistakes
- **Assuming config/app.php order is final**: Package discovery providers are appended after app providers, regardless of config order.
- **Not ordering dependencies**: Provider A depends on B's binding but A is listed before B in config/app.php.
- **Overriding without intent**: Two providers bind the same abstract; the last one wins silently.
- **Provider not registered at all**: Services cache is stale after adding a provider — the manifest doesn't include it.
- **Framework provider reorder attempt**: Trying to reorder framework core providers by editing config/app.php — they are hardcoded in Application::__construct().

## Failure Modes
- **Binding not found in boot()**: A provider's boot() tries to resolve a service that hasn't been registered yet. Check the provider's position relative to the registering provider.
- **Stale services cache**: After adding a provider, the old cache doesn't include it. Clear with `php artisan optimize:clear`.
- **Duplicate binding errors**: Two providers binding the same abstract — the second binding is silently ignored (first wins). Use contextual binding to differentiate.

## Ecosystem Usage
- **Laravel core**: Framework core providers (Event, Log, Routing) are always registered first, ensuring event dispatching, logging, and routing are available to all other providers.
- **Spatie packages**: Append their providers via package discovery. If a Spatie provider needs to boot early, users add it to config/app.php explicitly.
- **Horizon/Telescope**: These providers are appended last via discovery, meaning their boot() runs after all app providers.

## Related Knowledge Units

### Prerequisites
- [Register vs Boot (ku-01)](./ku-01-register-vs-boot/02-knowledge-unit.md) — the two-phase lifecycle that order controls.

### Related Topics
- [Complete Boot Sequence](../complete-boot-sequence/02-knowledge-unit.md) — where registration order fits in the broader pipeline.
- [Service Provider Organization](../service-providers/provider-organization-strategies/02-knowledge-unit.md) — how to arrange providers for maintainability.

### Advanced Follow-up Topics
- [Deferred Providers (ku-03)](./ku-03-deferred-providers/02-knowledge-unit.md) — how deferral changes registration order semantics.
- [Services Cache](../../caching-optimization/services-cache/02-knowledge-unit.md) — how the manifest preserves registration order.

## Research Notes
- The three-source merge is implemented in `Application::registerConfiguredProviders()`.
- The `$serviceProviderList` is a plain array — insertion order is the iteration order for boot().
- PackageManifest reads `vendor/composer/installed.json` to discover package providers.
- In Laravel 11+, the providers array in config/app.php was simplified — fewer core providers, more auto-discovered.
- The deduplication logic in `Application::register()` checks if the provider class is already in `$serviceProviderList`.
