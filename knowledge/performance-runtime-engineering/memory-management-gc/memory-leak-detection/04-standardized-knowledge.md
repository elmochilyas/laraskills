# Memory Leak Detection — Growing Static Collections, Closure Accumulation, Checkpointing, Profiling

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Memory Leak Detection — Growing Static Collections, Closure Accumulation, Checkpointing, Profiling |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Memory leaks in PHP manifest as monotonically increasing memory usage over time — worker RSS grows from ~65MB at start to ~120MB+ after 12 hours in persistent workers (Octane, Swoole, FrankenPHP). The three most common leak patterns are: **growing static collections** (arrays stored on static properties that never clear), **closure accumulation** (closures capturing scope variables in listeners/callbacks registered per-request), and **circular references** not collected by the GC. Detection relies on checkpointing memory at request boundaries, monitoring RSS trends, and profiling with memory-focused tools.

## Core Concepts

- **Growing static collections**: `public static array $cache = []` that accumulates entries per-request. Over 10,000 requests → 10,000 entries consuming growing memory. Fix: LRU-size-bound caches or WeakReference-based caches.
- **Closure accumulation**: Event listeners registered per-request but never removed. Each closure captures scope variables, preventing their memory from being freed. Fix: register listeners at boot time (Octane), not per-request (FPM).
- **Circular reference leaks**: Complex object graphs where GC cannot determine reachability. Rare but catastrophic. Fix: audit with memory profiling, use WeakReference.
- **Checkpoint technique**: `memory_get_usage()` at request boundaries. If baseline increases by >5% over 1000 requests, a leak exists. `memory_get_peak_usage()` shows worst-case allocation per request.
- **RSS monitoring**: Track process RSS via `ps` or `/proc/pid/status`. Worker RSS includes heap, stack, and shared libraries. Most reliable indicator of total memory usage.
- **Memory profiler**: Tools like Blackfire, SPX, and Tideways can profile memory allocation per function call, identifying leak sources.

## When To Use

- You are running Octane, Swoole, or FrankenPHP in production and monitoring worker memory growth.
- You have noticed workers being restarted frequently (indicates OOM or max_requests exhaustion due to leaks).
- You are diagnosing a gradual performance degradation over hours or days.
- You are migrating from PHP-FPM to Octane and need to audit for memory safety.
- You are developing long-running CLI daemons or queue workers.

## When NOT To Use

- You use PHP-FPM with default `pm.max_requests` — memory leaks reset per worker restart.
- Your application has been running stably for weeks with no memory growth.
- You are just optimizing and haven't observed any memory-related issues.
- You haven't set up basic monitoring (RSS, gc_status()) to detect leaks.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Monitor worker RSS over time | RSS is the single best indicator of memory leaks. Track at request boundaries. Alert on >10% growth over 1000 requests. |
| Use checkpointing for per-request memory tracking | `memory_get_usage()` before/after each request shows per-request allocation. If baseline increases, a leak exists. |
| Run `gc_collect_cycles()` before measuring memory | Removes collectable cycles so checkpointing measures stable memory, not GC-deferred garbage. |
| Profile with memory-focused tools | Blackfire and SPX can trace memory allocation to specific code paths. Use for targeted leak investigation. |
| Set `max_requests` as a safety net | Workers recycle before leaks cause OOM. This masks leaks but prevents crashes. |
| Use `$app->forgetInstance()` for request-scoped singletons in Octane | Clears singleton instances that would otherwise persist across requests. |
| Audit static properties with automated tools | PHPStan and Larastan include rules for detecting Octane-unsafe static property usage. |

## Architecture Guidelines

- **Checkpoint workflow**: Record `memory_get_usage(true)` at the start of each request → process → record at end → log delta. Track the baseline (memory after GC at request end). A rising baseline indicates a leak.
- **RSS tracking workflow**: Monitor `/proc/<pid>/status` or `ps -o rss` for each worker. Plot RSS over time. A linear trend indicates a leak; a flat trend indicates stability.
- **Leak triage**: 1) Confirm the leak with checkpointing, 2) Isolate by disabling code sections, 3) Use memory profiler to identify the source, 4) Apply fix (bound cache, remove listener, use WeakReference), 5) Verify fix with checkpointing.
- **Binary search method**: Disable half the application's services/providers → test if leak persists → narrow down to the responsible component → inspect that component for common patterns.
- **Octane-specific auditing**: Use `octane:watch` during development to detect state leaks. Run `php artisan octane:profile-memory` to identify service providers that consume excessive memory.

## Performance Considerations

- Memory checkpointing overhead: `memory_get_usage()` takes ~0.5–1µs per call. Negligible. Enable in production.
- RSS monitoring overhead: reading `/proc/pid/status` is a syscall taking ~1–5µs. Batch reads across workers.
- Memory profiler overhead: tools like SPX add 5–15% overhead when actively profiling. Use in staging or for targeted investigations only.
- Leak detection cost: the cost of detection (checkpointing, monitoring) is orders of magnitude lower than the cost of an undetected OOM crash.
- Worker recycling cost: each worker restart costs ~200ms spawn overhead + 10–40ms bootstrap. Recycling too frequently (every 100 requests) adds 0.1–0.4% overhead.

## Security Considerations

- Data leakage: memory leaks can retain sensitive data from previous requests. User A's data may remain in worker memory when User B's request runs. This is the primary security concern of memory leaks in Octane.
- OOM attacks: an attacker may intentionally trigger memory leaks (by repeatedly hitting leaky endpoints) to cause OOM and denial of service. Rate limiting helps but leak fixing is the real solution.
- Checkpoint logging: logs containing `memory_get_usage()` values are safe. Avoid logging request data in memory monitoring logs.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Using `memory_get_usage(false)` instead of `true` | `false` (default) returns real memory usage, including memory that Zend MM hasn't freed to the OS. | Not understanding the difference between real and internal memory. | Apparent leaks that are just Zend MM cache. | Use `true` (real usage) for leak detection. |
| Assuming `pm.max_requests` solves the problem | Worker recycling masks leaks but doesn't fix them. | Leaks still cause performance degradation and wasted resources. | At scale, the overhead of constant worker recycling adds up — each restart costs ~200ms. | Fix the leak, don't just recycle around it. |
| Not calling `gc_collect_cycles()` before measurement | GC-deferred cycles appear as "leaked" memory that isn't actually leaked. | Not accounting for GC collection state. | False positive leak detection. | Call `gc_collect_cycles()` before every checkpoint measurement. |
| Profiling with Xdebug in production | Xdebug's memory profiler adds 50–200% overhead. | Using the only available profiler without considering alternatives. | Production performance severely degraded. | Use SPX or Blackfire for production memory profiling. |

## Anti-Patterns

- **Memory leak denial**: "Workers always grow a bit, it's normal." Linear growth is not normal. Any sustained memory increase in a stable application indicates a leak.
- **Reactive leak detection**: Waiting until workers OOM before investigating. Proactive monitoring catches leaks when they are small and easy to fix.
- **One-size-fits-all max_requests**: Using the same `max_requests` value for all apps without measuring memory growth. Calibrate based on observed RSS trends.
- **Ignoring memory in development**: "It works on my machine" — development machines don't handle millions of requests. Test memory stability under load in staging.

## Examples

```php
// Memory checkpoint middleware for Octane
class MemoryCheckpointMiddleware
{
    private int $baseline = 0;

    public function handle($request, Closure $next)
    {
        gc_collect_cycles();
        $start = memory_get_usage(true);
        
        $response = $next($request);
        
        gc_collect_cycles();
        $end = memory_get_usage(true);
        $delta = $end - $start;
        
        if ($this->baseline === 0) {
            $this->baseline = $end;
        }
        
        $leak = $end - $this->baseline;
        if ($leak > 5 * 1024 * 1024) { // 5MB leak
            Log::warning("Memory leak suspected: +$leak bytes from baseline");
        }
        
        return $response;
    }
}
```

```php
// RSS monitoring
$pid = getmypid();
$status = file_get_contents("/proc/$pid/status");
preg_match('/VmRSS:\s+(\d+)\s+kB/', $status, $matches);
$rssKB = (int) $matches[1];
```

## Related Topics

- GC Telemetry and Root Buffer Monitoring
- Efficient Data Structures for Memory
- Octane Memory Management
- Memory Limit Configuration
- Persistent vs Per-Request Allocators

## AI Agent Notes

- Memory leak detection is the single most important operational skill for Octane/Swoole/FrankenPHP deployments. Without it, memory leaks go undetected until OOM kills workers.
- The checkpoint technique (memory before/after each request) is the simplest and most effective detection method. Implement it as middleware for automatic coverage.
- RSS tracking over time is more reliable than memory_get_usage() because it includes all memory (PHP heap + extensions + libraries). Plot RSS on a dashboard for visual leak detection.
- Most Octane memory leaks are caused by service providers registering listeners per-request (instead of using Octane::booted()). This is easy to fix once identified.

## Verification

- [ ] Implement memory checkpoint middleware and verify it logs baseline and deltas.
- [ ] Set up RSS monitoring for workers: track over 1-hour soak test.
- [ ] Run `php artisan octane:profile-memory` (Octane) in development.
- [ ] Enable `octane:watch` during development to detect state leaks.
- [ ] Verify no baseline increase over 1000 requests in a soak test.
- [ ] Test with known leak pattern (static array accumulation) and verify detection.
- [ ] Document the memory monitoring setup and alerting thresholds.
