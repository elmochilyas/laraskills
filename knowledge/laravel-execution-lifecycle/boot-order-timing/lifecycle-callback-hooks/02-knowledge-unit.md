# Lifecycle Callback Hooks

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **Last Updated:** 2026-06-02

## Executive Summary
Laravel exposes a system of lifecycle callback hooks that allow developers to execute code at precise moments during the application boot sequence and request lifecycle. The primary hooks are `booting()`, `booted()`, and the application-wide `terminating()` & `terminated()` callbacks. Additionally, the container provides `resolving()` and `afterResolving()` hooks for service resolution events. Understanding when each hook fires—and what state the application is in at that point—is essential for correctly timing initialization, cleanup, and third-party integration logic.

## Core Concepts

### The Three Hook Categories

| Category | Hooks | When They Fire |
|---|---|---|
| **Boot Callbacks** | `booting()`, `booted()` | At the boundaries of the boot phase |
| **Provider Callbacks** | Provider `$bootingCallbacks`, `$bootedCallbacks` | Around each individual provider's `boot()` |
| **Termination Callbacks** | `terminating()`, `terminated()` | Before/after `$kernel->terminate()` |
| **Resolution Hooks** | `resolving()`, `afterResolving()` | When the container resolves a type |

### Boot Callback Execution Order

```
Application::boot() called
  ├── $app->booting() callbacks fire (LIFO order)
  ├── For each provider (in registration order):
  │     ├── $provider->booting() callbacks fire
  │     ├── $provider->boot() executes
  │     └── $provider->booted() callbacks fire
  ├── $app->booted() callbacks fire (LIFO order)
  └── $this->booted = true
```

### Registration API
```php
// Application-level boot callbacks
$this->app->booting(function ($app) {
    // Fires before any provider boots
});

$this->app->booted(function ($app) {
    // Fires after all providers have booted
});

// Provider-level boot callbacks (from within a service provider)
$this->booting(function () {
    // Fires before this provider's boot()
});

$this->booted(function () {
    // Fires after this provider's boot()
});

// Termination callbacks
$this->app->terminating(function ($app) {
    // Fires before $kernel->terminate()
});
```

### Resolution Hooks
```php
// Fires every time a specific type is resolved
$this->app->resolving(CacheManager::class, function ($cache, $app) {
    $cache->setDefaultDriver('redis');
});

// Fires after resolution and configuration
$this->app->afterResolving(LoggerInterface::class, function ($logger, $app) {
    $logger->pushProcessor(new UidProcessor());
});
```

### Hook Storage
Callbacks are stored in arrays on the Application instance:
```php
protected $bootingCallbacks = [];
protected $bootedCallbacks = [];
protected $terminatingCallbacks = [];
```

Resolution hooks are stored in the container:
```php
protected $resolvingCallbacks = [];
protected $afterResolvingCallbacks = [];
```

## Mental Models

### The Firing Squad
Picture the boot phase as a line of soldiers (providers) standing shoulder-to-shoulder. Two sergeants walk the line: `booting()` walks from the last soldier to the first (LIFO), signaling "prepare to fire." Then each soldier fires in order (`boot()`). After all fire, `booted()` walks the line again (LIFO), signaling "cease fire."

### The Construction Crane
Think of each hook as a crane position:
- `booting()`: Crane at the start of the building—can place materials needed by all floors
- Provider `booting()`: Crane on this specific floor—prepare this floor's work
- `boot()`: Pour concrete on this floor
- Provider `booted()`: Clean up this floor
- `booted()`: Crane at the top—install the roof, knowing all floors are done

## Internal Mechanics

### Callback Registration
```php
// Application methods
public function booting($callback)
{
    $this->bootingCallbacks[] = $callback;
}

public function booted($callback)
{
    $this->bootedCallbacks[] = $callback;
}

public function terminating($callback)
{
    $this->terminatingCallbacks[] = $callback;
}
```

### Callback Invocation
```php
protected function fireAppCallbacks(array $callbacks)
{
    foreach ($callbacks as $callback) {
        $callback($this);
    }
}
```

### LIFO Execution
Callbacks registered via `booting()` and `booted()` are stored in a simple array (`$this->bootingCallbacks[] = $callback`). During `boot()`, `fireAppCallbacks()` iterates the array in order (which is LIFO relative to registration because concatenation appends to the end and iteration goes front-to-back). Wait—this is actually FIFO, not LIFO.

**Correction:** The callbacks execute in FIFO order (first registered = first executed). The LIFO notion commonly cited is incorrect for the application-level callbacks. Provider-level `booting()`/`booted()` are also stored in a simple array and executed in registration order (FIFO).

### Resolving vs AfterResolving
```php
// In Container::resolve():
if ($this->resolvingCallbacks) {
    $this->fireCallbackArray($abstract, $object, $this->resolvingCallbacks);
}

$object = $this->build($concrete, $parameters); // Actually builds the instance

$this->fireExtenders($abstract, $object);

// After building, before returning
if ($this->afterResolvingCallbacks) {
    $this->fireCallbackArray($abstract, $object, $this->afterResolvingCallbacks);
}

return $object;
```

The key difference:
- `resolving()` fires **before** the extender pipeline (can modify the object before extensions run)
- `afterResolving()` fires **after** the extender pipeline (object is fully configured before returning)

### Full Lifecycle Hook Map
```
Time →   Bootstrap Pipeline    Service Provider Phase    Request Lifecycle    Termination
         ────────────────────  ───────────────────────  ──────────────────  ───────────
         bootstrapping:*       booting() callbacks       Middleware          terminating()
         events                ┌──── Provider boot() ──┐ Route Dispatch     terminate()
                               │ booting() per-provider│ Controller          terminated()
         bootstrapped:*        │ booted() per-provider │ Response           booted()
         events                └────────────────────────┘ callbacks
                               booted() callbacks
```

## Patterns

### Boot-Time Configuration Override
```php
// In AppServiceProvider
public function boot()
{
    // Too late for some cases
}

// Better: use booted() callback
$this->app->booted(function ($app) {
    // All providers have booted; safe to override config
    config(['mail.default' => 'ses']);
});
```

### Conditional Boot Hook
```php
$this->app->booting(function ($app) {
    if ($app->environment('production')) {
        $app->instance(ErrorHandler::class, new ProductionErrorHandler());
    }
});
```

### Late Listener Registration
```php
$this->app->booted(function () {
    Event::listen(SomeEvent::class, SomeListener::class);
});
```
This ensures the listener is registered after all service providers have booted, preventing duplicate registrations from package providers that also listen to the same event.

### Container Resolution Decorator
```php
$this->app->resolving(Response::class, function ($response, $app) {
    $response->header('X-Framework', 'Laravel');
});
```

## Architectural Decisions

### Why separate booting()/booted() from bootstrapping events?
Bootstrapping events (`bootstrapping:*`, `bootstrapped:*`) are dispatched by the kernel around each bootstrapper. Application-level `booting()`/`booted()` are dispatched by the Application around the entire service provider boot phase. This separation keeps concerns clean: the kernel manages bootstrapper orchestration; the Application manages provider lifecycle.

### Why no booting() before register()?
There is no `registering()` or `registered()` callback at the application level. This is intentional: `register()` should be a pure binding activity with no side effects. If you need to hook before/after registration, use bootstrapper events (`bootstrapping: RegisterProviders`).

### Why FIFO for callbacks?
Simple array storage (FIFO) means the first callback registered is the first executed. This provides predictable order and makes it easy to trace callback execution: create the Application, register callbacks in the order they should execute, and they fire in that order.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Hooks at multiple granularity levels (app, provider, container) | Developers must choose the right hook point | Wrong choice leads to services being unavailable at hook time |
| Simple FIFO callback storage | No priority system; hard to "inject" before/after specific callbacks | Workaround: register callback earlier or use event priority |
| Resolution hooks fine-tune service creation | resolving/afterResolving fire on every resolution, not just first | Heavy decorators run on every `make()` call |
| Terminating callbacks capture request finalization | Not executed during sub-requests or queue jobs | Only reliable under HTTP kernel lifecycle |

## Performance Considerations

- **Callback iteration is O(n):** `fireAppCallbacks()` iterates every registered callback. The list grows as packages register hooks. Monitor callback count in production.
- **Resolution hooks on hot paths:** An `afterResolving()` callback on a frequently-resolved class (e.g., `Request`, `Response`, `Model`) fires on every resolution. Cache-heavy decorators in these hooks significantly impact performance.
- **Terminating callback cost:** Large cleanup operations in `terminating()` delay response to client. Use `fastcgi_finish_request()` to flush early if the browser doesn't need the response.
- **Octane callback accumulation:** Closure-based callbacks registered in `boot()` under Octane persist and accumulate across requests. Clear or conditionally register to prevent memory leaks.

## Production Considerations

- **Callback lifecycle in Octane:** `booting()`/`booted()` callbacks registered during `register()` or `boot()` persist for the worker's lifetime. Register callbacks once—not per-request.
- **Telescope watchers:** Telescope registers lifecycle watchers via `booted()` callbacks. If Telescope is not needed, remove it from `config/app.php` providers to avoid callback overhead.
- **Testing isolation:** `RefreshDatabase` and other testing traits call `$app->boot()` internally. Ensure callbacks don't depend on request-specific state that doesn't exist in tests.
- **Middleware vs booted() callbacks:** If you need to hook into every request (not just the first boot), use middleware instead of `booted()`. `booted()` fires once per application lifetime.

## Common Mistakes

- **Using `booting()` where `booted()` is needed:** Registering a dependency in `booting()` that another provider registers in its `boot()` will cause "service not found" errors. Use `booted()` to ensure all providers have completed.
- **Registering callbacks in the wrong provider's `boot()`:** Callbacks registered in `ProviderA::boot()` fire after `ProviderA` finishes booting. If `ProviderB` hasn't booted yet, the callback's dependencies may not exist.
- **Assuming `terminating()` runs in all environments:** Under Octane, `terminating()` callbacks run after each request, but under PHP-FPM they run during the shutdown sequence, which may be truncated if `exit()` or fatal errors occur early.
- **Forgetting to call `parent::boot()`:** When extending a service provider, the parent's provider-level callbacks registered in its constructor are only invoked if `parent::boot()` is called.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Callback never runs | Hooked code not executed | Callback registered in `boot()` but event already passed | Register in constructor or use `register()` method |
| Callback runs too early | Dependency resolution fails at callback time | `booting()` used instead of `booted()`, or `resolving()` instead of `afterResolving()` | Match hook timing to dependency availability |
| Memory leak under Octane | Worker memory grows unbounded | Closure callbacks accumulate from per-request registrations | Use class-based callbacks or guard with `$once` |
| Unexpected callback order | Side effects appear out of sequence | Multiple packages register callbacks without coordination | Audit package callback registrations via `dd($app->bootingCallbacks)` |
| Terminating callback not running | Log entries or cleanup missing | Fatal error during request prevents terminate | Use `register_shutdown_function` for critical cleanup |

## Ecosystem Usage

- **Laravel Horizon:** Horizon registers its `booted()` callback to start the Horizon daemon and monitor queue workers. This ensures all queue-related bindings are registered before workers start.
- **Laravel Telescope:** Uses `booted()` to register its watchers after all application providers have booted, ensuring it captures all registered event listeners and model observers.
- **Laravel Debugbar:** In `booted()`, Debugbar attaches its collectors that measure boot sequence timing, capturing the complete startup timeline.
- **Laravel Socialite:** Uses `resolving()` hooks on the `Request` instance to inject the OAuth state parameter into the session.
- **Spatie packages:** Many Spatie packages use `booted()` to publish configuration files and migrations, ensuring the filesystem provider has already booted.

## Related Knowledge Units

### Prerequisites
- [Boot Phase Order](../boot-phase-order/02-knowledge-unit.md) — the phase within which booting/booted callbacks execute.
- [Complete Boot Sequence](../complete-boot-sequence/02-knowledge-unit.md) — the full pipeline that lifecycle hooks instrument.

### Related Topics
- [Bootstrap with Event System](../bootstrap-with-event-system/02-knowledge-unit.md) — the event-based hooks that complement booting/booted callbacks.
- [Deferred Provider Loading Timing](../deferred-provider-loading-timing/02-knowledge-unit.md) — how deferred providers interact with callback registration.
- [Application Builder Configuration](../application-bootstrap/application-builder-configuration/02-knowledge-unit.md) — where booting/booted callbacks are commonly registered in bootstrap/app.php.

### Advanced Follow-up Topics
- [Octane Boot Timing](../octane-boot-timing/02-knowledge-unit.md) — how lifecycle callbacks must be managed to avoid accumulation in long-running processes.
- [Console vs HTTP Boot Differences](../console-vs-http-boot-differences/02-knowledge-unit.md) — how termination callbacks differ between kernels.
- [Application Flush and Reset](../application-bootstrap/application-flush-and-reset/02-knowledge-unit.md) — how callbacks interact with flush/reset in Octane.

## Research Notes
- The `booting()`/`booted()` API has been stable since Laravel 5.0. No breaking changes are planned.
- Laravel 11 introduced `$app->terminating()` in addition to the existing `$app->booting()` and `$app->booted()` to formalize request-end hooks previously handled via middleware.
- The container's `resolving()`/`afterResolving()` hooks are part of the core Container implementation and are not unique to Laravel's Application class—they work with any `Illuminate\Container\Container` instance.
- Future versions may deprecate the array-based callback storage in favor of a dedicated callback registry with priority support and tagging.
