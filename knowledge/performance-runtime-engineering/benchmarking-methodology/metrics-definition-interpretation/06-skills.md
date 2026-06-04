# Skill: Define, Collect, and Interpret Four Core Performance Metrics

## Purpose
Define and interpret the four core performance metrics — throughput (RPS), latency percentiles (p50/p95/p99), error rate (%), and resource utilization (CPU%, memory) — as a unified system, understanding their trade-offs (capacity vs latency, resource budgets), avoiding p50-only bias, and making correct system capacity decisions.

## When To Use
- Every performance benchmark — these four metrics are the minimum standard
- Capacity planning and resource budgeting
- SLO definition and monitoring configuration
- Performance regression detection and diagnosis

## When NOT To Use
- Non-performance functional testing
- Profiling focused on code-level optimization

## Prerequisites
- Benchmarking data from wrk2, k6, or equivalent tool
- System monitoring data (CPU, memory from htop, Grafana, etc.)
- Understanding of percentile statistics

## Inputs
- Raw benchmark results (requests, latencies, errors)
- System monitoring data during benchmark
- Target SLO thresholds

## Workflow

### 1. Collect Throughput (RPS)
- Measure at application layer with benchmarking tool
- Distinguish from raw TCP connections — measure actual request completions
- Report alongside latency: 500 RPS at p50=50ms is different from 500 RPS at p50=500ms
- Normalize by server count: 1000 RPS across 5 servers = 200 RPS/server

### 2. Collect Latency Percentiles
- Always report p50, p95, and p99 together
- Never report p50 alone — it hides 90% of problems
- p50/p99 ratio indicates consistency: ratio >5 = high variability
- Compare p50 vs p99 at different throughputs to find saturation point
- When p99 rises while p50 stays flat: queuing is building, saturation is near

### 3. Collect Error Rate
- Error rate = total errors / total requests × 100
- Report as percentage (not count)
- Errors during benchmark invalidate latency and throughput data
- Classify error types: 4xx (client), 5xx (server), timeout, connection reset
- Error >2%: investigate root cause, rerun benchmark

### 4. Collect Resource Utilization
- Record CPU% and memory during the benchmark — not just at start/end
- Report utilization at the throughput level: "70% CPU at 1000 RPS"
- CPU 100% = system is at capacity regardless of other metrics
- Memory trending upward during benchmark = memory leak risk
- Monitor per-core CPU balance — one saturated core causes throttling

### 5. Interpret Metrics Together
- All four metrics must be interpreted as a system:
  - High RPS + high latency + 100% CPU = system saturated (need more workers/capacity)
  - Low RPS + high latency + low CPU = bottleneck elsewhere (DB, network, lock)
  - Low RPS + normal latency + high memory = memory-bound (check RSS)
  - High errors + normal latency + normal resources = application configuration issue
- Cross-reference: never diagnose from one metric alone

### 6. Produce Standard Report
- Include all four metrics in a single table
- Document: loop type (open vs closed), tool version, environment
- Include sample size for confidence assessment
- Include baseline comparison if available

## Validation Checklist
- [ ] All four metrics collected: throughput, latency (p50/p95/p99), error rate, resources
- [ ] Latency reported as percentiles, not average
- [ ] Error rate included and validated (<2%)
- [ ] Resource utilization collected during benchmark window
- [ ] Metrics interpreted as a system, not in isolation
- [ ] Standard report produced with methodology documentation

## Related Rules
- Report all four metrics together (`05-rules.md:1`)
- p50/p95/p99 — never average (`05-rules.md:26`)
- Interpret metrics as system (`05-rules.md:52`)
- Normalize throughput by server count (`05-rules.md:79`)
- Error rate invalidates other metrics (`05-rules.md:106`)

## Related Skills
- Benchmarking Concepts
- Methodology Warmup Sample Size
- SLO Definition and Error Budgets
- Performance Regression Detection

## Success Criteria
- All four core metrics collected and reported for every benchmark
- Metrics interpreted together as a unified system
- p50/p95/p99 reported — never average latency
- Error rate validated and <2%
- Reports include loop type, tool version, and environment documentation
