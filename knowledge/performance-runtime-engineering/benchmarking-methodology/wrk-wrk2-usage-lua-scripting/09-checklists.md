# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** wrk/wrk2 Usage and Lua Scripting â€” Thread/Connection Tuning, HDR Histograms
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Use wrk2 for all latency benchmarks**: Always include `--rate` flag for open-loop mode. wrk (without rate) is for throughput discovery only.
- [ ] **Benchmark progression**: 1) wrk2 low rate to establish baseline latency. 2) Increase rate until latency increases 2x (saturation point). 3) wrk for max throughput. 4) Compare p50/p95 at each rate.
- [ ] **Lua for request customization**: Use Lua scripts to add authentication headers, CSRF tokens, or request body variations. Keep scripts simple for performance.
- [ ] **Save HDR histograms**: Use `--latency` flag and pipe output to file. HDR histograms enable precise p99.9 analysis and cross-benchmark comparison.
- [ ] **Match thread count to CPU cores**: wrk threads should match or be slightly below load generator CPU cores. Too many threads cause scheduling overhead.
- [ ] wrk2 used for all latency benchmarks (with `--rate` flag)
- [ ] wrk used only for maximum throughput discovery
- [ ] Thread count matches load generator CPU cores
- [ ] Warm-up phase completed before recorded test
- [ ] HDR histogram saved for post-processing (`--latency` flag)
- [ ] Lua script correctly implements three hooks (setup, request, response)
- [ ] Dynamic URL generation works with thread-local state
- [ ] Authentication tokens extracted and reused across requests
- [ ] Response verification tracks failures without skewing results
- [ ] Rate progression identifies saturation point
- [ ] HDR histograms produced for all rate levels
- [ ] Lua script structure with setup, request, response hooks
- [ ] Dynamic URL generation using thread-local state
- [ ] Authentication token extraction and reuse
- [ ] Response verification with status code checking

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Closed-loop vs Open-loop**: Closed-loop tools (wrk, ab, hey) are simpler but systematically underestimate tail latency under load due to coordinated omission. Open-loop tools (wrk2, k6) are more complex but produce accurate latency distributions. Use closed-loop for quick throughput estimates; use open-loop for production-relevant latency data.
- [ ] **Synthetic vs Realistic benchmarks**: Synthetic benchmarks (single endpoint, fixed payload) are repeatable and useful for regression detection. Realistic benchmarks (user journey, variable think times) predict production behavior. Use both: synthetic in CI, realistic for capacity planning.
- [ ] **wrk Mechanics**: Fixed thread count (-t). Each thread manages multiple connections via epoll/kqueue event loop. Lua scripting hooks into request(), response(), and done() callbacks within each thread's state.
- [ ] **wrk2 Timer**: wrk2 adds a constant-rate timer using a Poisson process to space requests. This enables open-loop mode. The timer is per-thread, synchronized at start.
- [ ] **Connection Management**: wrk creates N connections (-c) and reuses them with keep-alive. Connection count determines concurrency. Thread count determines how many connections each thread manages.
- [ ] **Lua Scripting Scope**: `setup()` runs once per thread. `request()` runs before each request. `response()` runs after each response. `done()` runs when the thread finishes, receiving summary statistics.
- [ ] Document and follow through on architectural decision: wrk vs wrk2 for benchmarking
- [ ] Document and follow through on architectural decision: Lua scripting for custom scenarios
- [ ] Ensure architecture aligns with core concept: **wrk Basic**: `wrk -t4 -c100 -d30s http://localhost:8080` â€” 4 threads, 100 connections, 30 seconds. Threads manage connections via event loop. Connections maintain keep-alive for maximum throughput.
- [ ] Ensure architecture aligns with core concept: **wrk2 Constant Rate**: `wrk2 -t4 -c100 -d30s -R 1000 http://localhost:8080` â€” targets 1000 RPS. If the server cannot handle the target rate, wrk2 accurately reports the failing latency distribution rather than hiding failures like closed-loop tools.
- [ ] Ensure architecture aligns with core concept: **Lua Scripting**: `wrk -s script.lua http://localhost:8080`. Scripts define `request()`, `response()`, `setup()`, `done()` functions. Enables authentication tokens, per-thread request bodies, response validation, and custom latency buckets.
- [ ] Ensure architecture aligns with core concept: **HDR Histogram**: wrk outputs latency distribution as an HDR histogram file with `--latency` flag. Import into HdrHistogram tools for precise percentile analysis.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Use wrk2 for all latency benchmarks**: Always include `--rate` flag for open-loop mode. wrk (without rate) is for throughput discovery only.
- [ ] **Benchmark progression**: 1) wrk2 low rate to establish baseline latency. 2) Increase rate until latency increases 2x (saturation point). 3) wrk for max throughput. 4) Compare p50/p95 at each rate.
- [ ] **Lua for request customization**: Use Lua scripts to add authentication headers, CSRF tokens, or request body variations. Keep scripts simple for performance.
- [ ] **Save HDR histograms**: Use `--latency` flag and pipe output to file. HDR histograms enable precise p99.9 analysis and cross-benchmark comparison.
- [ ] **Match thread count to CPU cores**: wrk threads should match or be slightly below load generator CPU cores. Too many threads cause scheduling overhead.

# Performance Checklist (from 04/06)
- [ ] wrk2 for accurate latency distribution, k6 for complex scenarios, JMeter for enterprise testing
- [ ] wrk can saturate a single machine at 50,000+ RPS for simple endpoints
- [ ] Lua scripting adds minimal overhead for simple customizations (<1% reduction in throughput)
- [ ] wrk2's Poisson timer adds ~1% CPU overhead compared to wrk's simpler scheduling
- [ ] wrk/wrk2
- [ ] k6
- [ ] Closed-loop
- [ ] Open-loop

# Security Checklist (from 04/06 - only if relevant)
- [ ] Lua scripts may contain authentication tokens. Use environment variables or external files for secrets.
- [ ] wrk/wrk2 traffic may trigger rate limiting or WAF rules. Coordinate with security teams.
- [ ] Benchmark results from wrk/wrk2 should be treated as confidential capacity information.

# Reliability Checklist (from 04/05/06)
- [ ] **Coordinated omission invalidates results**: Closed-loop tool reports falsely low latency. Symptom: Benchmarks show 50ms p99 in test, 500ms p99 in production. Mitigation: Use open-loop tools (wrk2, k6) for accurate latency.
- [ ] **Warm-up bias**: First 100 requests are 10x slower than steady state. Symptom: Benchmark includes cold cache data. Mitigation: Always warm up before recording, discard warm-up data.
- [ ] **Sample size too small**: Fewer than 1000 samples per measurement point. Symptom: High variance between runs, non-reproducible results. Mitigation: Run longer, target 10000+ samples per data point.
- [ ] **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- [ ] **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).
- [ ] **Warm-up**: Minimum 1000 requests or 30 seconds of warm-up before recording measurements. Discard warm-up data.
- [ ] **Multiple runs**: Run each benchmark at least 3 times and report median. Report variance Ã¢â‚¬â€ high variance indicates measurement problems.

# Testing Checklist (from 04/06)
- [ ] wrk2 used for all latency benchmarks (with `--rate` flag)
- [ ] wrk used only for maximum throughput discovery
- [ ] Thread count matches load generator CPU cores
- [ ] Warm-up phase completed before recorded test
- [ ] HDR histogram saved for post-processing (`--latency` flag)
- [ ] Lua scripts tested and validated
- [ ] Multiple rates tested to find saturation curve
- [ ] Lua script correctly implements three hooks (setup, request, response)
- [ ] Dynamic URL generation works with thread-local state
- [ ] Authentication tokens extracted and reused across requests
- [ ] Response verification tracks failures without skewing results
- [ ] Rate progression identifies saturation point
- [ ] HDR histograms produced for all rate levels
- [ ] Lua script structure with setup, request, response hooks
- [ ] Dynamic URL generation using thread-local state
- [ ] Authentication token extraction and reuse
- [ ] Response verification with status code checking
- [ ] Rate progression to identify saturation point
- [ ] HDR histogram output enabled with `--latency`

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Use wrk2 for all latency benchmarks**: Always include `--rate` flag for open-loop mode. wrk (without rate) is for throughput discovery only.
- [ ] **Benchmark progression**: 1) wrk2 low rate to establish baseline latency. 2) Increase rate until latency increases 2x (saturation point). 3) wrk for max throughput. 4) Compare p50/p95 at each rate.
- [ ] **Lua for request customization**: Use Lua scripts to add authentication headers, CSRF tokens, or request body variations. Keep scripts simple for performance.
- [ ] **Save HDR histograms**: Use `--latency` flag and pipe output to file. HDR histograms enable precise p99.9 analysis and cross-benchmark comparison.
- [ ] **Match thread count to CPU cores**: wrk threads should match or be slightly below load generator CPU cores. Too many threads cause scheduling overhead.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using wrk (closed-loop) for latency measurement
- [ ] Avoid: Too many threads on load generator
- [ ] Avoid: Ignoring HDR histogram output
- [ ] Avoid: Lua scripting that blocks
- [ ] Avoid anti-pattern: **Using wrk for all benchmarks**: wrk throughput numbers are valid. wrk latency numbers are not. Use wrk2 for latency.
- [ ] Avoid anti-pattern: **Benchmarking without warm-up**: wrk/wrk2 results without warm-up are dominated by cold-state effects. Run 30s warm-up before recorded test.
- [ ] Avoid anti-pattern: **Single rate benchmark**: Testing at one rate gives limited information. Test at multiple rates to find the saturation curve.
- [ ] Avoid anti-pattern: **Ignoring the difference between wrk and wrk2**: They are different tools with different flags and output formats. wrk flags may not work in wrk2 and vice versa.
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
**Core Concepts:** **wrk Basic**: `wrk -t4 -c100 -d30s http://localhost:8080` â€” 4 threads, 100 connections, 30 seconds. Threads manage connections via event loop. Connections maintain keep-alive for maximum throughput., **wrk2 Constant Rate**: `wrk2 -t4 -c100 -d30s -R 1000 http://localhost:8080` â€” targets 1000 RPS. If the server cannot handle the target rate, wrk2 accurately reports the failing latency distribution rather than hiding failures like closed-loop tools., **Lua Scripting**: `wrk -s script.lua http://localhost:8080`. Scripts define `request()`, `response()`, `setup()`, `done()` functions. Enables authentication tokens, per-thread request bodies, response validation, and custom latency buckets., **HDR Histogram**: wrk outputs latency distribution as an HDR histogram file with `--latency` flag. Import into HdrHistogram tools for precise percentile analysis.
**Skills:** Coordinated Omission, Tool Selection by Layer, k6 Scripting Thresholds Stages
**Decision Trees:** wrk vs wrk2 for benchmarking, Lua scripting for custom scenarios
**Anti-Patterns:** Benchmarking Without Warm-Up Rounds, Reporting Mean Without Percentiles, Benchmarking on Development Hardware, Single-Request Benchmarks (wrk -c1), P-Hacking Benchmark Results
**Related Topics:** Tool Selection by Layer, Coordinated Omission, HDR Histogram Analysis, Benchmarking Concepts

