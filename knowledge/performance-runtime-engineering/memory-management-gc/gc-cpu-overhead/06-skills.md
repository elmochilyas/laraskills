# Skill: Diagnose and Optimize GC CPU Overhead

## Purpose

Identify when PHP's cycle collector is wasting CPU, then apply the appropriate mitigation (disable, tune, or fix references) based on runtime type and workload characteristics.

## When To Use

- Flame graphs show `gc_collect_cycles` in the top 10 functions
- Octane workers show increasing GC time per request
- Profiling review reveals GC > 3% of execution time
- Preparing a performance optimization pass on a stable application

## When NOT To Use

- Applications where GC has never appeared in profiling
- Development or staging environments without representative traffic patterns
- Applications already using WeakReference patterns throughout

## Prerequisites

- Flame graph or sampling profiler output (Xdebug, Blackfire, Tideways)
- PHP 7.3+ for `gc_status()` function
- Understanding of the runtime type (FPM vs Octane/Swoole)

## Inputs

- Flame graph showing `gc_collect_cycles` percentage
- `gc_status()` output over time
- Root buffer size (`roots` field)
- Number of cycles collected per run
- Runtime type and worker lifecycle configuration

## Workflow (numbered steps)

1. Profile the application with representative traffic. Identify if `gc_collect_cycles` appears and what % of CPU it consumes.
2. Call `gc_status()` at request end and log the output. Collect at least 1,000 samples.
3. Calculate the **collection efficiency ratio**: `collected / runs`. If < 0.1 (fewer than 1 cycle collected per 10 runs), GC is mostly wasted.
4. Determine runtime type:
   - **PHP-FPM**: GC can be disabled globally (`gc_probability = 0`). Re-enable only for cycle-heavy batch jobs.
   - **Octane/Swoole**: GC must remain enabled. Instead, fix the circular references that inflate the root buffer.
5. For Octane: instrument `gc_status()` in per-request metrics. Set an alert when `roots > 10000` or GC time > 3% of request time.
6. Identify circular references in the codebase: look for parent-child bidirectional relationships, ORM entity graphs with reciprocal relations, and event subscriber patterns.
7. Replace one side of each cycle with `WeakReference`. The child holds a WeakReference to the parent instead of a strong reference.
8. After fixes, re-profile. Verify root buffer size decreased and GC overhead dropped below 1%.
9. If GC overhead remains high despite cycle fixes, tune `gc_threshold` to match typical allocation count.
10. Document the GC configuration, root buffer baseline, and maintenance procedure in the team runbook.

## Validation Checklist

- [ ] GC CPU overhead measured before any changes
- [ ] Collection efficiency ratio calculated (`collected / runs`)
- [ ] Decision made: disable (FPM) or fix cycles (persistent runtime)
- [ ] Circular references identified and converted to WeakReference where appropriate
- [ ] Root buffer size decreased by at least 50% after cycle fixes
- [ ] GC overhead re-profiled and confirmed below 2%
- [ ] Long-running workers show stable GC metrics over 10,000+ requests

## Common Failures

- **Disabling GC in Octane**: This "fix" causes unbounded memory growth that appears hours later as worker OOM. Always fix the cycles, not the collector.
- **Fixing cycles without verifying**: Converting a strong reference to WeakReference changes semantics. The referenced object may be freed prematurely if only the WeakReference holds it.
- **Only profiling one workload**: A batch import creates many more circular references than a typical web request. Profile both.
- **Not re-profiling after changes**: GC overhead can shift from 5% to 0.5% — or from 5% to 8% if the fix was wrong. Always verify.

## Decision Points

- GC < 2% CPU → No action needed
- GC 2-5% CPU, FPM → Set `gc_probability = 0`
- GC 2-5% CPU, persistent runtime → Fix circular references via WeakReference
- GC > 5% CPU, persistent runtime → Fix cycles AND tune threshold. If still high, reduce `max_requests`
- Collection efficiency ratio < 0.1 → GC is wasted; disable or fix cycles

## Performance Considerations

- `gc_collect_cycles()` duration is proportional to root buffer size. At 10,000 roots: ~100µs. At 100,000 roots: ~1ms.
- The collection probability check (0.1% per allocation) is negligible (~5ns).
- Re-enabling GC temporarily for batch operations adds ~50µs per collection call. This is acceptable for workloads where GC provides value.
- In Octane, the root buffer grows linearly with requests served since last recycle. Set `max_requests` such that root buffer stays below 20,000 entries.

## Security Considerations

- Disabling GC in a process that later handles user data with circular references can cause memory growth that degrades other tenants on the same host.
- A crafted attack that creates artificial circular references can inflate root buffer and degrade GC performance as a denial-of-service vector.
- Always pair GC configuration with monitoring. An unexpected spike in GC overhead may indicate malicious input.

## Related Rules (from 05-rules.md)

- Profile GC overhead before tuning
- Disable GC for PHP-FPM request-scoped workloads
- Fix circular references instead of disabling GC in persistent runtimes
- Call gc_collect_cycles() explicitly after batch operations

## Related Skills

- GC Telemetry and Root Buffer Monitoring
- WeakReference API Usage
- Octane Memory Management

## Success Criteria

- GC overhead reduced from baseline (target: < 2% CPU)
- Root buffer size stable in persistent runtimes (< 5,000 entries)
- Zero memory leaks attributable to GC misconfiguration
- GC configuration documented and version-controlled
