# Register vs Boot Methods

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Providers
- **Knowledge Unit:** Register vs Boot Methods
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary
The `register()` and `boot()` methods on `ServiceProvider` are the two phases of provider initialization. Understanding the contract — what must happen in each, what must never happen in each, and why the separation exists — separates correct provider code from code that will fail unpredictably in production.

---

## Core Concepts
`register()` is for **binding only** — contract-to-implementation mappings, singletons, config merges, and event/listener registrations that don't require resolved services. It must never call `$this->app->make()` or resolve anything from the container, because not all bindings exist yet. `boot()` runs after all providers have completed `register()`, so all bindings are guaranteed available. In `boot()`, you can resolve services, register routes, register views, register macros, or perform any initialization that depends on other services. Any provider may also register a `boot()` callback via `$this->app->booted()` to run after all providers have booted — this is useful for actions that depend on the entire provider stack being ready.

---

## Mental Models
Think of `register()` as **writing a class syllabus** and `boot()` as **teaching the first lecture**. During registration, you declare what exists and how it relates; during boot, you use those declarations. The syllabus doesn't require students to be enrolled (bindings to be resolved), but you can't teach until the syllabus is complete. If you try to teach during registration, you'll find empty seats — bindings that don't yet exist.

---

## Internal Mechanics
Internally, `Illuminate\Foundation\Application::boot()` iterates over the `$booted` array and calls each callback. When `$app->register($provider)` is called, the following happens:
1. If already booted, `register()` is called immediately, then `boot()` is called immediately.
2. If not yet booted, `register()` is called immediately, and `boot()` is deferred until the framework iterates all providers.
3. The `$serviceProvider->isDeferred()` check determines if the provider is full registered or parked for later.

The `ServiceProvider` base class provides `$this->app->booted(function($app) { ... })` for post-boot callbacks. These are queued if the app hasn't booted, or called immediately if it has.

---

## Patterns
- **Pure register**: Only `$this->app->bind()`, `$this->app->singleton()`, `$this->app->when()->needs()->give()`, `$this->mergeConfigFrom()`.
- **Boot-time init**: Route registrations (`Route::group`), view composers, Blade directives, event listeners, macro definitions.
- **Deferred registration**: Use `$this->app->register(SomeProvider::class)` inside `boot()` to conditionally register a sub-provider.
- **Post-boot callbacks**: Use `$this->app->booted(fn($app) => ...)` for actions that require the entire application to be booted.

---

## Architectural Decisions
The two-phase separation is a **constraint that prevents a whole class of dependency bugs**. Without it, provider authors would need to manually ensure providers are registered in dependency order, and circular dependencies between providers would be harder to detect. By enforcing that all bindings exist before any are resolved, Laravel guarantees that any provider can rely on any binding existing in `boot()` — regardless of registration order.

---

## Tradeoffs
- **register() purity is developer-enforced**: Nothing in the framework prevents you from calling `$this->app->make()` inside `register()`. It will work some of the time (when the target binding is already registered by an earlier provider) and fail other times. This creates intermittent, environment-dependent bugs.
- **boot() ordering is still unreliable**: While all bindings exist, the order of `boot()` calls is the same as registration order. If Provider A (boot: instantiate ServiceX) must run before Provider B (boot: uses ServiceX but also registers routes that ServiceX needs), there's no framework guarantee.
- **Performance**: Two-pass iteration doubles provider overhead. Deferred providers mitigate this.

---

## Performance Considerations
Because `register()` runs on every request for eager providers, keeping it lightweight is critical. Avoid database calls, HTTP requests, or heavy computation in either method. The `boot()` method is the primary contributor to request bootstrap time. Use deferred providers for packages that are rarely used, and consider lazy service resolution inside boot callbacks.

---

## Production Considerations
Never log, write to disk, or make network calls from `register()`. These actions cause subtle failures during config caching, route caching, or queue workers where the environment may be partially bootstrapped. Always type-hint dependencies in `boot()` method signature — Laravel will resolve them from the container, ensuring they exist and providing auto-documentation.

---

## Common Mistakes
- Calling `$this->app->make()` in `register()` (intermittent failures).
- Defining routes in `register()` (routes depend on `Router` binding, which may not exist yet).
- Registering views in `register()` (view paths may not be configured yet).
- Expecting `boot()` to run after all other `boot()` methods have completed (it runs in registration order).

---

## Failure Modes
- **Intermittent "Target class does not exist"**: Likely caused by resolving in `register()`. The binding exists when the provider is registered early in the list but not when registered late.
- **Partial boot during Artisan commands**: Some commands skip full app bootstrap; if your `boot()` assumes a full web stack, it may fail during console sessions.
- **Config cache collisions**: Running `php artisan config:cache` calls `register()` on all providers before serializing config. If `register()` has side effects that depend on request context, config caching breaks.

---

## Ecosystem Usage
Laravel's own providers demonstrate the pattern: `AuthServiceProvider` registers policies in `boot()`, `EventServiceProvider` maps events to listeners in `boot()`, `RouteServiceProvider` registers routes in `boot()`. All of these depend on services (Gate, Dispatcher, Router) that are registered by `FoundationServiceProvider` or other core providers during the `register()` phase.

---

## Related Knowledge Units
### Prerequisites
- provider-fundamentals (base provider contract and two-phase model)
- Service Container Bindings (what register() populates in the container)

### Related Topics
- deferred-providers (boot timing considerations for deferred providers)
- Service Container Bindings (binding vs resolution lifecycle)
- eager-providers (register/boot execution in eager context)

### Advanced Follow-up Topics
- Custom boot ordering strategies
- Boot-time event dispatching
- Boot Order Timing (register-then-boot guarantee in kernel lifecycle)
- Kernel Architecture (how Application::boot() orchestrates provider iteration)

---

## Research Notes
### Source Analysis
`Illuminate\Foundation\Application@boot()` and `Illuminate\Foundation\Application@register()` show the two-phase loop. The `ServiceProvider@setApplication()` method stores the app instance. `ServiceProvider@callBootingCallbacks()` is invoked before each `boot()`.
### Key Insight
The register/boot split is not a convenience feature — it is an architectural constraint designed to eliminate provider ordering dependencies. Writing code that violates this constraint (resolving in register) creates non-deterministic failures.
### Version-Specific Notes
Laravel 9+ added `boot()` method injection, allowing type-hinted dependencies to be auto-resolved. Earlier versions required manual `$this->app->make()` calls.
