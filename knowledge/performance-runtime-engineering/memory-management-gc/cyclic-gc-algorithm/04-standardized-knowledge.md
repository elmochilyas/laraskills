# Standardized Knowledge: Cyclic GC Algorithm

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Cyclic GC Algorithm — Root Buffer, Mark-Grey/Scan/Sweep Phases |
| Difficulty | Intermediate |
| Lifecycle | Understand, Debug |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP's cyclic garbage collector implements the **Bacon-Rajan algorithm** — a concurrent tri-color marking scheme. It operates in three phases: **Mark-Grey** (decrement refcounts of all children), **Scan** (evaluate which nodes can be reached from roots), and **Sweep** (free unreachable cycles). The collector is triggered when the root buffer (default 10,000 entries) fills.

## Core Concepts

- **Root buffer**: Array of `zend_refcounted*` pointers tracking potential cycle roots. Default size: 10,000. When full, GC is triggered automatically.
- **Mark-Grey phase**: Walk all children of each root, decrement their refcounts by 1 (simulating removal of the root's reference). Nodes with refcount > 0 after this are still reachable from outside the cycle.
- **Scan phase**: Walk all children again, incrementing refcounts of reachable nodes (restoring them). Nodes that remain refcount=0 are unreachable cycle members.
- **Sweep phase**: Free all unreachable cycle members. These are the actual garbage.
- **gc_status()**: Returns `{ 'running', 'protected', 'root_buffer_size', 'root_buffer_entries', 'collectable', 'collected' }`.

## When To Use

- Debugging memory leaks in long-running PHP processes (Octane, Swoole)
- Understanding when PHP frees memory from circular references
- Tuning GC behavior for latency-sensitive applications
- Diagnosing RSS growth in PHP-FPM workers

## When NOT To Use

- For understanding basic variable lifecycle (reference counting handles this)
- When debugging short-lived CLI scripts (GC rarely triggers)
- As a first step in memory optimization (start with reference counting and allocation patterns)

## Best Practices

- **Monitor gc_status() in production**: Track `root_buffer_entries` and `collected` to detect cycle accumulation
- **Call gc_collect_cycles() strategically**: At batch boundaries in long-running processes, not per-iteration
- **Use WeakReference to prevent cycles**: Cache-like patterns should not create circular references
- **Set pm.max_requests**: Recycle FPM workers every 500-1000 requests to prevent cycle accumulation

## Architecture Guidelines

- **Per-request vs persistent memory**: PHP-FPM's per-request heap destroys all memory at request end, making GC less critical. Octane's persistent memory requires active GC management.
- **GC trigger threshold**: Default root buffer is 10,000 entries. For memory-constrained environments, lower threshold. For latency-sensitive, raise or temporarily disable.
- **Reference counting priority**: PHP handles 99%+ of memory reclamation via refcounting. GC only handles circular references — design code to minimize cycles.

## Performance Considerations

- Full GC cycle: 50-500µs depending on number of roots and depth of structures
- GC pauses: The algorithm runs inline (stop-the-world) during the sweep phase
- PHP 8.5 improvements: Skip static fake closures (first-class callables) and Enum singletons — common false positives that wasted GC cycles
- Root buffer overflow: When buffer fills mid-request, GC triggers inline, adding latency

## Security Considerations

- GC state leaks between requests in Octane: Cumulative root buffer entries can expose allocation patterns
- Never disable GC permanently in long-running processes — unbounded root buffer growth leads to OOM

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Assuming unset() immediately frees memory | Ignoring circular references | Objects remain until GC runs | Monitor refcounts, use WeakReference |
| Not calling gc_collect_cycles() in long-running processes | FPM habit | Octane/Swoole workers accumulate cycles | Call strategically at boundaries |
| Using static properties for request-scoped data | Convenience | State leaks between requests | Use scoped bindings in Octane |
| Ignoring copy-on-write in loops | Unawareness of array duplication | Massive memory duplication | Use references or SplFixedArray |
| Not monitoring worker RSS | No observability | Gradual RSS growth undetected | Alert on >10% over 1000 requests |

## Anti-Patterns

- **Permanent GC disable in Octane workers**: Eliminates pauses but causes unbounded root buffer growth. Always re-enable after critical sections.
- **gc_collect_cycles() per request**: Wastes CPU. Call at batch boundaries (every 100 requests) instead.
- **Ignoring GC telemetry**: In FPM, GC resets per request so telemetry seems flat. In Octane, monotonic root buffer growth signals a leak.

## Examples

```php
<?php
// Monitor GC status
$status = gc_status();
echo "Root buffer entries: {$status['roots']}\n";
echo "Collected cycles: {$status['collected']}\n";
echo "GC running time: {$status['running_time']}s\n";

// Strategic collection in Octane
if (gc_status()['roots'] > 5000) {
    gc_collect_cycles();
}

// Disable around latency-critical section
gc_disable();
// ... time-sensitive operation ...
gc_enable();
```

## Related Topics

- Root Buffer Dynamics and Threshold Tuning
- gc_collect_cycles() Strategic Calling
- GC Enable/Disable Patterns
- Memory Leak Detection Patterns

## AI Agent Notes

- PHP's GC uses Bacon-Rajan (tri-color marking) — not mark-sweep or reference counting alone.
- GC only handles circular references; 99%+ of memory is freed via refcounting.
- In PHP-FPM, GC is less critical because per-request heap is destroyed entirely.
- In Octane/Swoole, GC management is essential for preventing memory leaks.
- PHP 8.5 reduced false-positive GC runs by ~30% by skipping static closures and Enum singletons.
- gc_status()['roots'] growing monotonically in a worker = leak.

## Verification

- [ ] GC algorithm phases understood (Mark-Grey, Scan, Sweep)
- [ ] Root buffer monitoring configured in production
- [ ] Strategic gc_collect_cycles() calls implemented for long-running processes
- [ ] WeakReference used for cache-like patterns to prevent cycles
- [ ] RSS monitoring alerts configured for >10% growth over 1000 requests
- [ ] PHP 8.5 GC improvements evaluated for reduced false positives
