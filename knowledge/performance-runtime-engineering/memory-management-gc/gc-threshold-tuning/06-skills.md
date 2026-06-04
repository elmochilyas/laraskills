# Skill: Tune PHP Garbage Collection Thresholds

## Purpose

Adjust `gc_threshold` (PHP 8.3+) or configure `gc_probability` / `gc_divisor` to balance GC overhead against memory usage for the application's workload.

## When To Use

- Long-running workers show increasing GC pause durations over time
- Profiling shows GC collection consuming >5% of CPU
- Memory usage is stable but GC runs too frequently (wasting CPU)
- GC root buffer grows slowly but steadily (threshold may be too high)

## When NOT To Use

- For PHP-FPM where short request lifetimes make GC tuning unnecessary
- Without first profiling GC activity and its impact on performance
- When the root cause is cyclic references (fix the cycles instead)

## Prerequisites

- PHP 7.3+ runtime (gc_probability/gc_divisor available in all versions)
- PHP 8.3+ for gc_threshold
- Profiling data showing GC activity and CPU usage
- `gc_status()` function for monitoring GC metrics

## Inputs

- Current GC configuration (gc_probability, gc_divisor, gc_threshold)
- GC telemetry from `gc_status()`: runs, collected, threshold, root_buffer_length
- CPU usage attributable to GC

## Workflow (numbered steps)

1. Monitor GC activity: `$gc = gc_status();` — record runs, collected, threshold, and root_buffer_length over 24 hours
2. If GC runs consume >5% CPU (profiling data) AND root_buffer_length is consistently low (<1000), GC is running too frequently
3. Increase gc_divisor (default 100) to reduce probability: `gc_divisor = 1000` reduces GC frequency by 10x
4. If memory usage grows because GC is not collecting frequently enough AND root_buffer_length is high (>10000), decrease gc_divisor or set explicit gc_threshold
5. For PHP 8.3+: set `gc_threshold = 5000` to trigger collection when root buffer reaches 5000 entries (default is 10000)
6. For batch processing jobs: call `gc_collect_cycles()` explicitly after the batch, not during
7. After tuning, monitor for 24 hours: verify CPU decreased AND memory did not grow unbounded
8. Document the selected thresholds with rationale

## Validation Checklist

- [ ] Baseline GC telemetry collected (runs, collected, threshold, root_buffer)
- [ ] GC CPU usage measured
- [ ] Threshold adjusted based on workload pattern (web vs batch vs long-running)
- [ ] After-tuning telemetry confirms improvement
- [ ] Memory usage stable over 24 hours
- [ ] Configuration documented

## Common Failures

- **Disabling GC entirely (gc_probability=0)**: Memory never freed from cycles — OOM in long-running processes
- **Running GC too frequently**: High CPU overhead from unnecessary collections — root_buffer < 1000 collections waste CPU
- **Not monitoring before tuning**: Without baseline data, cannot determine if tuning helped
- **Using gc_threshold on PHP < 8.3**: gc_threshold is a PHP 8.3+ feature — on earlier versions use gc_probability/gc_divisor

## Decision Points

- Web application (PHP-FPM): default GC settings are fine — workers recycle before GC matters
- Batch processing: call gc_collect_cycles() explicitly after large batches
- Long-running worker (Octane): tune gc_divisor to 1000 (less frequent) if CPU is concern, or decrease gc_threshold if memory is concern
- Memory-constrained worker: lower gc_threshold to 5000 to collect more aggressively

## Performance Considerations

- Default GC probability: 1% chance per request (gc_probability=1, gc_divisor=100)
- GC collection pause: 1-50ms depending on object graph size
- Increasing gc_divisor to 1000 reduces GC runs by 10x, saves ~0.5% CPU
- Decreasing gc_threshold to 5000 (from 10000) catches cycles earlier but runs 2x more frequently
- Each GC run processes the root buffer — buffer size affects pause duration

## Security Considerations

- GC tuning affects memory management but not security
- Disabling GC (gc_probability=0) in long-running processes risks OOM — service availability impact
- gc_threshold should never be set to 0 (runs GC on every request — extreme CPU overhead)

## Related Rules (from 05-rules.md)

- Tune GC Threshold for Long-Running Workers
- Never Disable GC Entirely in Production
- Monitor GC Activity Before Tuning

## Related Skills

- GC Algorithm and Cycle Collection
- GC Telemetry and Root Buffer
- Memory Leak Detection Patterns

## Success Criteria

- GC CPU usage reduced to <1% while memory remains stable
- root_buffer_length stays within acceptable range (never exceeds threshold by 2x)
- No memory growth from uncollected cycles
- Threshold configuration documented with telemetry data
