# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** Tool Selection by Layer â€” Protocol Load (k6, JMeter), Network Edge (wrk, Vegeta), Browser
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Match tool to layer**: Protocol testing = k6. Throughput testing = wrk2. Frontend testing = Lighthouse. Mixing layers gives misleading results.
- [ ] **Use k6 for CI pipelines**: JavaScript scripting, threshold-based pass/fail, and cloud execution make k6 ideal for automated performance gates.
- [ ] **Default to wrk2 for latency**: The `--rate` flag enables open-loop mode, eliminating coordinated omission. wrk (without rate) is for throughput discovery only.
- [ ] **Lua scripting for wrk2**: Custom headers, authentication tokens, and request bodies enable production-realistic load patterns.
- [ ] **Treat browser metrics separately**: LCP, CLS, and INP measure frontend performance, not server capacity. Don't conflate with server benchmarks.
- [ ] Tool selected matches the testing layer (protocol, network edge, or browser)
- [ ] wrk2 used for all latency benchmarks (not wrk or ab)
- [ ] k6 configured with think times for realistic user simulation
- [ ] Load generator capacity verified to exceed system under test
- [ ] Benchmark methodology documented with tool version and configuration
- [ ] Correct tool selected for each target layer
- [ ] Open-loop used for latency benchmarks, closed-loop for throughput
- [ ] Each layer benchmarked in isolation with documented baseline
- [ ] Multi-layer benchmarks coordinated to identify true bottleneck
- [ ] Benchmark choices documented with rationale
- [ ] Tool selected matches target layer
- [ ] Loop type correct for target metric
- [ ] Each layer benchmarked in isolation first
- [ ] Multi-layer benchmarks coordinated with simultaneous monitoring
- [ ] Bottleneck identified by comparing latency across layers

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Closed-loop vs Open-loop**: Closed-loop tools (wrk, ab, hey) are simpler but systematically underestimate tail latency under load due to coordinated omission. Open-loop tools (wrk2, k6) are more complex but produce accurate latency distributions. Use closed-loop for quick throughput estimates; use open-loop for production-relevant latency data.
- [ ] **Synthetic vs Realistic benchmarks**: Synthetic benchmarks (single endpoint, fixed payload) are repeatable and useful for regression detection. Realistic benchmarks (user journey, variable think times) predict production behavior. Use both: synthetic in CI, realistic for capacity planning.
- [ ] **Tool Taxonomy**: Protocol load (k6, JMeter, Gatling), network edge (wrk2, Vegeta, hey), browser (Lighthouse, Playwright). Each layer uses different metrics and methodologies.
- [ ] **k6 Architecture**: Go-based runtime executing JavaScript via Goja. Goroutine model handles virtual users. Metrics aggregated via HDR Histogram internally.
- [ ] **wrk2 Mechanics**: Fixed thread count ( -t ), each managing multiple connections via event loop. Lua scripting hooks into request/response/done callbacks per thread.
- [ ] **CI Integration Pattern**: k6 run â†’ CSV/JSON output â†’ compare against baseline â†’ threshold-based pass/fail. Store historical results in bencher.dev or similar.
- [ ] Document and follow through on architectural decision: Benchmarking tool selection
- [ ] Ensure architecture aligns with core concept: **k6**: JavaScript-scriptable load testing. Best for user-journey testing with stages, thresholds, checks, and custom metrics. Open source with cloud option.
- [ ] Ensure architecture aligns with core concept: **wrk/wrk2**: Multi-threaded HTTP benchmarking. Best for raw throughput and latency. wrk2 adds constant-RPS mode to eliminate coordinated omission. Lua scripting for request customization.
- [ ] Ensure architecture aligns with core concept: **Vegeta**: Go-based HTTP benchmarking with simple CLI. Best for ad-hoc throughput tests and CI integration. Constant-rate or targeted-RPS modes.
- [ ] Ensure architecture aligns with core concept: **JMeter/Gatling**: Java-based tools for complex enterprise scenarios with assertions, correlation, and distributed load generation.
- [ ] Ensure architecture aligns with core concept: **Browser Tools**: Lighthouse (performance audits), Playwright/Puppeteer (scripted browser tests, LCP/CLS measurement).

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Match tool to layer**: Protocol testing = k6. Throughput testing = wrk2. Frontend testing = Lighthouse. Mixing layers gives misleading results.
- [ ] **Use k6 for CI pipelines**: JavaScript scripting, threshold-based pass/fail, and cloud execution make k6 ideal for automated performance gates.
- [ ] **Default to wrk2 for latency**: The `--rate` flag enables open-loop mode, eliminating coordinated omission. wrk (without rate) is for throughput discovery only.
- [ ] **Lua scripting for wrk2**: Custom headers, authentication tokens, and request bodies enable production-realistic load patterns.
- [ ] **Treat browser metrics separately**: LCP, CLS, and INP measure frontend performance, not server capacity. Don't conflate with server benchmarks.

# Performance Checklist (from 04/06)
- [ ] wrk2 for accurate latency distribution, k6 for complex scenarios, JMeter for enterprise testing
- [ ] Profiling tools (Xdebug, Blackfire) add 10-200% overhead â€” use sampling profilers for production
- [ ] Minimum 1000 samples per scenario for statistical significance
- [ ] Warm-up requires 1000-5000 requests before recording measurements
- [ ] wrk/wrk2
- [ ] k6
- [ ] Closed-loop
- [ ] Open-loop

# Security Checklist (from 04/06 - only if relevant)
- [ ] Load testing tools generate traffic that may trigger security monitoring. Coordinate with security teams.
- [ ] k6 scripts may contain API keys or authentication tokens. Store secrets in environment variables, not in scripts.
- [ ] Distributed load testing (JMeter, k6 cloud) sends traffic from multiple IPs. Ensure this doesn't trigger abuse detection.

# Reliability Checklist (from 04/05/06)
- [ ] **Coordinated omission invalidates results**: Closed-loop tool reports falsely low latency. Symptom: Benchmarks show 50ms p99 in test, 500ms p99 in production. Mitigation: Use open-loop tools (wrk2, k6) for accurate latency.
- [ ] **Warm-up bias**: First 100 requests are 10x slower than steady state. Symptom: Benchmark includes cold cache data. Mitigation: Always warm up before recording, discard warm-up data.
- [ ] **Sample size too small**: Fewer than 1000 samples per measurement point. Symptom: High variance between runs, non-reproducible results. Mitigation: Run longer, target 10000+ samples per data point.
- [ ] **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- [ ] **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).
- [ ] **Warm-up**: Minimum 1000 requests or 30 seconds of warm-up before recording measurements. Discard warm-up data.
- [ ] **Multiple runs**: Run each benchmark at least 3 times and report median. Report variance Ã¢â‚¬â€ high variance indicates measurement problems.

# Testing Checklist (from 04/06)
- [ ] Tool selected matches the testing layer (protocol, network edge, or browser)
- [ ] wrk2 used for all latency benchmarks (not wrk or ab)
- [ ] k6 configured with think times for realistic user simulation
- [ ] Load generator capacity verified to exceed system under test
- [ ] Benchmark methodology documented with tool version and configuration
- [ ] CI integration configured for automated execution
- [ ] Correct tool selected for each target layer
- [ ] Open-loop used for latency benchmarks, closed-loop for throughput
- [ ] Each layer benchmarked in isolation with documented baseline
- [ ] Multi-layer benchmarks coordinated to identify true bottleneck
- [ ] Benchmark choices documented with rationale
- [ ] Tool selected matches target layer
- [ ] Loop type correct for target metric
- [ ] Each layer benchmarked in isolation first
- [ ] Multi-layer benchmarks coordinated with simultaneous monitoring
- [ ] Bottleneck identified by comparing latency across layers

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Match tool to layer**: Protocol testing = k6. Throughput testing = wrk2. Frontend testing = Lighthouse. Mixing layers gives misleading results.
- [ ] **Use k6 for CI pipelines**: JavaScript scripting, threshold-based pass/fail, and cloud execution make k6 ideal for automated performance gates.
- [ ] **Default to wrk2 for latency**: The `--rate` flag enables open-loop mode, eliminating coordinated omission. wrk (without rate) is for throughput discovery only.
- [ ] **Lua scripting for wrk2**: Custom headers, authentication tokens, and request bodies enable production-realistic load patterns.
- [ ] **Treat browser metrics separately**: LCP, CLS, and INP measure frontend performance, not server capacity. Don't conflate with server benchmarks.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using Apache Bench for production benchmarking
- [ ] Avoid: Using browser tools for server benchmarking
- [ ] Avoid: k6 with no think times
- [ ] Avoid: wrk for latency measurement
- [ ] Avoid anti-pattern: **Using one tool for everything**: No single tool optimally measures all layers. Use k6 for journeys, wrk2 for throughput, Lighthouse for frontend.
- [ ] Avoid anti-pattern: **Running benchmarks without understanding the tool's behavior**: wrk â‰  wrk2. ab â‰  hey. Each tool has different biases and measurement approaches.
- [ ] Avoid anti-pattern: **Ignoring load generator capacity**: The load generator must be more powerful than the system under test. Underpowered generators create artificial bottlenecks.
- [ ] Avoid anti-pattern: **Automating benchmarks without validation**: CI benchmarks degrade over time as code changes. Regularly validate that benchmarks still measure what you intend.
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
**Core Concepts:** **k6**: JavaScript-scriptable load testing. Best for user-journey testing with stages, thresholds, checks, and custom metrics. Open source with cloud option., **wrk/wrk2**: Multi-threaded HTTP benchmarking. Best for raw throughput and latency. wrk2 adds constant-RPS mode to eliminate coordinated omission. Lua scripting for request customization., **Vegeta**: Go-based HTTP benchmarking with simple CLI. Best for ad-hoc throughput tests and CI integration. Constant-rate or targeted-RPS modes., **JMeter/Gatling**: Java-based tools for complex enterprise scenarios with assertions, correlation, and distributed load generation., **Browser Tools**: Lighthouse (performance audits), Playwright/Puppeteer (scripted browser tests, LCP/CLS measurement).
**Skills:** wrk/wrk2 Usage and Lua Scripting, k6 Scripting Thresholds Stages, Coordinated Omission, Continuous Profiling Strategy
**Decision Trees:** Benchmarking tool selection
**Anti-Patterns:** Benchmarking Without Warm-Up Rounds, Reporting Mean Without Percentiles, Benchmarking on Development Hardware, Single-Request Benchmarks (wrk -c1), P-Hacking Benchmark Results
**Related Topics:** wrk/wrk2 Usage and Lua Scripting, k6 Scripting Thresholds and Stages, Benchmarking Concepts, CI Integration and Baseline Comparison

