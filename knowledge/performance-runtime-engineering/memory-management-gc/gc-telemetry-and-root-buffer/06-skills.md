# Skill: Monitor and Interpret GC Telemetry and Root Buffer

## Purpose

Use PHP's `gc_status()` function to monitor garbage collection activity, interpret root buffer growth, and take corrective action.

## When To Use

- Debugging memory growth in long-running processes
- Tuning GC thresholds
- Profiling GC overhead
- Checking if cycles are accumulating faster than collected

## When NOT To Use

- For short-lived PHP-FPM requests where GC telemetry resets
- When the application has no GC-related concerns
- Without understanding what each gc_status() field means

## Prerequisites

- PHP 7.3+ runtime (gc_status() available)
- Understanding of root buffer and cycle collection concepts
- Monitoring system for collecting gc_status() over time

## Inputs

- Current gc_status() output
- Application type (web, batch, daemon)
- Historical gc_status() trends

## Workflow (numbered steps)

1. Call `gc_status()` and record the five fields: runs, collected, threshold, roots, application_time
2. `runs`: number of times GC has executed since process start — should increase slowly over time for long-running workers
3. `collected`: total number of cycles freed since process start — should correlate with runs
4. `threshold`: the root buffer size that triggers GC (default 10001) — check if appropriate for workload
5. `roots`: current root buffer size — this is the most critical metric for active monitoring
6. `application_time`: time spent in GC since process start — high values indicate GC is consuming CPU
7. Calculate collection efficiency: `collected / runs` — should be > 100 (each run should collect hundreds of cycles)
8. Measure growth rate: `roots` over time in Octane workers — if growing, cycles are accumulating faster than collected
9. If `roots` consistently stays high (near threshold), GC runs frequently — investigate cycle sources
10. Set up monitoring to alert if `roots` exceeds 80% of `threshold` for sustained periods

## Validation Checklist

- [ ] gc_status() recorded at regular intervals
- [ ] runs, collected, threshold, roots, application_time understood
- [ ] Collection efficiency calculated (collected / runs)
- [ ] Root buffer growth rate established
- [ ] Alert set for roots > 80% of threshold
- [ ] Monitoring dashboard created with GC metrics
- [ ] Interpretation documented

## Common Failures

- **Sampling GC status too frequently**: gc_status() is cheap but adds noise — sample every 60 seconds, not every request
- **Ignoring application_time growth**: If application_time increases by 1%+ of wall time, GC is consuming significant CPU
- **Confusing roots with memory usage**: root buffer size is the number of possible cycle roots, not bytes of memory
- **Not correlating with other metrics**: Root buffer growth should be correlated with RSS growth, not viewed in isolation

## Decision Points

- roots < 10% of threshold: GC is keeping up well — no action needed
- roots 10-50% of threshold: moderate — monitor trend
- roots 50-80% of threshold: elevated — investigate cycle sources
- roots > 80% of threshold: GC will trigger soon — high root buffer indicates many potential cycles
- roots consistently near threshold: GC runs very frequently — tune threshold or fix cycles
- application_time growing > 1% of wall time: GC overhead is significant — tune or fix cycles

## Performance Considerations

- gc_status() call overhead: < 1µs — negligible
- Root buffer scanning: O(buffer size) per GC run
- Each root entry: 32 bytes in the root buffer — 10000 entries = 320KB (negligible memory)
- High root buffer count does not directly indicate high memory usage — it indicates many possible cycle roots
- GC runs at threshold: each run costs 1-50ms depending on root buffer size

## Security Considerations

- GC telemetry data does not contain sensitive information
- Access to gc_status() should be restricted to operations team (internal endpoint)
- No security implications from the telemetry itself

## Related Rules (from 05-rules.md)

- Monitor GC Root Buffer in Long-Running Workers
- Tune GC Threshold for Long-Running Workers
- Never Disable GC Entirely in Production

## Related Skills

- GC Algorithm and Cycle Collection
- GC Threshold Tuning
- Memory Leak Detection Patterns

## Success Criteria

- gc_status() monitoring implemented with dashboard
- Root buffer growth rate established and tracked
- Alert configured for elevated root buffer (>80% of threshold)
- GC CPU overhead (application_time) tracked
- Telemetry interpretation documented for team
