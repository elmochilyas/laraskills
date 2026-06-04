# Standardized Knowledge: JIT Hot Path Threshold Tuning

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | JIT Hot Path Threshold Tuning |
| Difficulty | Intermediate |
| Lifecycle | Configure, Tune |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

JIT compilation triggers only after code crosses hotness thresholds. jit_hot_loop (default 64 iterations) controls loop compilation. jit_hot_func (default 100 calls) controls function compilation. Lower thresholds trigger JIT sooner (faster acceleration of hot code) but increase compilation overhead. Higher thresholds delay JIT but avoid wasting compilation on rarely-executed paths.

## Core Concepts

- **jit_hot_loop**: Number of loop iterations before the loop body is compiled. Lower values (8-16) for loop-heavy workloads; higher (64-128) to avoid compiling loops that run infrequently.
- **jit_hot_func**: Number of function calls before compilation. Lower values (20-50) for hot function optimization; higher (100-200) for conservative memory usage.
- **Trigger Type (T in CRTO)**: Determines when compilation starts. T=5 (default) triggers after trigger counter reaches threshold, allowing profiling data collection before compilation.
- **Trigger Counter**: Tracks how many times a candidate code segment has been encountered. Resets after compilation.

## When To Use

- Tuning JIT for specific workload patterns (loop-heavy vs function-call-heavy)
- Reducing warm-up time for latency-sensitive services
- Minimizing JIT memory overhead in constrained environments
- Optimizing for long-running processes where warm-up is amortized

## When NOT To Use

- Default thresholds (64/100) are appropriate for most applications
- Without understanding the workload (profile first)
- When JIT buffer utilization is already the primary constraint

## Best Practices

- **Lower thresholds for hot paths**: If profiling shows specific loops/functions dominate execution time, lower thresholds to compile them faster.
- **Raise thresholds for memory conservation**: Higher thresholds reduce the number of compiled functions, saving JIT buffer space.
- **Profile trigger counters**: Check opcache_get_status()['jit'] to see how many functions are crossing triggers. If count is very high, thresholds may be too low.
- **Match thresholds to workload**: Loop-heavy workloads benefit from lower jit_hot_loop. Function-call-heavy workloads benefit from lower jit_hot_func.
- **Pre-warm in persistent workers**: In Octane/RoadRunner/FrankenPHP, execute representative requests at startup to trigger compilation before traffic arrives.

## Architecture Guidelines

- **Compilation Delay**: With default thresholds (T=5), compilation is delayed by N trigger counts to collect profiling data. This means the first N executions of a hot path run in the interpreter.
- **Warm-Up Period**: In PHP-FPM with pm.max_requests=500, if jit_hot_func=100, a function called once per request needs 100 requests before it's compiled. The remaining 400 requests benefit from JIT.
- **Trigger Counter Reset**: After compilation, the trigger counter resets. If compiled code is evicted from the buffer (due to overflow), it won't be re-compiled until the counter reaches the threshold again.
- **False Positive Avoidance**: PHP 8.3+ improved trigger detection to reduce compiling cold code that happened to be in a hot trace.

## Performance Considerations

- Lower thresholds improve steady-state throughput but increase warm-up time and compilation memory
- Higher thresholds reduce JIT memory fragmentation at the cost of missing some optimization opportunities
- PHP 8.3+ improved trigger detection to reduce false positives
- In long-running processes, thresholds primarily affect warm-up time, not steady-state performance

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Setting thresholds too low | Wanting maximum optimization | Excessive compilation, buffer thrashing | Start with defaults; lower only if profiling shows need |
| Not accounting for pm.max_requests | Short-lived workers | JIT never reaches steady state before worker recycles | Lower thresholds in high-turnover environments |
| Ignoring warm-up in latency metrics | Measuring immediately after start | JIT benefit appears lower than actual | Warm up workers before benchmarking |
| Using same thresholds for all runtimes | Copying settings blindly | Different worker lifetimes need different thresholds | Tune per runtime (FPM vs Octane) |

## Anti-Patterns

- **Tuning thresholds before buffer size**: Buffer thrashing from small buffer is more impactful than threshold tuning. Fix buffer size first.
- **Expecting instant JIT benefit**: JIT needs time to identify and compile hot paths. Warm-up is inherent to the design.
- **Lowering thresholds without monitoring buffer utilization**: More compiled code = more buffer pressure. Ensure buffer can accommodate.

## Examples

```ini
; php.ini — Default thresholds (balanced)
opcache.jit=1254
opcache.jit_buffer_size=128M

; Loop-heavy workload (templating, data processing)
opcache.jit=1254
opcache.jit_buffer_size=256M
;jit_hot_loop=16  ; compile loops after 16 iterations
;jit_hot_func=200 ; higher function threshold saves buffer space

; Function-call-heavy (ORM, domain logic)
opcache.jit=1205
opcache.jit_buffer_size=256M
;jit_hot_loop=128 ; higher loop threshold saves buffer
;jit_hot_func=50  ; compile functions after 50 calls
```

## Related Topics

- JIT Configuration for Production
- CRTO Bitmask Reference
- JIT Buffer Sizing Guidelines
- JIT for Long-Running Processes

## AI Agent Notes

- Default thresholds (jit_hot_loop=64, jit_hot_func=100) are balanced for most workloads.
- Lower thresholds = faster compilation but more memory pressure.
- Higher thresholds = less compilation but slower hot-path acceleration.
- In long-running processes (Octane), thresholds mainly affect warm-up time, not steady-state.
- Always pre-warm workers before accepting traffic to avoid cold-start JIT latency.

## Verification

- [ ] Default thresholds tried first (64/100)
- [ ] Workload profile analyzed (loop-heavy vs function-call-heavy)
- [ ] Thresholds adjusted based on workload if needed
- [ ] Buffer utilization monitored after threshold change
- [ ] Warm-up requests configured for latency-sensitive services
- [ ] Thresholds tuned per runtime (FPM vs Octane) if applicable
