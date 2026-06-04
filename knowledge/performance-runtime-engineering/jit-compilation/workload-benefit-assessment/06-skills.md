# Skill: Assess Whether a Workload Benefits from JIT Compilation

## Purpose

Determine, through profiling and benchmarking, whether a specific workload (web request, queue job, CLI script, batch process) benefits from PHP's JIT compilation.

## When To Use

- Evaluating whether to enable JIT for a specific application or service
- Deciding JIT tuning priority across multiple workloads
- Building a business case for enabling JIT on production servers

## When NOT To Use

- When JIT is already enabled and no decision needs to be made
- For workloads that are entirely I/O-bound (database, network, file I/O)
- When OpCache is not yet configured (configure OpCache first)

## Prerequisites

- PHP 8.0+ with OpCache enabled and optimally configured
- Profiling tool to measure PHP execution time vs I/O wait
- Benchmarking capability for before/after comparison
- Access to php.ini for JIT enable/disable

## Inputs

- Workload description (web API, queue worker, CLI batch job, cron task)
- Profiling data showing PHP execution vs I/O wait breakdown
- Baseline benchmark metrics (without JIT)
- Number of times the workload executes per worker lifetime (amortization potential)

## Workflow (numbered steps)

1. Profile the workload to determine PHP execution time as a percentage of total wall time
2. If PHP execution <20% of wall time: JIT benefit is minimal (0-5%) — proceed to step 8 to confirm
3. If PHP execution 20-50%: moderate JIT benefit potential (5-20%)
4. If PHP execution >50%: high JIT benefit potential (20-95%)
5. Characterize the PHP execution type: computation-heavy (algorithms, data processing), object-heavy (framework bootstrap), or mixed
6. Disable JIT and run a benchmark to establish baseline
7. Enable tracing JIT (1254) and re-run the same benchmark
8. Compare throughput and latency — if improvement >5%, JIT is beneficial for this workload
9. If improvement is <5% but the workload runs on background workers (queue, cron), still enable JIT — improvement compounds over thousands of executions
10. Document the assessment results for future reference

## Validation Checklist

- [ ] PHP execution vs I/O wait measured
- [ ] Execution type characterized (computation, object-heavy, mixed)
- [ ] Baseline benchmark without JIT completed
- [ ] Benchmark with tracing JIT completed
- [ ] JIT benefit quantified as percentage improvement
- [ ] Decision documented: enable, keep enabled, or prioritize tuning

## Common Failures

- **Assessing web requests only**: Even if web requests are I/O-bound, queue workers and cron jobs often benefit significantly from JIT
- **Not considering execution count**: A function called 10 times never benefits; a function called 10,000 times shows significant improvement
- **Benchmarking with I/O-bound workload**: If profiling already shows I/O dominates, skip benchmarking and enable JIT anyway (harmless overhead)
- **Expecting linear improvement**: JIT benefit depends on code complexity and type stability — not all CPU-bound code benefits equally

## Decision Points

- If PHP execution >50%: JIT is high priority — invest time in mode tuning and buffer sizing
- If PHP execution 20-50%: JIT is beneficial — enable with defaults and monitor
- If PHP execution <20%: JIT provides minimal benefit for this workload — enable but don't invest tuning time
- If workload runs on background workers: always enable JIT — even 5% improvement compounds over millions of job executions

## Performance Considerations

- JIT provides 61-95% gain for pure CPU-bound code (matrix operations, data transformation, image processing)
- JIT provides 0-5% gain for typical web requests (database queries dominate wall time)
- JIT compilation overhead: 50-500µs per hot function, requires thousands of calls to amortize
- The primary source of JIT speedup is guard elimination — type-stable code benefits most

## Security Considerations

- JIT does not alter PHP's security model or execution semantics
- Enabling JIT on all workloads has no security drawbacks
- No special security considerations for workload assessment

## Related Rules (from 05-rules.md)

- Enable JIT Universally, Then Benchmark
- Configure OpCache Before JIT — Never Tune JIT First
- Keep JIT Enabled on Queue and Cron Workers
- Use Tracing JIT (1254) as Default — Switch Only After Profiling

## Related Skills

- JIT Configuration for Production
- JIT Mode Comparison
- Bytecode vs Native Code Assessment
- Profiling vs Monitoring

## Success Criteria

- Workload CPU-bound proportion accurately measured
- JIT benefit quantified with before/after benchmark
- Assessment documented with profiling data
- Decision made: prioritize JIT tuning, enable with defaults, or confirm minimal impact
