# Scoped Instance Management

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Container |
| Knowledge Unit | Scoped Instance Management |
| Difficulty | Advanced |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 11+ |
| Last Updated | 2026-06-02 |

## Overview
Scoped instance management is the container subsystem responsible for managing service instances whose lifetime is confined to a specific scope boundary — typically a single HTTP request in Octane or a single job in a queue worker. Implemented through the `$scopedInstances` array and the `scoped()` binding method, this feature provides the semantics of singletons within a scope while ensuring automatic cleanup at scope boundaries. The critical engineering decision is that scoped instances are stored separately from the main `$instances` cache. The `$scopedInstances` array is cleared by `flushScoped()`, while `$instances` persists for the process lifetime. This separation enables Octane to call `flushScoped()` at the end of each request, destroying request-bound singletons while preserving process-global singletons.

## Core Concepts
- **`scoped()` Binding** — Registers a service shared within a scope boundary; behaves like singleton within scope, flushed at boundary.
- **`$scopedInstances` Array** — Separate cache for scope-bound instances; checked after `$instances` but before binding resolution.
- **`flushScoped()`** — Clears scoped instances; accepts optional array of specific abstracts for selective flushing.
- **Scope Boundary** — Default is request boundary; Octane calls `flushScoped()` after each request via `WorkerState`.
- **Singleton vs Scoped** — `singleton()` persists for process lifetime; `scoped()` persists for scope lifetime (request/job).

## When To Use
- Services holding per-request state under Octane: auth user, tenant context, locale, request-scoped caches.
- Queue worker scoped state that must be isolated between jobs.
- Multi-tenant applications where tenant context must be fresh per request.
- Migration from `singleton()` when deploying Octane — convert any singleton holding mutable request state.

## When NOT To Use
- Stateless services that hold no request-specific data (use `singleton()` for efficiency).
- Services that must be truly per-call fresh (use `bind()` instead).
- FPM-only deployments where `scoped()` and `singleton()` behave identically (but use `scoped()` anyway for future Octane migration).

## Best Practices
- **Audit all `singleton()` bindings before Octane deployment** — Every singleton holding request-scoped data must be converted to `scoped()`.
- **Ensure `flushScoped()` is called at scope boundaries** — Octane handles this automatically; queue workers must implement it manually.
- **Never cache scoped instances in singletons** — A singleton holding a reference to a scoped instance will keep stale data after flush.
- **Use selective flush for mid-request scope changes** — Tenant-switching middleware should flush `TenantContext` while leaving other scoped instances intact.
- WHY: Scoped instances are the primary Octane-safe alternative to singletons. Correct classification of every shared binding as either process-scoped or request-scoped prevents the #1 Octane production bug — user A seeing user B's data.

## Architecture Guidelines
- `$scopedInstances` is checked after `$instances` but before binding resolution — process singletons take priority.
- `scoped()` sets the same `shared` flag as `singleton()`, plus a separate `isScoped` flag on the `Definition`.
- `flushScoped()` O(N) clears `$scopedInstances`; selective flush accepts optional array of abstracts.
- Octane integration: `WorkerState::endRequest()` calls `$container->flushScoped()` after each request.

## Performance Considerations
- Scoped resolution = singleton performance within scope (O(1) array lookup in `$scopedInstances`).
- `flushScoped()` is O(N) where N = scoped instances; 50 instances ~2-5μs — negligible.
- Double cache check (`$instances` then `$scopedInstances`) adds ~0.3μs per resolution.
- Scoped instances that hold large data free memory at flush, unlike singletons which accumulate.

## Security Considerations
- Using `singleton()` for request-scoped auth data under Octane is a data leak vulnerability.
- Scoped instances cleared at scope boundary — ensure sensitive data (auth tokens, PII) is in scoped, not singleton, bindings.
- Selective flush must not skip clearing security-sensitive scoped instances (e.g., auth user).

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Using `singleton()` for request-scoped state | Assuming FPM-only or unaware of Octane | Data leak: user A sees user B's data | Use `scoped()` for any service with per-request state |
| Assuming `scoped()` and `singleton()` interchangeable in FPM | True in FPM, false in Octane | Latent bugs surface during Octane migration | Always use `scoped()` for request-scoped services |
| Not calling `flushScoped()` in queue workers | Missing scope boundary | State leaks between jobs | Call `$app->flushScoped()` at job start/end |
| Storing scoped instance reference in singleton | Caching for performance | Singleton holds stale scoped reference after flush | Re-resolve through container each time |

## Anti-Patterns
- **Singleton Holding Scoped Reference** — A singleton that caches a scoped dependency in a property.
- **Scoped for Truly Stateless Services** — Using `scoped()` when `singleton()` is appropriate wastes scope flush overhead.
- **Missing Scope Flush Boundary** — Not defining where the scope ends; scoped instances persist like singletons.

## Examples

### Octane-safe tenant context
```php
$this->app->scoped(TenantContext::class, function ($app) {
    return new TenantContext($app->make(Request::class)->getHost());
});
// Each request gets fresh TenantContext; automatically flushed
```

### Request-scoped cache
```php
$this->app->scoped(RequestCache::class, function ($app) {
    return new RequestCache($app->make(Cache::class));
});
// Cache is per-request — automatically cleared after scope flush
```

### Selective flush for mid-request tenant switch
```php
// After switching tenants mid-request:
$app->flushScoped([TenantContext::class, LocaleContext::class]);
// Other scoped instances remain (e.g., RequestCache)
```

## Related Topics
- **Prerequisites:** Container Fundamentals, Binding Types
- **Closely Related:** Binding Resolution, Container Aliases
- **Advanced:** Resolution Callbacks, Rebound Callbacks
- **Cross-Domain:** Octane Lifecycle, Queue Workers (Horizon)

## AI Agent Notes
- When debugging data leaks under Octane, check every `singleton()` for mutable request-state — convert to `scoped()`.
- For queue worker state leaks, verify `flushScoped()` is called between jobs.
- Log `count($container->getInstances())` in Octane to detect unexpected singleton accumulation.

## Verification
- [ ] Can explain the difference between `singleton()` and `scoped()` in FPM vs Octane
- [ ] Understand the separate `$scopedInstances` array and `flushScoped()` mechanics
- [ ] Know how to audit a codebase for incorrect singleton usage
- [ ] Can implement selective flush for mid-request scope changes
- [ ] Can configure queue workers to properly flush scoped instances between jobs
