# Standardized Knowledge: GC Telemetry and Root Buffer

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | GC Telemetry and Root Buffer Monitoring — gc_status(), Collection Frequency |
| Difficulty | Intermediate |
| Lifecycle | Monitor, Debug |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

`gc_status()` provides real-time insight into garbage collector state: root buffer size, collection frequency, and collected cycles. Monitoring these metrics in production reveals whether circular references are accumulating, whether the GC is triggering too frequently (wasting CPU), or whether memory is growing unbounded. For long-running Octane/Swoole workers, GC telemetry is essential for preventing memory leaks.

## Core Concepts

- **gc_status() output**: `{ running: bool, protected: bool, full: bool, buffer_size: int, running_time: float, collected: int, roots: int, threshold: int, application_time: float, collector_time: float }`
- **Root buffer entries**: Number of potential cycle roots currently tracked. If growing monotonically, GC may be disabled or cycles may be forming faster than collection.
- **Collection frequency**: `gc_status()['collected']` — total cycles collected since process start. Rapid growth indicates cycle-heavy code patterns.
- **collector_time vs application_time**: Ratio of GC time to application time. >5% GC time indicates excessive cycles or too-frequent collection.

## When To Use

- Monitoring memory health of long-running PHP workers (Octane, Swoole, FrankenPHP)
- Debugging unexplained RSS growth in production
- Tuning GC threshold and collection frequency
- Validating that memory leak fixes are effective
- Setting up production alerts for memory leak detection

## When NOT To Use

- In PHP-FPM where GC state resets per request (metrics reset on each request)
- For short-lived CLI scripts where GC never triggers
- As a substitute for proper memory profiling (use Blackfire/SPX for deep analysis)

## Best Practices

- **Monitor in Octane workers**: Log gc_status() every N requests. Alert if root_buffer_entries > 5000 or collector_time/application_time > 5%.
- **Track trends, not absolutes**: Root buffer entries growing over time = leak. Stable or cycling = healthy.
- **Compare across workers**: Inconsistent root buffer growth across workers indicates a request-order-dependent leak.
- **Log at worker start as baseline**: Capture gc_status() once to know baseline "roots" and "collected" counters.

## Architecture Guidelines

- **FPM vs Octane monitoring**: In FPM, GC state resets per request so per-request monitoring is meaningless. Monitor process-level RSS instead. In Octane, gc_status() accumulates and is meaningful.
- **Root buffer capacity planning**: Default threshold is 10,000 entries. If collector_time/application_time > 5%, raise threshold or investigate cycle formation.
- **Combined with RSS tracking**: Cross-reference gc_status()['roots'] with worker RSS. If RSS grows but roots stay flat, the leak is not from cycles (likely static property or closure accumulation).

## Performance Considerations

- Reference counting overhead: each zval assignment/deletion manipulates refcount; hot loops see measurable CPU cost
- GC collection pauses execution for 1-10ms depending on root buffer size and number of cycles
- Copy-on-write: array/string modification triggers duplication; use SplFixedArray for large fixed-size arrays
- Zend MM uses per-request heap; persistent allocator reduces fragmentation in long-running processes
- WeakReference resolution requires hash table lookup (~0.1µs); negligible for occasional use

## Security Considerations

- gc_status() exposes internal memory state. In multi-tenant environments, restrict access to this function.
- Root buffer growth patterns could theoretically leak information about request processing patterns.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not monitoring GC in long-running workers | FPM habit | Cycle accumulation goes undetected until OOM | Log gc_status() every N requests |
| Reading gc_status() once in FPM | One-shot check | Metrics reset per request, meaningless | Monitor process RSS instead |
| Alerting on absolute root count | No baseline | False positives on first request | Track rate of change over time |
| Ignoring collector_time ratio | Only checking roots | Misses excessive GC CPU usage | Alert if >5% of application time |

## Anti-Patterns

- **Checking gc_status() only during incidents**: By the time RSS is alarming, cycles have been accumulating for hours. Monitor continuously.
- **Assuming gc_status()['collected'] = 0 means no leaks**: Cycles may exist that GC hasn't detected yet. Root buffer may not have filled.
- **Setting and forgetting threshold**: As application evolves, cycle patterns change. Review GC telemetry weekly after major deploys.

## Examples

```php
<?php
// Octane GC monitoring middleware
$gcCheck = function ($request, $next) {
    $response = $next($request);
    
    static $requestCount = 0;
    $requestCount++;
    
    if ($requestCount % 100 === 0) {
        $status = gc_status();
        $ratio = $status['collector_time'] / max($status['application_time'], 1);
        
        Log::channel('gc')->info('GC status', [
            'roots' => $status['roots'],
            'collected' => $status['collected'],
            'gc_time_ratio' => round($ratio * 100, 2),
            'protected' => $status['protected'],
            'worker_pid' => getmypid(),
        ]);
        
        if ($status['roots'] > 5000) {
            Log::warning('High root buffer detected', ['roots' => $status['roots']]);
        }
        
        if ($ratio > 0.05) {
            Log::warning('High GC overhead', ['ratio' => $ratio]);
        }
    }
    
    return $response;
};
```

## Related Topics

- Cyclic GC Algorithm
- gc_collect_cycles() Strategic Calling
- Memory Leak Detection Patterns
- GC Enable/Disable Patterns

## AI Agent Notes

- gc_status() is the primary tool for GC observability in PHP. Essential for Octane/Swoole.
- In PHP-FPM, gc_status() resets per request — monitor process RSS instead.
- collector_time / application_time > 5% = excessive GC. Investigate cycle formation.
- Monotonic root buffer growth in a worker = memory leak from accumulating cycles.
- PHP 8.5 reduced false-positive GC runs, making GC telemetry cleaner.
- Cross-reference gc_status() with RSS monitoring for complete picture.

## Verification

- [ ] GC telemetry logging configured in production (Octane/Swoole workers)
- [ ] Alert threshold defined for root_buffer_entries > 5000
- [ ] Alert threshold defined for collector_time > 5% of application_time
- [ ] Baseline gc_status() captured at worker start
- [ ] RSS monitoring cross-referenced with GC telemetry
- [ ] Review cycle established for weekly GC telemetry checks
