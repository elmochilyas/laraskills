# Deferred Providers

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **Last Updated:** 2026-06-02

## Executive Summary
Deferred providers are service providers that implement `DeferrableProvider` (or historically set `$defer = true`). Unlike eager providers, their `register()` and `boot()` methods are not called during the main bootstrap pipeline. Instead, they are loaded lazily — the first time one of their provided services is resolved from the container. This optimization reduces bootstrap overhead by deferring provider initialization until the service is actually needed, making it one of the most effective performance tools for reducing request bootstrap time.

## Core Concepts
- **DeferrableProvider interface**: A marker interface signaling the framework that a provider should be deferred.
- **provides() method**: Returns an array of service identifiers (binding names, class names, interfaces) that the provider registers.
- **Deferred manifest**: `bootstrap/cache/services.php` maps service identifiers to their provider. The container uses this map to trigger lazy loading.
- **Lazy registration on resolve**: When `$app->make('service')` is called and no binding exists, the container checks the manifest, finds the deferred provider, calls its `register()`, then immediately calls `boot()` (if the app is already booted).
- **No boot() skip**: Deferred providers that have boot logic cannot be deferred — `boot()` is called on first resolution, not during the main boot phase.
- **Services cache**: Without the services cache, the framework falls back to scanning all providers to determine which are deferred — slower but functional.
- **when() method**: Allows conditional deferral — the provider loads when a specific binding is resolved, not when its own service is resolved.

## Mental Models
- **Lazy Loading Analogy**: Like lazy-loaded database relations — the data isn't fetched until you access it. Deferred providers aren't loaded until you need their service.
- **Vending Machine Model**: Eager providers are always-on machines in the hallway. Deferred providers are machines in a back room — they're only turned on when someone walks to the back room and makes a purchase.
- **On-Demand Service Model**: Like a streaming service — you don't download every movie when you open the app. You download (load the provider) only when you press play (request the service).

## Internal Mechanics
1. During `registerConfiguredProviders()`, providers implementing `DeferrableProvider` are set aside — they are NOT added to `$serviceProviderList`.
2. Their `provides()` return values are stored in a deferred mapping: `$deferredServices[service] = ProviderClass::class`.
3. This mapping is serialized to `bootstrap/cache/services.php` by `ProviderRepository::createManifest()`.
4. When `$app->make($service)` is called and no binding exists in `$bindings` or `$instances`:
   a. The container checks `$deferredServices` for the service identifier.
   b. If found, it loads (requires) the provider class file if not already loaded.
   c. Calls `Application::register($providerClass)` which runs `register()`.
   d. If the app is already booted, calls `boot()` immediately on the provider.
   e. Then resolves the service from the now-populated container.
5. If the service cache doesn't exist, the framework falls back to scanning all providers on every request — instantiating each, checking for `DeferrableProvider`, and building the deferred mapping from scratch.

## Patterns
- **Lazy Loading Pattern**: Deferring computation until the result is needed. The fundamental pattern behind deferred providers.
- **Manifest-Based Resolution**: A pre-computed manifest maps services to providers, enabling lazy loading without scanning all providers at runtime.
- **Auto-Boot on Resolution**: When a deferred provider is first resolved, it auto-boots immediately — the developer experience is identical to eager providers for any code that actually uses the service.

## Architectural Decisions
- **Why a manifest instead of always scanning?** Scanning all providers on every request negates the performance benefit of deferral. The manifest pre-computes the deferred service mapping so that lazy resolution has zero per-request overhead.
- **Why call boot() immediately on resolution?** If the app is already booted, all eager providers have booted. The deferred provider must boot immediately so its services are fully initialized. There is no "deferred boot" concept.
- **Why the provides() method?** The framework needs to know which services a provider registers to build the deferred mapping. Without `provides()`, the framework would need to run `register()` speculatively to discover bindings.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Skips register()/boot() on requests that don't use the service | First resolution pays full register() + boot() cost | Latency spike on first use after deploy or cache clear |
| Reduces per-request bootstrap time (up to 30-50ms) | Services cache must be regenerated after provider changes | Stale manifest causes provider-not-found errors |
| Enables "lazy" package registration without manual config | Deferred providers with boot() logic still run boot() on first use | Developer may expect deferred means zero cost (it doesn't) |
| Compatible with Octane's one-time boot model | Deferred provider loads on first request in each worker | Under Octane, first request to each worker pays the load cost |

## Performance Considerations
- Deferred providers save 100% of their register() and boot() overhead on requests that don't use their services.
- First resolution pays a ~1-5ms penalty for provider loading + service construction.
- The services cache eliminates the need to scan providers for deferral status, saving ~2-10ms per request.
- Without the manifest, every request loads and inspects all providers to check for deferral — this defeats the optimization.
- Under Octane, the deferred provider load cost is paid once per worker (first request that needs it), then amortized.

## Production Considerations
- Audit which providers are deferred and verify they have no required boot() logic.
- Clear services cache after changing deferred provider status — stale manifest causes incorrect behavior.
- Pre-resolve critical deferred services during warmup to avoid first-request latency spikes.
- Monitor deferred provider loading in Telescope — you may discover that certain providers are resolved on nearly every request and should be made eager.
- Package authors should mark providers as deferred when they only bind services and have no boot() logic.

## Common Mistakes
- **Missing service in provides()**: Adding a binding to register() without updating provides() — the service is not found because the provider is never loaded.
- **Deferring with boot() logic**: Provider has route/listener registration in boot() — boot() still runs on first resolution, negating the benefit.
- **Not clearing services cache**: Changing deferral status without clearing cache — old manifest has wrong mapping.
- **Assuming deferred = zero cost**: First resolution still pays registration + boot cost. In a cold cache scenario, all deferred providers load on the first request.
- **Forgetting provides() entirely**: An empty provides() array means the provider is never loaded — no services map to it.

## Failure Modes
- **Provider not found on first resolution**: The service identifier in `make()` doesn't match what provides() returns. Check for namespace mismatches or missing aliases.
- **Stale manifest after provider change**: Adding/removing providers without regenerating the manifest causes missed or orphaned providers.
- **Deferred provider with no services**: A provider implementing DeferrableProvider with an empty provides() is never loaded — binding registration never happens.
- **Partial services list**: A provider provides services A and B, but only A is in provides(). Resolving B triggers a different provider or auto-resolution, bypassing the deferred provider.

## Ecosystem Usage
- **Laravel Horizon**: Uses deferred providers for dashboard and monitoring services that aren't needed on non-admin routes.
- **Laravel Nova**: Nova's core services are often deferred — they only load when the admin route is accessed.
- **Spatie packages**: Many Spatie packages (e.g., `laravel-permission`) offer deferred registration to avoid overhead on requests that don't use permissions.
- **Community best practice**: Almost all packages that bind services without initialization logic should be deferred.

## Related Knowledge Units

### Prerequisites
- [Register vs Boot (ku-01)](./ku-01-register-vs-boot/02-knowledge-unit.md) — the two-phase lifecycle that deferred providers skip.
- [Provider Registration Order (ku-02)](./ku-02-provider-registration-order/02-knowledge-unit.md) — where registration order fits for deferred providers.

### Related Topics
- [Eager Providers](../../service-providers/eager-providers/02-knowledge-unit.md) — the counterpart to deferred providers.
- [Services Cache](../../caching-optimization/services-cache/02-knowledge-unit.md) — the manifest enabling deferred resolution.

### Advanced Follow-up Topics
- [Deferred Provider Loading Timing](../deferred-provider-loading-timing/02-knowledge-unit.md) — the timing of lazy loading in the boot sequence.
- [Provider Optimization](../../caching-optimization/optimize-command/02-knowledge-unit.md) — optimizing provider loading via deferral.

## Research Notes
- `DeferrableProvider` was introduced in Laravel 8, replacing the older `$defer` property pattern.
- The `when()` method on `DeferrableProvider` adds conditional deferral — the provider loads when a specified container binding is resolved.
- The manifest file structure includes a `when` array for providers with conditional deferral dependencies.
- In Laravel 10+, the services cache is generated automatically as a side effect of various commands, reducing developer awareness of the manifest.
- Future direction: More core providers becoming deferrable to reduce bootstrap overhead in slim configurations.
