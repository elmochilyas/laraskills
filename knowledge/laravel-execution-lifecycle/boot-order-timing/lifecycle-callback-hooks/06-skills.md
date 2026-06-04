# Skill: Use Lifecycle Callback Hooks for Cross-Provider Coordination

## Purpose
Register `booting()` and `booted()` callbacks to execute code before or after all service providers boot, enabling cross-provider coordination that cannot be achieved within a single provider's `boot()` method.

## When To Use
- Performing setup that must run after ALL providers have booted (cross-provider coordination)
- Registering post-boot routes, middleware, or exception handlers that depend on fully-initialized services
- In package development, when your package must observe the boot phase without extending providers
- Pre-resolving services under Octane to move resolution cost from per-request to once-per-worker

## When NOT To Use
- For setup that belongs in a specific provider's `boot()` — use the provider's `boot()` method directly
- For request-lifecycle hooks — use middleware or request lifecycle events
- For bootstrap-phase monitoring — use the bootstrap event system (`bootstrapping:*`, `bootstrapped:*`)
- For registering container bindings — use `register()` phase
- For logic that should run on every request — `booted()` fires once per application instance

## Prerequisites
- Understanding of the boot phase order (providers boot between `booting()` and `booted()` callbacks)
- Knowledge of the fire-once semantics of `booted()` callbacks
- Familiarity with the Application's booting/booted callback arrays

## Inputs
- Callback logic to execute before or after provider boot
- Application instance to register callbacks on

## Workflow
1. Determine whether your logic must run before all providers boot (`booting()`) or after all providers boot (`booted()`)
2. Register the callback in a service provider's `register()` method — never in `boot()`
3. For `booting()`: pass a closure to `$this->app->booting(function ($app) { ... })`
4. For `booted()`: pass a closure to `$this->app->booted(function ($app) { ... })`
5. Keep `booting()` callbacks lightweight — no I/O, no heavy computation
6. In `booted()` callbacks, safely resolve any service from the container
7. Under Octane, use `booted()` to pre-resolve hot-path services once per worker
8. For middleware/routing setup, use the ApplicationBuilder hooks (`->withRouting()`, `->withMiddleware()`) which delegate to `booted()` internally

## Validation Checklist
- [ ] `booting()`/`booted()` callbacks are registered in `register()`, not `boot()`
- [ ] `booting()` callbacks are lightweight (no I/O, no heavy computation)
- [ ] `booted()` callbacks are not used to replace individual provider `boot()` logic
- [ ] Fire-once semantics are understood: `booted()` fires once per application instance
- [ ] Container bindings are not modified inside `booting()` callbacks
- [ ] Under Octane, pre-resolved services in `booted()` are appropriate (singletons, not scoped bindings)

## Common Failures
- Registering `booting()` in `boot()` — the booting phase has already passed; the callback silently never executes
- Registering `booted()` in `boot()` — fires immediately due to fire-once semantics, potentially before all providers have actually booted
- Heavy I/O in `booting()` — delays every request before any provider code runs
- Modifying container bindings in `booting()` — creates non-deterministic behavior (some providers see the binding, others don't)
- Using `booted()` for per-request logic — it fires once per application lifecycle, not per request

## Decision Points
- If the logic is specific to one provider, put it in that provider's `boot()` method
- If the logic depends on ALL providers being booted, use `booted()`
- If the logic must run before any provider boots (e.g., setting a base configuration), use `booting()`
- For Octane pre-resolution, use `booted()` — services resolved here are cached in the container for all subsequent requests

## Performance Considerations
- Each callback is a closure dispatch — negligible overhead (~0.5-2µs per callback)
- Excessive callbacks (20+) add measurable overhead to the boot phase
- Under Octane, callbacks fire once per worker start — cost is amortized
- Heavy callbacks in `booting()` directly increase time-to-first-byte
- Pre-resolving services in `booted()` under Octane moves resolution cost from per-request to once-per-worker

## Security Considerations
- `booted()` callbacks run after all services are available, including security services
- Callbacks have full container access — avoid exposing sensitive data in closure-captured outer scope
- Third-party packages can register booting/booted callbacks — audit package callbacks for security implications
- Do not log sensitive configuration or secrets in booting/booted callbacks

## Related Rules
- Lifecycle Callback Hooks Rule 1: Register booting/booted Callbacks in register() Phase
- Lifecycle Callback Hooks Rule 3: Keep booting() Callbacks Lightweight
- Lifecycle Callback Hooks Rule 4: Understand Fire-Once Semantics of booted()

## Related Skills
- Leverage Bootstrap Events for Monitoring and Setup (bootstrap-with-event-system)
- Adapt Boot Timing for Octane (octane-boot-timing)
- Navigate the Complete Boot Sequence (complete-boot-sequence)

## Success Criteria
- `booting()` callbacks execute before any provider boots and are lightweight
- `booted()` callbacks execute after all providers boot and successfully coordinate cross-provider setup
- No callback is registered in the wrong phase (e.g., `booting()` in `boot()`)
- Fire-once semantics are respected in testing and Octane environments
- Pre-resolved services in `booted()` under Octane improve per-request performance
