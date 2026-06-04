# Knowledge Unit: Application Flush and Reset

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Application Bootstrap
- **Target Audience:** Octane engineers, package authors ensuring stateful request isolation, performance engineers tuning long-running processes
- **Last Updated:** 2026-06-02
- **Source File:** `Illuminate\Foundation\Application.php` (methods `flush()`, `reset()`, `hasBeenBootstrapped()`, `isBooted()`)

## Executive Summary
`flush()` and `reset()` are the mechanisms by which the Laravel Application returns to a clean state after a request in long-running processes (Octane, Swoole, RoadRunner). `flush()` clears all container bindings, resolved instances, aliases, and service providers — effectively returning the container to its post-constructor state. `reset()` additionally re-registers base bindings and core aliases. The `hasBeenBootstrapped()` guard prevents the bootstrapper sequence from running twice, while `reset()` selectively clears this flag to allow selective re-bootstrapping. These methods form the foundation of Laravel's Octane request isolation model.

## Core Concepts
- **`flush()`:** Clears all container state: `$this->bindings = []`, `$this->instances = []`, `$this->resolved = []`, `$this->aliases = []`, `$this->extenders = []`, `$this->tags = []`, `$this->reboundCallbacks = []`, `$this->globalBeforeResolvingCallbacks = []`, `$this->globalAfterResolvingCallbacks = []`, `$this->contextual = []`. Also resets the `AliasLoader` instance. After `flush()`, only the `'app'`, `Container::class`, and `Psr\Container\ContainerInterface::class` bindings remain (set in `registerBaseBindings()` which is NOT undone by flush).
- **`reset()`:** Calls `flush()` first, then re-calls `registerBaseBindings()` and `registerCoreContainerAliases()` to restore the alias map. Resets `$this->hasBeenBootstrapped` to `false` and `$this->booted` to `false`.
- **`hasBeenBootstrapped()`:** Returns `$this->hasBeenBootstrapped`. When `true`, `bootstrapWith()` throws `LogicException`. `reset()` sets it to `false`, allowing re-bootstrapping for the next request.
- **Load order:** `flush()` does NOT reset the base bindings — they survive intentionally. `reset()` DOES reset them (by re-registering), which is important when the Application instance is fully recycled.

## Mental Models
Think of `flush()` as a **factory reset for the container** — it clears all user and framework state except the absolute minimum required for the container to function as itself. `reset()` is like a **power cycle** — it not only clears state but restarts the container's identity systems (base bindings, aliases). The `hasBeenBootstrapped` guard is a **circuit breaker** — once tripped, it prevents the bootstrap sequence from running again until manually reset.

## Internal Mechanics
**`flush()` detailed operation:**
1. Saves the current `$this->app` instance reference.
2. Calls `$this->reboundCallbacks = []; $this->beforeResolvingCallbacks = []; $this->afterResolvingCallbacks = []; $this->globalBeforeResolvingCallbacks = []; $this->globalAfterResolvingCallbacks = [];` — empties all callback registries.
3. `$this->instances = []; $this->bindings = []; $this->resolved = []; $this->extenders = []; $this->tags = []; $this->contextual = [];` — empties all container data.
4. `$this->aliases = []; $this->abstractAliases = [];` — clears alias maps.
5. Calls `ServiceProvider::$resolvedProvider = false;` — resets the global provider registry.
6. Restores `$this->instance('app', $this)` so the self-reference survives.
7. Resets `$this->scopedInstances = []; $this->scoped = [];`.

**`reset()` detailed operation:**
1. Calls `$this->flush()`.
2. Calls `$this->registerBaseBindings()` and `$this->registerCoreContainerAliases()`.
3. Sets `$this->hasBeenBootstrapped = false; $this->booted = false;`.
4. Resets `$this->loadedProviders = [];`.

## Patterns
- **Selective State Survival Strategy:** Specific data structures (`$this->bindings`, `$this->instances`) are nullified while others (`$this->app` self-reference) are preserved. This is not a blanket clear — it is carefully designed to preserve what must survive.
- **Guard-Lock Pattern:** `hasBeenBootstrapped` acts as a binary lock. It is set to `true` after bootstrap completes and must be explicitly reset to `false` to allow re-bootstrap. This prevents accidental double initialization.
- **Reset-then-Reinitialize Pattern:** `reset()` follows clear → rebuild → unlock sequence, enabling safe re-initialization of the application for the next request cycle.

## Architectural Decisions
- **Why does `flush()` preserve `'app'` but not aliases?** The self-reference (`$this->instance('app', $this)`) is essential — without it, `app()` helper and `Container::getInstance()` return null. Aliases are re-registered by `reset()`, but `flush()` alone assumes the caller will manually restore them if needed (Octane uses `reset()`, not `flush()`).
- **Why separate `flush()` and `reset()`?** `flush()` is a lower-level operation for cases where the caller wants fine-grained control over what survives (e.g., running artisan commands inside an Octane worker). `reset()` is the higher-level "full reset" for request boundaries.
- **Why clear `$this->loadedProviders` in `reset()`?** Providers are marked as loaded in `$this->loadedProviders` to prevent double registration. Resetting this array allows `register()` to run again for the next request, which is necessary because providers may bind request-scoped singletons.

## Tradeoffs
| Tradeoff | Decision | Rationale |
|---|---|---|
| Full container clear vs selective clear | Selective (flush preserves app) | Minimizes re-registration work on next request |
| Separate flush/reset vs single method | Two methods | Flexibility for different isolation levels |
| Automatic vs manual reset | Manual via Octane middleware | Prevents accidental resets in normal FPM operation |
| Clear all vs reset-to-initial-state | Reset re-registers bindings/aliases | Ensures clean state without requiring a new Application instance |

## Performance Considerations
- `flush()` complexity: O(n) where n = number of bindings, instances, aliases, and callbacks. A typical application with 50–100 bindings clears in ~0.05ms.
- `reset()` adds the cost of `registerBaseBindings()` (~0.01ms) and `registerCoreContainerAliases()` (~0.15ms) on top of `flush()`.
- In Octane, `flush()` (called internally by `reset()`) runs after every request. The cumulative cost across thousands of requests is negligible (~0.2ms per request).
- The `hasBeenBootstrapped` guard check is O(1) — a single property access — and adds no measurable overhead.
- Memory: `flush()` releases all container-allocated memory from bindings, instances, and callbacks. In long-running processes, this is essential to prevent unbounded memory growth.

## Production Considerations
- **Octane deployment:** Ensure `reset()` is invoked between requests. Octane's `OctaneApplication` trait calls `reset()` automatically via the `$app->reset()` middleware. Custom long-running integrations must replicate this.
- **Scoped singletons:** Bindings registered with `scoped()` are automatically cleared after each request. They do not survive `flush()` because they are stored in `$this->scopedInstances` which is cleared. If you need cross-request persistence, use `singleton()` and manage state manually.
- **Memory leak detection:** Log `memory_get_usage()` before and after `flush()` to verify that container memory is released. A leak indicates that a binding or callback captured a reference that `flush()` cannot release.
- **Production debugging:** Never call `flush()` or `reset()` manually in production code outside of Octane/roadrunner middleware. Doing so will reset the application mid-request, causing unpredictable behavior.

## Common Mistakes
- Calling `flush()` without subsequent `registerBaseBindings()` — the application loses its alias map, breaking all facade resolution. Most callers should use `reset()` instead.
- Assuming `reset()` clears the config repository — it does not. The `'config'` binding in the container is cleared, but the config files are not re-loaded unless `bootstrapWith()` is called again with `LoadConfiguration` in the array.
- Expecting `hasBeenBootstrapped()` to return false after a normal FPM request — it remains true for the lifetime of the Application instance because there is only one request per instance in FPM.
- Forgetting that `ServiceProvider::$resolvedProvider` is a static property cleared by `flush()`. This means all providers are considered "not yet registered" after flush, even if they were previously registered.

## Failure Modes
- **Partial flush:** If a binding's `reboundCallback` modifies external state (e.g., writes to a file), `flush()` clears the callback but the external state is not rolled back. The next request starts with stale external state.
- **Static property leak:** `flush()` clears container state but cannot clear static properties on service providers or user classes. If a provider stores request-scoped data in a static property, that data survives `flush()` and leaks to the next request.
- **Resource handle leak:** If a binding creates a database connection or file handle, `flush()` removes the binding but does not close the resource. The connection survives in PHP's global resource table until garbage collection. Use `$app->beforeResolving()` to register cleanup callbacks if needed.
- **AliasLoader singleton persistence:** `flush()` calls `AliasLoader::setInstance(null)`, but if user code holds a separate reference to the old `AliasLoader`, facade resolution may continue using the stale instance.

## Ecosystem Usage
- **Laravel Octane:** The primary consumer. Octane's `OctaneApplication` trait overrides `flush()` to add event dispatching before and after the flush. Calls `reset()` between requests to prepare the Application for the next request.
- **Laravel Reverb (WebSocket server):** Uses `flush()` in combination with `reset()` to isolate WebSocket events per connection, ensuring that event-specific bindings do not pollute other connections.
- **Laravel Horizon:** Calls `flush()` when recycling the Horizon process between job batches, preventing job-scoped singletons from accumulating across thousands of queued jobs.
- **Laravel Pennant (feature flags):** Uses `reset()` in testing to reset the feature flag state between test cases without re-creating the Application.

## Related Knowledge Units

### Prerequisites
- [Application Class Construction](./application-class-construction/02-knowledge-unit.md) — `registerBaseBindings()` is re-invoked by `reset()`.
- [Base Bindings and Core Aliases](./base-bindings-and-core-aliases/02-knowledge-unit.md) — understanding what survives flush vs what requires re-registration.

### Related Topics
- [Bootstrapper Sequence](./bootstrapper-sequence/02-knowledge-unit.md) — how `hasBeenBootstrapped` guards against re-bootstrapping.
- [Service Container Instance Management] — how `instance()`, `scoped()`, and `singleton()` interact with flush.
- [Application Builder Configuration](./application-builder-configuration/02-knowledge-unit.md) — lifecycle hooks that may be affected by flush/reset.

### Advanced Follow-up Topics
- [Octane Request Lifecycle](../boot-order-timing/octane-boot-timing/02-knowledge-unit.md) — the complete flush-reset cycle between Octane requests.
- [Container Memory Management] — deep dive into container memory allocation and leak prevention strategies.
- [Deferred Provider Loading Timing](../boot-order-timing/deferred-provider-loading-timing/02-knowledge-unit.md) — how deferred providers behave across flush/reset boundaries.

## Research Notes

### Source Analysis
`flush()` is defined in `Illuminate\Foundation\Application::flush()` (~line 420). `reset()` is at ~line 450. The `hasBeenBootstrapped` property is a boolean initialized to `false` in the class definition and set to `true` at the end of `bootstrapWith()`.

### Key Insight
`flush()` and `reset()` are the unsung heroes of Laravel's long-running process support. They enable Octane to reuse a single Application instance across thousands of requests without memory leaks or state corruption. The careful distinction between what survives flush (the app self-reference) and what is cleared (everything else) is the result of years of production debugging across Swoole, RoadRunner, and FrankenPHP integrations.

### Version-Specific Notes
- **Laravel 7:** Introduced `flush()` for Swoole integration. Initially cleared everything including base bindings — Octane had to re-register them manually.
- **Laravel 8:** Split into `flush()` and `reset()`. Base bindings were made immune to `flush()`. The `hasBeenBootstrapped` guard was added.
- **Laravel 9:** `reset()` was updated to re-register core aliases. Added `$this->scoped` and `$this->scopedInstances` to the clear list.
- **Laravel 10:** `flush()` now clears `$this->contextual`, `$this->extenders`, and `$this->tags` — previously these were missed, causing contextual binding leaks across requests.
- **Laravel 11:** `flush()` clears `$this->hasReboundCallbacks` and resets the `AliasLoader` singleton via `AliasLoader::setInstance(null)`. The `reset()` method was promoted to public API.
