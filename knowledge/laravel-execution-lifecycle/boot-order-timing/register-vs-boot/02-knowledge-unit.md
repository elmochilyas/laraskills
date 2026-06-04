# Register vs Boot

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **Last Updated:** 2026-06-02

## Executive Summary
Laravel service providers implement a two-phase initialization: `register()` then `boot()`. The `register()` phase is for adding bindings to the container only. The `boot()` phase runs after all providers have registered, enabling safe resolution of any provider's services. Mixing these two phases is the most common source of bootstrap bugs. Understanding this separation is essential for writing correct service providers and debugging initialization failures.

## Core Concepts
- **`register()`**: Pure binding phase — only `$this->app->bind()`, `$this->app->singleton()`, or the `$bindings`/`$singletons` properties. No service resolution, no side effects.
- **`boot()`**: Post-registration phase — safe to resolve services, register routes, listeners, views. All providers have completed `register()`.
- **Two-phase guarantee**: Every provider's `register()` completes before any provider's `boot()` starts. This eliminates dependency ordering issues during initialization.
- **Auto-processing**: After `register()` runs, Laravel automatically processes `$provider->bindings` and `$provider->singletons` properties.
- **Late registration**: If a provider is registered after the app is already booted, `register()` runs and then `boot()` is called immediately on that provider.
- **Deferred providers**: Have `register()` called lazily (on first service resolution), then auto-boot immediately since the app is already booted.

## Mental Models
- **Assembly Line Model**: `register()` is the parts-supply phase — every station gets its parts. `boot()` is the assembly phase — stations use parts to build systems. You cannot assemble before parts arrive.
- **Power Grid Model**: `register()` connects providers to the grid (substations). `boot()` lets them draw power (use services). Drawing power before connecting causes a brownout (error).
- **Contract Model**: The two-phase contract guarantees all providers have signed (registered) before any provider acts (boots). Breaking the contract by resolving in `register()` voids the guarantee.

## Internal Mechanics
1. The kernel bootstrapper `RegisterProviders` iterates all providers and calls `$provider->register()`.
2. Each provider's `register()` method adds bindings, singletons, and contextual bindings to the container.
3. After all providers complete `register()`, the next bootstrapper `BootProviders` iterates again and calls `$provider->boot()`.
4. Inside `Application::boot()`, the providers are iterated from `$this->serviceProviderList`, which preserves registration order.
5. If any provider calls `$this->app->make()` during `register()`, the container checks if the service has been bound. If not yet bound (because the providing provider hasn't registered), a `BindingResolutionException` is thrown.
6. The `$bindings` and `$singletons` properties on providers are processed automatically by `Application::register()` after `register()` completes — they are syntactic sugar for common binding patterns.

## Patterns
- **Two-Phase Initialization**: Separation of registration and usage. Used across the framework for providers and extendable to any multi-step initialization.
- **Pure Registration**: The `register()` method should have no side effects — it only configures the container.
- **Auto-Properties Pattern**: The `$bindings` and `$singletons` properties provide a declarative API for simple bindings without writing boilerplate `register()` code.

## Architectural Decisions
- **Why separate register() and boot()?** Separation prevents circular dependencies. If providers resolved each other's services in an interleaved registration phase, the framework would need complex dependency ordering. By enforcing all-register-then-all-boot, the framework guarantees a consistent container state during the boot phase.
- **Why no resolution in register()?** Resolution may trigger auto-resolution of unbound classes or, worse, trigger deferred provider loading, which calls `register()` on that provider — mixing phases unpredictably.
- **Why auto-process $bindings/$singletons properties?** These properties are processed after `register()` completes, allowing providers to override or supplement array-based bindings with closure-based bindings in `register()`.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Eliminates circular provider dependencies | Extra iteration adds ~5-15ms per request | Every request pays the cost even for providers that don't use boot() |
| Clear phase separation for provider authors | Developers must learn two phases | Most common Laravel provider bug is resolving in register() |
| Safe late registration for deferred providers | Deferred providers that boot must be registered early | Edge case where a deferred provider's boot() depends on non-deferred bindings |
| Auto-processing of $bindings/$singletons reduces boilerplate | Processing happens AFTER register() — cannot be used for late bindings in boot() | Developers expect auto-processing to complete before register() ends |

## Performance Considerations
- Every non-deferred provider calls `register()` on every request. Keeping `register()` lightweight reduces bootstrap time.
- `boot()` iteration is O(n) on provider count. Each empty `boot()` still incurs ~1-2µs dispatch overhead.
- `$app->call([$provider, 'boot'])` uses Reflection for method injection, adding ~10-20µs per provider with dependencies.
- Heavy boot operations (route loading, view registration) should be cached (route cache, config cache).

## Production Considerations
- Audit providers for resolution calls in `register()`. Resolution here is the #1 cause of provider-related bugs in production.
- Use deferred providers for services not needed on every request — they skip both phases entirely until first use.
- Run `php artisan optimize` after provider changes to regenerate the services cache, which tracks deferral status.
- Monitor bootstrap time with Telescope — providers with heavy `register()` or `boot()` are easily identified.

## Common Mistakes
- **Resolving in register()**: `$this->app->make()` called inside register() — throws if the dependency provider hasn't registered yet.
- **Heavy I/O in register()**: Database/config calls in register() — slows every provider registration and affects bootstrap time.
- **Phase order assumptions**: Boot code assumes specific provider order that may change when package providers are appended.
- **Skipping boot() entirely**: All logic in register() — early resolution may fail; deferred providers skip boot().
- **Modifying container in boot()**: Rebinding resolved services in boot() — already-resolved instances are not affected.

## Failure Modes
- **BindingResolutionException in register()**: Resolution fails because the dependent provider hasn't registered yet. Trace the container's `$buildStack` to find the resolution path.
- **Silent failures in register()**: Catching exceptions in `register()` and swallowing them hides missing binding errors until runtime.
- **Deferred provider boot() discrepancy**: A deferred provider's `boot()` runs on first resolution, which may be in a different context than expected.

## Ecosystem Usage
- **Laravel core**: All framework providers follow the two-phase pattern rigorously — EventServiceProvider registers bindings in `register()`, boots listeners in `boot()`.
- **Spatie packages**: Use `register()` for config publishing and package registration; `boot()` for route and view loading.
- **Horizon/Telescope**: Register services in `register()`, start watchers and supervisors in `boot()`.

## Related Knowledge Units

### Prerequisites
- [Provider Fundamentals](../service-providers/provider-fundamentals/02-knowledge-unit.md) — the Service Provider contract and base class.

### Related Topics
- [Provider Registration Order (ku-02)](./ku-02-provider-registration-order/02-knowledge-unit.md) — how provider ordering interacts with the two phases.
- [Deferred Providers (ku-03)](./ku-03-deferred-providers/02-knowledge-unit.md) — providers that skip the standard two-phase entirely.
- [Boot Phase Order](../boot-phase-order/02-knowledge-unit.md) — the exact loop that calls boot() on each provider.

### Advanced Follow-up Topics
- [Lifecycle Callback Hooks](../lifecycle-callback-hooks/02-knowledge-unit.md) — booting/booted hooks that wrap the boot phase.
- [Service Provider Design](../service-providers/provider-organization-strategies/02-knowledge-unit.md) — organizing providers by concern.

## Research Notes
- The two-phase pattern is derived from the Composition Root pattern in Dependency Injection literature — specifically, the separation of "registration" from "initialization."
- Laravel's implementation processes `$bindings` and `$singletons` AFTER `register()` returns, not before. This is a common point of confusion.
- Deferred providers that use `when()` for conditional deferral have complex boot timing — the `boot()` is called when the trigger binding is resolved, not when the provider's own service is resolved.
- Future Laravel versions may move toward attribute-based provider configuration, potentially changing how the two phases are declared.
