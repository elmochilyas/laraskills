# Skill: Tune JIT Hot Path Thresholds for Workload-Specific Compilation

## Purpose

Adjust JIT compilation triggers (jit_hot_loop, jit_hot_func, jit_max_*_counts) to balance compilation overhead with execution speedup for a specific workload.

## When To Use

- JIT is enabled but hot paths are not being compiled (check jit_hot_func/hot_loop metrics)
- Compilation overhead is too high (too many functions compiled that are rarely called)
- Tuning for a specific workload pattern (e.g., many short-lived functions vs few long-running functions)

## When NOT To Use

- For initial JIT setup (default thresholds work well for most workloads)
- Without first profiling the workload to identify hot path characteristics
- When the JIT buffer is undersized (fix buffer first before tuning thresholds)

## Prerequisites

- JIT enabled and running in production
- Profiling data showing function call frequencies and loop iteration counts
- Understanding of jit_hot_loop (default 64) and jit_hot_func (default 100) trigger values

## Inputs

- Current JIT threshold configuration (php.ini)
- Profiling data: function call counts, loop iteration counts
- Current JIT buffer utilization
- Number of compiled functions vs total hot functions

## Workflow (numbered steps)

1. Profile the application to determine typical function call counts and loop iteration counts for hot paths
2. Check how many functions are currently JIT-compiled: `opcache_get_status(false)['jit']['compiled_funcs']`
3. If compiled_funcs is very low (<100) and the application has thousands of functions, thresholds may be too high
4. Reduce jit_hot_func from 100 to 50 to trigger compilation on more functions
5. Reduce jit_hot_loop from 64 to 32 to trigger compilation on shorter loops
6. Monitor JIT buffer utilization — lower thresholds increase the number of compiled functions and buffer usage
7. If buffer free drops below 20%, increase buffer size before reducing thresholds further
8. Benchmark before/after threshold changes to measure the impact on throughput
9. If throughput improves, keep the lower thresholds; if CPU increases due to compilation overhead, revert
10. Document the selected thresholds and the profiling data that justifies them

## Validation Checklist

- [ ] Current compiled function count measured
- [ ] Function call frequencies profiled
- [ ] Hot path thresholds adjusted based on workload profile
- [ ] Buffer utilization monitored after threshold change
- [ ] Before/after benchmark completed
- [ ] Threshold configuration documented with rationale

## Common Failures

- **Lowering thresholds too much**: Compiling rarely-called functions wastes buffer space and CPU on compilation that never amortizes
- **Raising thresholds for all workloads**: If hot functions are called 50 times, default threshold of 100 never triggers — JIT never benefits
- **Not monitoring buffer after threshold change**: More compilation = more buffer usage — may cause thrashing
- **Changing thresholds without benchmark**: Cannot determine if the change improved or degraded performance

## Decision Points

- If many functions are called 30-100 times but never cross the 100 threshold: reduce jit_hot_func to 50
- If short loops (8-32 iterations) are common but never cross the 64 threshold: reduce jit_hot_loop to 16
- If buffer is already >60% full: raise thresholds instead of lowering them to reduce compilation volume
- If CPU is the bottleneck: lower thresholds to compile more code; if memory is the bottleneck: raise thresholds

## Performance Considerations

- Each compiled function consumes ~1-5KB of JIT buffer space
- Compilation overhead per function: 50-500µs — must be amortized over 10+ executions to be worthwhile
- Default thresholds are conservative (bias toward not compiling) — tuning them is workload-dependent
- Lower thresholds increase total CPU spent on compilation but may reduce execution CPU

## Security Considerations

- Threshold changes do not affect PHP's security model
- JIT compilation of more functions does not introduce security vulnerabilities
- Monitor for unexpected behavior after threshold changes — compile more code may expose rare JIT bugs

## Related Rules (from 05-rules.md)

- Use Tracing JIT (1254) as Default
- Monitor JIT Buffer Utilization
- Pre-warm JIT in Long-Running Processes

## Related Skills

- JIT Configuration for Production
- Workload Benefit Assessment
- JIT Buffer Sizing Guidelines

## Success Criteria

- Hot path thresholds tuned based on workload profiling data
- Before/after benchmark shows improvement or confirms no regression
- JIT buffer utilization stays within acceptable range after tuning
- Threshold configuration documented with rationale
