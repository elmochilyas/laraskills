# Memory Profiling and Observability

## Rule Name
Track per-request memory delta on every request.
---
## Category
Performance | Reliability
---
## Rule
Always capture `memory_get_usage()` at both `RequestReceived` and `RequestTerminated`, and log the delta.
---
## Reason
Consistent positive deltas are the earliest indicator of a memory leak. Without both start and end measurements, the delta is meaningless and accumulation goes undetected.
---
## Bad Example
```php
// Only logging memory at end of request
Event::listen(RequestTerminated::class, function ($event) {
    Log::debug('Memory used: '.memory_get_usage());
});
```
---
## Good Example
```php
Event::listen(RequestReceived::class, function ($event) {
    $event->request->attributes->set('_mem_start', memory_get_usage());
});

Event::listen(RequestTerminated::class, function ($event) {
    $start = $event->request->attributes->get('_mem_start');
    Log::channel('memory')->debug('Memory delta', [
        'delta' => memory_get_usage() - $start,
        'baseline' => memory_get_usage(true),
    ]);
});
```
---
## Exceptions
Development or local environments where worker lifecycle is too short for meaningful analysis.
---
## Consequences Of Violation
Leaks silently grow until OOM crashes; investigation starts too late without trend data.

---

## Rule Name
Monitor baseline trend, not instantaneous memory.
---
## Category
Performance | Reliability
---
## Rule
Always track worker memory baseline (idle memory between requests) over time, rather than reacting to absolute memory values.
---
## Reason
A worker at 100MB is fine if stable. A worker growing from 50MB to 100MB to 150MB has a leak. Baseline trend reveals accumulation; instantaneous usage is contextless.
---
## Bad Example
```php
// Alerting on absolute threshold alone
if (memory_get_usage(true) > 100 * 1024 * 1024) {
    alert('High memory!');
}
```
---
## Good Example
```php
Octane::tick('memory-monitor', function () {
    Metrics::gauge('worker_memory_baseline', memory_get_usage(true));
    Metrics::gauge('worker_memory_delta_avg', $recentDeltasAverage);
    Metrics::gauge('worker_gc_roots', gc_status()['roots']);
}, 60);
```
---
## Exceptions
Initial capacity planning when no baseline history exists yet.
---
## Consequences Of Violation
Wasted investigation on normal high memory usage; real accumulation goes unnoticed until OOM.

---

## Rule Name
Use `memory_get_usage(false)` for actual usage, `true` for OS allocation.
---
## Category
Performance | Reliability
---
## Rule
Use `memory_get_usage(false)` when measuring per-request deltas and actual reclamation. Use `memory_get_usage(true)` when tracking OS-level baseline which only ever grows.
---
## Reason
`false` shows PHP's actual memory usage which Zend MM can free and reuse. `true` shows OS-level allocation that never shrinks — using `true` for deltas always produces misleading positive values.
---
## Bad Example
```php
$delta = memory_get_usage(true) - $startReal;
// OS allocation never shrinks — delta is always positive or zero
```
---
## Good Example
```php
$delta = memory_get_usage(false) - $startActual;
$osBaseline = memory_get_usage(true);
```
---
## Exceptions
When specifically investigating OS-level fragmentation or RSS growth.
---
## Consequences Of Violation
False positive leak signals; engineers chase phantom leaks caused by measurement methodology.

---

## Rule Name
Use structured logging over ad-hoc metrics for memory data.
---
## Category
Maintainability
---
## Rule
Prefer structured logging of memory metrics over `var_dump()`, `dd()`, or print statements when profiling memory in production.
---
## Reason
Structured logs enable post-hoc analysis, correlation with request context (URL, method, user), and integration with centralized observability platforms.
---
## Bad Example
```php
var_dump(memory_get_usage()); // Live production traffic — unparseable
```
---
## Good Example
```php
Log::channel('memory')->debug('Memory profile', [
    'delta' => $delta,
    'url' => $request->fullUrl(),
    'method' => $request->method(),
    'worker_id' => getmypid(),
]);
```
---
## Exceptions
Local debugging in a development environment.
---
## Consequences Of Violation
Memory data is lost or unsearchable; root cause analysis becomes manual and slow.

---

## Rule Name
Inspect GC root counts as a leading leak indicator.
---
## Category
Performance | Reliability
---
## Rule
Monitor `gc_status()['roots']` periodically — a growing root count indicates circular references the garbage collector has not yet collected.
---
## Reason
PHP's GC scans root buffers during collection cycles. Growing roots mean accumulating circular references, which is a common leak pattern in long-running processes.
---
## Bad Example
```php
// Never checking GC status
```
---
## Good Example
```php
Octane::tick('gc-monitor', function () {
    $status = gc_status();
    Metrics::gauge('gc_roots', $status['roots']);
    Metrics::gauge('gc_collected', $status['collected'] ?? 0);
    Metrics::gauge('gc_memory_freed', $status['memory_freed'] ?? 0);
}, 60);
```
---
## Exceptions
PHP < 8.2 lacks `memory_freed` and `collected_percentage` fields; basic root count is still available.
---
## Consequences Of Violation
Circular reference accumulation goes undetected; memory grows silently until OOM.

---

## Rule Name
Limit profiling tool overhead in production.
---
## Category
Performance | Security
---
## Rule
Never enable Blackfire, Telescope, and custom memory logging simultaneously in production — the combined profiling overhead can push workers past `memory_limit`.
---
## Reason
Blackfire continuous profiling adds ~2% CPU. Telescope watchers add 1-5ms per request. Custom logging adds I/O. Stacking them under high load creates 10%+ overhead that accelerates OOM.
---
## Bad Example
```php
// config/telescope.php — all watchers enabled
'watchers' => [
    RequestWatcher::class,
    CacheWatcher::class,
    QueryWatcher::class,
    MailWatcher::class,
    ExceptionWatcher::class,
    LogWatcher::class,
    GateWatcher::class,
    EventWatcher::class,
],
// Plus Blackfire profiling, plus custom per-request logging
```
---
## Good Example
```php
// Enable only essential watchers in production
'watchers' => [
    RequestWatcher::class,
    ExceptionWatcher::class,
    // Enable others only in staging/development
],
// Stagger profiling tools — never all at once
```
---
## Exceptions
Load testing or staging environments where profiling overhead is the specific measurement target.
---
## Consequences Of Violation
Workers OOM faster due to self-inflicted profiling overhead; profiling tool becomes the leak source.

---

## Rule Name
Cache static property reflection results.
---
## Category
Performance
---
## Rule
Cache class lists and only diff changed classes when running reflection-based static property scanning.
---
## Reason
Full reflection on all declared classes takes 1-3 seconds and is prohibitively expensive to run on every request. Running it as a background job or on-demand avoids blocking the request cycle.
---
## Bad Example
```php
// Running full static scan on every request
$classes = get_declared_classes();
foreach ($classes as $class) {
    $ref = new ReflectionClass($class); // 1-3s on every request
}
```
---
## Good Example
```php
// Run as artisan command, not inline
// php artisan audit:static-properties
$cached = Cache::get('declared_classes', []);
$current = get_declared_classes();
$diff = array_diff($current, $cached);
// Reflect only on diff
Cache::put('declared_classes', $current, 3600);
```
---
## Exceptions
First-run population of the cache when no previous snapshot exists.
---
## Consequences Of Violation
Request latency spikes of 1-3s; reduced throughput from CPU-bound reflection work.
