# Skill: Design and Execute Benchmarking with Correct Terminology and Metrics

## Purpose
Plan, execute, and report performance benchmarks using the four core metrics (throughput, latency percentiles, error rate, resource utilization) with proper statistical methodology — avoiding coordinated omission, ensuring adequate sample sizes, and providing actionable performance data.

## When To Use
- Establishing baseline performance metrics for a system
- Comparing performance across configurations, versions, or architectures
- Setting SLO targets based on measured capability
- Validating performance requirements before production deployment

## When NOT To Use
- When measurement overhead distorts system behavior (use sampling)
- For debugging specific performance issues (use profiling instead)
- Without a production-representative environment

## Prerequisites
- Dedicated benchmarking environment (isolated from production)
- Benchmarking tools: wrk2 and/or k6 installed
- Understanding of throughput, latency percentiles, and coordinated omission
- Defined hypothesis or question the benchmark will answer

## Inputs
- Target endpoints to benchmark
- Expected traffic patterns (RPS, concurrency)
- Environment specifications (CPU, RAM, network)

## Workflow

### 1. Define Benchmark Hypothesis and Metrics
- State the question: "Is Config A faster than Config B?" or "What is the maximum throughput?"
- Select the four core metrics to report: throughput (RPS), latency (p50/p95/p99), error rate (%), resource utilization (CPU%, memory)
- Determine target percentile and required sample size: p95 needs 1000+ samples, p99 needs 10000+
- Document the hypothesis and metrics before running any tests

### 2. Prepare the Environment
- Use dedicated hardware with no competing workloads
- Pin CPU frequency, disable turbo boost
- Use a fixed, production-representative dataset (not random)
- Isolate the network from external interference
- Verify the load generator can saturate the target system (more powerful than SUT)

### 3. Run Warm-Up Phase
- Execute 30-60 seconds (1000-5000 requests) of traffic before recording data
- Use a simple endpoint for warm-up (not the benchmark endpoint, to avoid cache pollution)
- Discard warm-up data entirely — it represents cold-state, not steady-state
- Confirm OpCache/JIT is populated and database connections are established

### 4. Execute Benchmark Runs
- Run minimum 3 iterations per configuration
- Use open-loop tools (wrk2 with `--rate`, k6 with constant arrival rate) for latency measurement
- Use closed-loop tools (wrk without `--rate`) only for maximum throughput discovery
- Collect all four metrics: RPS, latency (p50/p95/p99), error rate, CPU/memory
- Save HDR histogram output for post-processing

### 5. Report Results with Full Methodology
- Report all four core metrics together — never a single metric in isolation
- Include sample size, tool version, environment details
- State whether open-loop or closed-loop was used
- Compare against baseline if available
- Include confidence intervals where possible

## Validation Checklist
- [ ] Four core metrics reported (throughput, latency, error rate, resources)
- [ ] Warm-up phase included (30-60s, data discarded)
- [ ] Open-loop tool used for latency measurement
- [ ] Minimum 3 iterations per configuration
- [ ] Sample size requirements met (1000+ for p95, 10000+ for p99)
- [ ] Environment controlled (dedicated hardware, fixed dataset)
- [ ] Loop type documented in report

## Common Failures
- Reporting only average latency (hides outliers)
- No warm-up (20-50% inflated latency)
- Using closed-loop tools for latency (coordinated omission)
- Insufficient sample size (unreliable percentiles)

## Related Rules
- Four core metrics together (`05-rules.md:1`)
- Open-loop for latency (`05-rules.md:26`)
- Warm-up before recording (`05-rules.md:50`)
- Minimum sample sizes (`05-rules.md:75`)
- No ab for production (`05-rules.md:99`)

## Related Skills
- Metrics Definition and Interpretation
- Coordinated Omission
- Methodology Warmup Sample Size
- Tool Selection by Layer

## Success Criteria
- Benchmark methodology documented with warm-up, tool, loop type, and environment
- All four core metrics reported for every benchmark run
- At least 3 iterations per configuration with median reported
- Sample size meets statistical requirements for target percentile
- Results are reproducible in the same environment
