# Bootstrap with Event System

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **Last Updated:** 2026-06-02

## Executive Summary
Laravel dispatches two lifecycle events during each bootstrapper execution: `bootstrapping: <name>` before the bootstrapper runs and `bootstrapped: <name>` after it completes. This event system enables developers and packages to hook into the boot sequence at precise positions without modifying the kernel or bootstrapper classes. Understanding these events is critical for building packages that need to initialize at specific points in the bootstrap pipeline.

## Core Concepts

### Bootstrapper Events
Each bootstrapper triggers exactly two events:
- **`bootstrapping: <BootstrapperClassName>`** — Dispatched via `$this->app['events']->dispatch()` before the bootstrapper's `bootstrap()` method runs
- **`bootstrapped: <BootstrapperClassName>`** — Dispatched immediately after `bootstrap()` completes

### The Event Dispatch Mechanism
```php
// Inside Kernel::bootstrap()
foreach ($this->bootstrappers() as $bootstrapper) {
    $this->app['events']->dispatch('bootstrapping: '.$bootstrapper, [$this->app]);
    // [Resolve bootstrapper instance]
    $bootstrapper->bootstrap($this->app);
    $this->app['events']->dispatch('bootstrapped: '.$bootstrapper, [$this->app]);
}
```

### Full Event Sequence (HTTP Request)
```
bootstrapping: Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables
bootstrapped:  Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables
bootstrapping: Illuminate\Foundation\Bootstrap\LoadConfiguration
bootstrapped:  Illuminate\Foundation\Bootstrap\LoadConfiguration
bootstrapping: Illuminate\Foundation\Bootstrap\HandleExceptions
bootstrapped:  Illuminate\Foundation\Bootstrap\HandleExceptions
bootstrapping: Illuminate\Foundation\Bootstrap\RegisterFacades
bootstrapped:  Illuminate\Foundation\Bootstrap\RegisterFacades
bootstrapping: Illuminate\Foundation\Bootstrap\RegisterProviders
bootstrapped:  Illuminate\Foundation\Bootstrap\RegisterProviders
bootstrapping: Illuminate\Foundation\Bootstrap\BootProviders
bootstrapped:  Illuminate\Foundation\Bootstrap\BootProviders
```

### Event Payload
Both events receive a single argument: the `$app` (Application) instance. This allows listeners to inspect or mutate the application state at the current bootstrap stage.

### Listener Registration
Listeners are registered via the standard Laravel event system:
```php
// In a service provider's boot() method
public function boot()
{
    $this->app['events']->listen(
        'bootstrapping: Illuminate\Foundation\Bootstrap\LoadConfiguration',
        function ($app) {
            // Config not yet loaded—$_ENV has fresh values
        }
    );
}
```

### Kernel-Level Event Fire Method
```php
protected function fireBootstrapEvent($event, $bootstrapper)
{
    if ($this->booted && ! $this->app->runningUnitTests()) {
        return;
    }
    $this->app['events']->dispatch($event, [$this->app]);
}
```
Note: Events are suppressed after boot completes and during unit tests to prevent noise.

## Mental Models

### The Instrument Panel
Think of these events as sensors on a spacecraft launch panel. Each `bootstrapping:` event is a "stage ignition" indicator; each `bootstrapped:` is "stage separation confirmed." You can attach custom telemetry (listeners) to any stage to log timing, validate state, or inject course corrections.

### The Checkpoint System
Each event pair is a checkpoint. `bootstrapping:` = entering checkpoint, `bootstrapped:` = exiting checkpoint. Listeners at a checkpoint can see what's been initialized so far and what's still missing.

## Internal Mechanics

### The Event Loop in `bootstrap()`
```php
public function bootstrap()
{
    if (! $this->app->hasBeenBootstrapped()) {
        $this->app->bootstrapWith($this->bootstrappers());
    }
}

public function bootstrapWith(array $bootstrappers)
{
    $this->hasBeenBootstrapped = true;
    foreach ($bootstrappers as $bootstrapper) {
        $this->fireBootstrapEvent('bootstrapping: '.$bootstrapper, [$this->app]);
        $instance = $this->app->make($bootstrapper);
        $instance->bootstrap($this->app);
        $this->fireBootstrapEvent('bootstrapped: '.$bootstrapper, [$this->app]);
    }
}
```

### Custom Bootstrapper Integration
Developers can add custom bootstrappers to the kernel:
```php
// App\Http\Kernel
protected $bootstrappers = [
    \Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables::class,
    \App\Bootstrap\LoadCustomSettings::class,  // Custom bootstrapper
    // ... remaining default bootstrappers
];
```
Custom bootstrappers automatically get the `bootstrapping:` / `bootstrapped:` event pair.

### Event Suppression Conditions
Events are not dispatched when:
- `$this->booted` is true (app already booted—prevents re-dispatch on Octane second requests)
- `$this->app->runningUnitTests()` is true (prevents test pollution)

## Patterns

### Bootstrapper Timing Listener
```php
Event::listen('bootstrapping: *', function ($event, $payload) {
    static $start;
    $start[$event] = microtime(true);
});
Event::listen('bootstrapped: *', function ($event, $payload) {
    $name = str_replace('bootstrapped: ', '', $event);
    Log::debug("$name took " . (microtime(true) - $start['bootstrapping: '.$name]) . 's');
});
```

### Conditional Initialization
```php
Event::listen('bootstrapping: *', function ($event, $app) {
    if (str_contains($event, 'RegisterProviders')) {
        $app->instance('bootstrapping.register', true);
    }
});
```

## Architectural Decisions

### Why string-based event names instead of event classes?
Bootstrapper events use string names (`bootstrapping: ClassName`) rather than dedicated event classes. This avoids creating N event classes for N bootstrappers and allows wildcard matching (`bootstrapping: *`). The downside is no IDE autocompletion for event payloads.

### Why fire events in Kernel instead of bootstrapper?
Events are fired at the `Kernel::bootstrapWith()` level, not inside individual bootstrappers. This keeps bootstrappers pure—they don't need to know about the event system. The kernel orchestrates the event lifecycle around each bootstrapper invocation.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Hook into any bootstrap step without modifying kernel | String-based events lack type safety | Listeners must manually verify bootstrapper class name |
| Wildcard matching enables batch listeners | Events fire even if no listeners registered (dispatch overhead) | ~5-10µs overhead per bootstrapper with zero listeners |
| Custom bootstrappers get events automatically | Cannot selectively disable events for specific bootstrappers | Workaround: check bootstrapper class name inside listener |
| Kernel controls event timing centrally | Consumers cannot add events around sub-steps within a bootstrapper | Must extend or wrap bootstrapper class for finer granularity |

## Performance Considerations

- **Zero-listener cost:** Event dispatch with no registered listeners is fast (~1µs), but the wildcard `*` matching in Laravel's event system adds a small overhead because it iterates all `*` patterns.
- **Wildcard listener cost:** `Event::listen('bootstrapping: *', ...)` fires on every bootstrapper event. Use specific listeners when possible.
- **Multiple listeners per event:** Each listener is called synchronously. Heavy listeners inflate boot time.
- **Memory:** Listeners are stored in the container's event dispatcher. On Octane, listeners persist across requests—ensure closures don't capture request-specific references.

## Production Considerations

- **Audit listener count:** Run `php artisan event:list` to see all registered listeners. Unexpected `bootstrapping:*` listeners often come from packages.
- **Lagging listener duration:** Use `telescope:monitor` or custom middleware to log if any bootstrapper event listener exceeds 100ms.
- **Octane listener leak:** Closures registered via `Event::listen()` in `boot()` persist across requests. Use `Once` or conditional registration to avoid accumulating duplicate listeners.
- **Config cache+event cache:** Both caches must be fresh for listen events to work as expected. Stale caches may drop listener registrations.

## Common Mistakes

- **Assuming boot order from event order:** Listeners attached to `bootstrapping: X` and `bootstrapped: Y` may interleave if other packages attach to the same events. The order of listener invocation follows the priority system, not the insertion order.
- **Mutating app state in listeners that other bootstrappers depend on:** A listener attached to `bootstrapping: LoadConfiguration` that modifies environment variables may interfere with the configuration loading process.
- **Registering listeners after bootstrap:** `Event::listen()` called in a controller will not fire for the current request's bootstrap phase.
- **Assuming events fire during testing:** `runningUnitTests()` suppresses bootstrap events by default.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Listener not called | `bootstrapping:*` listener never fires | Listener registered in service provider `boot()` but event already passed | Register in `register()` or use `defer=true` provider |
| Events not fired under tests | Bootstrap events appear missing | `Kernel::fireBootstrapEvent()` skips when `runningUnitTests()` is true | Wrap assertions in `Event::fake()` for bootstrap events |
| Duplicate listeners on Octane | Boot time grows across requests | Closure listeners accumulate on each request start | Use `$this->app->events->forget('bootstrapping:*')` or register in `register()` |
| Wildcard listener overload | High memory/cpu during boot | `bootstrapping: *` listener that does heavy work | Narrow to specific bootstrapper class names |

## Ecosystem Usage

- **Laravel Telescope:** Listens to `bootstrapped:*` events to record the timing and memory usage of each bootstrapper during request monitoring.
- **Laravel Debugbar:** Attaches a `bootstrapping:*` listener that records a timeline marker for each bootstrapper, displayed in the Debugbar timeline panel.
- **Sentry/Laravel:** The Sentry SDK uses a `bootstrapped: HandleExceptions` listener to register its own error handler after Laravel's error handler is active, ensuring Sentry captures framework-level exceptions.
- **Clockwork:** The Clockwork extension listens to all `bootstrapped:*` events to collect boot sequence profiling data.

## Related Knowledge Units

### Prerequisites
- [Complete Boot Sequence](../complete-boot-sequence/02-knowledge-unit.md) — the full pipeline within which bootstrap events are dispatched.
- [Bootstrapper Sequence](../application-bootstrap/bootstrapper-sequence/02-knowledge-unit.md) — the bootstrapper classes that each generate a paired event.

### Related Topics
- [Register Phase Order](../register-phase-order/02-knowledge-unit.md) — events around the registration bootstrapper.
- [Lifecycle Callback Hooks](../lifecycle-callback-hooks/02-knowledge-unit.md) — relationship between bootstrapping events and booting/booted callbacks.
- [Application Builder Configuration](../application-bootstrap/application-builder-configuration/02-knowledge-unit.md) — lifecycle callbacks registered via the builder that interact with bootstrap events.

### Advanced Follow-up Topics
- [Octane Boot Timing](../octane-boot-timing/02-knowledge-unit.md) — how bootstrap events fire (or are suppressed) under long-running processes.
- [Console vs HTTP Boot Differences](../console-vs-http-boot-differences/02-knowledge-unit.md) — event suppression differences between kernels.
- [Cache Invalidation Deployment](../caching-optimization/cache-invalidation-deployment/02-knowledge-unit.md) — how deployment strategies affect bootstrap event listener registration.

## Research Notes
- The event string format `bootstrapping: ClassName` has been consistent since Laravel 5.0. No planned changes in Laravel 11.
- There is no `bootstrapWith()`-level event for the complete pipeline start/end—only per-bootstrapper events. Use `booting()`/`booted()` application callbacks for overall pipeline hooks.
- In Laravel 11, the kernel bootstrapper list was reduced, which also reduced the volume of bootstrap events. Developers should not rely on a specific number of bootstrap events being dispatched.
