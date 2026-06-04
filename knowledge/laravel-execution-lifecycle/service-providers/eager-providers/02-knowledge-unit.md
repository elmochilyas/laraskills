# Eager Providers

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Providers
- **Knowledge Unit:** Eager Providers
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
Eager providers are registered and booted on every request. All providers listed in `bootstrap/providers.php` are eager unless they implement `DeferrableProvider`. Understanding when to make a provider eager versus deferred — and knowing the cost — is critical for production applications where every microsecond of bootstrap time matters.

---

## Core Concepts
An eager provider is any provider that does not implement `DeferrableProvider` and is not registered dynamically. At application boot, Laravel iterates the provider list from `bootstrap/providers.php`, calls `register()` on each, then later calls `boot()` on each. All core framework providers (e.g., `FoundationServiceProvider`, `AuthServiceProvider`, `EventServiceProvider`) are eager. Eager providers are suitable for:
- Services needed on every request (logging, error handling, routing, events).
- Providers that register event listeners, middleware, or route definitions in `boot()`.
- Providers that merge configuration that other providers depend on.

---

## Mental Models
Eager providers are **always-on infrastructure** — like the electrical wiring in a building compared to individual appliances (deferred). The wiring must be live before anyone enters the building, even if no appliance is plugged in. Eager providers establish the baseline application environment that all subsequent code depends on.

---

## Internal Mechanics
When `Illuminate\Foundation\Application::registerConfiguredProviders()` runs, it reads `bootstrap/providers.php`, filters out deferred providers (they're stored in the manifest), and registers the rest as eager. Each call to `$app->register($providerClass)` instantiates the provider and calls `register()`. After all providers are registered, the kernel calls `$app->boot()`, which iterates all providers and calls `boot()`. The `ServiceProvider` base class's `isDeferred()` method checks for the `DeferrableProvider` interface — if absent, the provider is eager by default.

---

## Patterns
- **Core infrastructure pattern**: Keep foundational services (config, events, routing, database) as eager providers. These are dependencies for everything else.
- **Plugin/bridge pattern**: Third-party integrations that register middleware, event subscribers, or route groups must be eager, as these registrations must happen at boot time, not on-demand.
- **Conditional eager**: Use `$app->register()` inside another provider's `boot()` to conditionally register an eager provider based on runtime configuration.

---

## Architectural Decisions
Making a provider eager is the framework's default because it maximizes predictability. An eager provider's `register()` and `boot()` run at known times during the bootstrap sequence, making behavior deterministic. The decision to make a provider eager vs deferred should be based on: (a) does it register boot-time artifacts (routes, events, middleware)? (b) is it needed on most requests? (c) does it have side effects that must happen at startup?

---

## Tradeoffs
- **Predictability vs. Performance**: Eager providers are predictable (always loaded, always registered) but add overhead to every request. Deferred providers save overhead but add a manifest dependency and first-use latency.
- **Boot-time registration requirement**: Providers that register global state (routes, listeners, middleware) cannot be deferred. If you need a service to be deferred but also register boot-time artifacts, split it into two providers.
- **Memory overhead**: Each eager provider instance exists in memory for the entire request. For applications with many providers (50+), this adds measurable memory pressure.

---

## Performance Considerations
The cumulative cost of eager providers is linear: each provider's constructor + `register()` + `boot()`. For an application with 30 eager providers, this can add 10-30ms to bootstrap time depending on the provider's workload. Profile with Laravel Debugbar's "Bootstrap" timeline or use `dd(microtime(true))` markers. Key optimization strategies: (a) move rarely-used services to deferred providers, (b) inline small providers into larger ones to reduce iteration overhead, (c) use `booted()` callbacks for non-critical initialization.

---

## Production Considerations
Every new package added to a production application adds at least one eager provider (unless explicitly made deferred). Audit provider count as part of code review. The `php artisan about` command lists registered providers. In high-throughput applications, consider segmenting providers — use environment-specific loading to exclude providers not relevant to the current environment.

---

## Common Mistakes
- Making every provider deferred to "optimize" performance without considering that providers registering routes, events, or middleware must be eager.
- Adding multiple tiny providers when a single provider would suffice (exacerbating eager overhead).
- Assuming a provider is deferred when it's actually eager (check `isDeferred()` or look for `DeferrableProvider` implementation).

---

## Failure Modes
- **Unintentional eager provider**: A package that should be deferred doesn't implement `DeferrableProvider`, causing unnecessary bootstrap overhead. Monitor and add the interface if the package maintainer hasn't.
- **Eager provider crash prevents app boot**: If an eager provider's `register()` or `boot()` throws an exception, the entire application fails to boot — no request succeeds. This is the highest-severity failure mode for providers.
- **Memory exhaustion**: An eager provider that loads large datasets in `boot()` (e.g., loading all permissions from the database) creates memory pressure on every request.

---

## Ecosystem Usage
The framework's core providers are eager by design: `FoundationServiceProvider` (error handling, logging, macros), `BusServiceProvider` (command bus), `CacheServiceProvider`, `DatabaseServiceProvider`, `FilesystemServiceProvider`, `PipelineServiceProvider`, `RoutingServiceProvider`, `SessionServiceProvider`, `ViewServiceProvider`. These establish the Laravel baseline. Community packages like `laravel/telescope`, `laravel/horizon`, and `barryvdh/laravel-debugbar` use eager providers because they register boot-time listeners and middleware.

---

## Related Knowledge Units
### Prerequisites
- provider-fundamentals (provider contract and registration flow)
- register-vs-boot-methods (what eager providers execute on every request)

### Related Topics
- deferred-providers (comparison with lazy-loaded alternatives)
- provider-sprawl-and-governance (managing eager provider count)
- environment-specific-providers (conditional eager registration)

### Advanced Follow-up Topics
- Eager provider lazy-loading strategies
- Octane-compatible provider design
- Boot Order Timing (eager provider impact on request bootstrap time)
- Kernel Architecture (registerConfiguredProviders eager filtering)

---

## Research Notes
### Source Analysis
`Illuminate\Foundation\Application::registerConfiguredProviders()` in `src/Illuminate/Foundation/Application.php`. `Illuminate\Foundation\ProviderRepository::load()` separates eager and deferred providers.
### Key Insight
Eager is the default for a reason: predictability. Deferred providers are an optimization, not a default choice. The architectural cost of deferral (manifest management, timing issues) must be justified by measured performance gains.
### Version-Specific Notes
Laravel 11's `bootstrap/providers.php` made provider registration more explicit. Previous versions used `config/app.php` which mixed eager and deferred lists. The new file makes the eager/deferred distinction clearer.
