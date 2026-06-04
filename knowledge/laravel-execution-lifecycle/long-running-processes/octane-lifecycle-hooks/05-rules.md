# Octane Lifecycle Hooks

## Rule Name
Wrap `Octane::tick()` callbacks in try-catch.
---
## Category
Reliability
---
## Rule
Always wrap the body of every `Octane::tick()` callback in a try-catch block.
---
## Reason
Ticks run in the master container outside request context. An uncaught exception in a tick has no error handler and can silently terminate the entire worker, dropping all in-flight requests.
---
## Bad Example
```php
Octane::tick('health', function () {
    Metrics::gauge('memory', memory_get_usage(true)); // Throws — worker dies silently
}, 60);
```
---
## Good Example
```php
Octane::tick('health', function () {
    try {
        Metrics::gauge('memory', memory_get_usage(true));
    } catch (Throwable $e) {
        Log::error('Health tick failed: '.$e->getMessage());
    }
}, 60);
```
---
## Exceptions
Development environments where worker crashes are acceptable during debugging.
---
## Consequences Of Violation
Silent worker death; all in-flight requests lost; capacity drops without alert.

---

## Rule Name
Guard `Octane::tick()` registration against duplicates.
---
## Category
Reliability | Maintainability
---
## Rule
Always guard `tick()` calls with a flag or check to ensure the callback is registered only once per worker lifetime.
---
## Reason
Service providers can be called multiple times (worker restarts, provider deferral). Calling `tick()` multiple times with the same name silently registers duplicate callbacks, all of which execute on every tick.
---
## Bad Example
```php
// Called in AppServiceProvider::boot() — may fire multiple times
Octane::tick('memory-monitor', function () {
    Metrics::gauge('memory', memory_get_usage(true));
}, 60);
```
---
## Good Example
```php
public function boot(): void
{
    if (! $this->app->bound('tick.registered')) {
        Octane::tick('memory-monitor', function () {
            Metrics::gauge('memory', memory_get_usage(true));
        }, 60);
        $this->app->instance('tick.registered', true);
    }
}
```
---
## Exceptions
No common exceptions — duplicate guard is always safe.
---
## Consequences Of Violation
Duplicate callbacks execute N times per tick interval; metric duplication; CPU waste; potential O(n) degradation.

---

## Rule Name
Keep `RequestTerminated` listeners fast and synchronous.
---
## Category
Performance
---
## Rule
Always ensure `RequestTerminated` listeners complete in under 5ms. Never dispatch queued jobs, make HTTP calls, or perform heavy I/O inside them.
---
## Reason
`RequestTerminated` listeners run synchronously between requests — the worker is blocked from accepting the next request while cleanup executes. Heavy listeners directly reduce throughput.
---
## Bad Example
```php
Event::listen(RequestTerminated::class, function ($event) {
    Log::info('Request completed');
    Http::post('https://analytics.example.com/track', $data); // Blocks worker
    ProcessPayment::dispatch(); // Delays next request
});
```
---
## Good Example
```php
Event::listen(RequestTerminated::class, function ($event) {
    Str::resetCache();
    Collection::clearMacros();
    // Heavy work goes on queue
    if (memory_get_usage() > 100 * 1024 * 1024) {
        gc_collect_cycles();
    }
});
```
---
## Exceptions
No common exceptions — always move heavy work out of the hot path between requests.
---
## Consequences Of Violation
Reduced throughput; request queue backs up; worker spends more time cleaning up than serving.

---

## Rule Name
Never resolve request-scoped services inside tick callbacks.
---
## Category
Design | Reliability
---
## Rule
Never call `request()`, `auth()`, `session()`, or any request-scoped service inside `Octane::tick()` callbacks.
---
## Reason
Ticks run in the master container where no active request exists. Resolving request-scoped services returns stale or null values from the previous request, causing silent data corruption.
---
## Bad Example
```php
Octane::tick('metrics', function () {
    $user = request()->user(); // Stale — from previous or no request
    Metrics::gauge('user_id', $user->id);
}, 60);
```
---
## Good Example
```php
Octane::tick('metrics', function () {
    Metrics::gauge('memory', memory_get_usage(true));
    Metrics::gauge('gc_roots', gc_status()['roots']);
    // No request-scoped data
}, 60);
```
---
## Exceptions
No common exceptions. Ticks intentionally run outside request context.
---
## Consequences Of Violation
Stale request data pollutes metrics; unexpected null pointer errors; wrong user attribution.

---

## Rule Name
Always handle early returns in `RequestReceived` listeners.
---
## Category
Reliability
---
## Rule
If a `RequestReceived` listener returns a response to block a request, ensure sandbox state is not left partially initialized.
---
## Reason
Returning a response from `RequestReceived` skips the normal request lifecycle. If the listener mutates application state before returning, that state persists across the skipped request and affects subsequent requests.
---
## Bad Example
```php
Event::listen(RequestReceived::class, function ($event) {
    if (in_array($event->request->ip(), config('app.blocked_ips'))) {
        app('counter')->increment(); // State mutation — persists despite block
        $event->response = response('Forbidden', 403);
    }
});
```
---
## Good Example
```php
Event::listen(RequestReceived::class, function ($event) {
    if (in_array($event->request->ip(), config('app.blocked_ips'))) {
        // No state mutations before returning
        $event->response = response('Forbidden', 403);
    }
});
```
---
## Exceptions
No common exceptions — early return should leave no side effects.
---
## Consequences Of Violation
Accumulated counter state; corrupted metrics; unpredictable behavior on blocked requests.

---

## Rule Name
Test hooks explicitly against the target runtime.
---
## Category
Testing | Reliability
---
## Rule
Always verify Octane hook behavior (especially `RequestTerminated` and tick intervals) explicitly in tests running the target runtime, not just in PHPUnit's simulated environment.
---
## Reason
FrankenPHP may reuse sandboxes without firing `RequestTerminated` every request. Tick intervals behave differently under idle vs loaded workers. Runtime-specific behavior cannot be inferred from source code alone.
---
## Bad Example
```php
// Tested only with HTTP kernel — passes, but fails under FrankenPHP
```
---
## Good Example
```php
// Integration test with actual Octane runtime
// Uses OctaneTestResponse or FrankenPHP test helpers
public function test_request_terminated_fires(): void
{
    $response = $this->octaneGet('/test');
    $this->assertTrue(CleanupTracker::wasCalled());
}
```
---
## Exceptions
Development environments where runtime parity is not asserted.
---
## Consequences Of Violation
Cleanup listeners silently don't fire; static arrays accumulate; memory grows unbounded in production.
