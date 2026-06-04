# GC CPU Overhead

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | GC CPU Overhead |
| Difficulty | Intermediate |
| Last Updated | 2026-06-04 |

## Overview

PHP's cycle-detecting garbage collector scans the root buffer to find and free circular references. Each scan iterates over all registered zvals and marks candidate cycles — an O(n) operation proportional to the number of root buffer entries. On workloads with few or no circular references (typical in PHP-FPM request-scoped code), this scanning consumes 1-5% of CPU with no benefit. On persistent runtimes (Octane, Swoole) where circular references accumulate across requests, the cost can reach 5-15% of CPU. Understanding GC CPU overhead means knowing when to disable GC, when to tune its threshold, and when to fix the circular references that inflate the root buffer.

## Core Concepts

- **gc_collect_cycles()**: The CPU cost is proportional to the number of zvals in the root buffer, not the number of cycles found. Scanning 10,000 roots costs the same whether 0 or 100 cycles are collected.
- **gc_status()**: PHP 7.3+ provides `gc_status()` returning `runs`, `collected`, `threshold`, and `roots`. Monitor `collected / runs` ratio; a low ratio means GC runs are wasted.
- **gc_probability (default 1)**: Probability (out of 1000) that GC runs after every `gc_divisor` allocations. Default 1/1000 = 0.1% chance per allocation. For some workloads, even this rate triggers too-frequent scanning.
- **Root buffer entries**: Each circular reference or object with cyclic dependencies adds an entry to the root buffer. More entries = more scanning.
- **Persistent runtime accumulation**: In Octane, the root buffer grows across requests as objects with circular references persist. GC scanning cost increases monotonically until worker recycle.

## When To Use

- Profiling where `gc_collect_cycles` appears in flame graphs > 3% of execution time.
- PHP-FPM workloads without circular references where GC runs produce zero collections.
- Octane workers where root buffer growth indicates accumulating circular references.
- Batch jobs that create many temporary circular structures (ORM entity graphs, DOM trees).

## When NOT To Use

- Workloads with frequent circular references — GC is providing value.
- Single-request isolation where GC overhead is negligible (< 1% CPU).
- Development environments where the GC safety net prevents silent data loss.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Profile GC overhead before disabling | GC may cost nothing — disabling adds risk for no gain. Flame graphs tell the story. |
| Fix circular references before disabling GC | Using WeakReference to break cycles reduces root buffer size, solving both the CPU cost and potential leaks. |
| Disable GC for PHP-FPM, enable for long-running processes | FPM resets heap per request — cycles are rare. Long-running workers accumulate cycles. |
| Call gc_collect_cycles() after batch jobs | Forced collection during idle periods prevents root buffer growth from spiking during request time. |
| Monitor gc_status() ratio in Octane | A falling `collected / runs` ratio signals wasted scans. Rising `roots` signals accumulating cycles. |

## Architecture Guidelines

- **FPM default**: Disable GC in `php.ini` (`gc_probability = 0`) for request-scoped workloads. Enable via `gc_enable()` only before operations known to create cycles (ORM batch inserts, DOM parsing).
- **Octane default**: Keep GC enabled. Monitor `gc_status()` per-request overhead. If > 3% CPU, fix circular references via WeakReference rather than disabling GC.
- **Batch jobs**: Call `gc_collect_cycles()` after processing each batch (e.g., per 1000 records) to keep root buffer small.
- **Threshold tuning**: `gc_threshold = 10001` (just above common allocation counts) to prevent GC from running during normal requests while still catching large allocations. Only tune after profiling.
- **Worker recycling**: In persistent runtimes, `max_requests` recycling is the fallback for unbounded root buffer growth. Set `max_requests` to the point where GC overhead exceeds 5%.

## Performance Considerations

- GC scans all root buffer entries: O(n) where `n` = number of zvals with circular references. Each entry is ~72 bytes of scanning.
- Empty scan (0 cycles collected): Same CPU cost as productive scan. CPU is wasted proportionally to root buffer size.
- GC probability 1/1000 means ~1 scan per 1000 allocations. For a typical Laravel request with 500k allocations, that is ~500 GC checks — but only the one that triggers scans the full buffer.
- Triggered GC cost per request: 50-500µs depending on root buffer size. At 5% CPU, this is ~5ms per 100ms request.
- Persistent runtime cost accumulates: root buffer grows from ~100 entries (after recycle) to ~50,000+ entries (after 10k requests) in apps with circular references.

## Security Considerations

- A deliberately crafted request can create artificial circular references, inflating the root buffer and degrading GC performance (a form of resource exhaustion). Rate limiting and WeakReference patterns mitigate this.
- Disabling GC entirely in Octane without WeakReference patterns risks unbounded memory growth that can OOM the worker, causing service disruption.
- GC-disabled processes that use `gc_enable()` temporarily must ensure `gc_collect_cycles()` is called before re-disabling to prevent root buffer stalling.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Disabling GC globally without profiling | Turning off the collector for convenience, assuming it saves CPU. | Observing `gc_collect_cycles` in stack traces without measuring its cost. | Memory leaks from cycles accumulate silently in long-running processes. | Profile first. If GC < 3% CPU, leave it on. |
| Never calling gc_collect_cycles() after batch jobs | The root buffer grows during batch processing but collection only triggers on probability. | Assuming GC triggers automatically at end of script. | High GC cost on next triggered run. | Call `gc_collect_cycles()` explicitly after each batch. |
| Ignoring root buffer growth in Octane | The root buffer size is invisible without `gc_status()`. | Not monitoring GC metrics. | GC overhead grows silently to 10%+ of CPU. | Add `gc_status()` to Octane metrics. Alert on `roots > 10000`. |

## Anti-Patterns

- **GC risk denial**: Disabling GC globally in Octane because "it saves CPU" — without WeakReference patterns to handle cycles. The result is unbounded memory growth.
- **Threshold cargo culting**: Setting `gc_threshold` to an arbitrary high number (e.g., 1M) without profiling. The threshold should be just above the typical allocation count of a request.
- **Ignoring gc_status()**: Deploying GC changes without before/after metrics. GC tuning is data-driven, not guesswork.

## Examples

```php
<?php
// Profile GC overhead
$before = microtime(true);
$cycles = gc_collect_cycles();
$after = microtime(true);

Log::debug('GC collection', [
    'duration_us' => ($after - $before) * 1_000_000,
    'cycles' => $cycles,
    'status' => gc_status(),
]);
```

```php
<?php
// Octane: monitor GC after each request
use Laravel\Octane\Events\RequestHandled;

Event::listen(RequestHandled::class, function () {
    $status = gc_status();
    if ($status['roots'] > 5000) {
        Log::warning('GC root buffer growing', $status);
    }
});
```

## Related Topics

- **Prerequisites**: PHP Memory Model, Zval Structure and Reference Counting
- **Closely Related**: Cycle Collection Algorithm, GC Threshold Tuning, GC Enable/Disable Patterns
- **Advanced Follow-Up**: GC Telemetry and Root Buffer, Reference Counting Bottlenecks
- **Cross-Domain Connections**: Octane Memory Management, Long-Running Worker Strategies

## AI Agent Notes

- The most common pattern: teams disable GC in FPM (correct) but forget to re-enable it in Octane (incorrect). Always check the runtime before setting GC policy.
- GC overhead is rarely the top CPU consumer. Before tuning GC, confirm it appears in flame graphs above 2-3%. Otherwise, optimize the actual bottleneck first.
- `gc_status()` is the single most valuable diagnostic function. Add it to any performance monitoring dashboard for long-running workers.
- The decision tree for GC is: (1) Profile → (2) If FPM and low cycles → disable → (3) If persistent runtime and high cycles → fix references → (4) If still high overhead → tune threshold.
