# Resolution Callbacks

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Container |
| Knowledge Unit | Resolution Callbacks |
| Difficulty | Advanced |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Resolution callbacks are event hooks fired by the container during the service resolution lifecycle — `beforeResolving()`, `resolving()`, and `afterResolving()`. These callbacks allow interception and modification of services at the moment they are constructed, before they are returned to the caller. The critical engineering decision is their execution ordering relative to the extender stack: extenders run *before* `resolving()` callbacks, and shared instance caching happens *after* `resolving()` but *before* `afterResolving()`. This means `afterResolving()` is the only hook that sees the fully-extended, already-cached singleton. Callbacks with non-null return values replace the resolved instance — a powerful capability that when misused, bypasses all lifecycle guarantees.

## Core Concepts
- **`beforeResolving($abstract, $callback)`** — Fires before instance creation; receives abstract name + parameters.
- **`resolving($abstract, $callback)`** — Fires after build + extend, before caching; can modify/replace the instance.
- **`afterResolving($abstract, $callback)`** — Fires after caching; for side effects only (cached instance unchanged).
- **Global Callbacks** — Register without abstract name to fire for every resolution: `$app->resolving(fn($obj, $app) => ...)`.
- **Instance Replacement** — Callbacks returning non-null replace the resolved instance (applies to `resolving()` only effectively).

## When To Use
- Auto-configuration — Setting default properties on resolved services without modifying constructors.
- Cross-cutting behavior — Logging, profiling, or monitoring applied to all resolved services of a type.
- Tenant context injection — Configuring database connections with tenant-specific settings after resolution.
- Lazy initialization — Services that need post-construction setup but shouldn't do it in the constructor.

## When NOT To Use
- Service decoration (use `extend()` instead — it runs before `resolving()`).
- Modifying the cached singleton in `afterResolving()` (cached before this hook fires).
- Heavy logic in global callbacks (checked on every single resolution).
- Instance replacement when extenders are also registered (extender results lost if callback replaces instance).

## Best Practices
- **Prefer abstract-specific callbacks over global callbacks with instanceof checks** — Global callbacks checking `$object instanceof X` add overhead to every resolution.
- **Avoid instance replacement in `resolving()` callbacks** — Prefer `extend()` for decoration; use `resolving()` for configuration only.
- **Use `afterResolving()` for side effects only** — The cached singleton is already stored; treat this as fire-and-forget.
- **Use `$app` parameter for dependency resolution** — Don't capture container in closure; use the passed `$app` parameter to prevent circular references.
- WHY: Resolution callbacks provide the cleanest interception point for cross-cutting concerns — they apply at the container level without modifying individual binding registrations or consumer constructors.

## Architecture Guidelines
- Execution order in `resolve()`: `beforeResolving()` → build → extenders → `resolving()` → cache → `afterResolving()`.
- Callback return value matters — non-null return replaces the instance for `resolving()`.
- Global callbacks fire first, then abstract-specific callbacks.
- `afterResolving()` cannot affect the cached singleton because caching happens before this hook.

## Performance Considerations
- Each callback registration adds a closure to callback arrays (~80 bytes each).
- Global callbacks checked on EVERY resolution — with 10 global callbacks, 10 closure invocations per `make()`.
- Abstract-specific callbacks require array key lookup (O(1)) + closure invocation.
- With 10 global + 5 specific callbacks, overhead is ~3-5μs per resolution.
- In Octane, callbacks persist across requests — ensure they register only once during boot.

## Security Considerations
- Callbacks that replace instances can bypass security features of the original binding.
- `resolving()` callbacks have full access to the container — avoid resolving sensitive services inside callbacks.
- Callbacks registered by third-party packages can intercept and modify any resolved service; audit for malicious behavior.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Using `resolving()` to configure a service that is also extended | Unaware of execution order | Extender outputs lost; configuration invisible to extenders | Use `extend()` for decoration, `resolving()` for post-decoration config |
| Modifying instance in `afterResolving()` expecting cache update | Misunderstanding cache timing | Modifications applied but cached singleton unchanged | Use `resolving()` for modification; `afterResolving()` for side effects |
| Registering callbacks in `register()` that depend on unavailable services | Wrong lifecycle phase | Captured references stale or partially constructed | Use `$app` parameter passed to callback |
| Duplicate callback registration | Loop or multiple provider loads | Same callback fires multiple times | Guard with flag; centralize in dedicated provider |

## Anti-Patterns
- **Global instanceof Callback Chains** — Single global callback checking 20+ types instead of specific callbacks.
- **Instance Replacement in `resolving()`** — Replaces fully-extended instance, losing extender output.
- **Heavy Logic in Global Callbacks** — Database queries or API calls inside a callback that fires on every resolution.
- **Stateful Callbacks** — Closures that capture and mutate external state, causing non-deterministic behavior.

## Examples

### Auto-configuration at resolution
```php
$this->app->resolving(Repository::class, function ($repo) {
    $repo->setCacheTtl(config('repositories.cache_ttl'));
});
```

### Tenant context injection via afterResolving
```php
$this->app->afterResolving(DatabaseConnection::class, function ($connection, $app) {
    $tenantId = $app->make(TenantContext::class)->id();
    $connection->statement("SET app.tenant_id = ?", [$tenantId]);
});
```

### Global callback for monitored services
```php
$this->app->resolving(function ($object, $app) {
    if ($object instanceof MonitoredService) {
        $object->attachMonitor($app->make(Monitor::class));
    }
});
```

## Related Topics
- **Prerequisites:** Container Fundamentals, Binding Resolution
- **Closely Related:** Binding Extending, Rebound Callbacks
- **Advanced:** Scoped Instance Management, Container Aliases
- **Cross-Domain:** Service Providers (callback registration lifecycle)

## AI Agent Notes
- When debugging "resolving() not firing", check if abstract name matches exactly (including aliases).
- For callback ordering issues, remember: `beforeResolving` → extenders → `resolving` → cache → `afterResolving`.
- Return value of `resolving()` callback replaces the instance — accidental returns from `tap()` can cause bugs.

## Verification
- [ ] Can explain execution order: beforeResolving → extenders → resolving → cache → afterResolving
- [ ] Understand why `afterResolving()` cannot affect cached instance
- [ ] Know the difference between global and abstract-specific callbacks
- [ ] Can explain callback return value behavior (non-null replaces instance)
- [ ] Can decide between `extend()`, `resolving()`, and `afterResolving()` for a given use case
