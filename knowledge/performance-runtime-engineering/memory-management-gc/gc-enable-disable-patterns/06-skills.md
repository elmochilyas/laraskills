# Skill: Determine When to Enable or Disable Garbage Collection

## Purpose

Decide whether to enable, disable, or tune PHP's garbage collector based on the workload type and application requirements.

## When To Use

- Configuring GC for a specific workload (web, batch, long-running)
- Profiling shows significant CPU time in GC operations
- Memory-constrained environments where every MB matters
- Batch processing where GC timing affects throughput

## When NOT To Use

- When default GC settings work well (most web applications)
- Without first profiling GC activity and its impact
- When the application has no GC-related performance issues
- For short-lived CLI scripts where GC never runs

## Prerequisites

- PHP 7.3+ runtime (gc_enable/gc_disable available)
- Profiling data showing GC CPU usage
- Understanding of when GC is beneficial vs harmful

## Inputs

- Workload type (web, batch, daemon, CLI)
- GC telemetry from gc_status()
- CPU profiling showing time in GC functions
- Memory constraints and growth patterns

## Workflow (numbered steps)

1. Profile the workload: measure GC CPU time and root buffer accumulation over 24 hours
2. For PHP-FPM web requests: leave GC enabled at default settings — GC rarely runs during a single request, and running it adds minimal overhead
3. For Octane/Swoole long-running workers: keep GC enabled but tune thresholds (see GC Threshold Tuning skill)
4. For batch processing jobs with well-defined phases: disable GC during the processing phase, call `gc_collect_cycles()` explicitly between phases
5. For daemon processes where latency jitter from GC pauses is unacceptable: consider disabling GC and using explicit collection at scheduled times
6. Never disable GC entirely without a plan for explicit collection — cycles will accumulate until OOM
7. After any GC configuration change, run a 24-hour test to verify memory does not grow unbounded
8. Document the GC configuration and rationale

## Validation Checklist

- [ ] GC CPU time measured (profiling)
- [ ] Root buffer accumulation trend established
- [ ] Workload type matched to GC strategy
- [ ] If disabled: explicit collection strategy defined
- [ ] If enabled: thresholds tuned if needed
- [ ] 24-hour test confirms stable memory
- [ ] GC configuration documented

## Common Failures

- **Disabling GC to reduce CPU**: Without explicit collection, cycles accumulate until OOM — never disable without a collection plan
- **Enabling GC on every request for PHP-FPM**: GC garbage never accumulates meaningfully in single-request processes
- **Not testing after configuration change**: The impact of GC changes may take hours to surface
- **Applying the same strategy to all workloads**: Web, batch, and daemon workloads have different GC requirements

## Decision Points

- PHP-FPM web request: keep GC enabled (default) — it almost never runs
- Octane web worker: keep GC enabled, tune gc_threshold or gc_divisor
- Batch job (100K+ items): disable GC during main loop, call gc_collect_cycles() every 1000 items
- Daemon with strict latency requirements: disable GC, collect at scheduled low-traffic times
- CLI script processing < 100 items: GC is irrelevant — leave defaults

## Performance Considerations

- Default GC probability: 1% (gc_probability=1, gc_divisor=100)
- GC enabled but rarely triggered: <0.1% CPU overhead
- GC running frequently (root buffer always > threshold): 1-5% CPU overhead
- gc_disable(): eliminates GC CPU overhead entirely — but cycles accumulate
- gc_collect_cycles() explicit call: 1-50ms per call
- Memory growth without GC: cycles accumulate at 100-1000 roots per request — OOM in hours for Octane

## Security Considerations

- Disabling GC can lead to OOM — availability concern
- OOM from accumulated cycles affects all requests sharing the same worker
- No direct security vulnerability from GC configuration, but OOM is a denial-of-service risk

## Related Rules (from 05-rules.md)

- Never Disable GC Entirely in Production
- Tune GC Threshold for Long-Running Workers
- Call gc_collect_cycles() Strategically After Batch Operations

## Related Skills

- GC Threshold Tuning
- GC Algorithm and Cycle Collection
- Memory Leak Detection Patterns

## Success Criteria

- GC strategy matched to workload type
- If disabled: explicit collection plan in place and tested
- 24-hour test confirms memory stability
- GC CPU overhead acceptable (<1% of total)
- Configuration documented with rationale
