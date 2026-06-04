# Skill: Register Core Aliases and Base Bindings

## Purpose

Establish and extend the foundational container state — the three base bindings (`'app'`, `Container::class`, `Psr\Container\ContainerInterface::class`) and the ~70 core aliases — that enable facade resolution and PSR-11 compliance throughout the Laravel application lifecycle.

## When To Use

- Understanding how the Application container is self-referencing after construction
- Registering custom facades via `$app->alias()` in service providers
- Debugging why a facade resolves to null or throws `BindingResolutionException`
- Verifying that base bindings survive `flush()` in Octane
- Building packages that need to register their own container aliases

## When NOT To Use

- Modifying the static `Application::$aliases` array directly — always use `$app->alias()` at runtime
- Removing or unsetting core aliases — the container does not support alias removal
- Confusing aliases with bindings — an alias is a secondary name, not a resolution definition
- Registering a binding with the same abstract key as a core alias (causes silent shadowing)

## Prerequisites

- Application instance constructed and available
- Understanding of the difference between container aliases and container bindings
- Knowledge of how facades resolve through aliases

## Inputs

- The abstract class/interface name to alias from
- The alias string key to alias to
- For custom facades: the facade class and its underlying service accessor

## Workflow

1. Verify base bindings are present: `$app->bound('app')`, `$app->bound(Container::class)`, `$app->bound(Psr\Container\ContainerInterface::class)` should all return `true`
2. Verify all three resolve to the same instance: `$app->make('app') === $app->make(Container::class) === $app->make(Psr\Container\ContainerInterface::class)`
3. List existing aliases: `$app->getAliases()` returns all registered alias mappings
4. For custom aliases, register in a service provider's `register()` or `boot()`: `$app->alias('stripe-client', StripeClient::class)`
5. Never modify `Application::$aliases` via reflection or direct static assignment — use `$app->alias()` instead
6. Verify no collision between the new alias and existing core aliases: `$app->isAlias('stripe-client')` before registration
7. After alias registration, verify resolution: `$app->make('stripe-client') === $app->make(StripeClient::class)`
8. For Octane compatibility, test that user-registered aliases are cleared by `flush()` and re-registered by `reset()`

## Validation Checklist

- [ ] `$app->make('app')` returns the Application instance
- [ ] `$app->make(Container::class)` returns the same instance
- [ ] `$app->make(Psr\Container\ContainerInterface::class)` returns the same instance
- [ ] At least 60 core aliases are registered (check with `count($app->getAliases())`)
- [ ] Custom aliases use a unique prefix (e.g., `'acme-search'` not `'search'`)
- [ ] Custom aliases are registered via `$app->alias()`, not by modifying `Application::$aliases`
- [ ] No binding uses the same abstract key as a core alias
- [ ] After `flush()`, base bindings still resolve; core aliases throw until `reset()`
- [ ] `$app->bound($alias)` returns `true` only when the target binding exists

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| `BindingResolutionException` for alias | Alias exists but target binding is not registered | Register the target binding first, then the alias |
| Alias shadows core alias silently | Using a single-word key that matches a core alias | Prefix with unique package identifier |
| Facade resolution fails after `flush()` in Octane | Aliases cleared by `flush()` but not re-registered by `reset()` | Use `reset()` (not `flush()`) to re-register aliases |
| Static alias modification affects all workers | Modifying `Application::$aliases` via reflection in Octane | Use `$app->alias()` which operates per-instance |

## Decision Points

- **`$app->alias()` vs facade class `$aliases` array** — Use `$app->alias()` in service providers for runtime registration; use the facade class's `getFacadeAccessor()` for facade-to-alias mapping
- **Alias vs direct binding** — Register an alias when you need both the class name and a short string to resolve the same service; use direct binding when only class-based resolution is needed

## Performance Considerations

- Alias resolution is O(1) hash lookup ~0.01ms per `$app->make()` call
- The ~70 core aliases are registered via ~120-150 `$this->alias()` calls in the constructor at <0.15ms total
- In Octane, the alias array is a singleton across requests — registration cost paid once per worker
- The `$aliases` array is static (class-level) to avoid re-allocation per worker

## Security Considerations

- The PSR-11 `ContainerInterface::class` binding exposes the full Application to any PSR-11-aware library
- Alias shadowing: if a package binds an abstract with the same key as a core alias, the binding shadows the alias silently — no warning is emitted
- The `'app'` alias exposes the full Application object — restrict container access in multi-tenant or sandboxed environments

## Related Rules

- Never unset or remove core aliases from the container (05-rules.md, Rule 1)
- Register custom aliases with `$app->alias()`, never by modifying static `$aliases` array (05-rules.md, Rule 2)
- Always use `$app->bound()` to test resolvability, not alias existence (05-rules.md, Rule 3)
- Prefix custom facade aliases with unique namespace (05-rules.md, Rule 4)
- Never register a binding with same abstract key as a core alias (05-rules.md, Rule 5)

## Related Skills

- Bootstrap a Laravel Application Instance (application-class-construction)
- Reset Application State Between Octane Requests (application-flush-and-reset)
- Debug Facade Resolution Failures (this KU)

## Success Criteria

- Base bindings resolve correctly and survive `flush()`
- All registered aliases resolve to their correct target abstracts
- Custom aliases do not collide with existing core aliases
- `$app->bound()` accurately reflects resolvability (not just alias existence)
- After `reset()`, all aliases are restored to working order

---

# Skill: Debug Facade Resolution Failures

## Purpose

Diagnose and resolve failures where Laravel facades (e.g., `Cache::`, `Auth::`, `DB::`) throw `BindingResolutionException`, return unexpected instances, or silently fail to resolve.

## When To Use

- Facade calls throw `BindingResolutionException`
- A facade returns a different service implementation than expected
- Facade resolution works in FPM but fails in Octane
- Facade resolution works on the first Octane request but fails on subsequent requests
- Custom facade does not resolve its underlying service

## When NOT To Use

- Service container resolution failures that do not involve facades (use standard container debugging)
- Failures in the facade class itself (e.g., `BadMethodCallException`) — these are method-call issues, not resolution issues
- Configuration loading failures that prevent facade backends from being available

## Prerequisites

- Understanding of how facades work: `Facade::resolveFacadeInstance()` → `$app->make($alias)` → alias lookup → binding resolution
- Knowledge of the alias system and the `registerCoreContainerAliases()` method
- Access to the Application instance and the container state

## Inputs

- The failing facade class name and method call
- The error message and stack trace
- The Application container state (aliases, bindings, resolved instances)
- The execution context (FPM vs Octane, first request vs subsequent request)

## Workflow

1. Identify the alias used by the facade: `$facade::getFacadeAccessor()` returns the alias string
2. Check if the alias exists: `$app->isAlias($alias)` — if false, the facade is not registered
3. Check if the alias target is bound: `$app->bound($alias)` — if false, the binding does not exist
4. If the alias exists but binding does not, determine which bootstrapper or provider should register it
5. If resolution fails only in Octane after the first request, check if `reset()` is being called (it clears aliases and bindings)
6. Verify that no binding shadows the alias key: `$app->bound($alias)` before and after the bootstrapper that should register the binding
7. Check for alias collisions: call `$app->getAliases()` and look for duplicate keys
8. If using a custom facade, ensure the alias is registered via `$app->alias()` in a service provider that runs before the facade is used

## Validation Checklist

- [ ] `$facade::getFacadeAccessor()` returns the expected alias string
- [ ] `$app->isAlias($alias)` returns `true` for the facade's alias
- [ ] `$app->bound($alias)` returns `true` at the point of facade use
- [ ] No binding uses the same key as the facade's alias (shadowing)
- [ ] In Octane, the alias and binding survive the `reset()` cycle
- [ ] Custom facade alias is registered before first use (early in provider registration)
- [ ] No two packages register an alias with the same key

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| `BindingResolutionException` for `'auth'` facade | Auth service provider not registered or deferred | Check `config/app.php` providers list |
| Facade works on first Octane request but not second | Binding registered without `reset()` survival | Register binding in a bootstrapper or ensure provider re-registers after reset |
| Custom facade returns wrong service | Alias maps to different binding than expected | Check `$app->getAliases()` for collisions |
| `AliasLoader` not loading facade class | Facade not in `aliases` array in `config/app.php` | Add facade class to `config/app.php 'aliases'` |
| Facade works in FPM but not in test | Test does not run `RegisterFacades` bootstrapper | Call `$this->app->bootstrapWith([RegisterFacades::class])` in test setup |

## Decision Points

- **Missing alias vs missing binding** — If alias is missing, register it via `$app->alias()` or add to `config/app.php 'aliases'`; if binding is missing, register the binding in the appropriate bootstrapper or service provider
- **Static registration vs runtime registration** — Use `config/app.php 'aliases'` for application-wide facades; use `$app->alias()` in service providers for package facades or conditional registrations

## Performance Considerations

- Facade resolution via `Facade::resolveFacadeInstance()` is O(1) — negligible overhead
- First facade call per alias resolves and caches the instance in `$resolvedInstance` — subsequent calls use the cached reference
- In Octane, after `reset()`, `$resolvedInstance` is cleared — the next facade call re-resolves

## Security Considerations

- A facade resolution that returns the wrong service can silently expose the wrong implementation
- If a binding shadows an alias, the facade returns the shadowing binding — this may bypass security checks in the expected implementation
- In Octane, if a binding registration does not survive `reset()`, a facade may work on the first request but fail on the second — this is a reliability issue that can lead to partial application failure

## Related Rules

- Always use `$app->bound()` to test resolvability, not alias existence (05-rules.md, Rule 3)
- Prefix custom facade aliases with unique namespace (05-rules.md, Rule 4)
- Never register a binding with same abstract key as a core alias (05-rules.md, Rule 5)
- Never unset or remove core aliases (05-rules.md, Rule 1)

## Related Skills

- Register Core Aliases and Base Bindings (this KU)
- Reset Application State Between Octane Requests (application-flush-and-reset)
- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)

## Success Criteria

- The failing facade resolves correctly in all execution contexts (FPM, Octane, CLI, tests)
- The correct underlying service is returned by the facade
- No alias collisions exist between custom and core aliases
- Resolution works consistently across Octane request boundaries
- A clear distinction exists between alias existence and binding existence in the debugging trace
