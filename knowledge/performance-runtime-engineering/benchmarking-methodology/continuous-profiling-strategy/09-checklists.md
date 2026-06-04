# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** Continuous Profiling Strategy â€” Baseline Sampling, Burst Sampling on SLO Breach
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Adaptive sampling**: Sampling rate increases proportionally to error budget burn rate. 1x burn: 1 Hz. 5x burn: 10 Hz. 10x burn: 50 Hz. 20x burn: 100 Hz + immediate canary deployment.
- [ ] **Profile all production hosts**: Baseline profiles from all hosts establish normal behavior. Without baselines, you can't identify what changed during an incident.
- [ ] **Store profiles for comparison**: Keep profiles for 30+ days for historical comparison. Flame graph diffing between last week and today quickly reveals regressions.
- [ ] **Exclude health checks from profiling**: Health check endpoints generate traffic that dilutes profile data. Use endpoint filtering to focus on user-facing requests.
- [ ] **Integrate profiling with alerting**: When an alert fires, automatically trigger burst sampling on affected hosts. Include profile links in the alert notification.
- [ ] Baseline profiling configured at 1-5 Hz on all hosts
- [ ] Burst sampling triggered by SLO breach alerts
- [ ] Profiles stored for 30+ days for historical comparison
- [ ] Health check endpoints excluded from profiling
- [ ] Profiling integrated with incident alerting
- [ ] Baseline profiles established for all production hosts
- [ ] Profiling overhead <2% during normal operation
- [ ] Burst profiling captures diagnostic data automatically during SLO breaches
- [ ] Differential analysis identifies root cause within minutes
- [ ] Historical profiles enable week-over-week trend analysis
- [ ] Profiling agent installed on all production hosts at 1-5 Hz
- [ ] Baseline profiles established (1-2 weeks of data)
- [ ] Adaptive sampling configured by error budget burn rate
- [ ] Burst sampling triggered automatically by SLO breach alerts
- [ ] Profile data stored for 30+ days

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Closed-loop vs Open-loop**: Closed-loop tools (wrk, ab, hey) are simpler but systematically underestimate tail latency under load due to coordinated omission. Open-loop tools (wrk2, k6) are more complex but produce accurate latency distributions. Use closed-loop for quick throughput estimates; use open-loop for production-relevant latency data.
- [ ] **Synthetic vs Realistic benchmarks**: Synthetic benchmarks (single endpoint, fixed payload) are repeatable and useful for regression detection. Realistic benchmarks (user journey, variable think times) predict production behavior. Use both: synthetic in CI, realistic for capacity planning.
- [ ] **Sampling Profiler Mechanics**: Sampling profilers capture stack traces at intervals. 1 Hz captures 1 trace per second. 100 Hz captures 100 traces per second. The percentage of traces in each function approximates CPU time spent there.
- [ ] **eBPF-Based Profiling**: eBPF profilers (Parca, Pyroscope's eBPF mode) sample at the kernel level with near-zero overhead. They don't require code instrumentation. Best for always-on production profiling.
- [ ] **Agent-Based Profiling**: Blackfire and Tideways use PHP extensions to capture profiles. Higher overhead than eBPF but richer data (memory allocation, function arguments, database queries).
- [ ] **Storage and Retention**: Profiles generate significant data. 1 Hz sampling on 100 hosts produces ~8.6M stack traces per day. Store raw profiles for 7 days, aggregated profiles for 30+ days.
- [ ] Document and follow through on architectural decision: Continuous profiling adoption
- [ ] Ensure architecture aligns with core concept: **Baseline Sampling (1-5 Hz)**: Always-on, minimal overhead (<2% CPU). Collects CPU-hot functions, memory allocation hot spots, lock contention, GC activity. Establishes normal profiles by service endpoint.
- [ ] Ensure architecture aligns with core concept: **Burst Sampling (50-100 Hz)**: Triggered by SLO breach alerts. Captures detailed flame graphs during the incident window. Auto-disables when SLO is restored. Data preserved for post-mortem analysis.
- [ ] Ensure architecture aligns with core concept: **Tools**: Pyroscope (open source flame graphs), Parca (open source, eBPF-based), Blackfire (triggered production profiling), Tideways (always-on APM).
- [ ] Ensure architecture aligns with core concept: **Profile Comparison**: Compare burst profile against baseline profile. The difference highlights what changed â€” new slow path, increased contention, memory leak onset.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Adaptive sampling**: Sampling rate increases proportionally to error budget burn rate. 1x burn: 1 Hz. 5x burn: 10 Hz. 10x burn: 50 Hz. 20x burn: 100 Hz + immediate canary deployment.
- [ ] **Profile all production hosts**: Baseline profiles from all hosts establish normal behavior. Without baselines, you can't identify what changed during an incident.
- [ ] **Store profiles for comparison**: Keep profiles for 30+ days for historical comparison. Flame graph diffing between last week and today quickly reveals regressions.
- [ ] **Exclude health checks from profiling**: Health check endpoints generate traffic that dilutes profile data. Use endpoint filtering to focus on user-facing requests.
- [ ] **Integrate profiling with alerting**: When an alert fires, automatically trigger burst sampling on affected hosts. Include profile links in the alert notification.

# Performance Checklist (from 04/06)
- [ ] 1-5 Hz sampling: <2% CPU overhead. Safe for always-on production use.
- [ ] 50-100 Hz sampling: 5-10% CPU overhead. Use only during incident periods.
- [ ] eBPF profiling: <1% overhead. Lowest-cost profiling option available.
- [ ] Agent-based profiling: 2-15% overhead depending on tool and configuration.
- [ ] wrk/wrk2
- [ ] k6
- [ ] Closed-loop
- [ ] Open-loop

# Security Checklist (from 04/06 - only if relevant)
- [ ] Profile data includes function names, file paths, and sometimes variable values. This may leak sensitive information. Restrict profile database access.
- [ ] Continuous profiling infrastructure is a high-value target â€” it has access to all production hosts.
- [ ] eBPF profiling requires kernel-level access (CAP_BPF or root). Secure the profiling agent appropriately.
- [ ] Profile data retention policies should align with data privacy requirements.

# Reliability Checklist (from 04/05/06)
- [ ] **Coordinated omission invalidates results**: Closed-loop tool reports falsely low latency. Symptom: Benchmarks show 50ms p99 in test, 500ms p99 in production. Mitigation: Use open-loop tools (wrk2, k6) for accurate latency.
- [ ] **Warm-up bias**: First 100 requests are 10x slower than steady state. Symptom: Benchmark includes cold cache data. Mitigation: Always warm up before recording, discard warm-up data.
- [ ] **Sample size too small**: Fewer than 1000 samples per measurement point. Symptom: High variance between runs, non-reproducible results. Mitigation: Run longer, target 10000+ samples per data point.
- [ ] **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- [ ] **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).
- [ ] **Warm-up**: Minimum 1000 requests or 30 seconds of warm-up before recording measurements. Discard warm-up data.
- [ ] **Multiple runs**: Run each benchmark at least 3 times and report median. Report variance Ã¢â‚¬â€ high variance indicates measurement problems.

# Testing Checklist (from 04/06)
- [ ] Baseline profiling configured at 1-5 Hz on all hosts
- [ ] Burst sampling triggered by SLO breach alerts
- [ ] Profiles stored for 30+ days for historical comparison
- [ ] Health check endpoints excluded from profiling
- [ ] Profiling integrated with incident alerting
- [ ] Profile data access restricted to authorized personnel
- [ ] Adaptive sampling policy documented and implemented
- [ ] Profile comparison reviewed in post-mortems
- [ ] Baseline profiles established for all production hosts
- [ ] Profiling overhead <2% during normal operation
- [ ] Burst profiling captures diagnostic data automatically during SLO breaches
- [ ] Differential analysis identifies root cause within minutes
- [ ] Historical profiles enable week-over-week trend analysis
- [ ] Profiling agent installed on all production hosts at 1-5 Hz
- [ ] Baseline profiles established (1-2 weeks of data)
- [ ] Adaptive sampling configured by error budget burn rate
- [ ] Burst sampling triggered automatically by SLO breach alerts
- [ ] Profile data stored for 30+ days
- [ ] Differential analysis performed during incidents

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Adaptive sampling**: Sampling rate increases proportionally to error budget burn rate. 1x burn: 1 Hz. 5x burn: 10 Hz. 10x burn: 50 Hz. 20x burn: 100 Hz + immediate canary deployment.
- [ ] **Profile all production hosts**: Baseline profiles from all hosts establish normal behavior. Without baselines, you can't identify what changed during an incident.
- [ ] **Store profiles for comparison**: Keep profiles for 30+ days for historical comparison. Flame graph diffing between last week and today quickly reveals regressions.
- [ ] **Exclude health checks from profiling**: Health check endpoints generate traffic that dilutes profile data. Use endpoint filtering to focus on user-facing requests.
- [ ] **Integrate profiling with alerting**: When an alert fires, automatically trigger burst sampling on affected hosts. Include profile links in the alert notification.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Running high-frequency profiling continuously
- [ ] Avoid: No baseline profiles
- [ ] Avoid: Not excluding health checks
- [ ] Avoid: Profiling without alerting integration
- [ ] Avoid anti-pattern: **Profiling only during incidents**: Without baselines, you can't tell what changed. Always-on low-frequency profiling is essential.
- [ ] Avoid anti-pattern: **Using high-frequency profiling everywhere**: The cost of 100 Hz profiling across all hosts is prohibitive. Use it selectively during incidents.
- [ ] Avoid anti-pattern: **Ignoring profiling data after incidents**: Profiles captured during incidents contain valuable root cause data. Review them in post-mortems.
- [ ] Avoid anti-pattern: **Not correlating profiles with other signals**: Profiles alone don't tell the full story. Correlate with metrics, traces, and logs for complete incident analysis.
- [ ] Guard against anti-pattern: Benchmarking Without Warm-Up Rounds
- [ ] Guard against anti-pattern: Reporting Mean Without Percentiles
- [ ] Guard against anti-pattern: Benchmarking on Development Hardware
- [ ] Guard against anti-pattern: Single-Request Benchmarks (wrk -c1)
- [ ] Guard against anti-pattern: P-Hacking Benchmark Results
- [ ] Warm-up rounds conducted

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- [ ] **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).
- [ ] **Warm-up**: Minimum 1000 requests or 30 seconds of warm-up before recording measurements. Discard warm-up data.
- [ ] **Multiple runs**: Run each benchmark at least 3 times and report median. Report variance Ã¢â‚¬â€ high variance indicates measurement problems.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Baseline Sampling (1-5 Hz)**: Always-on, minimal overhead (<2% CPU). Collects CPU-hot functions, memory allocation hot spots, lock contention, GC activity. Establishes normal profiles by service endpoint., **Burst Sampling (50-100 Hz)**: Triggered by SLO breach alerts. Captures detailed flame graphs during the incident window. Auto-disables when SLO is restored. Data preserved for post-mortem analysis., **Tools**: Pyroscope (open source flame graphs), Parca (open source, eBPF-based), Blackfire (triggered production profiling), Tideways (always-on APM)., **Profile Comparison**: Compare burst profile against baseline profile. The difference highlights what changed â€” new slow path, increased contention, memory leak onset.
**Skills:** SLO Definition and Error Budgets, Performance Regression Detection, Flame Graph Interpretation, Profiling Observability
**Decision Trees:** Continuous profiling adoption
**Anti-Patterns:** Benchmarking Without Warm-Up Rounds, Reporting Mean Without Percentiles, Benchmarking on Development Hardware, Single-Request Benchmarks (wrk -c1), P-Hacking Benchmark Results
**Related Topics:** SLO Definition and Error Budgets, Performance Regression Detection, Flame Graph Interpretation, Profiling Observability

