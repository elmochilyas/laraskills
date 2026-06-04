# Skill: Reset Application State Between Octane Requests

## Purpose

Cleanly restore the Laravel Application container to a post-construction baseline between requests in long-running processes (Octane, RoadRunner, FrankenPHP), ensuring no request-scoped state leaks from one request to the next.

## When To Use

- Deploying Laravel Octane, RoadRunner, or FrankenPHP in production
- Implementing custom request-lifecycle middleware for long-running PHP runtimes
- Auditing or debugging cross-request state contamination in Octane workers
- Verifying that container state is properly isolated between requests

## When NOT To Use

- Calling `reset()` or `flush()` manually during a request lifecycle (middleware, controllers, service providers) — causes catastrophic container destruction mid-request
- Using `flush()` without immediately re-registering aliases and base bindings — use `reset()` instead
- Expecting `reset()` to re-load configuration files — it only clears bindings; config must be reloaded via bootstrappers
- Calling `flush()` or `reset()` in standard FPM code — only one request per instance; no useful effect

## Prerequisites

- Laravel Octane, RoadRunner, or FrankenPHP running in production
- Understanding of container bindings: singleton, scoped, instance, alias
- Familiarity with the `hasBeenBootstrapped` guard and its role in preventing double bootstrapping

## Inputs

- The Application instance (`$app`)
- Verification that the current runtime is a long-running process (Octane, RoadRunner, FrankenPHP)

## Workflow

1. Between request A completion and request B start, call `$app->reset()` — never `$app->flush()` alone
2. `reset()` internally calls `flush()` which clears all bindings, instances, aliases, extenders, rebound callbacks, resolved tracking, contextual bindings, tags, scoped instances, and resets the AliasLoader singleton
3. `reset()` then re-calls `registerBaseBindings()` to re-bind `'app'`, `Container::class`, and `Psr\Container\ContainerInterface::class`
4. `reset()` re-calls `registerCoreContainerAliases()` to restore all ~70 facade aliases
5. `reset()` sets `hasBeenBootstrapped = false` to allow re-bootstrap
6. `reset()` sets `booted = false` and clears `loadedProviders = []`
7. After `reset()`, the bootstrapper sequence can run again via `bootstrapWith()` — this is what Octane does between requests

## Validation Checklist

- [ ] `$app->reset()` is called (not `$app->flush()`) between request boundaries
- [ ] After reset, `$app->make('app')` still works (base bindings preserved)
- [ ] After reset, `$app->make('auth')` throws `BindingResolutionException` (aliases cleared, need bootstrappers)
- [ ] After reset, `$app->bound('config')` returns `false`
- [ ] After reset, `hasBeenBootstrapped()` returns `false`
- [ ] Memory usage decreases after reset (verify with `memory_get_usage()`)
- [ ] No static properties on service providers leak data across requests
- [ ] Scoped singletons are cleared (verify with `$app->make()` after reset)

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| All facade resolution breaks after request | Using `flush()` instead of `reset()` | Replace `flush()` with `reset()` to re-register aliases |
| `LogicException` on re-bootstrap | `hasBeenBootstrapped` still true from previous cycle | Call `reset()` before `bootstrapWith()` |
| Static properties leak user data | `flush()` does not clear static state | Replace static properties with scoped container bindings |
| Database connections remain open after reset | `flush()` clears bindings but not PHP resources | Register `beforeResolving()` callbacks or Octane flush listeners to clean resources |
| Mid-request reset destroys application | `flush()` called in middleware | Use Octane lifecycle hooks (`tick()`, `RequestTerminated`) instead |

## Decision Points

- **`reset()` vs `flush()`** — Always use `reset()` for request boundaries; only use `flush()` alone when you need fine-grained control and will manually re-register bindings and aliases
- **Framework-managed vs custom reset** — Octane, RoadRunner, and FrankenPHP manage `reset()` internally via lifecycle hooks — do not call `reset()` manually unless building a custom long-running integration

## Performance Considerations

- `flush()` complexity: O(n) where n = number of bindings, instances, aliases, callbacks — clears ~50-100 entries in ~0.05ms
- `reset()` adds `registerBaseBindings()` (~0.01ms) and `registerCoreContainerAliases()` (~0.15ms) on top of `flush()`
- Total `reset()` cost: ~0.2ms per request — negligible in Octane's per-request budget
- `flush()` releases all container-allocated memory from bindings, instances, and callbacks — prevents unbounded memory growth

## Security Considerations

- `flush()` does NOT clear static properties on service providers or user classes — static state leaks are the #1 Octane security incident cause
- `flush()` removes bindings but does NOT close database connections, file handles, or network sockets
- The `'app'` self-reference survives flush — code caching this reference and using it post-flush may access cleared bindings
- AliasLoader singleton is reset, but if user code holds a separate reference to the old `AliasLoader`, facade resolution may use the stale instance

## Related Rules

- Always use `reset()` not `flush()` for request-boundary cleanup (05-rules.md, Rule 1)
- Never call `flush()` or `reset()` during a request lifecycle (05-rules.md, Rule 2)
- Never rely on `flush()` to clear static properties (05-rules.md, Rule 4)
- Use `scoped()` instead of `singleton()` for fresh-per-request bindings (05-rules.md, Rule 5)
- Never call `bootstrapWith()` a second time without calling `reset()` first (bootstrapper-sequence, Rule 6)

## Related Skills

- Register Core Aliases and Base Bindings (base-bindings-and-core-aliases)
- Test Container Bindings for Flush Survival (this KU)
- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)

## Success Criteria

- Container state is cleanly reset between requests with no binding leaks
- Facade resolution works correctly on the next request (aliases re-registered)
- `hasBeenBootstrapped` guard is cleared, allowing re-bootstrap
- No request A's data is accessible in request B
- Memory usage is stable across thousands of requests

---

# Skill: Test Container Bindings for Flush Survival

## Purpose

Verify that container bindings, aliases, and resolved instances behave correctly after an Application `flush()` or `reset()` cycle in long-running processes.

## When To Use

- Writing Octane-compatible code that registers custom container bindings
- Auditing existing bindings for cross-request state leaks
- Developing service providers for deployment on Octane or RoadRunner
- Debugging bindings that should survive flush but do not, or vice versa

## When NOT To Use

- Testing framework-managed bindings (registered by `LoadConfiguration`, `RegisterFacades`, etc.) — they are already tested
- Testing bindings in standard FPM applications that do not use long-running processes
- Testing static class properties (they are not container-managed and require different testing)

## Prerequisites

- PHPUnit or Pest test suite set up
- Application instance available in tests
- Understanding of what `flush()` clears vs preserves
- A test environment that approximates Octane's request cycle

## Inputs

- The Application instance (`$this->app` or `app()`)
- The binding abstract key or class to test
- Expected survival behavior: `true` (should survive flush) or `false` (should be cleared)

## Workflow

1. Register the binding under test in the container: `$app->singleton(MyService::class, ...)`
2. Optionally resolve the binding to confirm it works before flush: `$instance = $app->make(MyService::class)`
3. Call `$app->flush()` to clear all non-base container state
4. Assert the binding is no longer bound: `$this->assertFalse($app->bound(MyService::class))`
5. For scoped bindings, verify the same: `$app->scoped(MyScoped::class, ...)` → `$app->flush()` → `$app->bound(MyScoped::class) === false`
6. For base bindings that should survive flush: `$app->flush()` → `$app->bound('app') === true`
7. Call `$app->reset()` to restore aliases
8. Verify the binding can be re-resolved after the full reset cycle

## Validation Checklist

- [ ] Custom singleton bindings are cleared by `flush()`
- [ ] Custom scoped bindings are cleared by `flush()`
- [ ] Base bindings (`'app'`, `Container::class`, `Psr\Container\ContainerInterface::class`) survive `flush()`
- [ ] Core aliases (`'auth'`, `'cache'`, etc.) are cleared by `flush()` and restored by `reset()`
- [ ] Resolved instances are cleared (previously resolved object is no longer in container)
- [ ] Re-resolving after `flush()` + `reset()` produces a fresh instance
- [ ] `AliasLoader` singleton is reset (old facade references do not persist)

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| Binding survives `flush()` unexpectedly | Registered using `instance()` which bypasses binding clearance | Use `singleton()` or `scoped()` for flushable bindings |
| Binding is cleared but shouldn't be | Not using `reset()` after `flush()` | Call `reset()` to re-register base bindings and aliases |
| Resolved instance returns stale data | Test resolves binding before flush, then uses old reference | Always re-resolve after reset cycle |
| `AliasLoader` still has old facade instances | `flush()` resets AliasLoader, but test code cached facade references | Refresh facade references after reset |

## Decision Points

- **Unit test vs integration test** — Use unit tests for individual binding survival; use integration tests for the full Octane request cycle
- **`flush()` test vs `reset()` test** — Use `flush()` test to verify the binding is cleared from the container; use `reset()` test to verify the binding can be re-registered on the next cycle

## Performance Considerations

- Flush-survival tests are fast (~0.1ms per binding assertion) — can be added to every service provider test suite
- In CI, run flush-survival tests as part of the provider test group to catch regressions early

## Security Considerations

- A binding that unexpectedly survives `flush()` can leak sensitive data across requests
- A binding that is unexpectedly cleared but should persist (e.g., a connection pool) causes re-initialization cost on every request

## Related Rules

- Test every custom binding for flush survival when writing Octane-compatible code (05-rules.md, Rule 3)
- Use `scoped()` instead of `singleton()` for fresh-per-request bindings (05-rules.md, Rule 5)
- Never rely on `flush()` to clear static properties (05-rules.md, Rule 4)

## Related Skills

- Reset Application State Between Octane Requests (this KU)
- Migrate Static State to Scoped Bindings (this KU)
- Register Core Aliases and Base Bindings (base-bindings-and-core-aliases)

## Success Criteria

- Every custom binding has a corresponding flush-survival test
- `flush()` tests correctly identify bindings that should be cleared per request
- `reset()` tests confirm bindings can be re-registered and re-resolved
- No binding unexpectedly leaks across the reset boundary in production Octane workers

---

# Skill: Migrate Static State to Scoped Bindings

## Purpose

Replace static class properties (which leak across requests in long-running processes) with scoped container bindings that are automatically cleared between Octane requests.

## When To Use

- Auditing an existing Laravel application for Octane compatibility
- Finding cross-request data leaks caused by static properties on service providers, controllers, or helper classes
- Building new Octane-compatible code that must store request-scoped state
- Refactoring legacy code that uses `static::$currentUser` or similar patterns for request context

## When NOT To Use

- Stateless static properties (class constants, mapping arrays, enum cases) that do not vary per request — these are safe
- Global configuration that does not change per request — use `singleton()` instead
- State that must persist across requests intentionally (rate limiters, connection pools) — use `singleton()`

## Prerequisites

- Application running on Octane, RoadRunner, or FrankenPHP
- Identified static property leak (e.g., `UserContext::$current` holding previous request's user)
- Understanding of container scoped bindings and how they are automatically cleared by `flush()`

## Inputs

- The class with static properties that leak state
- The type of state being stored (user, request, session, etc.)
- The expected lifetime of the state (single request only)

## Workflow

1. Identify all static properties in service providers, controllers, middleware, and helper classes that store request-scoped data
2. For each, create a container-friendly class that holds the state as instance properties instead of static properties
3. Register the class as a scoped binding: `$app->scoped(UserContext::class, fn () => new UserContext)` in a service provider's `register()` method
4. Replace all `ClassName::$property = $value` assignments with `app(ClassName::class)->property = $value`
5. Replace all `ClassName::$property` reads with `app(ClassName::class)->property`
6. Remove the static properties from the original class
7. Write a flush-survival test to verify the binding is cleared on `$app->flush()`
8. Run the application under Octane and verify no cross-request state leakage

## Validation Checklist

- [ ] All static properties storing request-scoped data have been converted to instance properties
- [ ] The replacement class is registered as `scoped()` in the container
- [ ] No `static::$property` reads or writes remain for request-scoped data
- [ ] Flush-survival test confirms the scoped binding is cleared on `flush()`
- [ ] Compile-time constants and class-level configuration remain as static properties (safe)
- [ ] The application functions correctly under Octane without data contamination

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| User data still leaks after migration | Some static reference was missed | Audit all classes with `static::$` or `self::$` for request-scoped data |
| `app(UserContext::class)` resolves to wrong instance | Not using `scoped()` — using `singleton()` instead | Change to `$app->scoped()` to auto-clear on flush |
| New instance created but old data still appears | Service provider registers scoped binding in `boot()` instead of `register()` | Move `$app->scoped()` to `register()` to ensure it runs before resolution |
| Performance regression | `app()` call on every access is slower than `static::$` | Accept micro-cost (~0.01ms per resolution) or inject via constructor |

## Decision Points

- **Scoped binding vs constructor injection** — Use scoped bindings for state that is set mid-request (after controller instantiation); use constructor injection for state available at instantiation time
- **`scoped()` vs `singleton()` + manual clear** — Always prefer `scoped()` because it is automatically cleared by `flush()` and requires no manual reset logic

## Performance Considerations

- Scoped binding resolution cost: ~0.01ms per `app()` call — negligible for typical usage (1-5 resolutions per request)
- Memory: scoped instances are stored in `$this->scopedInstances` and cleared by `flush()` — zero residual memory between requests
- Static property access is faster (~0.001ms) but the safety benefit of scoped bindings far outweighs the micro-optimization

## Security Considerations

- Static state leaks are the #1 Octane security incident — one request's authenticated user leaking to the next request is a critical vulnerability
- Scoped bindings are cleared by `flush()` but still accessible during a single request — ensure sensitive data is explicitly cleared if the same user context might be reused within a request

## Related Rules

- Never rely on `flush()` to clear static properties (05-rules.md, Rule 4)
- Use `scoped()` instead of `singleton()` for fresh-per-request bindings (05-rules.md, Rule 5)
- Test every custom binding for flush survival (05-rules.md, Rule 3)

## Related Skills

- Reset Application State Between Octane Requests (this KU)
- Test Container Bindings for Flush Survival (this KU)
- Write Environment-Aware Service Providers (path-helpers-and-environment-detection)

## Success Criteria

- No static properties storing request-scoped data remain in the codebase
- All request-scoped state uses scoped container bindings
- `flush()` clears all scoped instances between requests
- Octane workers show zero cross-request data contamination
- Flush-survival tests pass for all migrated bindings
