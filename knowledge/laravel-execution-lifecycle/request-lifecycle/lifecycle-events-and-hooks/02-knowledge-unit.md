# Lifecycle Events and Hooks

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Request Lifecycle
- **Knowledge Unit:** Lifecycle Events and Hooks
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Lifecycle Events and Hooks covers the event system and callback registration points that fire at specific phases of the request lifecycle: bootstrapping events (`bootstrapping:*`, `bootstrapped:*`), application callbacks (`booting`, `booted`, `terminating`), request-specific events (`RequestHandled`, `Terminating`), and request duration lifecycle handlers (`whenRequestLifecycleDurationExceeds`). These hooks provide observation and extension points without modifying framework internals, enabling packages and applications to react to lifecycle transitions.

The critical engineering distinction is between **synchronous callbacks** (registered via `$app->booting()`, `$app->booted()`, `$app->terminating()`) and **event-driven listeners** (registered via `EventServiceProvider` or `Event::listen()`). Callbacks execute immediately in the current call stack — they cannot be deferred, queued, or conditionally executed by environment. Events, by contrast, go through the full event dispatcher pipeline, supporting listeners, subscribers, and queueable event handling. Choosing the wrong mechanism leads to subtle ordering bugs: a `booting` callback registered in a service provider's `register()` method fires during **that provider's** registration, before `register()` completes for other providers.

For production engineers, lifecycle hooks are the primary mechanism for framework-level extensions like health checks, observability, and state management. Pulse uses duration handlers for slow request recording; Telescope uses `RequestHandled` for request logging; Octane uses `Terminating` for state flushing. Understanding hook ordering determines whether your application code runs at the correct point in the lifecycle.

---

## Core Concepts

### 1. Application Boot Callbacks
Registered via `$app->booting($callback)` and `$app->booted($callback)`. `booting` fires during `Application::bootstrapWith()` after bootstrapper #5 (`RegisterProviders`). `booted` fires after bootstrapper #6 (`BootProviders`):

```php
$this->booting(function () {
    // Runs after all providers have registered, before any boot
});
$this->booted(function () {
    // Runs after all providers have booted
});
```

### 2. Bootstrap Events
Laravel dispatches events before and after each bootstrapper via `bootstrapWith()`:

```php
// Illuminate\Foundation\Application::bootstrapWith()
$app['events']->dispatch('bootstrapping: '.$bootstrapper, [$this]);
$app->make($bootstrapper)->bootstrap($this);
$app['events']->dispatch('bootstrapped: '.$bootstrapper, [$this]);
```

### 3. RequestHandled Event
Dispatched inside `Kernel::handle()` after route dispatch and response creation, but before `send()`:

```php
$this->app['events']->dispatch(
    new \Illuminate\Foundation\Events\RequestHandled($request, $response)
);
```

### 4. Terminating Event and Callbacks
Two mechanisms for post-response hooks:
- `$app->terminating($callback)` — Registers a callback that fires in `Application::terminate()`
- `Event::listen(Terminating::class)` — Listens for the `Illuminate\Foundation\Events\Terminating` event

Both fire during `$kernel->terminate()`, after terminable middleware.

### 5. Request Duration Lifecycle Handlers
Registered via `$kernel->whenRequestLifecycleDurationExceeds($thresholdMs, $handler)`. Handlers are threshold-sorted and only fire if the request duration exceeds their threshold:

```php
$kernel->whenRequestLifecycleDurationExceeds(100, function ($request, $response) {
    Log::channel('slow')->info('Request took >100ms', [
        'uri' => $request->getUri(),
    ]);
});
```

---

## Mental Models

**The Building Construction Timeline.** `booting` is the scaffolding going up — the building (application) structure exists but furnishings (services) are not yet placed. `booted` is move-in day when all rooms are furnished and operational. Bootstrap events (`bootstrapping:LoadConfiguration` etc.) are the daily construction logs — each contractor (bootstrapper) reports before and after their work phase.

**The Airport Terminal Announcements.** `RequestHandled` is the "flight has landed" announcement (passengers are at the gate, response is ready). `Terminating` is the "final boarding call before gate closes" (cleanup begins). Duration handlers are the airport's performance metrics — if a flight takes too long on the tarmac (request exceeds threshold), an alert is triggered.

**The Photo Processing Pipeline.** Boot hooks are camera setup (lens cap off, focus set), bootstrap events are each development step (develop → stop bath → fixer → wash), `RequestHandled` is the printed photo leaving the enlarger, `Terminating` is cleaning the chemicals. Duration handlers are the timer — if any step exceeds its expected duration, the technician logs it.

---

## Internal Mechanics

### Complete Hook Timeline

```
┌─ Application::__construct() ──────────────────────────────────┐
│  No hooks fire here                                            │
├─ bootstrap/app.php (ApplicationBuilder configuration) ────────┤
│  ->booting($callback) stores in $app->bootingCallbacks         │
│  ->booted($callback)   stores in $app->bootedCallbacks        │
├─ Kernel::handle($request) ────────────────────────────────────┤
│  ├─ Kernel::bootstrap() → Application::bootstrapWith()         │
│  │  ├─ 'bootstrapping: LoadEnvironmentVariables' event         │
│  │  ├─ LoadEnvironmentVariables bootstraps                    │
│  │  ├─ 'bootstrapped: LoadEnvironmentVariables' event         │
│  │  ├─ ... (repeat for each of 6 bootstrappers)               │
│  │  ├─ 'bootstrapping: RegisterProviders' event                │
│  │  ├─ RegisterProviders → calls all provider register()      │
│  │  │  └─ During register():                                   │
│  │  │     → $app->booting() callbacks from this provider fire  │
│  │  │     → $app->booted() callbacks are QUEUED (not fired)    │
│  │  ├─ 'bootstrapped: RegisterProviders' event                 │
│  │  ├─ 'bootstrapping: BootProviders' event                    │
│  │  ├─ BootProviders → calls all provider boot()              │
│  │  │  └─ During boot():                                       │
│  │  │     → $app->booting() callbacks from THIS provider fire  │
│  │  │     → $app->booted() callbacks still QUEUED              │
│  │  │     → When ALL providers booted: fire queued booted()   │
│  │  ├─ 'bootstrapped: BootProviders' event                     │
│  │                                                             │
│  ├─ Pipeline through global middleware                         │
│  ├─ dispatchToRouter() → route → controller                   │
│  ├─ RequestHandled event dispatched (before send)              │
│  └─ return $response to public/index.php                      │
├─ public/index.php: $response->send() ──────────────────────────┤
│  (no lifecycle hooks during send)                              │
├─ public/index.php: $kernel->terminate() ──────────────────────┤
│  ├─ terminateMiddleware()                                      │
│  ├─ Application::terminate() → fires terminating callbacks    │
│  ├─ dispatch(Terminating::class) event                        │
│  └─ runRequestLifecycleDurationHandlers()                     │
└──────────────────────────────────────────────────────────────┘
```

### Duration Handler Registration and Execution

```php
// Kernel stores handlers as array of [threshold, handler]
// Sorted by threshold ascending
public function whenRequestLifecycleDurationExceeds($threshold, $handler)
{
    $this->lifecycleDurationHandlers[] = [$threshold, $handler];
}

// After termination, evaluate each handler
protected function runRequestLifecycleDurationHandlers($request, $response)
{
    $duration = microtime(true) - $this->app['request']->server->get('REQUEST_TIME_FLOAT');
    foreach ($this->lifecycleDurationHandlers as [$threshold, $handler]) {
        if ($duration >= $threshold / 1000) {  // Convert ms to seconds
            $handler($request, $response);
        }
    }
}
```

### Booting/Booted Callback Firing Order

The critical detail: `booting` callbacks registered in a provider's `register()` fire during **that provider's** `register()` method, not after all providers have registered:

```php
class MyProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->booting(function () {
            // THIS FIRES NOW, during this provider's register()
            // Other providers have NOT yet registered
        });
        $this->app->booted(function () {
            // THIS IS QUEUED, fires after ALL providers have booted
        });
    }
}
```

---

## Patterns

### 1. Octane State Flushing via Terminating Event
**When**: You need to reset per-request state under Octane.
**How**:

```php
// AppServiceProvider::boot()
Event::listen(Terminating::class, function () {
    app()->forgetInstance(CurrentUser::class);
    MySingleton::reset();
});
```

### 2. Bootstrapping Performance Monitoring
**When**: You need to measure individual bootstrapper timing.
**How**: Listen to bootstrap events with timing:

```php
// AppServiceProvider::boot()
$app['events']->listen('bootstrapping: *', function ($event, $data) {
    $data[0]->instance('bootstrap.start.' . $event, microtime(true));
});
$app['events']->listen('bootstrapped: *', function ($event, $data) {
    $start = $data[0]->bound('bootstrap.start.' . $event)
        ? $data[0]->make('bootstrap.start.' . $event)
        : LARAVEL_START;
    Log::debug("Bootstrap phase: $event took " . (microtime(true) - $start) . 's');
});
```

### 3. RequestHandled for Response Enrichment
**When**: You need to add headers or modify response before send.
**How**:

```php
Event::listen(RequestHandled::class, function (RequestHandled $event) {
    $event->response->headers->set('X-Debug-Time', microtime(true) - LARAVEL_START);
    $event->response->headers->set('X-Debug-Memory', memory_get_peak_usage());
});
```

---

## Architectural Decisions

**Why `booting` callbacks fire during `register()` of the registering provider.** This ensures that callbacks registered by a provider are available for the same provider's `register()` completion. If they were deferred until after all providers registered, a provider could not bootstrap its own initialization using `booting`. The tradeoff: ordering guarantees depend on provider registration order.

**Why `Terminating` exists both as a callback system and an event.** Callbacks are simpler and have lower overhead (no dispatcher pipeline). Events enable queueable listeners, multiple independent listeners, and subscriber classes. The dual system lets simple cleanup use callbacks while complex operations (Octane state flushing, Pulse recording) use events.

**Why duration handlers run after `fastcgi_finish_request()` in FPM.** Duration handlers are for monitoring, not response modification. Running them after `send()` prevents handler latency from affecting time-to-first-byte. In Octane, this is moot — workers are synchronous, so handler time still affects throughput.

**Why bootstrap events use string names (`bootstrapping:ClassName`) rather than event objects.** The string pattern allows wildcard listeners (`bootstrapping: *`) to capture all bootstrappers with one listener. Event objects would require explicit listener registration per bootstrapper. The tradeoff: no IDE autocompletion or type safety for event payloads.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| `booting`/`booted` provide fine-grained lifecycle hooks | Firing during `register()` is counterintuitive | Developers who miss this ordering create hard-to-debug initialization bugs |
| Bootstrap events use wildcard string matching | No type safety for event parameters | Wildcard listener receives array payload; must extract Application instance from `$data[0]` |
| Duration handlers are threshold-filtered | Handlers array grows with each registration | With 50+ handlers, threshold iteration adds ~0.02ms — negligible but unbounded |
| `RequestHandled` fires before send for response modification | Developers may modify response after intended modification window | No protection against late modification (no `isFrozen()` check) |

---

## Performance Considerations

- **Hook registration is O(1).** Each callback or event listener registration is an array push. Cost: ~0.001ms per registration. With 100 hooks, registration overhead is ~0.1ms.
- **Bootstrap event dispatching adds ~0.05ms per bootstrapper.** With 6 bootstrappers × 2 events each = 12 dispatches × 0.05ms = ~0.6ms total. Negligible for FPM; for Octane, this is a one-time cost per worker.
- **Duration handler threshold comparison is O(n).** With 10 handlers, 10 float comparisons + 10 closure invocations for handlers that pass threshold. Total cost: ~0.02ms-0.05ms when threshold is exceeded.
- **`Terminating` event dispatching overhead.** The event dispatcher resolves listeners from the container, iterates them, and invokes each. With 20 terminating listeners, total dispatch time is ~0.5-1ms. This runs after the response is sent, so client-visible impact is zero in FPM.

---

## Production Considerations

- **Monitor `RequestHandled` listener performance.** Slow listeners delay `$response->send()` because `RequestHandled` fires before send. If a listener makes an API call or database query, time-to-first-byte increases. Ensure all `RequestHandled` listeners are sub-millisecond.
- **Use `Terminating` listeners for cleanup, not `RequestHandled`.** Termination-specific cleanup (session flushing, cache invalidation) belongs in `Terminating`, not `RequestHandled`. Using `RequestHandled` for cleanup delays the response to the client.
- **Audit duration handler count.** While individual handlers are cheap, applications with 30+ duration handlers may experience measurable iteration overhead. Consider consolidating threshold-based logic into a single listener that evaluates all thresholds.
- **Under Octane, `Terminating` listeners run synchronously.** Each listener blocks the worker from accepting the next request. If a `Terminating` listener does 100ms of I/O, worker throughput drops by 100ms per request. Offload heavy cleanup to queue jobs.
- **Set `LARAVEL_START` constant explicitly in `public/index.php`.** If the constant is not defined, `microtime(true) - LARAVEL_START` in duration handlers produces incorrect results. The default `index.php` defines it as `define('LARAVEL_START', microtime(true))` at the top.

---

## Common Mistakes

**Why it happens:** Developers assume `booted()` callbacks registered in `register()` fire after all providers register.  
**Why it's harmful:** `booted()` callbacks are queued, not fired, during `register()`. They fire much later (after `BootProviders`). Code in a `booted` callback may access services not yet resolved.  
**Better approach:** Use `booting()` for logic that must run after all providers register. Use `booted()` only for logic after all providers boot.

**Why it happens:** Registering `$app->booting()` inside a provider's `boot()` method.  
**Why it's harmful:** `booting()` callbacks registered during `boot()` are intended for immediate execution during `register()`. When registered in `boot()`, they fire immediately (because providers boot sequentially and `booting` callbacks fire the moment they're registered during the boot phase).  
**Better approach:** `booting()` callbacks should only be registered in `register()`. In `boot()`, use direct code instead.

**Why it happens:** Heavy computation inside `RequestHandled` listener.  
**Why it's harmful:** `RequestHandled` fires before `send()` — any slow listener increases time-to-first-byte for the client.  
**Better approach:** Move heavy work to `Terminating` listener (fires after send) or dispatch a queue job.

**Why it happens:** Using event string names with typos in wildcard listeners.  
**Why it's harmful:** A listener on `bootstrapping: handleExc*` does not catch `HandleExceptions` due to regex mismatch. No error is thrown — the listener silently never fires.  
**Better approach:** Use exact full class name strings in listeners. Test wildcard patterns with a quick Artisan Tinker verification.

---

## Failure Modes

**Failure: `booting` callback accesses unresolvable service.** A `booting` callback registered in a provider's `register()` fires before `BootProviders` — not all services are available. Detection: `Target [...] is not instantiable` during bootstrap. Mitigation: Only use `booting` for configuration setup, not service resolution.

**Failure: Duration handler calls `app()->terminating()` recursively.** A duration handler that triggers registration of a new terminating callback causes an infinite loop if the callback list is iterated by reference. Detection: Worker memory exhaustion under Octane. Mitigation: Avoid registering lifecycle hooks inside lifecycle hooks.

**Failure: `Terminating` event listener crashes, preventing subsequent listeners.** Unlike HTTP exception handling, the `Terminating` event dispatch does not stop on first failure. However, if the event dispatcher catches exceptions, later listeners may still run. Detection: Partial cleanup — some listeners succeeded, others failed. Mitigation: Wrap every `Terminating` listener in try/catch with logging.

**Failure: `RequestHandled` event cache stampede.** A `RequestHandled` listener that clears cache on the same key that other listeners read causes cache stampedes under concurrent requests. Detection: Intermittent cache-miss spikes in monitoring. Mitigation: Use cache locks or defer cache clearing to `Terminating`.

---

## Ecosystem Usage

**Laravel Pulse** registers multiple `whenRequestLifecycleDurationExceeds` handlers for various thresholds (slow requests, N+1 queries, exceptions). Pulse also uses `Terminating` to flush recorded entries to its storage driver, demonstrating production monitoring via lifecycle hooks.

**Laravel Telescope** listens to `RequestHandled` to capture request snapshots (headers, session, user, duration). Telescope's `Watcher` classes register as event listeners during provider `boot()`, showing how lifecycle hooks enable observability without middleware modification.

**Laravel Octane** uses `Terminating` event to trigger its state reset mechanism. The `Octane\Listeners\FlushUploadedFiles` and `FlushSessionState` listeners are registered as `Terminating` event subscribers, ensuring per-request state is cleaned before the next request on the same worker.

**Spatie's Laravel Package Tools** uses `booting`/`booted` callbacks internally via its `Package` registration system. The `registeringPackage`, `packageRegistered`, `bootingPackage`, `packageBooted` hooks in Spatie packages map directly to Laravel's lifecycle hooks, providing phased initialization for third-party packages.

---

## Related Knowledge Units

### Prerequisites
- HTTP Kernel Dispatch (hooks fire within kernel handle/terminate)
- Response Sending and Termination (termination phase context)
- Service Providers (boot callbacks register during provider lifecycle)

### Related Topics
- Service Providers (boot callbacks register during provider lifecycle)
- Boot Order & Timing (complete hook timing within bootstrap sequence)
- Long-Running Process Architecture (Octane's use of Terminating for state flush)
- Console Kernel Dispatch (console hooks via Terminating event)
- Entry Point Mechanics (LARAVEL_START constant for duration measurement)

### Advanced Follow-up Topics
- Laravel Event Dispatcher Internals
- Octane Sandbox and Reset Mechanism
- Custom Bootstrapper Development
- Hook Performance Benchmarking
- Queueable Event Listeners and Lifecycle Hooks

---

## Research Notes

### Source Analysis
- `Illuminate\Foundation\Application` — Contains `booting()`, `booted()`, `terminating()` callback registration and execution. The `bootstrapWith()` method dispatches string-based bootstrap events.
- `Illuminate\Foundation\Http\Kernel::whenRequestLifecycleDurationExceeds()` — Registers threshold-sorted post-response handlers.
- `Illuminate\Foundation\Events\RequestHandled` — Event class dispatched inside `Kernel::handle()` before `send()`, carries `$request` and `$response`.
- `Illuminate\Foundation\Events\Terminating` — Event class dispatched in `Kernel::terminate()` after terminable middleware and app callbacks.
- `Illuminate\Events\Dispatcher` — The event system that dispatches bootstrap events and lifecycle events through listener resolution.
- `Illuminate\Foundation\Http\Kernel::runRequestLifecycleDurationHandlers()` — Iterates threshold handlers and invokes those whose threshold is exceeded.

### Key Insight
The critical distinction is between **synchronous callbacks** (`booting`, `booted`, `terminating`) that execute immediately in the current call stack and **event-driven listeners** dispatched through the event dispatcher pipeline. Callbacks are simpler and lower overhead but fire during unexpected phases: a `booting()` callback registered in a provider's `register()` method fires during that provider's registration, before other providers have registered. Events, by contrast, provide ordered, deferrable, queueable execution through the full event system — but add dispatching overhead. Choosing the wrong mechanism leads to subtle ordering bugs that are difficult to reproduce because they depend on provider registration order.

### Version-Specific Notes
- **Laravel 10**: `booting()`/`booted()` callbacks exist on Application. `RequestHandled` event dispatches in kernel handle. Bootstrap events (`bootstrapping:*`, `bootstrapped:*`) use string-based dispatching.
- **Laravel 11**: `whenRequestLifecycleDurationExceeds()` added to HTTP kernel. No changes to callback firing order.
- **Laravel 12**: `Terminating` event introduced as dedicated event class. Application gains `terminating()` callback registration.
- **Laravel 13**: Duration handler threshold sorting optimized. Octane-specific lifecycle hooks added for request lifecycle. Bootstrap events gain typed event classes alongside string names.
