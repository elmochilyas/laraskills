# Standardized Knowledge: GC Enable/Disable Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | gc_enable/gc_disable — Time-Sensitive Code Sections, gc_status() Pre/Post |
| Difficulty | Intermediate |
| Lifecycle | Configure, Debug |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

`gc_disable()` turns off automatic cycle collection, preventing stop-the-world GC pauses during time-sensitive code. `gc_enable()` re-enables it. The correct pattern: disable GC before a latency-critical section, call `gc_collect_cycles()` at boundaries, and re-enable after. Never permanently disable GC in long-running processes — unbounded root buffer growth will eventually exhaust memory.

## Core Concepts

- **gc_disable()**: Sets the `gc_protected` flag. The root buffer continues accumulating entries but collection is not triggered. Pauses are eliminated.
- **gc_enable()**: Clears protection. If root buffer is over threshold, collection triggers immediately.
- **gc_status()['protected']**: Boolean indicating whether GC is currently disabled. Check before/after critical sections.
- **Risk of permanent disable**: In long-running processes (Octane workers), permanently disabled GC causes unbounded root buffer growth → eventual OOM. Always re-enable.

## When To Use

- Latency-critical API endpoints where GC pauses cause p99 spikes
- High-frequency trading, real-time applications, or sub-millisecond response targets
- Batch processing where controlled GC at boundaries is acceptable
- Short-lived CLI scripts where GC never triggers anyway

## When NOT To Use

- In long-running workers without periodic gc_collect_cycles() calls
- As a permanent optimization for PHP-FPM (harmless but unnecessary — process resets per request)
- Without monitoring root buffer growth (risk of silent OOM)
- For general-purpose web applications with standard latency requirements

## Best Practices

- **Disable strategically, not permanently**: gc_disable() around critical sections, gc_enable() after
- **Call gc_collect_cycles() at boundaries**: Every 100 requests or after heavy batch processing
- **Monitor gc_status()['roots']**: If root buffer grows >80% of capacity, trigger collection
- **FPM vs Octane**: In FPM, GC disable is harmless. In Octane, permanent disable causes memory exhaustion
- **Use gc_status()['protected'] to verify state**: Log before/after in debug builds

## Architecture Guidelines

- **High-frequency pattern**: `gc_disable()` at worker start, `gc_collect_cycles()` every 100 requests, `gc_enable()` only on graceful shutdown. Predictable latency with controlled memory growth.
- **Per-request heap vs shared heap**: PHP-FPM's per-request allocation automatically frees all memory at request end, making GC disable safe. Octane's persistent heap requires active GC management.
- **Root buffer monitoring**: Track `gc_status()['roots']` over time in production. Monotonic growth signals a leak that periodic collection isn't fixing.

## Performance Considerations

- GC pause avoidance: Disabling GC during critical sections eliminates latency spikes but defers collection cost
- The deferred cost is identical — GC still takes 50-500µs when eventually triggered
- PHP-FPM's shared-nothing architecture makes GC disable safer (process resets after each request) than Octane's persistent workers
- Root buffer growth rate determines how long you can safely disable GC before OOM risk

## Security Considerations

- In multi-tenant Octane apps, disabled GC could let one tenant's memory leak affect others via shared worker
- gc_status() exposes allocation metadata — consider access restrictions in production

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Permanently disabling GC in PHP-FPM | Misunderstanding lifecycle | Not harmful but unnecessary | Leave enabled; it never triggers anyway |
| Permanently disabling GC in Octane | FPM habit | Unbounded root buffer growth → OOM | Re-enable after critical section |
| Not calling gc_collect_cycles() before re-enable | Forgetting deferred cost | Large GC pause when gc_enable() triggers | Collect cycles manually at boundaries |
| Disabling GC without monitoring roots | No observability | Silent root buffer growth until OOM | Log gc_status() periodically |

## Anti-Patterns

- **Disabling GC and never re-enabling**: In Octane, this guarantees eventual OOM. Always pair gc_disable() with gc_enable().
- **gc_collect_cycles() per request**: Wastes CPU. Collect at batch boundaries (100 requests) instead.
- **Disabling GC as a performance "hack"**: GC pauses are 50-500µs. Profile first to confirm GC pauses are a real bottleneck.

## Examples

```php
<?php
// Safe GC disable pattern in Octane
gc_disable();
$status = gc_status();
error_log("GC disabled. Root buffer: {$status['roots']}");

// ... latency-critical request handling ...

// Every 100 requests, collect and re-enable temporarily
if ($requestCount % 100 === 0) {
    gc_collect_cycles();
    gc_enable();
    // Let GC run if needed
    gc_disable();
}

// On worker shutdown
gc_enable();
gc_collect_cycles();
```

## Related Topics

- Cyclic GC Algorithm
- gc_collect_cycles() Strategic Calling
- GC Telemetry and Root Buffer Monitoring
- Memory Leak Detection Patterns

## AI Agent Notes

- gc_disable() prevents automatic collection but root buffer still accumulates entries.
- In PHP-FPM, disabling GC is harmless because the entire process heap is destroyed per request.
- In Octane, permanent GC disable causes unbounded root buffer growth → OOM — always re-enable.
- Call gc_collect_cycles() at batch boundaries, not per-request.
- Monitor gc_status()['roots'] — monotonic growth in a worker indicates a leak.
- PHP 8.5 reduces false-positive GC runs by ~30%, making selective disable less necessary.

## Verification

- [ ] GC enable/disable pattern understood for time-sensitive code
- [ ] No permanent gc_disable() in long-running processes
- [ ] gc_collect_cycles() called at batch boundaries in Octane/Swoole workers
- [ ] gc_status()['roots'] monitoring configured
- [ ] Root buffer growth alert threshold defined (>5000 entries)
- [ ] GC pause impact measured (confirm it's a real bottleneck before optimizing)
