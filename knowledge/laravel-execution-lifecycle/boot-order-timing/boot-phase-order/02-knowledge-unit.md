# Boot Phase Order

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **Last Updated:** 2026-06-02

## Executive Summary
The `boot()` phase is the second half of Laravel's two-phase service provider initialization. After all providers have completed `register()`, the framework iterates every registered provider and calls `boot()`. This phase is where providers resolve services from the container, register routes, configure event listeners, and perform any initialization that depends on other providers' bindings. The boot order matches the registration order, and two application-level callbacks—`booting()` and `booted()`—provide hooks at the boundaries of the phase.

## Core Concepts

### The Boot Phase Trigger
The `BootProviders` bootstrapper is the last in the kernel bootstrap pipeline. It calls `$app->boot()`:

```php
class BootProviders
{
    public function bootstrap(Application $app)
    {
        $app->boot();
    }
}
```

### The `Application::boot()` Method
```php
public function boot()
{
    if ($this->isBooted()) {
        return;
    }

    // Fire booting callbacks (registered via $app->booting())
    $this->fireAppCallbacks($this->bootingCallbacks);

    foreach ($this->serviceProviderList as $provider) {
        $this->bootProvider($provider);
    }

    // Fire booted callbacks (registered via $app->booted())
    $this->fireAppCallbacks($this->bootedCallbacks);

    $this->booted = true;
}
```

### Provider Boot Order
Providers boot in the exact order they appear in `$this->serviceProviderList`, which is the order they were registered:
1. Framework core providers (LogServiceProvider, EventServiceProvider, RoutingServiceProvider)
2. `config/app.php` providers (in listed order)
3. Package discovery providers (in discovery order)

This means a provider later in the list can safely use services from earlier providers because all `register()` calls completed before any `boot()` started.

### Boot Method Invocation
```php
protected function bootProvider(ServiceProvider $provider)
{
    $provider->callBootingCallbacks();

    if (method_exists($provider, 'boot')) {
        $this->app->call([$provider, 'boot']);
    }

    $provider->callBootedCallbacks();
}
```
Each provider also supports its own `$provider->booting()` and `$provider->booted()` callbacks, wrapping the individual provider's `boot()` invocation.

## Mental Models

### The Construction Site
`register()` is like laying foundations for all buildings in a development. `boot()` is the simultaneous move-in day: all foundations are done, so any building can use any other building's utilities. You can't start moving into Building B before Building A's foundation is laid (that's register order), but on move-in day (boot), the order only matters if building A needs to be occupied before building B's moving trucks arrive.

### The Stage Play
All actors are backstage ready (`register()` completed). The curtain rises (`boot()` starts). Actors enter in order (provider boot order). Each actor's performance (`boot()` logic) can reference any other actor's props because all were prepared before the curtain.

## Internal Mechanics

### The Fire Callbacks Mechanism
```php
protected function fireAppCallbacks(array $callbacks)
{
    if (! $this->isBooted()) {
        foreach ($callbacks as $callback) {
            $callback($this);
        }
    }
}
```
Note the `! $this->isBooted()` guard: callbacks fire only during the initial boot. Once `$this->booted` is true, subsequent calls to `boot()` return immediately.

### Provider-Level booting/booted
Each provider instance gets its own callback collections:
```php
class ServiceProvider
{
    protected $bootingCallbacks = [];
    protected $bootedCallbacks = [];

    public function booting($callback)
    {
        $this->bootingCallbacks[] = $callback;
    }

    public function booted($callback)
    {
        $this->bootedCallbacks[] = $callback;
    }
}
```
These fire around the provider's own `boot()` method, not around the entire phase.

### Boot Phase Events
From the Kernel level, the boot phase is wrapped:
```php
// In bootstrapWith():
$this->fireBootstrapEvent('bootstrapping: BootProviders', [$this->app]);
$instance->bootstrap($this->app);  // calls $app->boot()
$this->fireBootstrapEvent('bootstrapped: BootProviders', [$this->app]);
```

### Re-Boot Prevention
```php
public function isBooted()
{
    return $this->booted;
}
```
The `$booted` boolean is set to `true` at the end of `boot()`. This flag is also used to determine if newly registered providers should be immediately booted:

```php
public function register($provider, $force = false)
{
    // ... registration logic ...
    
    if ($this->isBooted()) {
        $this->bootProvider($provider);
    }
    
    return $provider;
}
```

## Patterns

### Boot-Time Registration
Use `boot()` to register routes, event listeners, and views:
```php
public function boot()
{
    Route::middleware('web')->group(function () {
        $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
    });
    
    $this->loadViewsFrom(__DIR__.'/../resources/views', 'package');
    
    Event::listen(SomeEvent::class, SomeListener::class);
}
```

### Conditional Boot Logic
```php
public function boot()
{
    if ($this->app->runningInConsole()) {
        $this->commands([
            InstallCommand::class,
            PurgeCommand::class,
        ]);
    }
}
```

### Boot-Time Configuration Publishing
```php
public function boot()
{
    $this->publishes([
        __DIR__.'/../config/package.php' => config_path('package.php'),
    ], 'package-config');
}
```

## Architectural Decisions

### Why not resolve services in register()?
Resolving a service in `register()` triggers the container to instantiate it immediately, potentially using bindings from providers that haven't run `register()` yet. The two-phase design eliminates this risk by guaranteeing all registrations precede all boots.

### Why fire booting/booted at both app and provider levels?
Application-level callbacks (`$app->booting()`, `$app->booted()`) wrap the entire phase. Provider-level callbacks (`$provider->booting()`, `$provider->booted()`) wrap individual provider boots. This two-level nesting matches the hierarchical nature of booting (app boots, then each provider boots within it).

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| All bindings available during boot | Developer must wait for boot() to resolve—can't eagerly create in register() | Forces deferred initialization pattern; benefits testability |
| Boot order is deterministic (matches register order) | Developers may not know the register order without tracing | Boot-time failures from missing bindings are confusing |
| booting()/booted() provide clean before/after hooks | Callbacks cannot be unregistered once added | Memory leak in Octane if callbacks accumulate |
| Provider-level callbacks wrap each provider's boot | Callback overhead for every provider even if unused | Small but consistent CPU cost per provider |

## Performance Considerations

- **Boot iteration is O(n):** Every registered provider's `boot()` is called, even if the provider does nothing in `boot()`. Each call incurs PHP method dispatch overhead (~1-2µs).
- **Heavy boot operations:** Providers that load routes, register views, or publish configs perform file I/O during `boot()`. On cold boots, this dominates boot time.
- **`$app->call([$provider, 'boot'])`** uses the container's method call mechanism, which inspects the method's type hints for dependency injection. This adds ~10-20µs per provider with dependencies.
- **Octane amortization:** Under Octane, `boot()` runs once per worker start. Per-request cost drops to zero, making heavy boot operations free after the first request.

## Production Considerations

- **Monitor boot time per provider:** Use Laravel Telescope's `bootstrapped: BootProviders` event to measure total boot phase duration.
- **Deferred providers in boot:** Ensure providers that only provide services (no `boot()` logic) are marked as deferred. This skips both `register()` and `boot()` for those providers.
- **boot() exception handling:** An exception in one provider's `boot()` prevents subsequent providers from booting. Wrap critical boot logic in try/catch.
- **Config/route caching:** `php artisan route:cache` and `php artisan config:cache` move route and config registration out of `boot()`, dramatically reducing boot phase work.

## Common Mistakes

- **Throwing in boot() without handling:** An exception during `boot()` stops the entire boot phase. Other providers never boot.
- **Assuming boot order is controllable via config/app.php alone:** Package discovery providers are appended after app providers. If a package provider must boot before an app provider, add the package provider explicitly in `config/app.php` at the correct position.
- **Registering duplicate event listeners in boot():** `Event::listen()` called in `boot()` on every request (non-cached) adds duplicate listeners on repeated calls. Use `$this->app->booted()` for one-time registration or leverage event caching.
- **Modifying container bindings in boot():** Rebinding an abstract in `boot()` after another provider has already resolved it in `boot()` will not affect the already-resolved instance. This can cause inconsistent state.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Boot phase exception | White screen; 500 error | Provider boot() throws unhandled exception; remaining providers don't boot | Wrap boot logic; log before throwing |
| Service not available | "Call to undefined method" on resolved service | Provider tries to use a service registered by a deferred provider that hasn't been triggered | Ensure deferred providers' services are resolved in boot(), not register() |
| Duplicate registration | Routes/views registered twice | Provider boot() called twice due to manual $app->boot() | Use $app->booted() flag check in manual calls |
| Memory growth on Octane | Booting callbacks accumulate | Callbacks registered in boot() aren't cleared between requests | Use `$this->app->booting()` in `register()` not `boot()` |

## Ecosystem Usage

- **Laravel Horizon:** In `boot()`, Horizon registers its console commands and starts monitoring daemons. It depends on queue bindings registered by other providers in `register()`.
- **Laravel Nova:** Nova's `boot()` publishes its assets, registers its routes, and configures its authorization gate. It must boot after Laravel's auth provider so the gate system is available.
- **Spatie Permission:** In `boot()`, it calls `Gate::define()` for each registered permission. It depends on the auth provider having registered the Gate facade.
- **Laravel Debugbar:** Uses `boot()` to add its collectors and middleware. It must boot near the end to capture all other providers' registrations fully.
- **Barryvdh DomPDF:** In `boot()`, it publishes its configuration file and registers custom fonts. The publishing step depends on the filesystem having been configured in a prior provider's boot.

## Related Knowledge Units

### Prerequisites
- [Register Phase Order](../register-phase-order/02-knowledge-unit.md) — all providers must register before any provider boots.
- [Complete Boot Sequence](../complete-boot-sequence/02-knowledge-unit.md) — the full pipeline showing where the boot phase fits.

### Related Topics
- [Lifecycle Callback Hooks](../lifecycle-callback-hooks/02-knowledge-unit.md) — booting/booted callbacks that wrap the boot phase execution.
- [Deferred Provider Loading Timing](../deferred-provider-loading-timing/02-knowledge-unit.md) — how deferred providers boot lazily when first resolved.
- [Bootstrap with Event System](../bootstrap-with-event-system/02-knowledge-unit.md) — the bootstrapped: BootProviders event that brackets the boot phase.

### Advanced Follow-up Topics
- [Octane Boot Timing](../octane-boot-timing/02-knowledge-unit.md) — how boot order changes under long-running processes.
- [Console vs HTTP Boot Differences](../console-vs-http-boot-differences/02-knowledge-unit.md) — boot order differences between kernel implementations.
- [Route Caching](../caching-optimization/route-caching/02-knowledge-unit.md) — how route registration in boot() interacts with route caching.

## Research Notes
- The `$provider->callBootingCallbacks()` before each provider's `boot()` was added in Laravel 5.5. Prior versions only supported application-level callbacks.
- Laravel's `boot()` phase has maintained the same structure since Laravel 5.0. Future versions may parallelize independent provider boots (e.g., providers that only publish configs could boot concurrently).
- The `$app->call()` wrapper around `boot()` enables method injection into `boot(SomeDependency $dep)`, but this pattern is rarely used in practice as it couples the provider to specific resolved instances.
