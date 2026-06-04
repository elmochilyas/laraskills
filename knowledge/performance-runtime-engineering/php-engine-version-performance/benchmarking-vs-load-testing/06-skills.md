# Skill: Design and Execute a Benchmark vs Load Test Campaign

## Purpose

Establish reliable throughput and latency baselines using benchmarking, then validate system behavior under realistic conditions using load testing.

## When To Use

- Evaluating performance impact of a code change, upgrade, or configuration tuning
- Establishing baseline metrics before and after optimization
- Validating SLO compliance before production deployment

## When NOT To Use

- For debugging specific performance issues (use profiling instead)
- When the environment is not production-representative
- For quick smoke tests where only basic validation is needed

## Prerequisites

- Access to a production-like staging environment
- wrk2 and k6 installed on the load generator machine
- Target endpoint or user journey identified
- Baseline metrics from previous runs (if available)

## Inputs

- Target URL(s) and HTTP methods
- Expected throughput range (RPS estimate)
- Concurrency level and test duration
- Performance SLOs (p95 latency, error rate, throughput)

## Workflow (numbered steps)

1. Define the benchmark scope: single endpoint, fixed concurrency, open-loop (wrk2) with constant rate
2. Configure wrk2 with appropriate threads, connections, rate, and duration
3. Run a 30-second warm-up phase to populate OpCache/JIT caches (discard this data)
4. Execute the measurement phase (60+ seconds) and capture raw output
5. Parse results for throughput (RPS), latency distribution (p50/p95/p99), and error rate
6. Design the load test: multi-stage scenario with ramp-up, steady-state, and spike phases
7. Write a k6 script with realistic think times, multiple endpoints, and threshold assertions
8. Execute the load test and monitor system resources (CPU, memory, I/O) during the run
9. Compare results against baselines and SLOs — regression if latency increased >5% or throughput dropped >5%
10. Document findings including environment details, tool versions, and raw results

## Validation Checklist

- [ ] Warm-up phase completed before measurement (30s+)
- [ ] Open-loop (constant-rate) model used for latency measurement
- [ ] Both p50 and p95/p99 latency percentiles reported
- [ ] Error rate tracked alongside throughput
- [ ] Resource metrics (CPU, RAM, I/O) captured during test
- [ ] At least 3 runs performed to assess variance
- [ ] Load test includes realistic user journeys, not single endpoint
- [ ] Results stored with environment metadata for reproducibility

## Common Failures

- **Coordinated omission**: Closed-loop tools (wrk, ab) underestimate tail latency by 30-60% under saturation
- **No warm-up**: Cold caches inflate latency by 20-50%, producing non-reproducible results
- **Hello World endpoints**: Results are 10-100x better than production, hiding real bottlenecks
- **Single run conclusions**: System noise causes 5-15% variance; multiple runs required for statistical significance

## Decision Points

- If benchmarking for capacity planning ceiling, use closed-loop tool to find max RPS
- If benchmarking for user-facing latency SLOs, use open-loop tool (wrk2, k6)
- If testing system breaking point, include spike stage in load test
- If validating gradual degradation, extend steady-state phase to 10+ minutes

## Performance Considerations

- Load generator machine must not be the bottleneck — use dedicated hardware with more resources than target
- Network latency between generator and target adds to measured latency — minimize distance
- PHP-FPM with 100ms+ response times limits throughput to ~10 RPS per worker — size concurrency accordingly

## Security Considerations

- Coordinate with security team before load testing — may trigger DDoS protection
- Never run write-heavy benchmarks against production databases
- Isolate benchmark environment from production network
- Anonymize any request data captured during testing

## Related Rules (from 05-rules.md)

- Warm Up Before Measuring
- Report Both p50 and p95/p99 Latency, Not Just Average
- Benchmark with Realistic Workloads, Not Synthetic Endpoints
- Use Open-Loop Models for Tail Latency
- Benchmark Against a Known Baseline

## Related Skills

- Metrics Definition and Interpretation
- Coordinated Omission Avoidance
- CI Performance Regression Detection

## Success Criteria

- Benchmark produces reproducible results within 5% variance across 3 runs
- Load test validates system meets SLOs under peak expected traffic
- Report documents throughput, p50/p95/p99 latency, error rate, and resource utilization
- Findings actionable: specific optimizations prioritized based on data
