# Scoped Bindings for Octane

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Executive Summary
Scoped bindings (`$app->scoped()`) are Octane's designated mechanism for safe stateful service resolution. Unlike singletons, a scoped binding returns the **same instance within a single request** but a **fresh instance for each new request**. This provides the performance benefit of shared instances within a request (no repeated construction) while eliminating cross-request state leakage. Scoped bindings are the canonical answer to "how do I bind a service that needs per-request state?"

## Core Concepts
- **`scoped()` vs `singleton()`:** Both return the same instance on repeated `make()` calls within a single request. The difference: scoped instances are discarded when the Octane sandbox is flushed at request end. Singleton instances persist for the worker lifetime.
- **Sandbox Flush Mechanism:** On `RequestTerminated`, Octane calls `$sandbox->flush()`. This iterates all scoped bindings registered in the sandbox and calls `unset()` on their entries in the container's `$instances` array. The next `make()` creates a fresh object.
- **Scope Hierarchy:** Scoped bindings are per-sandbox. If you manually create a child container instance, scoped semantics do not propagate — the child has its own scoped lifecycle.
- **`OctaneSandbox` Contract:** Service providers implementing `OctaneSandbox` (interface with `boot()` method) are re-registered in the sandbox. This allows providers to register scoped bindings on each sandbox creation.

## Mental Models
- **"The Fresh Towel":** A singleton is a towel rack. Everyone uses the same towel all day. A scoped binding is a fresh towel per guest (request). Same-room reuse, but new guest gets new towel.
- **"Request-Scoped Singleton":** Treat `scoped()` exactly like `singleton()` but with automatic cleanup at the end of the request. The API is identical; only the lifecycle differs.
- **"The Hotel Room Key":** Scoped bindings are like a hotel key card — it works for the duration of your stay (request), then is deactivated at checkout.

## Internal Mechanics
1. **Registration:** `$app->scoped(PaymentGateway::class)` registers the binding with `shared = true` (same as singleton) and tags it internally as scoped.
2. **First Request Resolution:** `$app->make(PaymentGateway::class)` creates the instance, stores in `$app->instances`. Same behavior as singleton.
3. **Repeated Resolution in Same Request:** Returns the stored instance from `$instances`. No new object.
4. **Flush on Termination:** Octane's sandbox flush finds all scoped bindings and calls `$app->forgetInstance($abstract)` for each. The instances array entry is removed. Next request's first `make()` creates a new instance.
5. **Sandbox Provider Re-Registration:** Providers tagged with `OctaneSandbox` have their `boot()` called on each sandbox creation. They call `$sandbox->scoped()` — this registers the binding in the sandbox container, not the master container.

## Patterns
- **Default to Scoped:** For any service that interacts with per-request data (auth, session, current team, locale), register as scoped. Only use singleton for truly stateless services (HTTP client, config reader, logger).
- **Scoped Wrapper for Legacy Singletons:** Create a scoped wrapper service that delegates to a singleton inner service but manages per-request state locally. The wrapper is `scoped()`, the delegate is `singleton()`.
- **Explicit Flush Hooks:** If a scoped binding holds heavy resources (DB transaction, file handle), implement a `flush()` method and call it from `RequestTerminated` listener. The sandbox flush removes the binding reference but does not call destructors eagerly.
- **Pre-Binding Lazy Resolution:** Use `$app->scoped(Contract::class, Concrete::class)` (class name, not closure) to defer instantiation until first use within the request. Reduces sandbox creation overhead.

## Architectural Decisions
| Decision | Rationale |
|---|---|
| Scoped uses same registry as singleton | No new data structure; leverages existing container `$instances` array |
| Flush happens on sandbox destruction | Scoped lifecycle matches sandbox lifecycle exactly |
| `OctaneSandbox` is opt-in | Avoids forcing re-registration of providers that don't need it |
| Scoped !== per-test isolation in PHPUnit | PHPUnit does not use Octane's sandbox; scoped behaves like singleton in tests |

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Zero cross-request leakage | ~0.5-2ms overhead per scoped binding per request | For 10 scoped bindings, adds ~5-20ms to request time |
| Familiar singleton-like API | Developers may confuse scoped and singleton boundaries | Misuse leads to unexpected instance sharing within long operations (queues) |
| Automatic cleanup via sandbox flush | Heavy resources are not explicitly freed | If scoped binding holds 10MB of data, that data persists until GC runs after request |

## Performance Considerations
- Each scoped binding adds construction overhead once per request. If the binding is expensive (e.g., creates 50 dependent objects), consider using a singleton + state-reset pattern instead.
- Scoped bindings increase container memory churn. Each request creates new instances; old instances are garbage collected. Monitor GC pressure in high-throughput Octane deployments.
- Prefer `scoped(Contract::class, Concrete::class)` over `scoped(Contract::class, fn() => new Concrete(...))` closures. Closures capture scope and cannot be cached as easily by opcode optimizers.

## Production Considerations
- Audit all `singleton()` calls and convert stateful ones to `scoped()`. Run this as a CI lint rule.
- Scoped bindings that implement `__destruct()` for cleanup (closing connections, releasing locks) must be robust to `__destruct()` running after the request has already sent the response.
- In Swoole coroutines, scoped bindings are shared across coroutines within the same request's sandbox. Do not assume scoped == coroutine-safe. Use coroutine IDs if per-coroutine state is needed.
- Test scoped behavior explicitly: assert `app(Service::class) !== app(Service::class)` across two separate simulated requests in the same PHP process.

## Common Mistakes
- Using `scoped()` for services that must be truly global (database connection, event dispatcher). These should remain singletons.
- Registering scoped bindings inside a service provider's `register()` method that does NOT implement `OctaneSandbox`. The binding is registered in the master container only, and the scoped lifecycle never activates.
- Expecting scoped to provide per-coroutine isolation. Scoped is per-request (sandbox), not per-coroutine.
- Calling `$app->forgetInstance()` manually on singletons to simulate scoped behavior. This corrupts the container's instance tracking.

## Failure Modes
- **Scoped Binding Escalation:** A scoped binding depends on a singleton that accumulates state. The singleton still leaks; the scoped binding just masks the symptom for direct consumers.
- **Premature Destruction:** A scoped binding's destructor runs during sandbox flush but the application later tries to resolve it again (in a tick callback). Result: resolved a new instance with missing state.
- **Resource Handle Loss:** Database connection pools managed via scoped bindings lose handles on flush, causing connection storms on subsequent requests. Singleton pool + scoped connection wrapper is safer.

## Ecosystem Usage
- Laravel's `AuthManager` uses `scoped()` internally for guard instances since Laravel 10.
- `SessionManager` uses `scoped()` for session drivers. Session state is correctly isolated per request.
- `Scout`'s search engine instances should be `scoped()` if they hold per-request query state.
- Livewire v3 uses scoped bindings for its `ComponentHydrator` and `LifecycleManager` when running under Octane.

## Related Knowledge Units
### Prerequisites
- singleton-state-leaks (the problem scoped bindings solve)

### Related Topics
- octane-architecture-overview (sandbox mechanism that enables scoped)
- service-binding-audit (auditing tooling to identify scoped candidates)
- octane-package-compatibility (third-party packages that need scoped)

### Advanced Follow-up Topics
- static-property-accumulation (static leaks that scoped bindings cannot fix)
- octane-lifecycle-hooks (flush lifecycle for scoped bindings)
- memory-profiling-and-observability (profiling scoped binding creation overhead)

## Research Notes
- `$container->scoped()` was introduced in Laravel 8.3 (Octane release train). Prior to this, developers had to manually call `forgetInstance()` in request lifecycle hooks.
- The current implementation stores scoped bindings in a `$scopedInstances` array on the container. Flush iterates this array. Full scan is O(n) in number of scoped bindings.
- Research question: Does Redis-backed sessions need scoped bindings for the connection? Answer: No — the Redis connection is stateless (multiplexed). The session data itself is managed by the session handler, which is scoped.
- Potential optimization: Implement "lazy flush" that only clears scoped instances that were actually resolved. Current implementation clears all scoped bindings regardless of resolution state.
