# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP Engine & Version Performance
**Knowledge Unit:** Benchmarking vs Load Testing â€” Throughput Capacity vs User-Journey Simulation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always benchmark with realistic workloads**: Production applications with database queries, template rendering, and caching layers behave completely differently from synthetic endpoints.
- [ ] **Use open-loop models for tail latency**: wrk2 (constant-rate) avoids coordinated omission bias that wrk introduces under saturation.
- [ ] **Warm up before measuring**: Run 30+ seconds of warm-up traffic before recording results to let OpCache and JIT stabilize.
- [ ] **Measure both p50 and p95/p99**: Average latency hides tail performance. The p95-p50 gap reveals I/O variability and saturation effects.
- [ ] Benchmark methodology includes warm-up period (30s+)
- [ ] Both p50 and p95/p99 latency reported for all benchmarks
- [ ] Workload reflects production request patterns (not Hello World)
- [ ] Open-loop model used for tail latency measurement
- [ ] Resource metrics (CPU, RAM, I/O) captured during benchmark runs
- [ ] Benchmark produces reproducible results within 5% variance across 3 runs
- [ ] Load test validates system meets SLOs under peak expected traffic
- [ ] Report documents throughput, p50/p95/p99 latency, error rate, and resource utilization
- [ ] Findings actionable: specific optimizations prioritized based on data
- [ ] Warm-up phase completed before measurement (30s+)
- [ ] Open-loop (constant-rate) model used for latency measurement
- [ ] Both p50 and p95/p99 latency percentiles reported
- [ ] Error rate tracked alongside throughput
- [ ] Resource metrics (CPU, RAM, I/O) captured during test
- [ ] At least 3 runs performed to assess variance
- [ ] Load test includes realistic user journeys, not single endpoint

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Shared-nothing architecture** (PHP-FPM): Each request is isolated in a separate OS process. Maximizes fault isolation at the cost of per-request bootstrap overhead. Best for multi-tenant hosting where isolation is prioritized.
- [ ] **Memory-resident architecture** (Octane/Swoole): Boot once, handle many. Reduces latency by 60-90% for framework-heavy applications but introduces state management complexity. Best for dedicated API servers with controlled code deployments.
- [ ] **Event-driven coroutines** (Swoole/FrankenPHP): Single process handles many concurrent requests via coroutine switching. Memory efficiency is high but requires non-blocking I/O for all operations.
- [ ] **Closed-loop (wrk)**: Next request issued after previous completes. Models request-response perfectly but underestimates tail latency.
- [ ] **Open-loop (wrk2)**: Requests issued at constant rate regardless of completion. Realistic for modeling user arrival patterns.
- [ ] **Multi-stage load tests (k6)**: Ramp-up -> steady -> spike -> ramp-down. Reveals scaling behavior, recovery, and breaking points.
- [ ] Document and follow through on architectural decision: Benchmark vs load testing approach
- [ ] Document and follow through on architectural decision: Open-loop vs closed-loop model
- [ ] Document and follow through on architectural decision: What to measure and report
- [ ] Ensure architecture aligns with core concept: **Benchmarking tools**: wrk/wrk2, Apache Bench, Vegeta. Single endpoint. Fixed concurrency. Measures RPS and latency distributions.
- [ ] Ensure architecture aligns with core concept: **Load testing tools**: k6, JMeter, Gatling, Locust. Multi-step user journeys. Variable ramp-up. Measures throughput, error rate, response times under realistic conditions.
- [ ] Ensure architecture aligns with core concept: **Key metrics**: RPS (requests per second), p50/p95/p99 latency, error rate, memory footprint, CPU utilization.
- [ ] Ensure architecture aligns with core concept: **Coordinated omission**: Closed-loop benchmarks (wrk) underestimate tail latency during saturation. Open-loop models (wrk2, constant-rate) avoid this bias.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always benchmark with realistic workloads**: Production applications with database queries, template rendering, and caching layers behave completely differently from synthetic endpoints.
- [ ] **Use open-loop models for tail latency**: wrk2 (constant-rate) avoids coordinated omission bias that wrk introduces under saturation.
- [ ] **Warm up before measuring**: Run 30+ seconds of warm-up traffic before recording results to let OpCache and JIT stabilize.
- [ ] **Measure both p50 and p95/p99**: Average latency hides tail performance. The p95-p50 gap reveals I/O variability and saturation effects.
- [ ] Define the benchmark scope: single endpoint, fixed concurrency, open-loop (wrk2) with constant rate
- [ ] Configure wrk2 with appropriate threads, connections, rate, and duration
- [ ] Run a 30-second warm-up phase to populate OpCache/JIT caches (discard this data)
- [ ] Execute the measurement phase (60+ seconds) and capture raw output
- [ ] Parse results for throughput (RPS), latency distribution (p50/p95/p99), and error rate
- [ ] Design the load test: multi-stage scenario with ramp-up, steady-state, and spike phases
- [ ] Write a k6 script with realistic think times, multiple endpoints, and threshold assertions
- [ ] Execute the load test and monitor system resources (CPU, memory, I/O) during the run
- [ ] Compare results against baselines and SLOs â€” regression if latency increased >5% or throughput dropped >5%
- [ ] Document findings including environment details, tool versions, and raw results

# Performance Checklist (from 04/06)
- [ ] Shared-nothing (FPM)
- [ ] Memory-resident (Octane)
- [ ] JIT compilation
- [ ] OpCache

# Security Checklist (from 04/06 - only if relevant)
- [ ] Load testing can trigger rate limiting and DDoS protections â€” coordinate with operations team
- [ ] Never benchmark production databases with write-heavy workloads
- [ ] Isolate benchmark environments from production to avoid performance interference
- [ ] Benchmark authentication/authorization endpoints with realistic session states

# Reliability Checklist (from 04/05/06)
- [ ] **Deadlock**: PHP-FPM workers deadlocked on shared resource (file lock, database connection pool). Symptom: active workers plateau at max_children, no requests complete. Mitigation: Set request_terminate_timeout to kill stuck workers.
- [ ] **Memory exhaustion**: PHP worker exceeds memory_limit. Symptom: PHP Fatal error "Allowed memory size exhausted". Mitigation: Increase limit or optimize memory usage. Root cause analysis via memory profiler.
- [ ] **File descriptor exhaustion**: OpCache or PHP worker runs out of file descriptors. Symptom: "Too many open files" errors. Mitigation: Increase ulimit -n in systemd service file.
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Testing Checklist (from 04/06)
- [ ] Benchmark methodology includes warm-up period (30s+)
- [ ] Both p50 and p95/p99 latency reported for all benchmarks
- [ ] Workload reflects production request patterns (not Hello World)
- [ ] Open-loop model used for tail latency measurement
- [ ] Resource metrics (CPU, RAM, I/O) captured during benchmark runs
- [ ] Baseline established before making changes
- [ ] Multiple tools used for cross-validation
- [ ] Benchmark produces reproducible results within 5% variance across 3 runs
- [ ] Load test validates system meets SLOs under peak expected traffic
- [ ] Report documents throughput, p50/p95/p99 latency, error rate, and resource utilization
- [ ] Findings actionable: specific optimizations prioritized based on data
- [ ] Warm-up phase completed before measurement (30s+)
- [ ] Open-loop (constant-rate) model used for latency measurement
- [ ] Both p50 and p95/p99 latency percentiles reported
- [ ] Error rate tracked alongside throughput
- [ ] Resource metrics (CPU, RAM, I/O) captured during test
- [ ] At least 3 runs performed to assess variance
- [ ] Load test includes realistic user journeys, not single endpoint
- [ ] Results stored with environment metadata for reproducibility

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always benchmark with realistic workloads**: Production applications with database queries, template rendering, and caching layers behave completely differently from synthetic endpoints.
- [ ] **Use open-loop models for tail latency**: wrk2 (constant-rate) avoids coordinated omission bias that wrk introduces under saturation.
- [ ] **Warm up before measuring**: Run 30+ seconds of warm-up traffic before recording results to let OpCache and JIT stabilize.
- [ ] **Measure both p50 and p95/p99**: Average latency hides tail performance. The p95-p50 gap reveals I/O variability and saturation effects.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Benchmarking with Hello World
- [ ] Avoid: Using only average latency
- [ ] Avoid: No warm-up period
- [ ] Avoid: Closed-loop under saturation
- [ ] Avoid anti-pattern: **Benchmarking without a baseline**: A single benchmark run is meaningless. Always compare against a known baseline with identical conditions.
- [ ] Avoid anti-pattern: **Over-relying on a single tool**: Each tool has biases. Cross-validate findings with multiple tools (wrk + k6 + ab).
- [ ] Avoid anti-pattern: **Testing only the happy path**: Error handling, queue buildup, and degradation under load reveal the true system behavior.
- [ ] Avoid anti-pattern: **Ignoring resource metrics during benchmarks**: CPU, memory, and I/O metrics during the run explain why performance changes occur.
- [ ] Guard against anti-pattern: Benchmarking with Hello World Endpoints
- [ ] Guard against anti-pattern: Reporting Only Average Latency
- [ ] Guard against anti-pattern: No Warm-Up Period Before Measurement
- [ ] Guard against anti-pattern: Closed-Loop Under Saturation (Coordinated Omission)
- [ ] Guard against anti-pattern: Single-Run Conclusions Without Baseline
- [ ] Benchmarked endpoint includes database query execution

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Benchmarking tools**: wrk/wrk2, Apache Bench, Vegeta. Single endpoint. Fixed concurrency. Measures RPS and latency distributions., **Load testing tools**: k6, JMeter, Gatling, Locust. Multi-step user journeys. Variable ramp-up. Measures throughput, error rate, response times under realistic conditions., **Key metrics**: RPS (requests per second), p50/p95/p99 latency, error rate, memory footprint, CPU utilization., **Coordinated omission**: Closed-loop benchmarks (wrk) underestimate tail latency during saturation. Open-loop models (wrk2, constant-rate) avoid this bias.
**Rules:**
- General: Isolate Benchmark Environment from Production
**Skills:** Metrics Definition and Interpretation, Coordinated Omission Avoidance, CI Performance Regression Detection
**Decision Trees:** Benchmark vs load testing approach, Open-loop vs closed-loop model, What to measure and report
**Anti-Patterns:** Benchmarking with Hello World Endpoints, Reporting Only Average Latency, No Warm-Up Period Before Measurement, Closed-Loop Under Saturation (Coordinated Omission), Single-Run Conclusions Without Baseline
**Related Topics:** Coordinated Omission, HDR Histogram Analysis, Statistical Significance in Benchmarking, CI Performance Regression Detection, Metrics Definition and Interpretation

