## Keep all Octane tick callbacks under 100ms execution time
---
Category: Performance
---
Ensure every tick callback registered via Octane::tick() completes in under 100ms — use queue jobs for any heavier work.
---
Reason: Ticks execute synchronously within the worker between requests. While a tick is running, the worker cannot handle any incoming request. A 500ms tick blocks the worker for half a second, adding 500ms of latency to any request that arrives during tick execution. For a worker processing 10 RPS, a 100ms tick affects ~1 request — acceptable. A 500ms tick affects ~5 requests, causing visible latency degradation.
---
Bad Example:
```php
// Heavy tick — blocks worker for seconds
Octane::tick('report:generate', function () {
    Artisan::call('report:generate');  // Takes 2-5 seconds — blocks all requests
}, seconds: 60);
```

Good Example:
```php
// Lightweight tick under 100ms
Octane::tick('cache:warm', function () {
    cache()->get('metrics:summary');  // <10ms — negligible impact
}, seconds: 60);
```
---
Exceptions: Cache warming ticks that touch Redis (sub-millisecond) may be acceptable even if their total execution includes slightly more work.
---
Consequences Of Violation: Worker blocked during tick execution, p99 latency spikes proportional to tick duration, degraded user experience during tick windows.

## Register all ticks in service provider boot() methods, never in register()
---
Category: Framework Usage
---
Always register Octane::tick() callbacks in a service provider's boot() method, never in register().
---
Reason: The register() method runs before the service container is fully booted — key services (cache, config, router, log) may not be available. Any attempt to resolve these services within a tick closure registered in register() will fail. The boot() method runs after all providers have registered their bindings, ensuring all framework services are available at tick registration time.
---
Bad Example:
```php
// Tick registered in register() — services may not be available
public function register(): void
{
    Octane::tick('cache:warm', fn() => cache()->get('key')); // cache() not ready
}
```

Good Example:
```php
// Tick registered in boot() — all services available
public function boot(): void
{
    Octane::tick('cache:warm', fn() => cache()->get('key')); // Cache ready
}
```
---
Exceptions: Ticks that only use primitive PHP operations (no framework services) may technically work in register(), but boot() is still the correct convention.
---
Consequences Of Violation: Fatal errors from resolving unavailable services during tick registration, worker crashes, tick not registered at all.

## Always wrap tick callbacks in try/catch to prevent worker crashes
---
Category: Reliability
---
Surround all tick callback logic with try/catch blocks so that an uncaught exception in the tick does not crash the entire worker.
---
Reason: Ticks execute in the worker's main process, not in a sandboxed request context. An uncaught exception in a tick propagates to the worker's top-level error handler, which may terminate the worker process. A crashed worker reduces pool capacity until it is automatically restarted. During that window (seconds to minutes), the pool has one fewer worker, reducing throughput proportionally.
---
Bad Example:
```php
// Uncaught exception crashes the worker
Octane::tick('metrics:flush', function () {
    Http::post('https://metrics.example.com/flush', $data); // Exception = worker crash
}, seconds: 60);
```

Good Example:
```php
// Exception caught — worker continues
Octane::tick('metrics:flush', function () {
    try {
        Http::post('https://metrics.example.com/flush', $data);
    } catch (Throwable $e) {
        Log::error('Metrics flush failed', ['error' => $e->getMessage()]);
    }
}, seconds: 60);
```
---
Exceptions: Ticks that perform only pure in-memory operations (no I/O) with no risk of exceptions may omit try/catch, though defensively wrapping is still best practice.
---
Consequences Of Violation: Worker crashes from tick exceptions, reduced worker pool capacity, throughput degradation, false-positive alerts from worker restarts.

## Use distinct tick names across all providers to avoid duplicate registration
---
Category: Maintainability
---
Assign unique, descriptive names to each tick callback and verify no tick name is used in more than one service provider.
---
Reason: If two providers register a tick with the same name, both closures are registered under the same name, and both execute on the tick interval. This causes duplicate work — cache warming runs twice, metrics are flushed twice, GC collection executes twice. Beyond wasted CPU, duplicate ticks can cause data corruption (duplicate log entries, double-decrementing counters, cache stampedes from double-clearing).
---
Bad Example:
```php
// Two providers register tick named "metrics:flush" — runs twice
// Provider A: Octane::tick('metrics:flush', fn() => flushMetrics());
// Provider B: Octane::tick('metrics:flush', fn() => flushMetrics());
```

Good Example:
```php
// Unique tick names across all providers
// Provider A: Octane::tick('metrics:flush', fn() => flushMetrics());
// Provider B: Octane::tick('metrics:aggregate', fn() => aggregateMetrics());
```
---
Exceptions: None. Tick names must be globally unique within the application.
---
Consequences Of Violation: Duplicate tick execution doubling workload, potential data corruption from repeated operations, wasted CPU and I/O.
