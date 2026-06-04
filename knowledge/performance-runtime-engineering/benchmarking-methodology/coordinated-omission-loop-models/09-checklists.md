# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** Coordinated Omission â€” Closed-Loop (wrk) vs Open-Loop (wrk2) Models
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always use open-loop for latency benchmarks**: wrk2 with `--rate`, k6 with constant arrival rate, or Vegeta with `-rate` flag. Closed-loop latency numbers are systematically misleading.
- [ ] **Use closed-loop only for throughput discovery**: wrk (without `--rate`) finds maximum throughput. Then use wrk2 to measure latency at that rate.
- [ ] **Report both throughput and the rate at which it was measured**: A system may handle 2000 RPS at 50ms p50 under open-loop but only 1500 RPS under closed-loop. Report the methodology.
- [ ] **Gradually increase rate**: Start below expected capacity, increase until p99 latency doubles (saturation point). Report the entire curve, not just one point.
- [ ] Open-loop tool used for all latency benchmarks (wrk2 with `--rate`, k6 constant arrival rate)
- [ ] Closed-loop tool used only for maximum throughput discovery
- [ ] Loop type explicitly documented in all benchmark reports
- [ ] Latency measurements verified with open-loop before capacity decisions
- [ ] Saturation point identified by gradually increasing rate until p99 doubles
- [ ] All latency benchmarks use open-loop tools
- [ ] Coordinated omission bias eliminated from all measurements
- [ ] Loop type documented in all reports
- [ ] Saturation point identified with accurate latency data
- [ ] Capacity decisions based on open-loop latency data
- [ ] Open-loop tool used for all latency benchmarks (wrk2 with `--rate` or k6)
- [ ] Loop type documented in all benchmark reports
- [ ] Saturation point identified by gradual rate increase
- [ ] Latency verified with open-loop before capacity decisions
- [ ] **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- [ ] **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Closed-loop vs Open-loop**: Closed-loop tools (wrk, ab, hey) are simpler but systematically underestimate tail latency under load due to coordinated omission. Open-loop tools (wrk2, k6) are more complex but produce accurate latency distributions. Use closed-loop for quick throughput estimates; use open-loop for production-relevant latency data.
- [ ] **Synthetic vs Realistic benchmarks**: Synthetic benchmarks (single endpoint, fixed payload) are repeatable and useful for regression detection. Realistic benchmarks (user journey, variable think times) predict production behavior. Use both: synthetic in CI, realistic for capacity planning.
- [ ] **Closed-Loop Mechanics**: wrk creates N connections and reuses them. After sending a request, the thread blocks until a response arrives. During server slowdown, connections wait longer, automatically reducing request rate.
- [ ] **Open-Loop Mechanics**: wrk2 creates N connections and sends requests at a fixed rate using a Poisson process timer. If all connections are busy, new requests enter a queue. Queue delay is measured in the response latency.
- [ ] **Real-World Analogy**: Closed-loop = toll booth with one car. The booth waits until the car passes before letting the next one through. Open-loop = toll booth with cars arriving at a fixed rate regardless of how fast the previous car passed.
- [ ] **Impact on Percentiles**: Closed-loop can underreport p99 by 30-60% under saturation. A system that appears to have 100ms p99 under closed-loop may have 500ms p99 under open-loop.
- [ ] Document and follow through on architectural decision: Closed-loop vs open-loop benchmark
- [ ] Ensure architecture aligns with core concept: **Closed-Loop**: Tool waits for response before sending next request. During overload, tool sends fewer requests. Measured throughput drops but latency stays apparently low. Underestimates real latency by 30-60%.
- [ ] Ensure architecture aligns with core concept: **Open-Loop**: Tool sends requests at a fixed rate (e.g., 1000 RPS). If the server can only handle 800 RPS, remaining 200 requests accumulate queue delay. Measured latency accurately reflects user experience.
- [ ] Ensure architecture aligns with core concept: **Example**: 1000 RPS target, server handles 800 RPS at 50ms. Closed-loop: reports 800 RPS at 50ms. Open-loop: reports 800 RPS at 50ms + 20% of requests at 500ms (queued). Only open-loop shows true user impact.
- [ ] Ensure architecture aligns with core concept: **wrk2 Mitigation**: `wrk2 --rate 1000` sends requests at exactly 1000 RPS. Queue buildup is reflected in latency distribution.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always use open-loop for latency benchmarks**: wrk2 with `--rate`, k6 with constant arrival rate, or Vegeta with `-rate` flag. Closed-loop latency numbers are systematically misleading.
- [ ] **Use closed-loop only for throughput discovery**: wrk (without `--rate`) finds maximum throughput. Then use wrk2 to measure latency at that rate.
- [ ] **Report both throughput and the rate at which it was measured**: A system may handle 2000 RPS at 50ms p50 under open-loop but only 1500 RPS under closed-loop. Report the methodology.
- [ ] **Gradually increase rate**: Start below expected capacity, increase until p99 latency doubles (saturation point). Report the entire curve, not just one point.

# Performance Checklist (from 04/06)
- [ ] Coordinated omission is the most common benchmarking error â€” include queuing time in latency measurements
- [ ] Under 50% utilization, closed-loop and open-loop give similar results. Above 70%, divergence grows rapidly.
- [ ] Most published benchmarks using ab, wrk (without rate), or hey are affected by coordinated omission.
- [ ] Always verify critical latency numbers with an open-loop tool before making decisions.
- [ ] wrk/wrk2
- [ ] k6
- [ ] Closed-loop
- [ ] Open-loop

# Security Checklist (from 04/06 - only if relevant)
- [ ] Open-loop testing can generate traffic spikes that overwhelm a system. Ramp up rates gradually to avoid unintended self-inflicted DoS.
- [ ] Fixed-rate open-loop testing at high rates may trigger rate limiting or DDoS protection. Coordinate with operations teams.

# Reliability Checklist (from 04/05/06)
- [ ] **Coordinated omission invalidates results**: Closed-loop tool reports falsely low latency. Symptom: Benchmarks show 50ms p99 in test, 500ms p99 in production. Mitigation: Use open-loop tools (wrk2, k6) for accurate latency.
- [ ] **Warm-up bias**: First 100 requests are 10x slower than steady state. Symptom: Benchmark includes cold cache data. Mitigation: Always warm up before recording, discard warm-up data.
- [ ] **Sample size too small**: Fewer than 1000 samples per measurement point. Symptom: High variance between runs, non-reproducible results. Mitigation: Run longer, target 10000+ samples per data point.
- [ ] **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- [ ] **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).
- [ ] **Warm-up**: Minimum 1000 requests or 30 seconds of warm-up before recording measurements. Discard warm-up data.
- [ ] **Multiple runs**: Run each benchmark at least 3 times and report median. Report variance Ã¢â‚¬â€ high variance indicates measurement problems.

# Testing Checklist (from 04/06)
- [ ] Open-loop tool used for all latency benchmarks (wrk2 with `--rate`, k6 constant arrival rate)
- [ ] Closed-loop tool used only for maximum throughput discovery
- [ ] Loop type explicitly documented in all benchmark reports
- [ ] Latency measurements verified with open-loop before capacity decisions
- [ ] Saturation point identified by gradually increasing rate until p99 doubles
- [ ] Benchmark methodology disclosed in all published results
- [ ] All latency benchmarks use open-loop tools
- [ ] Coordinated omission bias eliminated from all measurements
- [ ] Loop type documented in all reports
- [ ] Saturation point identified with accurate latency data
- [ ] Capacity decisions based on open-loop latency data
- [ ] Open-loop tool used for all latency benchmarks (wrk2 with `--rate` or k6)
- [ ] Loop type documented in all benchmark reports
- [ ] Saturation point identified by gradual rate increase
- [ ] Latency verified with open-loop before capacity decisions

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always use open-loop for latency benchmarks**: wrk2 with `--rate`, k6 with constant arrival rate, or Vegeta with `-rate` flag. Closed-loop latency numbers are systematically misleading.
- [ ] **Use closed-loop only for throughput discovery**: wrk (without `--rate`) finds maximum throughput. Then use wrk2 to measure latency at that rate.
- [ ] **Report both throughput and the rate at which it was measured**: A system may handle 2000 RPS at 50ms p50 under open-loop but only 1500 RPS under closed-loop. Report the methodology.
- [ ] **Gradually increase rate**: Start below expected capacity, increase until p99 latency doubles (saturation point). Report the entire curve, not just one point.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Trusting ab/wrk latency numbers
- [ ] Avoid: Using wrk for all benchmarks
- [ ] Avoid: Not distinguishing closed vs open in reports
- [ ] Avoid: Comparing latency from different loop types
- [ ] Avoid anti-pattern: **Publishing latency numbers without disclosing loop type**: Any latency measurement without methodology disclosure is untrustworthy. Always document closed vs open loop.
- [ ] Avoid anti-pattern: **Exclusively using closed-loop tools**: Latency benchmarks must use open-loop. Closed-loop latency data is systematically biased.
- [ ] Avoid anti-pattern: **Assuming coordinated omission doesn't affect your results**: It affects all closed-loop benchmarks above ~50% utilization. Test and verify with open-loop.
- [ ] Avoid anti-pattern: **Setting latency SLOs based on closed-loop benchmarks**: You'll miss targets in production because real user traffic is open-loop. Always validate SLOs with open-loop data.
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
**Core Concepts:** **Closed-Loop**: Tool waits for response before sending next request. During overload, tool sends fewer requests. Measured throughput drops but latency stays apparently low. Underestimates real latency by 30-60%., **Open-Loop**: Tool sends requests at a fixed rate (e.g., 1000 RPS). If the server can only handle 800 RPS, remaining 200 requests accumulate queue delay. Measured latency accurately reflects user experience., **Example**: 1000 RPS target, server handles 800 RPS at 50ms. Closed-loop: reports 800 RPS at 50ms. Open-loop: reports 800 RPS at 50ms + 20% of requests at 500ms (queued). Only open-loop shows true user impact., **wrk2 Mitigation**: `wrk2 --rate 1000` sends requests at exactly 1000 RPS. Queue buildup is reflected in latency distribution.
**Skills:** wrk/wrk2 Usage and Lua Scripting, Benchmarking Concepts, Metrics Definition and Interpretation
**Decision Trees:** Closed-loop vs open-loop benchmark
**Anti-Patterns:** Benchmarking Without Warm-Up Rounds, Reporting Mean Without Percentiles, Benchmarking on Development Hardware, Single-Request Benchmarks (wrk -c1), P-Hacking Benchmark Results
**Related Topics:** wrk/wrk2 Usage and Lua Scripting, Benchmarking Concepts, HDR Histogram Analysis, Metrics Definition and Interpretation

