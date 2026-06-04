# Binding Types

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Container |
| Knowledge Unit | Binding Types |
| Difficulty | Foundation |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 11+ (scoped() in 11+) |
| Last Updated | 2026-06-02 |

## Overview
Binding types are the different registration modes in Laravel's service container that determine how and when service instances are created. The four primary methods — `bind()` (new instance each resolution), `singleton()` (one instance per process), `scoped()` (one instance per scope boundary), and `instance()` (direct object injection) — each map to a distinct lifecycle strategy. The critical engineering decision is the separation between `singleton()` and `scoped()`. In traditional PHP-FPM, both behave identically; under Octane, `singleton()` instances persist across requests while `scoped()` instances are flushed at scope boundaries, preventing state leakage.

## Core Concepts
- **`bind()` — Transient** — Every `make()` call produces a new instance. Stores `shared: false`.
- **`singleton()` — Process Singleton** — First resolution caches in `$instances`; all subsequent calls return same instance.
- **`scoped()` — Scope-Bound Singleton** — Same as singleton within scope boundary; `flushScoped()` clears all scoped instances.
- **`instance()` — Pre-Constructed Injection** — Skips resolution pipeline; object placed directly into `$instances`.
- **`extend()` — Decorator** — Wraps existing binding with additional behavior; does not create a new binding.

## When To Use
- `bind()` — Stateless services (parsers, transformers, validators) where fresh instance per resolution is desired.
- `singleton()` — Stateless or immutable shared services (config, router, logger) where construction is expensive.
- `scoped()` — Services holding per-request state (auth user, tenant context, locale) under Octane/queue workers.
- `instance()` — Testing mocks, pre-configured objects that must not be decorated or intercepted.

## When NOT To Use
- `singleton()` for mutable request-scoped state under Octane (causes data leaks between requests).
- `bind()` for expensive-to-construct services resolved multiple times per request (wasteful allocation).
- `instance()` in production service providers (bypasses extenders and resolution callbacks).
- `extend()` before binding exists (throws `BindingResolutionException`).

## Best Practices
- **Default to `bind()` for stateless services** unless profiling shows allocation overhead is significant.
- **Use `scoped()` for any service holding per-request state** — auth user, tenant context, locale, request-scoped caches.
- **Audit all `singleton()` bindings before Octane deployment** — convert any holding mutable request state to `scoped()`.
- **Use `instance()` only in tests or boot-time** — its bypass of the resolution pipeline makes behavior less predictable.
- WHY: Binding type choice directly impacts memory footprint, resolution speed, and correctness under concurrency. The wrong choice under Octane is the #1 source of production data leaks.

## Architecture Guidelines
- `singleton()` and `scoped()` both set `shared: true`; distinction is tracked via separate `$scopedInstances` array.
- `instance()` bypasses the resolution pipeline — cannot be decorated via `extend()` or intercepted by `resolving()` callbacks.
- `bind()` with null concrete defaults to abstract name (self-binding), enabling `$this->app->bind(MyClass::class)` shorthand.
- The resolution path differs: `bind()` always resolves fresh; `singleton()`/`scoped()` check respective caches first; `instance()` reads from `$instances`.

## Performance Considerations
- `bind()` resolutions are most expensive — each `make()` re-executes factory closure or reflection.
- `singleton()` is zero-cost after first resolution (O(1) array lookup).
- `scoped()` has identical performance to `singleton()` within a scope; `flushScoped()` is O(N) where N = scoped instances.
- `instance()` is fastest (zero allocation, zero reflection) but increases baseline memory.

## Security Considerations
- `singleton()` holding user-specific data under Octane is a data leak vulnerability — user A sees user B's data.
- `instance()` with pre-configured objects may bypass security middleware if the object was configured before security checks.
- Scoped instances that hold sensitive data (auth tokens) are automatically cleared at scope boundaries — verify scope flushing is configured.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Using `singleton()` for request-scoped state | Assuming FPM-only deployment | Under Octane, leaks user A's data to user B | Use `scoped()` for any service depending on request data |
| Using `bind()` for expensive services | Default choice without profiling | Reconstructs expensive service per consumer | Use `singleton()` or `scoped()` for expensive services |
| Calling `instance()` in `register()` with incomplete object | Convenience over correctness | Object cannot be decorated or intercepted later | Use `singleton()` with closure factory |
| Singleton depending on transient with per-request state | Ignoring dependency graph lifecycle | Transient resolved once; subsequent requests get stale dependency | Inject factory or use `scoped()` for entire graph |

## Anti-Patterns
- **Singleton with mutable internal state** — Accumulates state across consumers; use immutable data structures.
- **Instance() for production binding registration** — Bypasses container lifecycle hooks.
- **Using bind() where singleton() was intended** — Multiplys allocation for stateless shared services.

## Examples

### Transient binding
```php
$this->app->bind(ReportParser::class, XmlReportParser::class);
$parser1 = $this->app->make(ReportParser::class); // new instance
$parser2 = $this->app->make(ReportParser::class); // different instance
```

### Singleton binding
```php
$this->app->singleton(CacheManager::class, RedisCacheManager::class);
$cache1 = $this->app->make(CacheManager::class); // cached
$cache2 = $this->app->make(CacheManager::class); // same instance
```

### Scoped binding (Octane-safe)
```php
$this->app->scoped(CurrentUser::class, AuthenticatedUser::class);
$user1 = $this->app->make(CurrentUser::class); // cached per scope
$user2 = $this->app->make(CurrentUser::class); // same within scope
// After flushScoped(): fresh instance on next make()
```

## Related Topics
- **Prerequisites:** Container Fundamentals
- **Closely Related:** Binding Resolution, Scoped Instance Management, Binding Extending
- **Advanced:** Contextual Binding, Tagged Bindings, Rebound Callbacks
- **Cross-Domain:** Octane Lifecycle (scoped/singleton distinction matters most here)

## AI Agent Notes
- When debugging data leaks under Octane, check every `singleton()` for mutable request-state — convert to `scoped()`.
- For test pollution, check `instance()` calls not restored via `forgetInstance()` in `tearDown()`.
- In FPM, `singleton()` and `scoped()` behave identically — distinction only matters in long-running processes.

## Verification
- [ ] Can explain the 4 binding types and their lifecycle behavior
- [ ] Understand why `scoped()` exists separately from `singleton()`
- [ ] Know when to use each binding type for correctness vs performance
- [ ] Can explain why `instance()` bypasses extenders and resolving callbacks
- [ ] Can audit a codebase for incorrect singleton usage under Octane
