# Memory Profiling and Observability

## Metadata
- **ID:** ku-10-long-running-memory-leak
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Overview
Memory profiling in Octane and queue workers is fundamentally different from PHP-FPM profiling. In PHP-FPM, memory is allocated per-request and freed when the process dies. In long-running processes, memory accumulates, leaks grow, and the profile changes over thousands of requests. Observability requires tracking memory across request boundaries, identifying growth trends, and pinpointing the sources of accumulation. This KU covers tools (Blackfire, Telescope, Xdebug, custom scripts), metrics to monitor, and strategies for establishing memory observability in production.

## Core Concepts
- **Baseline Memory**: Memory footprint of an idle worker after booting Laravel but before handling any requests. Typically 30-50MB. Memory should return near this value after each request.
- **Per-Request Delta**: Difference in worker memory before and after handling a single request. Consistent positive deltas = accumulation.
- **Accumulation Rate**: Average memory growth per request (MB/request). Calculated: `(memory_after_N_requests - memory_after_0_requests) / N`.
- **Terminating Callback Accumulation**: Callbacks registered via `register_shutdown_function()`, `Blade::directive()`, `Collection::macro()`, event listeners never removed. These accumulate in static arrays.
- **Observable State**: Set of application state that can be inspected at runtime without modifying the application.

## When To Use
- **Pre-Octane deployment**: Establish memory baseline before migrating to Octane.
- **OOM incident response**: When workers crash with memory exhaustion, profiling identifies the source.
- **Capacity planning**: Determine optimal `max_requests` based on accumulation rate.
- **Post-deployment monitoring**: Continuous observability to detect regressions.
- **Queue worker optimization**: Profile queue workers for memory growth patterns.

## When NOT To Use
- **PHP-FPM only apps**: Memory is freed per-request — profiling is for performance, not leak detection.
- **Development environment**: Worker lifecycle is too short for meaningful accumulation analysis.
- **Single-request profiling**: One snapshot tells you nothing about accumulation trends.

## Best Practices (WHY)
- **Track baseline, not just current usage**: A worker using 100MB is fine if stable. One that grows from 50MB to 100MB to 150MB has a leak. *Why: Baseline trend shows accumulation; instantaneous usage is contextless.*
- **Log per-request memory delta**: Register `RequestReceived` to record `$start = memory_get_usage()` and `RequestTerminated` to log the delta. *Why: Consistent positive deltas are the earliest indicator of a leak.*
- **Use `memory_get_usage(false)` for actual usage, `true` for OS allocation**: `false` shows what PHP is actually using; `true` shows OS-level allocation which only grows. *Why: `true` shows OS allocation that never shrinks; `false` shows actual reclamation.*
- **Cache static property reflection results**: Reflecting on all classes for static property scanning is slow (1-3s). Cache and diff only changed classes. *Why: Running full reflection on every request is prohibitively expensive — run as background job or on-demand.*

## Architecture Guidelines
- **`memory_get_usage()` over `xdebug_memory_usage()`**: Available without extension; sufficient for trend detection.
- **Real usage (`true`) for baseline**: Shows OS-level allocation; real_usage only increases, making leaks obvious.
- **Structured logging over metrics**: Allows post-hoc analysis and correlation with request context.
- **Telescope integration over custom tool**: Reduces toolchain complexity; Telescope already deployed.

## Performance
- `memory_get_usage()`: Extremely fast (~0.001ms). Log freely.
- Reflection-based static property scanning: Slow. Cache class lists and diff only changed classes.
- Blackfire continuous profiling: Samples at 100ms intervals; ~2% CPU overhead continuously.
- Telescope watchers: ~1-5ms per request. Enable only relevant watchers.
- GC collection: Manual `gc_collect_cycles()` forces full scan. Use only when root count is high.

## Security
- **Profiling overhead death**: Enabling Blackfire, Telescope, and custom logging simultaneously adds 10%+ overhead. Under high load, pushes worker over memory_limit.
- **False positive leak alert**: Memory spike from legitimate operation (large file download, report generation) triggers alert. Team wastes hours investigating normal behavior.
- **Blind spot in profiling**: The profiling tool itself stores data in a static array — becomes the source of the leak.
- **Metric deluge**: Logging memory on every request for 100 workers × 500 requests/min = 50,000 log entries/minute.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Measuring only at request end | No start baseline | Delta is meaningless | Always capture start-of-request baseline |
| Confusing high memory with leak | Stable 100MB is fine; growing to 150MB is not | Wasted investigation on normal usage | Track trend, not absolute value |
| Not accounting for Zend MM internals | `memory_get_usage(true)` shows OS allocation | OS allocation never shrinks | Use `false` for actual usage; `true` for baseline |
| Forgetting opcache preloaded classes | Preloaded classes increase baseline | Stable baseline despite opcache ≠ no leak | Differentiate preloaded from accumulated |

## Anti-Patterns
- **Single-point-in-time snapshots**: Taking one memory snapshot and declaring "no leak." Accumulation is a trend, not a point.
- **Profiling tool as leak source**: The monitoring tool itself accumulates data in static arrays. Telescope watchers are known to leak if not configured for Octane.
- **Manual memory inspection in production**: Running `var_dump(memory_get_usage())` on live traffic. Use structured logging or metrics.
- **Ignoring GC statistics**: `gc_status()` shows root count — growing roots indicate circular references that the GC hasn't collected.

## Examples

```php
// Per-request memory delta tracking
Event::listen(RequestReceived::class, function ($event) {
    $event->request->attributes->set('_mem_start', memory_get_usage());
});

Event::listen(RequestTerminated::class, function ($event) {
    $start = $event->request->attributes->get('_mem_start');
    $delta = memory_get_usage() - $start;
    $baseline = memory_get_usage(true);
    
    Log::channel('memory')->debug('Memory delta', [
        'delta' => $delta,
        'baseline' => $baseline,
        'url' => $event->request->fullUrl(),
        'method' => $event->request->method(),
    ]);
});

// Tick-based baseline monitoring
Octane::tick('memory-monitor', function () {
    Metrics::gauge('worker_memory_baseline', memory_get_usage(true));
    Metrics::gauge('worker_memory_usage', memory_get_usage());
    Metrics::gauge('worker_gc_roots', gc_status()['roots']);
}, 60);

// Static property scanner (run as artisan command)
$classes = get_declared_classes();
foreach ($classes as $class) {
    $ref = new ReflectionClass($class);
    foreach ($ref->getStaticProperties() as $name => $value) {
        if (is_array($value) && count($value) > 1000) {
            Log::warning("Large static array: {$class}::{$name} has " . count($value) . " entries");
        }
    }
}
```

## Related Topics
- **Singleton State Leaks**: The leaks to profile.
- **Static Property Accumulation**: The main source of growth.
- **Octane Lifecycle Hooks**: Hooks for pre/post request measurement.
- **Octane Configuration and Workers**: max_requests as leak safety valve.
- **Octane Package Compatibility**: Profiling package memory behavior.

## AI Agent Notes
- `php-meminfo` (by Facebook) can dump the entire PHP heap and analyze it offline. Useful for deep leak investigations but requires 5-10s per dump.
- Blackfire's Octane integration was improved in 2023. It now correctly handles coroutine context in Swoole and sandbox lifecycle.
- PHP 8.2+ improved `gc_status()` to include `'collected_percentage'` and `'memory_freed'` fields, making GC observability easier without custom instrumentation.
- Research question: Could a PHP extension provide per-request memory reset (like a lightweight worker fork + CoW)? Similar to uWSGI's "emperor" mode for Python.
- The OpenTelemetry PHP SDK can be used to export memory metrics as spans/metrics. Not yet widely adopted in Laravel Octane ecosystem.

## Verification
- [ ] Log `memory_get_usage()` before and after each request — calculate delta
- [ ] Set up a baseline trend tracker — log baseline after every 100 requests
- [ ] Run GC status check: `gc_status()` — monitor roots count over time
- [ ] Deploy Blackfire or Telescope for continuous profiling in staging
- [ ] Set up Grafana dashboard with worker memory panels
- [ ] Configure alerts: (a) delta >5MB consistently, (b) baseline >20% increase over 1000 requests
- [ ] Run static property scanner to identify growing arrays
