# Rebound Callbacks

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Container |
| Knowledge Unit | Rebound Callbacks |
| Difficulty | Advanced |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Rebound callbacks are hooks that fire when an existing binding is re-registered — specifically when `bind()` or `singleton()` is called for an abstract that has already been resolved. Implemented through `Container::rebinding()` and `Container::rebound()`, these callbacks enable services to react to binding changes, forming the container's "hot-reload" mechanism. The critical engineering decision is that rebound fires *only* when a binding is replaced after it has already been resolved — if a binding is never resolved, `bind()` can be called multiple times without triggering rebound. This means rebound callbacks specifically notify about changes to *already-active* bindings, not general binding changes.

## Core Concepts
- **`rebinding($abstract, $callback)`** — Registers interest; fires callback when binding is rebound and immediately if already resolved.
- **`rebound($abstract)`** — Internal trigger called by `bind()` when abstract was already resolved; re-resolves and fires all callbacks.
- **Resolved Guard** — The `$resolved` array tracks which abstracts have been resolved; only resolved bindings trigger rebound.
- **Re-resolution** — `rebound()` calls `make()` to build a fresh instance with the new binding definition.
- **Hot-Reload Mechanism** — Primary consumer is framework middleware synchronization (e.g., `syncMiddlewareToRouter()` when Kernel is rebound).

## When To Use
- Framework-level reactivity — services that must be notified when a binding configuration changes.
- Middleware/route synchronization — when the HTTP kernel binding changes, re-apply middleware configuration.
- Test setup/teardown — restoring original bindings after mocking.
- Configuration-aware services that need to rebuild when config changes.

## When NOT To Use
- Application code that just needs to configure a service after resolution (use `resolving()` callbacks).
- Scenarios where the binding is never resolved before rebind (rebound won't fire — use `resolving()` instead).
- Octane production code — avoid rebinding mid-lifecycle in long-running processes.

## Best Practices
- **Use `rebinding()` rather than manually calling `forgetInstance()` + `rebound()`** — The `rebinding()` method handles immediate callback delivery and lifecycle correctly.
- **Ensure callbacks are idempotent** — If a binding is rebound multiple times, callbacks fire each time without deduplication.
- **Avoid rebinding in Octane** — Service providers should register bindings once during one-time boot; rebinding triggers re-resolution across the dependency graph.
- **Log rebinding events in development** — Catch unexpected mid-lifecycle binding changes.
- WHY: Rebound callbacks are the container's observer pattern for binding changes — they enable clean separation between binding registration and notification concerns.

## Architecture Guidelines
- Rebound triggered by `bind()` after storing new definition if `$this->resolved($abstract)` is true.
- `rebounding()` calls callback immediately if binding is already resolved — ensures callback always fires at least once.
- `rebound()` re-resolves via `make()` — full resolution pipeline runs, including extenders and resolution callbacks.
- The `$resolved` array is set to true in `resolve()` after successful resolution, reset on `forgetInstance()`.

## Performance Considerations
- Rebound callbacks add zero runtime overhead in stable deployments (no binding changes).
- When triggered, `rebound()` calls `make()` — full resolution cost for the abstract and its entire dependency graph.
- In Octane, if a service provider registers bindings (shouldn't happen), rebound cost is paid on each re-registration.
- Each `rebinding()` registration adds a closure; callbacks only fire when binding changes.

## Security Considerations
- Rebound callbacks receive the new instance; ensure callbacks don't expose sensitive data from the old instance.
- Re-resolution during rebound re-applies all extenders and callbacks — security-related decorations are preserved.
- In test environments, ensure rebound callbacks don't leak mock instances to production code paths.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Expecting rebound on unresolved bindings | Misunderstanding resolved guard | `bind()` silently overwrites without firing callback | Check `$app->resolved($abstract)`; use `resolving()` for general config |
| `rebinding()` callback calling `make()` on same abstract | Circular logic | Infinite loop — callback triggers another rebind | Use the instance parameter passed to callback |
| Using `rebinding()` in `register()` before target is resolved | Order-dependent code | Callback may fire immediately or never, depending on timing | Use `rebinding()` in `boot()` after setup is complete |

## Anti-Patterns
- **Rebinding in Octane** — Triggers re-resolution on every worker request; defeats one-time boot optimization.
- **`rebinding()` for per-resolution configuration** — Use `resolving()` instead; rebound is for binding changes, not initial config.
- **Manual `forgetInstance()` + `rebound()` instead of `rebinding()`** — Error-prone; missing the immediate-callback behavior.

## Examples

### Middleware hot-reload (framework core)
```php
$this->app->rebinding(Illuminate\Contracts\Http\Kernel::class, function ($app, $kernel) {
    $kernel->syncMiddlewareToRouter();
});
```

### Configuration-aware service rebuild
```php
$this->app->rebinding(SearchClient::class, function ($app, $client) {
    $client->configure($app->make(SearchConfig::class));
});
```

### Test binding restore
```php
$originalBound = $this->app->bound(Gateway::class);
$originalInstance = $originalBound ? $this->app->make(Gateway::class) : null;

$this->app->singleton(Gateway::class, FakeGateway::class);
// Test logic...
$this->app->forgetInstance(Gateway::class);
$this->app->rebound(Gateway::class);
```

## Related Topics
- **Prerequisites:** Container Fundamentals, Binding Types, Binding Resolution
- **Closely Related:** Resolution Callbacks, Binding Extending
- **Advanced:** Container Aliases, Scoped Instance Management
- **Cross-Domain:** Testing (test setup/teardown with rebinding)

## AI Agent Notes
- When debugging "rebound not firing", check if `$app->resolved($abstract)` returns true before the rebind.
- `rebinding()` with immediate callback can cause unexpected `make()` calls during registration — be aware of side effects.
- The immediate-callback behavior makes `rebinding()` safe for initialization: callback always fires at least once.

## Verification
- [ ] Can explain when rebound fires vs does not fire (resolved guard)
- [ ] Understand difference between `rebinding()` and `resolving()` callbacks
- [ ] Know why `rebinding()` fires immediately if binding is already resolved
- [ ] Can identify appropriate use cases (binding changes) vs inappropriate (per-resolution config)
- [ ] Can debug "rebound not triggered" by checking resolved status
