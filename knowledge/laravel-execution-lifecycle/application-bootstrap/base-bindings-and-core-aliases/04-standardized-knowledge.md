# Base Bindings and Core Aliases

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Application Bootstrap |
| Knowledge Unit | Base Bindings and Core Aliases |
| Difficulty | Foundation |
| Lifecycle Phase | Construction |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Two methods within the Application constructor establish the absolute minimum service container state. `registerBaseBindings()` binds the Application itself and the PSR-11 container interface as singletons. `registerCoreContainerAliases()` populates the `$aliases` array — a mapping from short facade names (e.g., `'events'`, `'log'`, `'router'`) to their concrete class or interface names — enabling Laravel's facade system to resolve targets through the container. These registrations are permanent: they are the only bindings guaranteed to survive a `flush()` or `reset()` call, making them the persistence layer during Octane request recycling.

## Core Concepts
- **Base Bindings** — Three singleton bindings: `'app' => $this`, `Container::class => $this`, `Psr\Container\ContainerInterface::class => $this`. These ensure any PSR-11-aware library retrieves the container without coupling to Laravel's concrete Application class.
- **Core Aliases Array** — A `protected static $aliases` array of ~70 entries mapping short string keys (like `'auth'`, `'cache'`, `'encrypter'`) to fully qualified class/interface names. Registered via successive `$this->alias($abstract, $alias)` calls.
- **Alias vs Binding** — An alias is a secondary name pointing to an existing abstract; a binding is a concrete resolution definition. Aliases do not create new bindings — they create alternative lookup paths.
- **Flush survival** — Base bindings are the only container state immune to `flush()`. Aliases are cleared by `flush()` and re-registered by `reset()`.

## When To Use
- Understanding why `app()`, `Container::class`, and PSR-11 resolution work even before bootstrappers run
- Debugging facade resolution failures — verify the alias exists in the `$aliases` array
- Building custom facades that need alias registration
- Auditing container state in Octane after `flush()` — only base bindings survive

## When NOT To Use
- Registering user-defined aliases in the static `$aliases` array — use `$app->alias()` at runtime instead
- Expecting `$app->make('config')` to work before `LoadConfiguration` bootstrapper — the alias exists but no binding does
- Modifying `Application::$aliases` at runtime via reflection — use `$app->alias()` for runtime registration
- Relying on aliases for type-hinting resolution — type-hints resolve by class/interface name, not alias

## Best Practices
- **Use unique alias keys for custom facades** — Prefix with package name (e.g., `'stripe-client'`) to avoid core alias collisions.
- **Never unset core aliases** — The container does not support alias removal; removing a resolved alias leaves dangling references in `$this->resolved` and `$this->aliases`.
- **Distinguish alias from binding** — Check with `$app->bound()` rather than assuming alias existence guarantees resolvability.
- **Test flush survival** — When writing Octane-compatible code, verify that bindings relying on base aliases survive `flush()`; user-registered aliases do not.
- WHY: The base bindings and aliases define the container's identity. Aliases fail silently on collision — the last registration wins with no warning.

## Architecture Guidelines
- Base bindings establish the container's identity within itself; aliases are a convenience layer for facades — separating them allows `flush()` to clear user state while preserving framework identity.
- The `$aliases` array is static (class-level) to avoid re-allocation per worker in Octane — shared across all Application instances.
- Multi-class alias values (e.g., `'app'` maps to both `Container::class` and `Psr\Container\ContainerInterface::class`) allow type-hinting either interface to receive the same instance.
- The PSR-11 bridge is implemented via direct `$this->instance()` binding rather than an adapter — eliminates overhead but couples PSR-11 consumers to Laravel's container.

## Performance Considerations
- Alias array iteration: ~70 entries × 1–3 `alias()` calls each = ~120–150 invocations at <0.15ms total.
- Facade resolution: `Facade::resolveFacadeInstance()` calls `$app->make($alias)` — O(1) hash lookup at ~0.01ms per call.
- In Octane, the alias array is a singleton across requests; registration cost paid once per worker.
- Base bindings are three `$this->instance()` calls — negligible overhead.

## Security Considerations
- Binding `Psr\Container\ContainerInterface::class` to the Application gives any PSR-11-aware library full access to the container — audit third-party packages for container access patterns.
- Alias shadowing: if a package binds an abstract with the same key as a core alias (e.g., `'events'`), the binding shadows the alias silently. Use `$app->bound()` to verify no collision exists.
- The `'app'` alias exposes the full Application object — container access should be restricted in multi-tenant or sandboxed environments.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Confusing `$app->make('app')` with `$app->make(Application::class)` | Both resolve to same instance but through different paths | Subtle resolution differences if aliases are modified | Use `Application::class` for type-safety in production code |
| Expecting `$app->make('config')` to work before LoadConfiguration | Assuming alias existence = resolvable | `BindingResolutionException` despite alias existing | Wait for `LoadConfiguration` bootstrapper or document that aliases are not bindings |
| Modifying `Application::$aliases` via reflection at runtime | Needing to change alias mapping | Inconsistent container state across requests | Use `$app->alias()` for runtime alias registration |
| Forgetting aliases are cleared by `flush()` | Assuming all container state persists | Facade resolution breaks after flush in Octane | Use `reset()` not `flush()` to re-register aliases between requests |

## Anti-Patterns
- **Static alias modification** — Reassigning `Application::$aliases` at runtime via reflection; the static property is not intended for mutation.
- **Alias-only resolution strategy** — Resolving services exclusively by alias string prevents IDE autocompletion and type inference.
- **Binding over core aliases** — Registering a binding with the same abstract as a core alias key causes silent shadowing.
- **Alias removal after resolution** — The container does not track alias removal; dangling references in `$this->resolved` cause memory leaks.

## Examples

### Base Bindings Registration
```php
// registerBaseBindings() equivalent
$app->instance('app', $app);
$app->instance(Container::class, $app);
$app->instance(Psr\Container\ContainerInterface::class, $app);
```

### Alias Registration Pattern
```php
// registerCoreContainerAliases() processes entries like:
protected static $aliases = [
    'app' => [
        \Illuminate\Contracts\Container\Container::class,
        \Psr\Container\ContainerInterface::class,
    ],
    'auth' => [
        \Illuminate\Contracts\Auth\Factory::class,
        \Illuminate\Contracts\Auth\Guard::class,
    ],
    'cache' => [
        \Illuminate\Contracts\Cache\Factory::class,
    ],
    // ... ~70 entries total
];
```

### Custom Alias Registration
```php
// In a service provider
$app->alias('stripe-client', StripeClient::class);
// Now $app->make('stripe-client') === $app->make(StripeClient::class)
```

## Related Topics
- **Prerequisites:** Service Container Fundamentals, Application Class Construction
- **Closely Related:** Facade Architecture, Container Aliases, Application Flush and Reset
- **Advanced:** Octane State Management, Deferred Provider Loading Timing
- **Cross-Domain:** PSR-11 Container Interface Compliance

## AI Agent Notes
The three base bindings are the only container state that survives `flush()`. Any code that must remain available across request boundaries in Octane must either bind against these three keys or use `reset()` (which re-registers aliases) instead of `flush()`. The `$aliases` array is defined as `protected static` — it is shared across all Application instances in the same PHP process. In Octane, this means alias registration is effectively global; modifying it in one worker affects all workers in that process.

## Verification
- [ ] `$app->make('app')` returns the Application instance
- [ ] `$app->make(Container::class)` returns the same instance
- [ ] `$app->make(Psr\Container\ContainerInterface::class)` returns the same instance
- [ ] At least 60 core aliases are registered in `$app->getAliases()`
- [ ] After `flush()`, base bindings (`'app'`, `Container::class`, PSR-11) still resolve
- [ ] After `flush()`, core aliases (e.g., `'auth'`) throw `BindingResolutionException` until `reset()`
- [ ] Custom alias registered via `$app->alias()` resolves correctly
- [ ] No collision exists between custom aliases and core aliases
