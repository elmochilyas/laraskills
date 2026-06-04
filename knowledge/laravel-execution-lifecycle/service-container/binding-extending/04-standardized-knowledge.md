# Binding Extending

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Container |
| Knowledge Unit | Binding Extending |
| Difficulty | Advanced |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Binding extending is Laravel's implementation of the Decorator pattern within the service container, enabled through `Container::extend()`. After a binding is registered, `extend()` wraps the resolved instance with additional behavior by passing it through an extender closure before returning it to the caller. This enables modification of service behavior without altering the original binding registration — a form of open-ended interception. The critical engineering decision is that extenders are applied *before* the instance is cached as a singleton and *before* resolution callbacks fire, ensuring the cached instance is the fully-decorated one and preventing wrapper stacking on repeated resolutions.

## Core Concepts
- **Extender Registration** — `$app->extend(Abstract::class, fn($instance, $app) => modified)` — appends to extender stack.
- **Extender Stack** — Multiple extenders execute in registration order; later extenders wrap earlier ones.
- **Instance Replacement** — Extenders can replace the instance entirely (return a decorator wrapping the original).
- **Pre-existing Binding Required** — `extend()` throws if abstract has no binding — cannot decorate non-existent bindings.
- **Already-Resolved Rebinding** — If `extend()` is called after binding was already resolved, container re-resolves via rebound mechanism.

## When To Use
- Adding cross-cutting behavior (logging, caching, monitoring) to existing services without modifying them.
- Package authors needing to modify framework services without changing registration.
- Wrapping API clients with retry logic, tracing, or circuit breakers.
- Environment-specific modifications (e.g., enable query logging only in debug mode).

## When NOT To Use
- Replacing a binding entirely when extenders exist — use `forgetInstance()` + rebind instead.
- Extending auto-resolved classes without first registering a binding (extend requires pre-existing binding).
- Stateful extenders that capture mutable request data (behavior becomes non-deterministic).

## Best Practices
- **Prefer extenders over binding replacement** — Using `extend()` preserves original binding and allows other packages to also extend it.
- **Register extenders in correct order** — Later extenders wrap earlier ones. Document intended ordering.
- **Use decorator classes, not inline closures** — Extenders that wrap the instance should use proper decorator classes implementing the same interface.
- **Avoid stateful extenders** — Closures capturing mutable request state produce non-deterministic decoration.
- WHY: Extenders enable Open/Closed Principle compliance — services are open for extension through decoration without modifying their registration or source code.

## Architecture Guidelines
- Extenders stored as array stack in `$extenders[abstractName]`.
- Applied after build but before caching — ensures cached singleton is fully decorated.
- Applied before resolution callbacks — callbacks see the final decorated instance.
- If already resolved, `extend()` triggers `rebound()` which re-resolves and applies the new extender.

## Performance Considerations
- Extender closures stored but not executed until resolution — zero registration-time cost.
- Extender application loop is O(N) where N = extenders for that abstract.
- Each extender adds closure storage (~80 bytes) plus captured variable memory.
- With 50 extenders across all bindings, total memory ~6.4KB — negligible.
- If extender re-resolves (`make()` inside extender), can trigger recursive resolution.

## Security Considerations
- Extenders can replace instances entirely — a malicious extender could return a different type, breaking type safety.
- Extenders have access to the container — avoid resolving sensitive services inside extender closures.
- Audit third-party package extenders before deployment — they modify framework behavior at the container level.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Calling `extend()` before binding registered | Wrong provider ordering | `BindingResolutionException` | Ensure bindings provider registers before extender's provider |
| Returning wrong type from extender | Incorrect decorator implementation | Type errors at consumer site | Always return same type or subtype; use static analysis |
| Modifying instance in-place instead of decorating | Simpler code, but non-composable | Cannot stack multiple extenders | Always wrap in decorator class implementing same interface |
| `make()` inside extender on same abstract | Re-resolution attempt | Infinite recursion or double decoration | Use instance parameter passed to extender |

## Anti-Patterns
- **Inline Mutations Instead of Decorators** — Modifying properties on the instance instead of wrapping it.
- **Extending Non-Existent Bindings** — Not registering a binding first before calling `extend()`.
- **Stacking Excessively** — 10+ extenders on one binding creates deeply nested call stacks.

## Examples

### Logging decorator via extend
```php
$this->app->extend(OrderProcessor::class, function ($processor, $app) {
    return new LoggingOrderProcessor(
        $processor,
        $app->make(LoggerInterface::class)
    );
});
```

### Cache-aside wrapping
```php
$this->app->extend(ExpensiveCalculator::class, function ($calculator, $app) {
    return new CachedCalculator(
        $calculator,
        $app->make(Cache::class),
        ttl: 3600
    );
});
```

### Environment-specific extending
```php
if (config('app.debug')) {
    $this->app->extend(DatabaseManager::class, function ($db) {
        return $db->enableQueryLog();
    });
}
```

## Related Topics
- **Prerequisites:** Container Fundamentals, Binding Types
- **Closely Related:** Resolution Callbacks, Binding Resolution
- **Advanced:** Contextual Binding, Rebound Callbacks
- **Cross-Domain:** Service Providers (extender registration in providers)

## AI Agent Notes
- When an extender doesn't seem to apply, check if the binding was resolved before `extend()` was called.
- Debug extenders by logging abstract name + extender count in `boot()`.
- For third-party package conflicts, check extender order — later extenders wrap earlier ones.

## Verification
- [ ] Can register an extender and explain when it executes
- [ ] Understand why extenders run before caching (prevents wrapper stacking)
- [ ] Know why extenders require pre-existing bindings
- [ ] Can explain the difference between `extend()` and `resolving()` callbacks
- [ ] Can debug "extender not applied" issues (binding resolved too early)
