# Skill: Compare and Select Between JIT Modes for a Specific Workload

## Purpose

Run a systematic comparison of tracing JIT (1254), function JIT (1205), and max JIT (1235) modes to select the optimal mode for a given workload.

## When To Use

- JIT is enabled but the default tracing mode may not be optimal for the workload
- Before/after benchmark shows room for improvement with a different JIT mode
- Evaluating JIT mode for a specific CPU-bound batch job or queue worker

## When NOT To Use

- For initial JIT setup (start with tracing 1254 as default)
- When the workload is I/O-bound and JIT benefit is minimal regardless of mode
- Without first confirming OpCache is optimally configured

## Prerequisites

- PHP 8.0+ with OpCache enabled and hit rate >99%
- Benchmarking tools for before/after comparison
- Profiling data showing workload characteristics (loop vs function heavy)
- JIT buffer of adequate size (128MB+)

## Inputs

- Workload profile: CPU-bound proportion, loop vs function-call-heavy
- Baseline benchmark (JIT disabled)
- Current JIT configuration and buffer utilization

## Workflow (numbered steps)

1. Profile the workload to determine if it is loop-heavy (tracing preferred) or function-call-heavy (function JIT preferred)
2. Disable JIT and run a benchmark to establish baseline without JIT
3. Enable tracing JIT (opcache.jit=1254) and run the same benchmark
4. Enable function JIT (opcache.jit=1205) and run the same benchmark
5. If buffer allows, enable max JIT (opcache.jit=1235) and run the same benchmark
6. Compare throughput, latency, and error rate across all modes for the same workload
7. Check JIT buffer utilization after each mode — max mode compiles more aggressively and may use more buffer
8. If all JIT modes provide similar improvement (<5% difference), stay with tracing (1254) — it has the lowest compilation overhead
9. If function JIT provides >5% better throughput than tracing for function-heavy workloads, switch to function mode
10. Document the comparison results and selected mode with rationale

## Validation Checklist

- [ ] Workload profiled for loop vs function-call characteristics
- [ ] Baseline benchmark without JIT completed
- [ ] Tracing JIT (1254) benchmark completed
- [ ] Function JIT (1205) benchmark completed
- [ ] Max JIT (1235) benchmark completed (if applicable)
- [ ] Buffer utilization compared across modes
- [ ] Optimal mode selected with documented rationale

## Common Failures

- **Not profiling workload characteristics**: Without knowing whether the workload is loop or function heavy, mode selection is guessing
- **Using max mode everywhere**: Max mode has highest compilation overhead and buffer usage — benchmark before using
- **Comparing modes with different buffer sizes**: Buffer size differences affect compilation volume — keep buffer constant across tests
- **Insufficient warmup for each mode**: JIT needs time to reach steady state after mode changes — warm up thoroughly

## Decision Points

- Loop-heavy workload (tight loops, array iterations): tracing JIT (1254)
- Function-call-heavy workload (many method calls, deep call stacks): function JIT (1205)
- Mixed workload with tight memory constraints: tracing JIT (1254) — lower buffer usage
- CPU-bound batch processing with ample memory: test max JIT (1235) — highest potential gain

## Performance Considerations

- Tracing JIT: 61-95% gain for loop-heavy CPU code, moderate buffer usage
- Function JIT: better for method-heavy code, may use more buffer for whole-function compilation
- Max JIT: highest potential gain but requires 2x+ buffer and has higher compilation overhead
- All modes provide 0-5% gain for I/O-bound workloads — mode choice matters primarily for CPU-bound code

## Security Considerations

- JIT mode changes do not affect PHP's security model
- Max JIT mode compiles more aggressively but does not change execution semantics
- No security implications from selecting between tracing, function, or max modes

## Related Rules (from 05-rules.md)

- Use Tracing JIT (1254) as Default — Switch Only After Profiling
- Configure OpCache Before JIT
- Monitor JIT Buffer Utilization

## Related Skills

- CRTO Bitmask Reference
- JIT Configuration for Production
- Workload Benefit Assessment
- Type Inference and Guard Elimination

## Success Criteria

- All JIT modes benchmarked on the same workload with same buffer size
- Optimal mode selected based on benchmark data
- Buffer utilization acceptable for selected mode
- Mode selection rationale documented
