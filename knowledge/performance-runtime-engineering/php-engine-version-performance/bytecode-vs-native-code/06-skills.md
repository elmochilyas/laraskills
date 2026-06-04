# Skill: Assess Whether JIT Native Code Compilation Benefits a Given Code Path

## Purpose

Determine if a specific code path is CPU-bound enough to benefit from JIT's native code compilation, and measure the before/after impact.

## When To Use

- Evaluating whether to enable or disable JIT for a specific endpoint or job
- Tuning JIT mode (tracing vs function) for a workload
- Deciding if JIT buffer size needs adjustment for a particular hot path

## When NOT To Use

- For I/O-bound code paths where PHP execution time is <30% of wall time
- For single-execution CLI scripts where compilation overhead never amortizes
- When OpCache is not yet configured (JIT requires OpCache foundation)

## Prerequisites

- OpCache enabled and optimally configured
- JIT enabled with tracing mode (1254) and 128MB buffer
- Profiling tool to measure PHP execution time vs I/O wait time
- Access to benchmark tools for before/after comparison

## Inputs

- Target code path or endpoint URL
- Profiling data showing PHP execution time vs I/O wait breakdown
- Current JIT configuration (mode, buffer size)
- Number of times the code path executes per worker lifetime

## Workflow (numbered steps)

1. Profile the target code path to determine PHP execution time as percentage of wall time
2. If PHP execution time <30% of wall time, JIT benefit will be minimal (0-5%) — proceed only if CPU-bound
3. Classify the code: loop-heavy (tracing JIT benefits), function-call-heavy (function JIT benefits), or mixed
4. Disable JIT (opcache.jit=0) and run a benchmark to establish baseline
5. Enable tracing JIT (opcache.jit=1254) and re-run the same benchmark
6. Compare results: if throughput improves >5%, JIT is beneficial for this workload
7. Optionally test function JIT (opcache.jit=1205) for function-heavy workloads
8. Monitor JIT buffer utilization: if free space <20%, increase jit_buffer_size
9. If no significant improvement, keep JIT enabled anyway (harmless overhead 0-2%) but do not prioritize further JIT tuning

## Validation Checklist

- [ ] PHP execution time measured as percentage of wall time
- [ ] Baseline benchmark with JIT disabled completed
- [ ] Benchmark with tracing JIT (1254) completed
- [ ] Benchmark with function JIT (1205) completed if applicable
- [ ] JIT buffer utilization verified (free >20%)
- [ ] Results compared: identify if JIT provides >5% improvement

## Common Failures

- **Expecting JIT to fix I/O problems**: JIT only accelerates CPU execution — slow database queries or API calls are unaffected
- **Wrong mode for workload**: Using function JIT for loop-heavy code or tracing JIT for method-heavy code suboptimizes results
- **Undersized buffer**: If buffer is full, hot paths get evicted and never benefit from compilation
- **No OpCache foundation**: JIT reads from OpCache — if OpCache has high miss rate, JIT has nothing to compile

## Decision Points

- If PHP execution >50% of wall time: JIT is likely to provide significant (20%+) improvement
- If PHP execution 30-50%: moderate improvement (5-20%)
- If PHP execution <30%: minimal improvement (0-5%) — keep enabled but don't tune further
- If loop-heavy: prefer tracing JIT (1254). If function-call-heavy: prefer function JIT (1205)

## Performance Considerations

- JIT compilation overhead: 50-500µs per hot function, amortized over thousands of calls
- Once compiled, native code runs 2-10x faster than interpreted opcodes for CPU-bound operations
- Guard failures cause bailout to interpreter — type-stable code benefits most

## Security Considerations

- JIT does not alter PHP's security model — it only changes execution speed
- JIT-buffer memory is per-worker, not shared — no cross-worker information disclosure risk
- JIT blacklist (PHP 8.5+) can exclude specific functions from compilation if needed

## Related Rules (from 05-rules.md)

- Enable JIT Universally, Then Benchmark
- Configure OpCache Before JIT
- Use Tracing JIT (1254) as Default
- Monitor JIT Buffer Utilization
- Pre-warm JIT in Long-Running Processes

## Related Skills

- JIT Configuration for Production
- Workload Benefit Assessment
- Benchmark Design and Execution

## Success Criteria

- JIT benefit quantified as percentage improvement in throughput or latency
- Baseline and post-JIT benchmarks documented with environment details
- JIT mode selection justified by workload profile
- Buffer sizing verified adequate for the compiled code
