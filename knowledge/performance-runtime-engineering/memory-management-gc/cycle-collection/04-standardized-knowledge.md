# Cycle Collection — Bacon-Rajan Algorithm, Root Buffer, Mark-Grey/Scan/Sweep Phases

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Cycle Collection — Bacon-Rajan Algorithm, Root Buffer, Mark-Grey/Scan/Sweep Phases |
| Difficulty | Advanced |
| Last Updated | 2026-06-02 |

## Overview

PHP's cyclic garbage collector implements the **Bacon-Rajan algorithm** — a concurrent tri-color marking scheme that detects and collects circular references that reference counting cannot resolve. It operates in three phases: **Mark-Grey** (decrement refcounts of all children simulating removal of a root's reference), **Scan** (evaluate which nodes are reachable from external references), and **Sweep** (free unreachable cycle members). The collector is triggered automatically when the root buffer (default 10,000 entries) fills, or manually via `gc_collect_cycles()`. In typical web applications, cycle collection handles <1% of memory reclamation, but for long-running processes, it is essential for preventing memory leaks from accumulating cycles.

## Core Concepts

- **Bacon-Rajan algorithm**: Tri-color concurrent marking algorithm adapted for PHP's reference-counted heap. Colors: Grey (decremented, under evaluation), Black (reachable from root), White (candidate for collection, unreachable).
- **Root buffer**: Array of `zend_refcounted*` pointers tracking potential cycle roots. Default size: 10,000. When full, GC is triggered automatically.
- **Mark-Grey phase**: Walk all children of each root, decrement their refcounts by 1 (simulating removal of the root's reference). Records the decremented refcount for restoration.
- **Scan phase**: Walk all children again. Nodes with refcount > 0 after decrementing are reachable from outside the cycle — their refcounts are incremented back (restored to original). Nodes remaining at refcount = 0 are unreachable.
- **Sweep phase**: Free all unreachable cycle members (refcount = 0 after scan). These were the actual garbage.
- **gc_status()**: PHP function returning `{ running: bool, protected: bool, full: bool, buffer_size: int, roots: int, collected: int, threshold: int, running_time: float, application_time: float, collector_time: float }`.
- **False positives (PHP 8.5)**: Static closures (first-class callables) and Enum singletons are now skipped during root buffer detection, eliminating ~30% of false-positive GC runs in framework-heavy apps.

## When To Use

- You are running long-lived PHP processes (Octane, Swoole, FrankenPHP workers) where memory must be stable over millions of requests.
- You are debugging memory growth in a PHP application — cycle accumulation is a common cause of gradual increases.
- You are working with complex object graphs (e.g., Doctrine entities, nested relationships) that may form circular references.
- You need to optimize GC behavior for latency-sensitive applications.

## When NOT To Use

- You use PHP-FPM with short-lived requests (each request resets the heap, cycles are destroyed naturally).
- Your application doesn't create circular references (simple CRUD apps rarely have cycles).
- You are just optimizing and haven't measured that GC is a bottleneck.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Monitor `gc_status()` in long-running processes | Track root buffer entries, collection count, and GC time ratio. Alert if collector_time / application_time > 5%. |
| Call `gc_collect_cycles()` at request boundaries in Octane | Prevents accumulation of cycles between requests. Run every N requests, not every request. |
| Use `WeakReference` for cache-like object relationships | Weak references don't create refcount cycles. The GC doesn't need to intervene. |
| Avoid creating circular references in singleton-like patterns | Parent-child back-references are the most common cycle source. Use events or callbacks instead. |
| Understand that `gc_disable()` stops cycle collection | Disabled GC means root buffer grows unbounded. Only disable temporarily around time-sensitive code. |
| Upgrade to PHP 8.5+ for false-positive reduction | PHP 8.5 skips static closures and Enum singletons, reducing unnecessary GC runs by ~30%. |

## Architecture Guidelines

- **GC trigger mechanism**: The collector runs automatically when the root buffer reaches its threshold (default 10,000 entries). If `gc_collect_cycles()` is called manually, the buffer is processed regardless of size.
- **Stop-the-world**: The GC runs inline — all execution stops during the mark-grey/scan/sweep phases. A full GC cycle takes 50–500µs depending on root count and graph depth.
- **Root buffer lifecycle**: Entries are added to the buffer when a refcount decreases but doesn't reach zero (potential cycle root). If the entry's refcount reaches zero before GC runs, it's removed from the buffer.
- **Collection efficiency**: Not all root buffer entries are garbage. Typically, only 1–10% of entries are actually collectable cycles. The majority are false positives that the scan phase resolves.
- **PHP 8.5 optimization**: Static closures (generated by first-class callable syntax) and Enum singletons are excluded from root buffer detection. These were the most common false positives and consumed ~30% of GC effort.

## Performance Considerations

- Full GC cycle: 50–500µs depending on root count and graph depth. Latency-sensitive apps should monitor GC time.
- GC time ratio: If collector_time > 5% of application_time, GC is causing measurable overhead. Investigate cycle sources or adjust threshold.
- PHP 8.5 GC improvements: Skipping false-positive roots reduces unnecessary runs. Measured ~30% elimination of GC cycles in framework apps.
- Root buffer size: Default 10,000. Larger buffer means less frequent GC runs but longer pauses when they do occur. Smaller buffer means more frequent, shorter pauses.
- Manual collection overhead: Calling `gc_collect_cycles()` every request adds 50–500µs per call. Batch calls every N requests.

## Security Considerations

- Timing attacks: GC pauses can introduce timing variability that theoretically leaks information about execution context. In practice, GC pauses are too small (<1ms) to be a meaningful attack vector.
- Data remnants: Freed cycle members are zeroed by the Zend MM. No sensitive data remains accessible after sweep.
- Use-after-free: PHP 8.x GC does not have use-after-free bugs in userland. Extension bugs could theoretically cause issues.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Assuming `unset()` immediately frees memory | Objects in circular references remain until GC runs. | Reference counting seems to guarantee immediate cleanup. | Memory appears to leak in long-running processes. | Use `gc_collect_cycles()` after unsetting cycles. |
| Disabling GC permanently in Octane | `gc_disable()` in a persistent worker means cycles accumulate forever. | Thinking "GC slows things down, disable it." | Unbounded root buffer growth → eventual OOM. | Only disable around critical sections. Use manual collection at request boundaries. |
| Not monitoring root buffer growth | Roots increase monotonically without detection. | GC telemetry is not part of standard monitoring. | Missed warning signs before OOM. | Monitor `gc_status()['roots']` in production. Alert on sustained growth. |
| Creating deep object graphs with many weak references | Each WeakReference adds to the root buffer when resolved. | Assuming WeakReference has zero overhead. | Increased GC root buffer entries, more frequent collection. | Use WeakReference judiciously. Combine with explicit cleanup. |

## Anti-Patterns

- **Calling `gc_collect_cycles()` on every request**: This adds 50–500µs per request unnecessarily. Call every N requests (e.g., every 100) or when root buffer exceeds a threshold.
- **Creating objects purely to benefit from GC**: If you can avoid cycles entirely, GC overhead drops to near zero. Design object graphs to be acyclic when possible.
- **Assuming GC solves all memory problems**: GC only handles circular references. Linear reference chains, static collections, and closure accumulation are not GC-solvable.

## Examples

```php
// GC status monitoring
$status = gc_status();
echo "Root buffer: {$status['roots']}/{$status['buffer_size']}";
echo "Collected: {$status['collected']} cycles";
echo "GC time ratio: " . ($status['collector_time'] / max($status['application_time'], 1));

// Manual collection at request boundary
$shouldCollect = (rand(1, 100) === 1);
if ($shouldCollect) {
    $collected = gc_collect_cycles();
    Log::debug("GC collected $collected cycle(s)");
}
```

```
// gc_status() output example
{
    "running": false,
    "protected": true,
    "full": false,
    "buffer_size": 10000,
    "roots": 234,
    "collected": 15000,
    "threshold": 10001,
    "running_time": 0.0,
    "application_time": 125.5,
    "collector_time": 1.2
}
```

## Related Topics

- GC Threshold Tuning — gc_threshold dynamic adjustment
- Reference Counting Lifecycle
- Memory Leak Detection Patterns
- WeakReference API
- Copy-on-Write Mechanics

## AI Agent Notes

- The cyclic collector is the most misunderstood part of PHP's memory management. Most developers think GC handles all memory cleanup — it doesn't. RC handles ~99% of cases.
- The key insight: GC only collects circular references. If your code doesn't create cycles (and much PHP code doesn't), GC is essentially idle.
- In Framework applications (Laravel, Symfony), the most common cycle sources are: event listeners that reference their dispatcher, parent-child ORM relationships, and closure-scoped variable capture.
- PHP 8.5 GC improvements significantly reduce unnecessary cycles. Upgrading is the single best GC optimization for most teams.

## Verification

- [ ] Run `gc_status()` and verify root buffer entries, collection count, and time ratio.
- [ ] Create a circular reference and verify `unset()` does not immediately free memory.
- [ ] Call `gc_collect_cycles()` and verify the cycle is collected.
- [ ] Monitor GC time ratio over a 1-hour soak test — should be <5%.
- [ ] Verify PHP 8.5 GC improvements: static closures and Enum singletons are excluded from root buffer.
- [ ] Document the GC behavior and monitoring setup for your application.
