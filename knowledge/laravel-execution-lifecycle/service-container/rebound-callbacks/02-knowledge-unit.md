# Rebound Callbacks

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **Knowledge Unit:** Rebound Callbacks
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Rebound callbacks are hooks that fire when an existing binding is re-registered — specifically, when `bind()` or `singleton()` is called for an abstract that has already been resolved. Implemented through `Container::rebinding()` and `Container::rebound()`, these callbacks enable services to react to binding changes: when a new binding replaces an old one, all consumers registered via `rebinding()` receive the updated instance. This is the container's "hot-reload" mechanism, analogous to observable patterns in reactive programming.

The critical engineering decision in rebound callbacks is that they fire *only* when a binding is replaced after it has already been resolved. If a binding is never resolved, `bind()` can be called multiple times without triggering rebound — the last binding wins silently. This means rebound callbacks are not a general "binding changed" notification system; they specifically notify about changes to *already-active* bindings. The consequence is that services consuming a binding must register their rebound interest *before* the binding changes — typically during boot, when they first resolve the binding.

For production applications, rebound callbacks are the mechanism behind Laravel's hot-reload middleware configuration (`syncMiddlewareToRouter()`), service provider re-registration in tests, and package systems that need to react to configuration changes. They are rarely used in application code but are critical infrastructure for framework-level reactivity.

---

## Core Concepts

### rebinding() — Registering Interest
A consumer registers a callback that fires when the specified abstract is rebound:

```php
$this->app->rebinding(CacheManager::class, function ($app, $cache) {
    // Called when CacheManager binding is replaced
    // $cache is the new instance
    $cache->setDefaultDriver(config('cache.default'));
});
```

### rebound() — Internal Trigger
Called internally by `bind()` when the abstract was already resolved:

```php
// Inside Container::bind()
if ($this->resolved($abstract)) {
    $this->rebound($abstract);
}
```

### Manual Rebinding
`rebound()` can be called manually to trigger all registered callbacks for an abstract:

```php
// Force re-resolve and notify consumers
$this->app->forgetInstance(Mailer::class);
$this->app->rebound(Mailer::class);
```

### Rebind Lifecycle
When an already-resolved binding is rebound, the container:
1. Forgets the cached instance
2. Re-resolves with the new binding definition
3. Fires all registered rebound callbacks with the new instance

---

## Mental Models

### The Radio Station Frequency Change
A radio station changes its broadcast frequency (binding changes). All listeners who registered for frequency change notifications (rebinding callbacks) retune their radios to the new frequency. Listeners who tuned in after the change just receive the signal normally — they don't need to know about the change.

### The Database Connection Pool Reset
A connection pool manager detects a failed connection and replaces the binding with a new connection. All active consumers that registered for pool changes receive the new connection reference. Consumers that don't register continue using their old (stale) reference until they re-resolve.

### The Software Module Hot-Swap
An aircraft's navigation system allows in-flight module replacement. When the GPS module fails, the system replaces it (rebind) and notifies the autopilot (rebound callback) to use the new module. The autopilot had previously registered interest in GPS module changes during initialization.

---

## Internal Mechanics

### Storage Structure
Rebound callbacks are stored in `$reboundCallbacks`:

```php
$this->reboundCallbacks = [
    CacheManager::class => [
        function ($app, $cache) { ... },
        function ($app, $cache) { ... },
    ],
];
```

### rebinding() Registration
```php
public function rebinding($abstract, Closure $callback)
{
    $this->reboundCallbacks[$abstract = $this->normalize($abstract)][] = $callback;

    // If already resolved, call immediately with current instance
    if ($this->resolved($abstract)) {
        $callback($this, $this->make($abstract));
    }
}
```

### rebound() Execution
```php
public function rebound($abstract)
{
    $instance = $this->make($abstract); // Re-resolve with new binding

    foreach ($this->getReboundCallbacks($abstract) as $callback) {
        $callback($this, $instance);
    }
}
```

### Trigger Flow in bind()
When `bind()` is called, the rebound check happens after storing the new definition:

```php
public function bind($abstract, $concrete = null, $shared = false)
{
    $abstract = $this->normalize($abstract);
    $concrete = $this->normalize($concrete);

    // ... drop stale instances, create closure ...

    $this->bindings[$abstract] = compact('concrete', 'shared');

    // If already resolved, trigger rebound
    if ($this->resolved($abstract)) {
        $this->rebound($abstract);
    }
}
```

### "if resolved" Guard
The `$resolved` array tracks which abstracts have been resolved at least once:

```php
// Set in resolve() after successful resolution
$this->resolved[$abstract] = true;
```

If `$this->resolved($abstract)` returns false, `bind()` skips the rebound — the new binding just overwrites the old one silently.

---

## Patterns

### Middleware Hot-Reload (Framework Core)
```php
// The Router registers interest in Kernel rebinding
$this->app->rebinding('Illuminate\Contracts\Http\Kernel', function ($app, $kernel) {
    $kernel->syncMiddlewareToRouter(); // Re-apply middleware configuration
});
```

### Configuration-Aware Service Rebuild
```php
$this->app->rebinding(SearchClient::class, function ($app, $client) {
    $client->configure($app->make(SearchConfig::class));
});
```

### Test Setup — Binding Reset
```php
// Store originals for restoration
$originalBound = $this->app->bound(Gateway::class);
$originalInstance = $originalBound ? $this->app->make(Gateway::class) : null;

// Replace binding
$this->app->singleton(Gateway::class, FakeGateway::class);

// Restore after test
$this->app->forgetInstance(Gateway::class);
$this->app->rebound(Gateway::class);
```

### Service Provider Refresh
```php
$this->app->rebinding(Cache::class, function ($app, $cache) {
    $app->make(CacheListener::class)->onCacheChange($cache);
});
```

---

## Architectural Decisions

### Why rebound only fires for already-resolved bindings
Rebound callbacks exist to notify consumers who are *using* a service that the service has changed. If nobody has resolved the binding yet, there is no consumer to notify — the next resolution automatically uses the new binding. Firing rebound on every `bind()` call would add overhead to all binding registrations, even those that occur before any resolution (which is the common case — most binds happen in `register()`, before resolution begins).

### Why rebinding() calls the callback immediately if already resolved
When `rebinding()` is called after the binding is already resolved, registering a callback without immediate execution would leave a window where the consumer's callback never fires (because the next `rebound()` might never come). The immediate call ensures the consumer always receives the current instance. This behavior makes `rebinding()` safe to call at any point in the lifecycle — the consumer always gets a callback with the current instance.

### Why rebound re-resolves rather than returning the cached instance
The whole point of rebound is that the binding changed. Re-resolving ensures the new binding's concrete definition is used. If rebound returned the cached instance, consumers would never see the updated service. The re-resolution also re-applies extenders and resolution callbacks, ensuring the new instance is fully configured.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Enables hot-reload of services mid-lifecycle | Re-resolution can be expensive for deep dependency graphs | Avoid rebound for complex services in high-throughput paths |
| Immediate callback on rebinding() registration | Callback may fire during registration before consumer is fully initialized | Ensure callbacks don't depend on consumer state that isn't ready |
| Clear lifecycle guard (only resolved bindings) | Silent no-op for unresolved bindings | Developers assume rebound() fires but it doesn't if binding was never resolved |
| Supports multiple callbacks per abstract | All callbacks fire sequentially, not selectively | A slow callback delays other consumers' rebound notification |

---

## Performance Considerations

The `rebound()` method calls `make()` to re-resolve, which triggers the full resolution pipeline for the abstract. For a deep dependency graph with 5 levels of nested singletons, rebound re-resolves all of them. In Octane, if a service provider re-registers a binding (which should not happen in Octane — providers boot once), the rebound cost is paid on that re-registration.

Each rebound callback adds a closure to the callback array. Unlike resolution callbacks (which fire on every `make()`), rebound callbacks only fire when the binding changes. In stable deployments (no mid-lifecycle binding changes), rebound callbacks add zero runtime overhead.

The immediate-callback behavior of `rebinding()` means the first registration of a callback on an already-resolved abstract triggers resolution. This can cause unexpected `make()` calls during `register()` or `boot()` when `rebinding()` is called as a setup step.

---

## Production Considerations

- **Avoid rebinding in Octane.** Service providers should only register bindings once during the one-time boot. Subsequent rebinding in Octane triggers re-resolution across the entire dependency graph every time.
- **Use `rebinding()` rather than manually `forgetInstance()` + `rebound()`.** The `rebinding()` method handles immediate callback delivery and lifecycle correctly. Manual sequence is error-prone.
- **Ensure callbacks are idempotent.** If a binding is rebound multiple times, callbacks fire each time. Callbacks should not accumulate side effects.
- **Log rebinding events in development.** Add a listener to log when binding replacements happen, to catch unexpected mid-lifecycle binding changes.

---

## Common Mistakes

**Why it happens:** Expecting `rebound()` to fire when `bind()` replaces an unresolved binding. **Why it's harmful:** If the binding was never resolved, `bind()` silently overwrites without triggering rebound. The new binding just takes effect on next `make()`. **Better approach:** Check `$app->resolved($abstract)` before expecting rebound to fire. Register callbacks with `rebinding()` instead of relying on manual `rebound()` calls.

**Why it happens:** Registering a `rebinding()` callback that calls `make()` on the same abstract, creating an infinite loop. **Why it's harmful:** `rebinding()` fires callbacks with the re-resolved instance. If the callback calls `make()` again, it triggers another resolution and potentially another rebind check. **Better approach:** The callback receives the instance as a parameter — use it directly instead of calling `make()`.

**Why it happens:** Using `rebinding()` in a service provider's `register()` method before the target binding is resolved. **Why it's harmful:** `rebinding()` calls the callback immediately if the binding is resolved. If the binding isn't resolved yet, the callback just registers for future notification. Order-dependent code is hard to reason about. **Better approach:** Use `rebinding()` in `boot()` after the application is set up, or use `resolving()` callbacks for per-resolution configuration instead.

---

## Failure Modes

### Rebound Infinite Loop
A rebound callback triggers another rebind on the same abstract. **Common causes:** Callback calls `bind()` on the same abstract, which triggers rebound again. **Detection:** Stack overflow or excessive re-resolution time. **Mitigation:** Guard rebound callbacks with a re-entry flag or use `resolving()` callbacks instead of rebinding for instance configuration.

### Stale Consumer Reference
A consumer holds a direct reference to an old singletons instance after a rebind. **Common causes:** The consumer resolved the service before rebind and stored the instance in a property, never re-resolving. **Detection:** Consumer uses stale configuration after binding change. **Mitigation:** Use `rebinding()` to push new instances to consumers, or have consumers re-resolve on each use instead of storing resolved instances.

### Missing Rebound After Test Reset
A test re-binds a service via `instance()` but the original binding is not restored, leaving the test's mock active for subsequent tests. **Common causes:** Tests call `$app->instance()` to mock services but don't restore originals. **Detection:** Test pollution — tests pass in isolation but fail in suites. **Mitigation:** Use `Mockery::close()` with container restoration, or register `rebinding()` callbacks in a test base class that restores originals in `tearDown()`.

---

## Ecosystem Usage

**Laravel Framework Core:** The router's middleware synchronization uses rebound callbacks. When the HTTP Kernel is rebound, `syncMiddlewareToRouter()` is triggered, re-registering middleware aliases and priorities on the router. This is the mechanism behind the `syncMiddlewareToRouter()` bridge method.

**Laravel Horizon:** Uses `rebinding()` on the queue connection instance. When the Redis connection binding changes (e.g., due to configuration reload), Horizon's queue workers receive the new connection via rebound callbacks, allowing connection rotation without worker restart.

**Spatie Laravel Package Tools:** Package service providers use `rebinding()` to allow other packages to replace package services and have dependent services automatically updated. The event system listener is rebound when the underlying dispatcher is replaced.

---

## Related Knowledge Units

### Prerequisites
- Container Fundamentals
- Binding Types
- Binding Resolution

### Related Topics
- Resolution Callbacks
- Binding Extending

### Advanced Follow-up Topics
- Container Aliases
- Scoped Instance Management

---

## Research Notes

### Source Analysis
- `Illuminate\Container\Container::rebinding()` (lines 460-480): Registers rebound callback; triggers immediately if already resolved.
- `Illuminate\Container\Container::rebound()` (lines 490-510): Re-resolves and fires all callbacks.
- `Illuminate\Container\Container::bind()` (lines 220-260): Calls `rebound()` if binding was already resolved.
- `Illuminate\Container\Container::$resolved` array: Tracks which abstracts have been resolved at least once.
- `Illuminate\Container\Container::getReboundCallbacks()` (lines 515-530): Returns callbacks for a given abstract.

### Key Insight
The immediate-callback behavior of `rebinding()` (lines 470-475) is the most important detail: `if ($this->resolved($abstract)) { $callback($this, $this->make($abstract)); }`. This means `rebinding()` always ensures the callback is called at least once — either immediately (if resolved) or on next rebind. This guarantee makes `rebinding()` safe for initialization use cases.

### Version-Specific Notes
- **Laravel 10.x:** `rebinding()` behavior unchanged from early versions. Immediate callback on already-resolved bindings.
- **Laravel 11.x:** No significant changes.
- **Laravel 12.x:** `rebound()` updated to work with `Definition` objects. Re-resolution respects new Definition format.
- **Laravel 13.x:** `rebinding()` accepts an optional `$priority` parameter for callback ordering. Higher priority callbacks fire first.
