# Application Flush and Reset

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Application Bootstrap |
| Knowledge Unit | Application Flush and Reset |
| Difficulty | Advanced |
| Lifecycle Phase | Termination / Reset |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
`flush()` and `reset()` are the mechanisms by which the Laravel Application returns to a clean state after a request in long-running processes (Octane, Swoole, RoadRunner). `flush()` clears all container bindings, resolved instances, aliases, and service providers — effectively returning the container to its post-constructor state while preserving the application self-reference. `reset()` additionally re-registers base bindings and core aliases, clears the `hasBeenBootstrapped` guard, and resets the provider registry to allow clean re-initialization. These methods form the foundation of Laravel's Octane request isolation model and are the result of years of production debugging across multiple long-running process runtimes.

## Core Concepts
- **`flush()`** — Clears all container state: `$this->bindings`, `$this->instances`, `$this->resolved`, `$this->aliases`, `$this->extenders`, `$this->tags`, `$this->reboundCallbacks`, `$this->globalBeforeResolvingCallbacks`, `$this->globalAfterResolvingCallbacks`, `$this->contextual`. Resets `AliasLoader` singleton. Only `'app'`, `Container::class`, and `Psr\Container\ContainerInterface::class` survive.
- **`reset()`** — Calls `flush()` then re-calls `registerBaseBindings()` and `registerCoreContainerAliases()`. Sets `$this->hasBeenBootstrapped = false` and `$this->booted = false`. Clears `$this->loadedProviders`.
- **`hasBeenBootstrapped()`** — Returns `$this->hasBeenBootstrapped`. When `true`, `bootstrapWith()` throws `LogicException`. `reset()` sets it to `false`, allowing re-bootstrapping.
- **Selective Survival** — Not a blanket clear: `flush()` intentionally preserves `'app'` self-reference while clearing everything else. Aliases are cleared by `flush()` and re-registered by `reset()`.

## When To Use
- Deploying Laravel Octane, RoadRunner, or FrankenPHP in production — `reset()` runs between every request
- Auditing container memory growth in long-running processes — verify `flush()` releases all transient state
- Building custom long-running process integrations that need to isolate request state
- Debugging state leaks where one request's data persists into the next request

## When NOT To Use
- Calling `flush()` or `reset()` manually in normal FPM code — there is only one request per instance, and these methods have no useful effect
- Using `flush()` without subsequent `registerBaseBindings()` — the application loses alias mapping, breaking all facade resolution
- Expecting `reset()` to clear the config repository — it clears the `'config'` binding but does not re-load config files
- Assuming `flush()` closes database connections or file handles — it removes bindings but does not release PHP resources

## Best Practices
- **Use `reset()` not `flush()` for request boundaries** — `reset()` restores aliases and the bootstrapping guard; `flush()` alone leaves the container in a non-functional state.
- **Audit bindings for flush survival** — When writing Octane-compatible code, test that all bindings survive `reset()` correctly; bindings that capture request state should be `scoped()`, not `singleton()`.
- **Log `memory_get_usage()` before and after `flush()`** — Verify container memory is released; a leak indicates a binding or callback captured a reference that `flush()` cannot release.
- **Never call `flush()` or `reset()` in middleware** — Doing so will reset the application mid-request, causing unpredictable behavior.
- WHY: `flush()` and `reset()` are the unsung heroes of long-running process support. Misuse causes state corruption, memory leaks, and data cross-contamination between requests.

## Architecture Guidelines
- `flush()` is a lower-level operation for fine-grained control (e.g., running Artisan commands inside an Octane worker). `reset()` is the higher-level "full reset" for request boundaries.
- The self-reference (`$this->instance('app', $this)`) is preserved because without it, `app()` helper and `Container::getInstance()` return null.
- `reset()` clears `$this->loadedProviders` so provider `register()` can run again — necessary because providers may bind request-scoped singletons.
- `flush()` calls `AliasLoader::setInstance(null)` to reset the facade alias loader, ensuring new facade resolution uses the fresh container.
- Scoped singletons are cleared by `flush()` because they are stored in `$this->scopedInstances` which is explicitly emptied.

## Performance Considerations
- `flush()` complexity: O(n) where n = number of bindings, instances, aliases, and callbacks. A typical 50–100 binding application clears in ~0.05ms.
- `reset()` adds `registerBaseBindings()` (~0.01ms) and `registerCoreContainerAliases()` (~0.15ms) on top of `flush()`.
- In Octane, `reset()` runs after every request — cumulative cost across thousands of requests is negligible (~0.2ms per request).
- `hasBeenBootstrapped` guard check is O(1) — a single property access with no measurable overhead.
- `flush()` releases all container-allocated memory from bindings, instances, and callbacks — essential for preventing unbounded memory growth in long-running processes.

## Security Considerations
- `flush()` clears bindings but does not clear static properties on service providers or user classes — static state leaks are the #1 security concern in Octane (one request's authenticated user can leak to the next).
- Resource handle leak: `flush()` removes bindings but does not close database connections, file handles, or network sockets — ensure cleanup via `beforeResolving()` callbacks or Octane flush listeners.
- AliasLoader singleton persistence: if user code holds a separate reference to the old `AliasLoader`, facade resolution may continue using the stale instance.
- The `'app'` self-reference survives flush — ensure that no pre-resolved services cache this reference and use it after flush to access cleared bindings.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Calling `flush()` without re-registering aliases | Unaware of alias clearing | Facade resolution breaks — `BindingResolutionException` | Use `reset()` instead of `flush()` for request boundaries |
| Expecting `reset()` to re-load config files | Confusing binding clear with config reload | Config repository empty after reset | Call `bootstrapWith([LoadConfiguration::class])` explicitly if needed |
| Assuming static properties are cleared by flush | Flush only clears container state | Static data leaks across requests in Octane | Use scoped bindings instead of static properties for request-scoped data |
| Calling `flush()` mid-request in Octane middleware | Attempting to reset state | Application resets during pipeline — catastrophic failure | Use Octane lifecycle hooks (`tick()`, `RequestTerminated`) instead |
| Not testing flush survival after binding registration | Assuming all bindings survive | Register-scoped data unexpectedly cleared | Verify with `$app->make()` after `$app->flush()` |

## Anti-Patterns
- **Mid-request reset** — Calling `flush()` or `reset()` during a request lifecycle (middleware, controller, service) destroys container state unpredictably.
- **Flush without rebind** — Using `flush()` directly (not `reset()`) without immediately re-registering essential bindings and aliases.
- **Static property accumulation** — Storing request-scoped data in static properties expecting `flush()` to clear them — it does not.
- **Binding state capture** — Registering a callback with `resolving()` that captures request-scoped data — the callback survives flush if not cleared from the callback registries.
- **Manual alias management** — Re-registering aliases manually after flush instead of using `reset()` which handles alias restoration.

## Examples

### Octane Reset Cycle (Conceptual)
```php
// Between Octane requests, the framework calls:
$app->reset();

// Which does:
// 1. $app->flush() — clear all bindings, instances, aliases, callbacks
// 2. $app->registerBaseBindings() — re-bind app, Container, PSR-11
// 3. $app->registerCoreContainerAliases() — re-register all ~70 aliases
// 4. $app->hasBeenBootstrapped = false — allow re-bootstrap
// 5. $app->booted = false — allow re-boot
// 6. $app->loadedProviders = [] — allow provider re-registration
```

### What Flush Clears vs Preserves
```php
// PRESERVED after flush():
$app->make('app');           // Application instance
$app->make(Container::class); // Same Application instance
$app->make(Psr\Container\ContainerInterface::class); // Same

// CLEARED after flush():
$app->make('config');    // BindingResolutionException
$app->make('auth');      // BindingResolutionException
$app->bound('config');   // false
$app->make('cache');     // BindingResolutionException
Facade::resolvedInstance('auth'); // null
```

### Flush Survival Test
```php
// Register a test binding
$app->singleton('test-service', fn() => new stdClass);
$service = $app->make('test-service');

// Flush
$app->flush();

// Verify
$app->bound('test-service'); // false — cleared
$app->make('app');           // works — preserved
```

### Scoped Binding Auto-Clearing
```php
// Registered in a service provider:
$app->scoped(CartService::class, fn() => new CartService);

// After request, flush() clears $this->scopedInstances
// Next request receives a fresh CartService instance
```

## Related Topics
- **Prerequisites:** Application Class Construction, Base Bindings and Core Aliases
- **Closely Related:** Bootstrapper Sequence, Service Container Instance Management, Scoped Instance Management
- **Advanced:** Octane Request Lifecycle, Container Memory Management, Deferred Provider Loading Timing
- **Cross-Domain:** Memory Profiling and Observability, Static Property Leak Detection

## AI Agent Notes
`flush()` and `reset()` enable Octane to reuse a single Application instance across thousands of requests without memory leaks or state corruption. The careful distinction between what survives flush (the app self-reference) and what is cleared (everything else) is the result of years of production debugging across Swoole, RoadRunner, and FrankenPHP integrations. `flush()` is defined in `Illuminate\Foundation\Application` (~line 420), `reset()` at ~line 450. In Laravel 7, `flush()` initially cleared everything including base bindings. Laravel 8 split into `flush()` and `reset()` and made base bindings immune to `flush()`. Laravel 9 updated `reset()` to re-register core aliases. Laravel 10 added `$this->contextual`, `$this->extenders`, and `$this->tags` to the clear list. Laravel 11 added `$this->hasReboundCallbacks` clearing and `AliasLoader::setInstance(null)` reset, and promoted `reset()` to public API.

## Verification
- [ ] `flush()` clears all user-bound bindings and instances
- [ ] `flush()` preserves `'app'`, `Container::class`, and PSR-11 bindings
- [ ] `flush()` clears all aliases (`$app->make('auth')` throws after flush)
- [ ] `reset()` restores all core aliases and base bindings
- [ ] `reset()` sets `hasBeenBootstrapped` to `false`
- [ ] `reset()` clears `loadedProviders` array
- [ ] After `reset()`, `bootstrapWith()` can be called again without `LogicException`
- [ ] Scoped instances are cleared by `flush()` (in `$this->scopedInstances`)
- [ ] `AliasLoader` singleton is reset by `flush()`
- [ ] Memory usage decreases after `flush()` (verify with `memory_get_usage()`)
