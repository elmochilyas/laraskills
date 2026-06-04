# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** RoadRunner Benchmark Performance â€” 41-111% Throughput Improvement Over PHP-FPM
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always benchmark your specific workload**: Published benchmarks are directional. Your application's I/O profile, framework, and dependencies determine actual gains.
- [ ] **Warm up before measuring**: Cold caches, JIT, and OpCache produce misleading results. Run 1000+ warm-up requests before recording metrics.
- [ ] **Measure latency distributions, not just averages**: Track p50, p95, p99, and max latency. Average latency hides tail latency problems.
- [ ] **Account for coordinated omission**: Use open-loop load testing (wrk2) for accurate tail latency measurements. Closed-loop tools underreport latency.
- [ ] **Monitor error rate under load**: High throughput with high errors is worse than low throughput. Track HTTP error codes and PHP worker crashes.
- [ ] Warm-up phase completed (1000+ requests)
- [ ] Open-loop load testing tool used (wrk2 or k6)
- [ ] Latency distributions recorded (p50, p95, p99, max)
- [ ] Error rate monitored during benchmark
- [ ] All variables (PHP version, OpCache, hardware) controlled
- [ ] RoadRunner vs FPM benchmark completed for application workload
- [ ] Throughput improvement quantified (RPS and latency)
- [ ] Resource utilization compared (CPU, memory)
- [ ] Decision supported by data
- [ ] Benchmark methodology documented
- [ ] Identical PHP configuration for both runtimes
- [ ] Same application code deployed
- [ ] Warm-up completed before measurement
- [ ] wrk2 open-loop model used for latency
- [ ] Multiple endpoints benchmarked

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Process vs Thread vs Coroutine**: PHP-FPM uses processes (max isolation, highest memory). FrankenPHP uses threads (shared memory, lower isolation). Swoole uses coroutines (shared memory + cooperative multitasking, lowest memory per request). The choice depends on isolation requirements and acceptable complexity.
- [ ] **Embedded SAPI vs sidecar process**: FrankenPHP embeds PHP directly into Caddy (single binary deployment). RoadRunner runs PHP as a sidecar process (separate lifecycle management). Swoole runs PHP as a C-extension within the SAPI. Each model affects deployment, monitoring, and debugging workflows.
- [ ] **Benchmark in Warm State**: RoadRunner's advantage is most pronounced when workers are warm. Cold-state benchmarks (after deploy) underestimate production performance.
- [ ] **Match Concurrency to Production**: Use `wrk -t N -c M` with N threads and M connections matching your production concurrency profile. Single-threaded benchmarks for multi-threaded systems mislead.
- [ ] **Isolate Variables**: When comparing RoadRunner vs FPM vs Swoole vs FrankenPHP, keep all other variables (PHP version, OpCache config, hardware) identical.
- [ ] **Test Memory Under Load**: Monitor RSS, heap usage, and OpCache status during benchmarks. Performance improvements that cause OOM are not wins.
- [ ] Document and follow through on architectural decision: Expected performance gain from RoadRunner
- [ ] Ensure architecture aligns with core concept: **Benchmark Methodology**: Sources include PHPBenchLab (2026), Deploynix (2026), toadbeatz/PHP-Runtime-Benchmark (2026). Test configurations use Laravel/Symfony with varying I/O profiles in warm state.
- [ ] Ensure architecture aligns with core concept: **Light I/O (sub-1ms DB)**: RoadRunner: 2,200 RPS. PHP-FPM: 1,300 RPS. Improvement: 69%.
- [ ] Ensure architecture aligns with core concept: **Mixed I/O (5-20ms DB)**: RoadRunner: 1,800 RPS. PHP-FPM: 1,100 RPS. Improvement: 64%.
- [ ] Ensure architecture aligns with core concept: **Heavy I/O (50ms+ DB)**: RoadRunner: 950 RPS. PHP-FPM: 450 RPS. Improvement: 111%.
- [ ] Ensure architecture aligns with core concept: **Latency Improvement**: p50 latency drops from ~80ms (FPM) to ~15ms (RoadRunner) for fast endpoints.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always benchmark your specific workload**: Published benchmarks are directional. Your application's I/O profile, framework, and dependencies determine actual gains.
- [ ] **Warm up before measuring**: Cold caches, JIT, and OpCache produce misleading results. Run 1000+ warm-up requests before recording metrics.
- [ ] **Measure latency distributions, not just averages**: Track p50, p95, p99, and max latency. Average latency hides tail latency problems.
- [ ] **Account for coordinated omission**: Use open-loop load testing (wrk2) for accurate tail latency measurements. Closed-loop tools underreport latency.
- [ ] **Monitor error rate under load**: High throughput with high errors is worse than low throughput. Track HTTP error codes and PHP worker crashes.
- [ ] Configure identical PHP settings for both runtimes (same OpCache, JIT, memory_limit)
- [ ] Deploy the same application code to both environments
- [ ] Warm up both systems: 30-60 seconds of traffic to populate OpCache/JIT
- [ ] Benchmark using wrk2 with open-loop model on each environment
- [ ] Benchmark both runtimes on the same 3-5 endpoints
- [ ] Record throughput (RPS), latency distribution (p50/p95/p99), and error rate
- [ ] Record resource metrics: CPU, memory per worker/process, and system load
- [ ] Calculate improvement: (RoadRunner_RPS - FPM_RPS) / FPM_RPS Ã— 100
- [ ] Run each benchmark 3 times to assess variance
- [ ] Document the benchmark results with full environment details

# Performance Checklist (from 04/06)
- [ ] RoadRunner's advantage over Swoole under low I/O: Go goroutine scheduler has dedicated OS threads; Swoole coroutines share a single thread
- [ ] Bottleneck shifts from bootstrap to PHP execution â€” further optimization requires JIT or algorithmic improvements
- [ ] RoadRunner's memory advantage over FPM: fewer total processes (PHP workers) due to no per-request bootstrap need
- [ ] Performance gains diminish when response times exceed 500ms as I/O wait dominates
- [ ] FrankenPHP
- [ ] RoadRunner
- [ ] Swoole
- [ ] PHP-FPM

# Security Checklist (from 04/06 - only if relevant)
- [ ] Benchmarked numbers should be treated as sensitive business metrics â€” do not expose raw benchmark results publicly
- [ ] Load testing tools can trigger security monitoring thresholds. Coordinate with security teams before running benchmarks on production-like environments.
- [ ] Benchmark data from production traffic captures real user behavior â€” ensure data is anonymized if published.

# Reliability Checklist (from 04/05/06)
- [ ] **Thread safety violation** (FrankenPHP): Extension not ZTS-compatible crashes worker. Symptom: Segfault in thread context. Mitigation: Test all extensions with ZTS, disable incompatible ones.
- [ ] **Coroutine deadlock** (Swoole): Blocking I/O in coroutine blocks all coroutines on that thread. Symptom: Partial site unresponsive. Mitigation: Ensure all I/O uses coroutine-aware libraries, set swoole hook flags.
- [ ] **Process leak** (RoadRunner): PHP worker processes accumulate over time. Symptom: Zombie PHP processes, memory growth. Mitigation: Monitor worker lifecycle, configure max_worker lifetime.
- [ ] **CGO memory leak** (FrankenPHP): Go GC doesn't collect PHP memory. Symptom: RSS grows over time. Mitigation: Set pm.max_requests to recycle threads, monitor RSS trends.
- [ ] **Monitoring**: All alternative runtimes require custom monitoring. Use the SAPI-specific status endpoints (FrankenPHP: Caddy metrics, RoadRunner: /health?plugin=http, Swoole: $server->stats()).
- [ ] **Logging**: FrankenPHP logs via Caddy's structured logging. RoadRunner writes to stdout/stderr. Swoole has built-in logger. Centralize logs via syslog or filebeat.
- [ ] **Graceful shutdown**: All three support SIGTERM for graceful shutdown Ã¢â‚¬â€ workers finish current requests before exiting. Test shutdown behavior under load.
- [ ] **Update procedure**: Runtime updates require testing worker compatibility. Always deploy to a subset first.

# Testing Checklist (from 04/06)
- [ ] Warm-up phase completed (1000+ requests)
- [ ] Open-loop load testing tool used (wrk2 or k6)
- [ ] Latency distributions recorded (p50, p95, p99, max)
- [ ] Error rate monitored during benchmark
- [ ] All variables (PHP version, OpCache, hardware) controlled
- [ ] Production-representative data and workload used
- [ ] Coordinated omission accounted for in methodology
- [ ] RoadRunner vs FPM benchmark completed for application workload
- [ ] Throughput improvement quantified (RPS and latency)
- [ ] Resource utilization compared (CPU, memory)
- [ ] Decision supported by data
- [ ] Benchmark methodology documented
- [ ] Identical PHP configuration for both runtimes
- [ ] Same application code deployed
- [ ] Warm-up completed before measurement
- [ ] wrk2 open-loop model used for latency
- [ ] Multiple endpoints benchmarked
- [ ] Resource metrics captured alongside throughput
- [ ] Minimum 3 runs per configuration
- [ ] Improvement percentage calculated
- [ ] Results documented with environment details

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always benchmark your specific workload**: Published benchmarks are directional. Your application's I/O profile, framework, and dependencies determine actual gains.
- [ ] **Warm up before measuring**: Cold caches, JIT, and OpCache produce misleading results. Run 1000+ warm-up requests before recording metrics.
- [ ] **Measure latency distributions, not just averages**: Track p50, p95, p99, and max latency. Average latency hides tail latency problems.
- [ ] **Account for coordinated omission**: Use open-loop load testing (wrk2) for accurate tail latency measurements. Closed-loop tools underreport latency.
- [ ] **Monitor error rate under load**: High throughput with high errors is worse than low throughput. Track HTTP error codes and PHP worker crashes.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Ignoring coordinated omission
- [ ] Avoid: Not warming up the system
- [ ] Avoid: Benchmarking with unrealistic data
- [ ] Avoid: Single-threaded load generation
- [ ] Avoid: Not measuring error rate
- [ ] Avoid anti-pattern: **Benchmarking RoadRunner against FPM without tuning FPM first**: An unoptimized FPM configuration makes RoadRunner look better than it is. Tune FPM properly before comparing.
- [ ] Avoid anti-pattern: **Publishing benchmark results without methodology**: Without methodology details (warm-up, sample size, hardware specs), benchmarks are misleading. Always document the full methodology.
- [ ] Avoid anti-pattern: **A/B testing with different hardware**: Comparing RoadRunner on one server against FPM on another introduces hardware variance. Always use the same hardware.
- [ ] Avoid anti-pattern: **Using production traffic for benchmarks**: Real user traffic introduces uncontrolled variables. Use synthetic load with production-representative patterns.
- [ ] Guard against anti-pattern: Porting PHP-FPM Code Without Adapting to Persistent Runtime
- [ ] Guard against anti-pattern: Choosing Runtime Without Workload Analysis
- [ ] Guard against anti-pattern: Not Configuring Worker Count to CPU Topology
- [ ] Guard against anti-pattern: Ignoring Goridge Serialization Overhead (RoadRunner)
- [ ] Guard against anti-pattern: FrankenPHP Thread Safety Violations

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Monitoring**: All alternative runtimes require custom monitoring. Use the SAPI-specific status endpoints (FrankenPHP: Caddy metrics, RoadRunner: /health?plugin=http, Swoole: $server->stats()).
- [ ] **Logging**: FrankenPHP logs via Caddy's structured logging. RoadRunner writes to stdout/stderr. Swoole has built-in logger. Centralize logs via syslog or filebeat.
- [ ] **Graceful shutdown**: All three support SIGTERM for graceful shutdown Ã¢â‚¬â€ workers finish current requests before exiting. Test shutdown behavior under load.
- [ ] **Update procedure**: Runtime updates require testing worker compatibility. Always deploy to a subset first.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Benchmark Methodology**: Sources include PHPBenchLab (2026), Deploynix (2026), toadbeatz/PHP-Runtime-Benchmark (2026). Test configurations use Laravel/Symfony with varying I/O profiles in warm state., **Light I/O (sub-1ms DB)**: RoadRunner: 2,200 RPS. PHP-FPM: 1,300 RPS. Improvement: 69%., **Mixed I/O (5-20ms DB)**: RoadRunner: 1,800 RPS. PHP-FPM: 1,100 RPS. Improvement: 64%., **Heavy I/O (50ms+ DB)**: RoadRunner: 950 RPS. PHP-FPM: 450 RPS. Improvement: 111%., **Latency Improvement**: p50 latency drops from ~80ms (FPM) to ~15ms (RoadRunner) for fast endpoints.
**Skills:** RoadRunner Architecture and Goridge, RoadRunner Installation and Configuration, Benchmark Design and Execution, Runtime Comparison Overview
**Decision Trees:** Expected performance gain from RoadRunner
**Anti-Patterns:** Porting PHP-FPM Code Without Adapting to Persistent Runtime, Choosing Runtime Without Workload Analysis, Not Configuring Worker Count to CPU Topology, Ignoring Goridge Serialization Overhead (RoadRunner), FrankenPHP Thread Safety Violations
**Related Topics:** Runtime Comparison Overview, RoadRunner Architecture and Goridge, Laravel Octane Driver Selection, Benchmarking Methodology

