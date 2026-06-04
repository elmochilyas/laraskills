# Container Aliases

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Container |
| Knowledge Unit | Container Aliases |
| Difficulty | Intermediate |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Container aliases are alternative names for registered abstracts, enabling multiple keys to resolve to the same container binding. Implemented through `Container::alias()` and stored in the `$aliases` array, this feature powers Laravel's Facade system — every Facade resolves through an alias chain that ends at a concrete binding. The critical engineering decision is the recursive resolution chain: when `make('cache')` is called, the container checks if `'cache'` is an alias, which may point to another alias, until reaching a non-alias binding. Alias resolution happens as the very first step in `resolve()`, before the instances cache check — ensuring `make('cache')` and `make(CacheManager::class)` hit the same cached singleton.

## Core Concepts
- **Alias Registration** — `$app->alias('cache', 'Illuminate\Contracts\Cache\Repository')` maps a short name to an FQCN.
- **Resolution Chain** — `getAlias()` recursively follows aliases until it reaches a non-alias abstract.
- **Facade Integration** — Every Facade's `getFacadeAccessor()` returns a string that resolves through alias chain.
- **Core Aliases** — ~40 alias groups registered in `registerCoreContainerAliases()`, each mapping a short key to 1-3 FQCNs.
- **Bidirectional Storage** — `$aliases` (forward) and `$abstractAliases` (reverse lookup for debugging).

## When To Use
- Providing short-hand names for long FQCNs: `alias(CacheManager::class, 'cache')`.
- Backward compatibility when refactoring interface/class names.
- Multi-name Facade support — allowing Facades with multiple accessor names.
- Service provider registration — alias newly registered services for convenient access.

## When NOT To Use
- Creating circular alias chains (A → B → A causes infinite recursion / stack overflow).
- Replacing binding registration — aliases are pointers, not bindings.
- Overusing aliases for every service — each alias is one more name to maintain.

## Best Practices
- **Register alias in same provider as the binding** — Separating risks alias registered before binding exists.
- **Avoid circular aliases** — Ensure alias chains form a DAG, not a cycle. All aliases must resolve to a non-alias binding.
- **Use aliases sparingly in application code** — Prefer type-hinting the contract interface directly and using Facades for convenience.
- **Document core alias overrides** — Overriding a core alias (e.g., `'db'`) can break packages relying on the original mapping.
- WHY: Aliases provide the flexibility of multiple accessor names for a single service while maintaining resolution consistency across all entry points.

## Architecture Guidelines
- Alias resolution is the first step in `resolve()` — before instances cache, contextual bindings, and bindings.
- Aliases are not bindings — an alias without a target binding throws at resolution time, not registration time.
- $aliases is forward map (alias → canonical); $abstractAliases is reverse map (canonical → [aliases]).
- Core aliases map short keys to arrays of FQCNs; the first class is primary, remaining are alias()'d to it.

## Performance Considerations
- Every `make()` call invokes `getAlias()` — array key existence check (~0.2μs for non-aliased abstracts).
- For aliased abstracts, recursive traversal adds ~0.3μs per alias chain level (typically 1-2 levels).
- ~40 core aliases with 2-3 secondary aliases each = ~100 entries; memory footprint ~8KB.
- In Octane, alias arrays persist for worker lifetime — memory is constant and negligible.

## Security Considerations
- Aliases can obscure which service is actually being resolved — make alias chains transparent through documentation.
- Overriding core aliases can silently change framework behavior — audit before overriding.
- Dangling aliases (alias without binding) throw at resolution time — catch and test in CI.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Registering alias for non-existent binding | Wrong provider ordering | `BindingResolutionException` at resolution time | Register binding before alias in same provider |
| Creating circular aliases | Chaining `alias()` calls without verifying target | Stack overflow / infinite recursion | Ensure alias chain forms a DAG, not cycle |
| Assuming aliased abstract is a binding | `bound()` returns true for aliases | `forgetInstance('cache')` may not clear instance stored under canonical name | Use canonical name for `bound()` and `forgetInstance()` |

## Anti-Patterns
- **Alias Cycles** — A → B → A creates infinite recursion; container doesn't detect circular aliases.
- **Alias Overuse** — Registering aliases for every service instead of using the FQCN directly.
- **Alias-to-Alias Chains** — Aliases that point to other aliases create unnecessary indirection.

## Examples

### Basic alias registration
```php
$this->app->singleton(PaymentManager::class);
$this->app->alias(PaymentManager::class, 'payments');
// Both resolve to same instance:
$manager = $this->app->make(PaymentManager::class);
$manager = $this->app->make('payments');
```

### Backward compatibility alias
```php
$this->app->alias(NewPaymentGateway::class, OldPaymentGateway::class);
// Old type-hints still work, resolving to NewPaymentGateway
```

### Core alias structure
```php
// registerCoreContainerAliases() structure:
'app' => [Application::class, Container::class, ContainerInterface::class],
'cache' => [CacheManager::class, Factory::class],
// Short key → array of FQCNs all resolving to same instance
```

## Related Topics
- **Prerequisites:** Container Fundamentals
- **Closely Related:** Binding Types, Binding Resolution
- **Advanced:** Resolution Callbacks, Scoped Instance Management
- **Cross-Domain:** Facade Architecture (aliases power the Facade system)

## AI Agent Notes
- When `make('some_key')` returns unexpected instance, trace the alias chain — it may resolve to a different binding.
- Dangling alias errors occur at resolution time, not registration — test all aliases during boot.
- Alias cycles cause stack overflow — the only error is PHP "Maximum function nesting level" without a container exception.

## Verification
- [ ] Can explain how `getAlias()` resolves recursive alias chains
- [ ] Understand why alias resolution is the first step in `resolve()`
- [ ] Know the bidirectional storage structure ($aliases + $abstractAliases)
- [ ] Can diagnose dangling alias and circular alias failures
- [ ] Can explain the relationship between aliases and Facades
