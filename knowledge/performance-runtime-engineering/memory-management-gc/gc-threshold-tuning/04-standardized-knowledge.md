# GC Threshold Tuning — gc_threshold Dynamic Adjustment, Collection Frequency, Root Buffer Sizing

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | GC Threshold Tuning — gc_threshold Dynamic Adjustment, Collection Frequency, Root Buffer Sizing |
| Difficulty | Advanced |
| Last Updated | 2026-06-02 |

## Overview

PHP's garbage collector triggers automatically when the root buffer reaches its threshold (default 10,000 entries). The threshold can be adjusted dynamically via `gc_threshold()`, allowing developers to balance GC overhead against memory pressure. A lower threshold triggers GC more frequently with shorter pauses. A higher threshold triggers GC less frequently with longer pauses when it does run. For latency-sensitive applications (Octane, real-time APIs), tuning this threshold can reduce GC pause-induced latency spikes. For memory-constrained applications, a lower threshold ensures cycles are collected promptly before memory pressure builds.

## Core Concepts

- **Root buffer size (default 10,000)**: Number of potential cycle roots tracked before automatic GC triggers. Configurable via `gc_threshold()`.
- **gc_threshold(int $threshold)**: Sets the root buffer size. When the buffer reaches this size, GC runs automatically. Returns the previous threshold.
- **gc_status()['threshold']**: Reports the current threshold value. Combined with `roots` field, shows how close the buffer is to triggering GC.
- **Collection frequency vs pause duration**: Lower threshold → more frequent, shorter GC runs. Higher threshold → less frequent, longer GC runs per run.
- **Buffer overflow**: If the root buffer exceeds the threshold while a GC run is in progress, the new roots wait for the next collection cycle.
- **gc_protect()/gc_unprotect()**: Temporarily protects/unprotects the root buffer from collection. Used around critical sections.
- **Dynamic adjustment**: The threshold can be changed at runtime based on system state — e.g., increase during peak traffic (fewer pauses), decrease during off-peak (more thorough cleanup).

## When To Use

- You are running latency-sensitive Octane/Swoole workers and GC pauses are causing p99 latency spikes.
- You have measured that GC time ratio is >5% of application time.
- You want to balance memory pressure vs CPU overhead in long-running processes.
- You have a workload with predictable cycle-generation patterns (e.g., batch processing).
- You are debugging GC pause storms caused by too-frequent collection.

## When NOT To Use

- You use PHP-FPM with short-lived requests. Each request resets the heap — GC tuning has minimal impact.
- Your GC time ratio is <5% and you have no latency sensitivity.
- You haven't measured GC behavior and are tuning blindly.
- Your application doesn't create circular references — GC rarely runs regardless of threshold.
- You are new to PHP memory management — focus on RC and basic GC understanding first.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Start with default threshold (10,000) and monitor | The default is well-tuned for most applications. Only adjust if monitoring shows GC-related issues. |
| Increase threshold for latency-sensitive endpoints | Fewer GC runs means fewer stop-the-world pauses. Monitor memory — ensure cycles don't accumulate. |
| Decrease threshold for memory-constrained environments | More frequent GC runs keep memory pressure lower at the cost of more pauses. |
| Adjust threshold dynamically based on traffic | Use a tick hook or middleware to increase threshold during peak hours and decrease during off-peak. |
| Monitor `gc_status()['roots']` to assess whether threshold change is needed | If roots rarely exceed 1000 before GC runs, threshold is too low. If roots consistently stay at 10,000+, threshold may be too high. |
| Combine threshold tuning with manual `gc_collect_cycles()` at request boundaries | Manual collection at known points (end of request) reduces the accumulation that triggers automatic collection. |

## Architecture Guidelines

- **Threshold semantics**: The threshold is the number of root buffer entries before automatic GC is triggered. It is NOT a time interval. GC runs when the count of potential cycle roots reaches this number.
- **Buffer growth pattern**: In a typical Laravel Octane worker, the root buffer grows by 10–50 entries per request. At 10,000 threshold, GC runs every 200–1000 requests. Each run collects 10–100 cycles.
- **Collection during GC**: While GC is running, new potential cycle roots are tracked but not processed. They are processed in the next GC run.
- **Threshold and memory relationship**: A higher threshold means more memory is consumed before GC runs. Ensure available memory can accommodate the accumulation between GC runs.
- **gc_protect/gc_unprotect**: These protect the root buffer from collection during critical sections (e.g., during a database transaction where inline processing would cause latency). Use sparingly — they defer collection, not eliminate it.

## Performance Considerations

- GC pause duration at default threshold (10,000 roots): ~50–500µs. At a threshold of 100,000: ~500–5000µs (proportional to root count).
- GC frequency at default threshold: ~once every 200–1000 requests in an Octane worker. At a threshold of 5,000: ~twice as frequent.
- CPU cost of GC: collector_time / application_time ratio. >5% indicates excessive collection. Tune threshold to reduce frequency.
- Memory cost of deferred GC: each uncollected root entry holds memory for potential cycles. A full root buffer (10,000 entries) holds approximately 1–10MB of data that could be freed.
- Trade-off: halving the threshold doubles GC frequency but halves memory held by uncollected cycles.

## Security Considerations

- GC pauses are too short (<1ms) to be a meaningful timing side channel. Threshold tuning does not affect security posture.
- Memory exhaustion: a threshold set too high in a memory-constrained environment could allow cycles to accumulate until OOM. Always set safety margins.
- gc_protect should not be called indefinitely — it prevents collection and can mask memory leaks.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Setting threshold very low (<1000) | GC runs too frequently, causing excessive CPU overhead. | Thinking "more GC is better." | GC time ratio >10%, latency spikes on every collection. | Monitor first. Adjust from default (10,000) gradually. |
| Setting threshold very high (>100000) | GC runs rarely, allowing cycles to accumulate. | Wanting to eliminate all GC pauses. | Memory grows from accumulated cycles, eventual OOM. | Set threshold based on available memory and cycle growth rate. |
| Changing threshold without monitoring | No way to know if the change helped or hurt. | Adjusting parameters without feedback. | Performance may degrade without detection. | Monitor gc_status() before and after threshold changes. |
| Forgetting that PHP-FPM resets the heap | Threshold changes affect per-request heap only during the request. | Assuming global scope for gc_threshold(). | Changes have no effect across PHP-FPM requests. | Only tune threshold for long-running processes (Octane, Swoole). |

## Anti-Patterns

- **Setting threshold to 0**: This disables automatic collection (gc_threshold(0) sets threshold to 0). Only do this if you manage collection manually via gc_collect_cycles(). Risk of unbounded root buffer growth.
- **Changing threshold on every request**: Threshold changes are cheap but unnecessary. Set once per process based on monitoring data.
- **Assuming threshold tuning replaces manual collection**: Manual gc_collect_cycles() at request boundaries complements threshold-based automatic collection. Both should be configured.
- **Tuning before measuring**: Threshold tuning without gc_status() data is guesswork. Always measure first.

## Examples

```php
// Monitor root buffer growth and adjust
$status = gc_status();

// If roots are growing too fast, lower threshold
if ($status['roots'] > $status['threshold'] * 0.8) {
    gc_threshold(5000);
    Log::warning('GC threshold lowered due to root accumulation');
}

// Traffic-aware threshold adjustment
if (shouldReducePauses()) {
    $old = gc_threshold(20000); // Fewer, longer pauses
} else {
    $old = gc_threshold(10000); // Default
}

// Protect critical section
gc_protect();
// ... time-sensitive code ...
gc_unprotect();
gc_collect_cycles(); // Collect deferred cycles
```

```php
// Octane tick for dynamic GC threshold
Octane::tick('gc:tune', function () {
    $status = gc_status();
    $ratio = $status['collector_time'] / max($status['application_time'], 1);
    
    if ($ratio > 0.05) {
        gc_threshold(20000); // Reduce collection frequency
    } elseif ($ratio < 0.01 && $status['roots'] > 5000) {
        gc_threshold(5000); // Increase collection frequency
    }
}, seconds: 300);
```

## Related Topics

- Cycle Collection — Bacon-Rajan Algorithm
- GC Enable/Disable Patterns
- gc_collect_cycles() Strategic Calling
- GC Telemetry and Root Buffer Monitoring
- Memory Leak Detection Patterns

## AI Agent Notes

- Threshold tuning is the most effective GC optimization for long-running processes. It directly controls the frequency vs duration trade-off of GC pauses.
- The sweet spot depends on your application's cycle-generation rate. Monitor `gc_status()['roots']` over time — if roots grow by N per request and the threshold is T, GC runs every T/N requests.
- Most teams should never need to tune the GC threshold. Default (10,000) is appropriate for >95% of applications. Only tune if you have measured GC-related issues.
- Combining threshold tuning with manual gc_collect_cycles() at request boundaries gives you the most control: manual collection handles the common case (end of request), and automatic collection catches any remaining accumulation.

## Verification

- [ ] Read gc_status() and verify current threshold value.
- [ ] Change threshold to 5000 and verify gc_status() shows the new value.
- [ ] Measure GC frequency and pause duration at different threshold values.
- [ ] Monitor root_buf_entries over time — verify threshold prevents unbounded growth.
- [ ] Test gc_protect/gc_unprotect in a critical section.
- [ ] Verify threshold change takes effect immediately (no restart needed).
- [ ] Document the chosen threshold and the reasoning based on monitoring data.
