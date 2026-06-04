# Resolution Callbacks

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **Knowledge Unit:** Resolution Callbacks
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Resolution callbacks are event hooks fired by the container during the service resolution lifecycle — specifically `beforeResolving()`, `resolving()`, and `afterResolving()`. These callbacks allow interception and modification of services at the moment they are constructed, before they are returned to the caller. They constitute the container's observer pattern, enabling cross-cutting behavior (logging, configuration injection, proxy wrapping) without modifying individual binding registrations.

The critical engineering decision in resolution callbacks is their execution ordering relative to the extender stack: extenders run *before* `resolving()` callbacks, and the shared instance caching happens *after* `resolving()` but *before* `afterResolving()`. This means `afterResolving()` is the only hook that sees the fully-extended, fully-configured, already-cached singleton. Any modification in `beforeResolving()` or `resolving()` affects the instance before it is cached; modifications in `afterResolving()` affect the returned instance but the singleton cache already holds the pre-`afterResolving()` version — a discrepancy that surprises developers who cache state in `afterResolving()`.

For production applications, resolution callbacks are the mechanism for framework-wide interception: Telescope uses them to wrap resolved services for monitoring, debug packages inject tracing, and application-level concerns like tenant context injection are implemented through `afterResolving()` hooks. The key production insight is that `resolving()` callbacks with mutable return values can replace the resolved instance — a powerful capability that, when misused, bypasses all lifecycle guarantees.

---

## Core Concepts

### beforeResolving()
Fires before the concrete instance is created. Receives the abstract name and parameters:

```php
$this->app->beforeResolving(PaymentGateway::class, function ($abstract, $parameters) {
    Log::debug("Resolving: $abstract", $parameters);
});
```

### resolving()
Fires after the instance is built and extended, but before caching. Can modify or replace the instance:

```php
$this->app->resolving(CacheManager::class, function ($cache, $app) {
    $cache->setDefaultDriver(config('cache.default'));
    return $cache;
});
```

### afterResolving()
Fires after the instance is cached as a singleton/scoped. Cannot affect the cached instance, only the returned reference:

```php
$this->app->afterResolving(Job::class, function ($job, $app) {
    $job->initializeJobId();
    // Note: modifying $job here does NOT affect the cached singleton
});
```

### Global Callbacks
All three methods accept a closure without an abstract name, registering a global callback for every resolution:

```php
$this->app->resolving(function ($object, $app) {
    if ($object instanceof MonitoredService) {
        $object->attachMonitor($app->make(Monitor::class));
    }
});
```

---

## Mental Models

### The Airport Security Check
`beforeResolving()` is the ID check before boarding — validating identity before construction. `resolving()` is the boarding gate agent who stamps the boarding pass (modifies the instance) before you board. `afterResolving()` is the flight attendant who greets you at the door — you're already on the plane (cached), but they can still offer a drink (post-resolution action).

### The Factory Quality Control
Three inspection stations on an assembly line. Station 1 (`beforeResolving`) verifies parts are available. Station 2 (`resolving`) inspects the assembled product and adjusts it. Station 3 (`afterResolving`) packs the product — the product is already boxed (cached), but Station 3 can add a warranty card (post-resolution side effect).

### The Software CI Pipeline
`beforeResolving` is the linter — runs before compilation. `resolving()` is the compiler — transforms the source into an executable. `afterResolving()` is the deployment step — the executable is already built (cached), but it can be configured for the target environment.

---

## Internal Mechanics

### Storage Structure
Each callback type has a dedicated array, with both global and abstract-specific slots:

```php
$this->beforeResolvingCallbacks = [
    '*' => [Closure, ...],       // Global callbacks
    PaymentGateway::class => [Closure, ...],  // Abstract-specific
];

$this->resolvingCallbacks = [/* same structure */];
$this->afterResolvingCallbacks = [/* same structure */];
```

### Execution During resolve()

Within `Container::resolve()`, the callback execution order is:

```php
protected function resolve($abstract, $parameters = [], $raiseEvents = true)
{
    // 1. Fire beforeResolving callbacks
    if ($raiseEvents) {
        $this->fireBeforeResolvingCallbacks($abstract, $parameters);
    }

    // 2. Get concrete definition
    $concrete = $this->getConcrete($abstract);

    // 3. Build the instance
    $object = $concrete instanceof Closure
        ? $concrete($this, $parameters)
        : $this->build($concrete, $parameters);

    // 4. Apply extenders
    foreach ($this->getExtenders($abstract) as $extender) {
        $object = $extender($object, $this);
    }

    // 5. Fire resolving callbacks — can modify/replace $object
    if ($raiseEvents) {
        $this->fireResolvingCallbacks($abstract, $object);
    }

    // 6. Cache if shared
    if ($this->isShared($abstract)) {
        $this->instances[$abstract] = $object;
    }

    // 7. Fire afterResolving callbacks — $object is already cached
    if ($raiseEvents) {
        $this->fireAfterResolvingCallbacks($abstract, $object);
    }

    return $object;
}
```

### fireResolvingCallbacks() Implementation
Global callbacks execute first, then abstract-specific:

```php
protected function fireResolvingCallbacks($abstract, &$object)
{
    // Fire global callbacks
    foreach ($this->getGlobalResolvingCallbacks() as $callback) {
        $result = $callback($object, $this);
        if ($result !== null) {
            $object = $result; // Callback can replace the instance
        }
    }

    // Fire abstract-specific callbacks
    foreach ($this->getResolvingCallbacks($abstract) as $callback) {
        $result = $callback($object, $this);
        if ($result !== null) {
            $object = $result;
        }
    }
}
```

---

## Patterns

### Auto-Configuration at Resolution
```php
$this->app->resolving(Repository::class, function ($repo) {
    $repo->setCacheTtl(config('repositories.cache_ttl'));
});
```

### Proxy/Wrapping via resolving()
```php
$this->app->resolving(CalculatorService::class, function ($service) {
    return new ProfiledCalculator($service); // Replace with profiled version
});
```

### Tenant Context Injection
```php
$this->app->afterResolving(DatabaseConnection::class, function ($connection, $app) {
    $tenantId = $app->make(TenantContext::class)->id();
    $connection->statement("SET app.tenant_id = ?", [$tenantId]);
});
```

### Lazy Initialization Hook
```php
$this->app->resolving(NotificationsManager::class, function ($manager, $app) {
    if (! $manager->initialized()) {
        $manager->initialize($app->make(NotificationConfig::class));
    }
});
```

---

## Architectural Decisions

### Why extenders run before resolving() callbacks
Extenders implement the Decorator pattern — they wrap the concrete instance. Resolution callbacks implement the Observer pattern — they react to resolution. The order ensures that callbacks see the fully-decorated instance. If callbacks ran before extenders, they would see the raw concrete class without decoration, making callback behavior inconsistent with what consumers actually receive.

### Why afterResolving() cannot affect the cached instance
The singleton instance is cached before `afterResolving()` fires. This prevents `afterResolving()` callbacks from accidentally corrupting the singleton cache. The design assumes that `afterResolving()` is for side effects (logging, notifying, initializing external systems) rather than instance modification. If modification is needed, `resolving()` (which runs before caching) is the appropriate hook.

### Why callbacks receive the container as second parameter
Callbacks often need to resolve additional services (loggers, config, monitors). Passing the container avoids requiring callbacks to capture `$app` in the closure — which would create a circular reference if the callback captured the container that holds the callback. The explicit `$app` parameter prevents memory leaks from nested closure scopes.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Global callbacks apply to every resolution | Global callbacks execute for ALL resolutions | A global callback checking `instanceof` adds ~0.3μs per resolution |
| Callbacks can replace the instance entirely | Callback replacement bypasses extenders that ran before | An extender's work is lost if a resolving() callback replaces the instance |
| Three hook points provide granular control | Ordering (beforeExtenders → extending → resolving → cache → afterResolving) is non-obvious | Developers often use the wrong hook and wonder why modifications are lost or overwritten |
| Abstract-specific callbacks avoid instanceof checks | Each abstract-specific callback is stored separately | With 200+ specific callbacks, memory for closure storage is ~16KB |

---

## Performance Considerations

Each callback registration adds a closure to the callback arrays. Global callbacks are checked on every resolution regardless of abstract; abstract-specific callbacks require an array lookup by key.

The callback execution loop iterates global callbacks, then abstract-specific callbacks. With 10 global callbacks and 5 abstract-specific callbacks, each resolution fires 15 closures plus the instanceof checks inside them. On a hot path (e.g., `make(Request::class)` which resolves on every request), 15 closure calls add ~3-5μs.

In Octane, registered callbacks persist across requests and accumulate if providers are re-registered (which they shouldn't be in Octane). Ensure callbacks are registered only once during boot.

## Production Considerations

- **Prefer abstract-specific callbacks over global callbacks with instanceof checks.** A global callback that checks `$object instanceof X` for every resolution adds overhead. Register a specific callback for each target abstract instead.
- **Avoid instance replacement in resolving() callbacks.** Replacing the instance means the extender output is discarded. If extenders and callbacks both modify the same service, the modification order is confusing. Prefer extenders for decoration and callbacks for configuration.
- **Use afterResolving() for side effects only.** Since the cached singleton is already stored, treat `afterResolving()` as fire-and-forget. Modify state through `resolving()` or extenders, not `afterResolving()`.
- **Profile callback overhead in Octane.** With 50+ callbacks firing on every resolution, measure the aggregate cost in Octane. Deduplicate or batch callbacks where possible.

---

## Common Mistakes

**Why it happens:** Using `resolving()` to configure a service that is also extended, then expecting the extender to see the configuration. **Why it's harmful:** Extenders run before `resolving()` callbacks. Configuration applied in `resolving()` is invisible to extenders. **Better approach:** Use `extend()` for decoration and `resolving()` for post-decoration configuration, or move configuration to the extender.

**Why it happens:** Modifying the instance in `afterResolving()` and expecting the singleton cache to reflect changes. **Why it's harmful:** The singleton is cached before `afterResolving()` fires. Modifications to the instance object will affect the cached reference (since it's the same object), but replacing the instance in `afterResolving()` has no effect. **Better approach:** Use `resolving()` for instance modification. Reserve `afterResolving()` for side effects on external systems.

**Why it happens:** Registering callbacks in a service provider's `register()` method that depend on services not yet available. **Why it's harmful:** The callback closure captures a reference to a service that may not be resolved yet. When the callback fires later, the captured reference may be stale or partially constructed. **Better approach:** Use the `$app` parameter passed to the callback to resolve dependencies at callback execution time.

**Why it happens:** Registering the same callback multiple times (e.g., in a loop or across multiple provider loads). **Why it's harmful:** Duplicate callbacks fire multiple times per resolution, applying the same modification repeatedly. **Better approach:** Guard callback registration with a flag or centralize callback registration in a dedicated provider.

---

## Failure Modes

### Callback Throws Exception During Resolution
A `resolving()` or `afterResolving()` callback throws an unhandled exception. **Common causes:** Callback tries to resolve a missing service, or configuration access (e.g., `config()`) fails. **Detection:** Resolution fails with the callback's exception, not a container exception. **Mitigation:** Wrap callback bodies in try/catch, or validate external dependencies before the callback is registered.

### Callback Replaces Instance with Incompatible Type
A `resolving()` callback returns an object of a different type than the abstract. **Common causes:** The callback conditionally returns a different implementation based on runtime state. **Detection:** Type errors at the consumer site. **Mitigation:** Ensure the replacement instance implements the same interface or extends the same class as the original.

### Global Callback Checks instanceof on Every Resolution
A global `resolving()` callback iterates every resolved service through an `instanceof` chain, adding overhead to all resolutions. **Common causes:** Using a global callback as a catch-all instead of registering specific callbacks. **Detection:** Profiling shows callback overhead across all resolutions. **Mitigation:** Replace global callbacks with abstract-specific callbacks for each target type.

---

## Ecosystem Usage

**Laravel Telescope:** Uses `resolving()` callbacks to intercept services for monitoring. Telescope registers global callbacks that wrap resolved services in proxy instances to collect timing data. The callback checks `$object instanceof Contracts\Cache\Repository` and similar contracts to selectively wrap framework services.

**Laravel Horizon:** Uses `beforeResolving()` callbacks to tag resolved jobs with metadata before construction. The tag (job ID, queue name, timestamp) is attached to the job instance during `resolving()` for monitoring in the Horizon dashboard.

**Spatie Laravel Missing Page Redirector:** Uses `resolving()` callbacks to configure redirect rules on the router after it's resolved. When the route resolver is resolved, the callback registers custom redirect routes and fallback handlers.

---

## Related Knowledge Units

### Prerequisites
- Container Fundamentals
- Binding Resolution

### Related Topics
- Binding Extending
- Rebound Callbacks

### Advanced Follow-up Topics
- Scoped Instance Management
- Container Aliases

---

## Research Notes

### Source Analysis
- `Illuminate\Container\Container::beforeResolving()` (lines 520-540): Registers before-resolution callback.
- `Illuminate\Container\Container::resolving()` (lines 545-565): Registers resolution callback.
- `Illuminate\Container\Container::afterResolving()` (lines 570-590): Registers post-resolution callback.
- `Illuminate\Container\Container::fireResolvingCallbacks()` (lines 760-790): Callback execution loop — global first, then specific.
- `Illuminate\Container\Container::fireBeforeResolvingCallbacks()` (lines 795-815): Before-resolution callback execution.
- `Illuminate\Container\Container::fireAfterResolvingCallbacks()` (lines 820-840): After-resolution callback execution.

### Key Insight
The return value of callback closures matters: if a callback returns a non-null value, the container replaces the resolved instance with that value. This is documented but non-obvious — most developers treat callbacks as fire-and-forget hooks. A callback that accidentally returns a value (e.g., the result of `tap()`) will silently replace the resolved instance.

### Version-Specific Notes
- **Laravel 10.x:** Callbacks were fired with the resolved object only (no `$app` parameter). Return value replacement existed but was undocumented.
- **Laravel 11.x:** `$app` parameter added to callback signatures. Return-value replacement behavior formally documented.
- **Laravel 12.x:** Global callbacks can be registered with `resolving(*)` syntax. Callback ordering is guaranteed: global → abstract-specific.
- **Laravel 13.x:** Callbacks can be tagged for selective execution. `beforeResolving()` callbacks receive unnormalized abstract names (before alias resolution).
