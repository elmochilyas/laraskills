# Standardized Knowledge: Memory Leak Detection Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Memory Leak Detection Patterns — Growing Static Collections, Closure Accumulation, Checkpointing |
| Difficulty | Intermediate |
| Lifecycle | Debug, Monitor |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Memory leaks in PHP manifest as **monotonically increasing memory usage** over time — worker RSS grows from ~65MB at start to ~120MB+ after 12 hours. The three most common patterns are: **growing static collections** (arrays or objects stored on static properties), **closure accumulation** (closures capturing scope variables in listeners/callbacks), and **circular references** not collected by the GC (usually from third-party libraries not using WeakReference).

## Core Concepts

- **Growing static collections**: `public static array $cache = []` that never clears. Each request adds entries. Over 10,000 requests = 10,000 entries. Fix: LRU-size-bound caches or WeakReference-based caches.
- **Closure accumulation**: Event listeners registered per-request but never removed. Each closure captures scope variables, preventing their memory from being freed. Fix: register listeners at boot time (Octane), not per-request (FPM).
- **Circular reference leaks**: Complex object graphs where GC cannot determine reachability. Rare but catastrophic. Fix: audit with memory profiling, use WeakReference.
- **Checkpoint technique**: `memory_get_usage()` at request boundaries. If baseline increases by >5% over 1000 requests, a leak exists. `memory_get_peak_usage()` shows worst-case allocation.

## When To Use

- Debugging unexplained RSS growth in production workers
- Pre-deployment audit for Octane/Swoole migration
- Investigating OOM kills in PHP-FPM or Octane
- Routine performance health check for long-running processes

## When NOT To Use

- For short-lived CLI scripts (memory freed at process end)
- When profiling CPU performance (use Xdebug/Blackfire instead)
- As a substitute for proper GC monitoring (cross-reference with gc_status())

## Best Practices

- **Memory leak triage**: 1) Check if baseline RSS increases over time, 2) Use `gc_collect_cycles()` to rule out cycle accumulation, 3) Profile with memory-focused tools (Blackfire, SPX), 4) Binary search: disable half the codebase, test, repeat.
- **Don't just recycle, fix the leak**: pm.max_requests masks leaks but doesn't fix them. At scale, constant worker recycling (~200ms spawn overhead) adds significant CPU cost.
- **Checkpoint memory at request boundaries**: Log `memory_get_usage()` at start and end of each request. Rising baseline across requests = leak.
- **Binary search debugging**: Disable half the service providers. If leak stops, it's in that half. Repeat to isolate.

## Architecture Guidelines

- **Static property audit**: Search codebase for `static` properties. Each must be justified as intentionally shared state or eliminated. `grep -r "static \$" app/` — expect zero results for request-scoped data in Octane.
- **Closure lifecycle**: In Octane, closures registered in service provider boot() persist across requests. Ensure closures don't capture request-scoped variables.
- **WeakReference for caches**: Cache maps should use WeakReference as values, allowing objects to be freed when no longer externally referenced.

## Performance Considerations

- Reference counting overhead: each zval assignment/deletion manipulates refcount; hot loops see measurable CPU cost
- GC collection pauses execution for 1-10ms depending on root buffer size and number of cycles
- Copy-on-write: array/string modification triggers duplication; use SplFixedArray for large fixed-size arrays
- Zend MM uses per-request heap; persistent allocator reduces fragmentation in long-running processes
- WeakReference resolution requires hash table lookup (~0.1µs); negligible for occasional use

## Security Considerations

- State leaks between requests can expose sensitive data (e.g., user A sees user B's database results)
- Static property caches may retain PII across requests if not properly scoped
- In multi-tenant Octane, one tenant's memory leak can cause OOM affecting all tenants

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Assuming pm.max_requests solves memory leaks | Relying on recycling | Worker restart overhead at scale | Fix the root cause |
| Not checking static property accumulation | FPM habit | In Octane, these persist across requests | Search for static in codebase |
| Registering listeners per-request | Copying FPM patterns | Listener array grows unbounded | Register at boot in Octane |
| Ignoring vendor package leaks | Third-party trust | Hard-to-diagnose RSS growth | Profile to isolate package code |
| Not using checkpoint technique | No baseline | Leak detected only after OOM | Log memory_usage at boundaries |

## Anti-Patterns

- **Relying solely on pm.max_requests**: Worker recycling hides the symptom but wastes CPU on constant restarts. Fix the leak.
- **Adding memory_limit as the only defense**: Hard limit prevents OOM kill but causes 500 errors. Detect leaks early.
- **Blindly adding gc_collect_cycles()**: If leak is from static properties, not cycles, GC collection won't help. Profile first.

## Examples

```php
<?php
// Memory checkpoint in Octane middleware
$memoryCheck = function ($request, $next) {
    static $baseline = null;
    static $requestCount = 0;
    
    $usageBefore = memory_get_usage(true);
    $response = $next($request);
    $usageAfter = memory_get_usage(true);
    
    if ($baseline === null) {
        $baseline = $usageAfter;
    }
    
    $requestCount++;
    $drift = $usageAfter - $baseline;
    
    if ($requestCount % 100 === 0) {
        Log::channel('memory')->info('Memory drift', [
            'baseline' => $baseline,
            'current' => $usageAfter,
            'drift' => $drift,
            'requests' => $requestCount,
            'request_delta' => $usageAfter - $usageBefore,
        ]);
        
        if ($drift > $baseline * 0.2) {
            Log::warning('Memory leak suspected', [
                'drift_percent' => round($drift / $baseline * 100, 2)
            ]);
        }
    }
    
    return $response;
};
```

## Related Topics

- GC Telemetry and Root Buffer Monitoring
- Memory Drift Detection and Mitigation
- PM Max Requests Tuning
- Static Property Audit Methodology

## AI Agent Notes

- Three main leak patterns: static collections, closure accumulation, circular references.
- In PHP-FPM, memory is freed per-request — leaks are less visible. In Octane, they accumulate.
- pm.max_requests masks leaks but doesn't fix them — worker restart overhead is real.
- Checkpoint technique: log memory_get_usage() at request boundaries to detect drift.
- Binary search debugging: disable half the codebase to isolate leak source.
- Cross-reference with gc_status() to determine if leak is from cycles vs static data.

## Verification

- [ ] Memory checkpoint logging configured at request boundaries
- [ ] Static property audit completed for Octane migration
- [ ] pm.max_requests set but not relied upon as leak solution
- [ ] Closure accumulation checked in service provider boot() methods
- [ ] Binary search procedure documented for leak isolation
- [ ] Alert threshold defined for >20% RSS drift over 1000 requests
