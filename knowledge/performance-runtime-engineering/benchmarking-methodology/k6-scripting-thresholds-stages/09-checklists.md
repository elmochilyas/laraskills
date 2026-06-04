# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** k6 Scripting â€” Stages, Thresholds, Checks, Custom Metrics
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Add think times**: Use `sleep(thinkTime)` between requests to simulate real user behavior. Without think times, load is unrealistic and overestimates server capacity.
- [ ] **Define thresholds for CI gates**: Set p95 < 500ms and error rate < 1% as minimum pass criteria. Tighten thresholds as performance improves.
- [ ] **Use scenarios for mixed workloads**: Define separate scenarios for different user types (browsers, buyers, admins) with independent VU counts.
- [ ] **Export results for analysis**: `k6 run script.js --out csv=results.csv --summary-export=summary.json` for post-processing and baseline comparison.
- [ ] **Run locally first**: Validate script behavior with low VU count before running at production scale in k6 Cloud.
- [ ] Script includes think times (sleep) between requests
- [ ] Thresholds defined for CI pass/fail (p95, p99, error rate)
- [ ] Checks validate response status and content
- [ ] Multiple stages configured (ramp-up, steady, ramp-down)
- [ ] Environment variables used for configurable parameters
- [ ] k6 script models realistic user journey with think times
- [ ] Stages configure ramp-up, steady-state, and ramp-down
- [ ] Thresholds automate CI pass/fail decisions
- [ ] Checks validate response correctness under load
- [ ] Results exported for historical comparison
- [ ] Environment variables enable cross-environment execution
- [ ] Think times included (sleep between requests)
- [ ] CI thresholds defined (p95, p99, error rate)
- [ ] Custom metrics added for application-specific tracking
- [ ] Results exported for baseline comparison

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Closed-loop vs Open-loop**: Closed-loop tools (wrk, ab, hey) are simpler but systematically underestimate tail latency under load due to coordinated omission. Open-loop tools (wrk2, k6) are more complex but produce accurate latency distributions. Use closed-loop for quick throughput estimates; use open-loop for production-relevant latency data.
- [ ] **Synthetic vs Realistic benchmarks**: Synthetic benchmarks (single endpoint, fixed payload) are repeatable and useful for regression detection. Realistic benchmarks (user journey, variable think times) predict production behavior. Use both: synthetic in CI, realistic for capacity planning.
- [ ] **k6 Execution Model**: Go-based runtime executing JavaScript via Goja (pure Go JS engine). Virtual users (VUs) are goroutines. Each VU runs the default function in a loop. Stages control VU count over time.
- [ ] **Metrics Pipeline**: k6 collects HTTP metrics (http_req_duration, http_req_failed) and custom metrics. Data flows through stats.MinMax aggregators to HDR Histogram for percentile calculation.
- [ ] **Threshold Evaluation**: Thresholds are evaluated at test end (or periodically in cloud mode). All threshold conditions must be met for a passing test. Failed thresholds exit with non-zero code.
- [ ] **Scenarios vs Stages**: Scenarios are more flexible (independent VU scheduling, different executor types). Stages are simpler (linear ramp-up/down). Use scenarios for complex tests.
- [ ] Document and follow through on architectural decision: k6 adoption for CI benchmarking
- [ ] Document and follow through on architectural decision: Threshold definition
- [ ] Ensure architecture aligns with core concept: **Stages**: Configure ramp-up, steady-state, and ramp-down patterns. Example: `stages: [{ duration: '2m', target: 100 }, { duration: '5m', target: 100 }, { duration: '2m', target: 0 }]`.
- [ ] Ensure architecture aligns with core concept: **Thresholds**: Pass/fail conditions for CI. Example: `thresholds: { http_req_duration: ['p(95)<500', 'p(99)<1500'], http_req_failed: ['rate<0.01'] }`.
- [ ] Ensure architecture aligns with core concept: **Checks**: Per-request assertions. Example: `check(res, { 'status is 200': (r) => r.status === 200 })`. Run regardless of threshold criteria.
- [ ] Ensure architecture aligns with core concept: **Custom Metrics**: `const myTrend = new Trend('response_size'); myTrend.add(res.body.length);` â€” track any measurement.
- [ ] Ensure architecture aligns with core concept: **Scenarios**: Mix multiple user types (browsing, checkout, admin) in a single test with independent VUs, stages, and thresholds.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Add think times**: Use `sleep(thinkTime)` between requests to simulate real user behavior. Without think times, load is unrealistic and overestimates server capacity.
- [ ] **Define thresholds for CI gates**: Set p95 < 500ms and error rate < 1% as minimum pass criteria. Tighten thresholds as performance improves.
- [ ] **Use scenarios for mixed workloads**: Define separate scenarios for different user types (browsers, buyers, admins) with independent VU counts.
- [ ] **Export results for analysis**: `k6 run script.js --out csv=results.csv --summary-export=summary.json` for post-processing and baseline comparison.
- [ ] **Run locally first**: Validate script behavior with low VU count before running at production scale in k6 Cloud.

# Performance Checklist (from 04/06)
- [ ] k6's Goja JS engine is slower than Node.js for complex JavaScript. Keep scripts simple.
- [ ] k6 can saturate a single machine at 30,000+ RPS. For higher loads, use distributed execution (k6 Cloud).
- [ ] Memory usage scales with VU count and script complexity. ~10MB per VU for typical scripts.
- [ ] wrk/wrk2
- [ ] k6
- [ ] Closed-loop
- [ ] Open-loop

# Security Checklist (from 04/06 - only if relevant)
- [ ] k6 scripts should not contain hardcoded secrets. Use environment variables for API keys, tokens, and passwords.
- [ ] k6 Cloud execution sends traffic from multiple regions. Ensure target systems accept traffic from these sources.
- [ ] Thresholds that fail on authentication errors may indicate auth token expiry rather than performance regression.

# Reliability Checklist (from 04/05/06)
- [ ] **Coordinated omission invalidates results**: Closed-loop tool reports falsely low latency. Symptom: Benchmarks show 50ms p99 in test, 500ms p99 in production. Mitigation: Use open-loop tools (wrk2, k6) for accurate latency.
- [ ] **Warm-up bias**: First 100 requests are 10x slower than steady state. Symptom: Benchmark includes cold cache data. Mitigation: Always warm up before recording, discard warm-up data.
- [ ] **Sample size too small**: Fewer than 1000 samples per measurement point. Symptom: High variance between runs, non-reproducible results. Mitigation: Run longer, target 10000+ samples per data point.
- [ ] **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- [ ] **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).
- [ ] **Warm-up**: Minimum 1000 requests or 30 seconds of warm-up before recording measurements. Discard warm-up data.
- [ ] **Multiple runs**: Run each benchmark at least 3 times and report median. Report variance Ã¢â‚¬â€ high variance indicates measurement problems.

# Testing Checklist (from 04/06)
- [ ] Script includes think times (sleep) between requests
- [ ] Thresholds defined for CI pass/fail (p95, p99, error rate)
- [ ] Checks validate response status and content
- [ ] Multiple stages configured (ramp-up, steady, ramp-down)
- [ ] Environment variables used for configurable parameters
- [ ] Output export configured (CSV, JSON, or cloud)
- [ ] Script validated locally before production-scale execution
- [ ] k6 script models realistic user journey with think times
- [ ] Stages configure ramp-up, steady-state, and ramp-down
- [ ] Thresholds automate CI pass/fail decisions
- [ ] Checks validate response correctness under load
- [ ] Results exported for historical comparison
- [ ] Environment variables enable cross-environment execution
- [ ] Think times included (sleep between requests)
- [ ] CI thresholds defined (p95, p99, error rate)
- [ ] Custom metrics added for application-specific tracking
- [ ] Results exported for baseline comparison
- [ ] Environment variables used for configuration

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Add think times**: Use `sleep(thinkTime)` between requests to simulate real user behavior. Without think times, load is unrealistic and overestimates server capacity.
- [ ] **Define thresholds for CI gates**: Set p95 < 500ms and error rate < 1% as minimum pass criteria. Tighten thresholds as performance improves.
- [ ] **Use scenarios for mixed workloads**: Define separate scenarios for different user types (browsers, buyers, admins) with independent VU counts.
- [ ] **Export results for analysis**: `k6 run script.js --out csv=results.csv --summary-export=summary.json` for post-processing and baseline comparison.
- [ ] **Run locally first**: Validate script behavior with low VU count before running at production scale in k6 Cloud.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: No think times
- [ ] Avoid: Thresholds too tight for normal variance
- [ ] Avoid: Complex JavaScript slowing down k6
- [ ] Avoid: One scenario for all user types
- [ ] Avoid anti-pattern: **Hardcoding target URLs in scripts**: Use environment variables (`__ENV.TARGET_URL`) for flexibility across environments.
- [ ] Avoid anti-pattern: **No thresholds in CI**: Without thresholds, k6 reports data but doesn't gate deployments. Thresholds are the primary CI integration mechanism.
- [ ] Avoid anti-pattern: **Ignoring checks that always pass**: If all checks pass trivially, they're not testing anything useful. Design checks that validate real behavior.
- [ ] Avoid anti-pattern: **Running without `--out` for persistence**: Without output files, results are lost after the test. Always persist to CSV, JSON, or cloud.
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
**Core Concepts:** **Stages**: Configure ramp-up, steady-state, and ramp-down patterns. Example: `stages: [{ duration: '2m', target: 100 }, { duration: '5m', target: 100 }, { duration: '2m', target: 0 }]`., **Thresholds**: Pass/fail conditions for CI. Example: `thresholds: { http_req_duration: ['p(95)<500', 'p(99)<1500'], http_req_failed: ['rate<0.01'] }`., **Checks**: Per-request assertions. Example: `check(res, { 'status is 200': (r) => r.status === 200 })`. Run regardless of threshold criteria., **Custom Metrics**: `const myTrend = new Trend('response_size'); myTrend.add(res.body.length);` â€” track any measurement., **Scenarios**: Mix multiple user types (browsing, checkout, admin) in a single test with independent VUs, stages, and thresholds.
**Skills:** CI Integration and Baseline Comparison, Tool Selection by Layer, Coordinated Omission, SLO Definition and Error Budgets
**Decision Trees:** k6 adoption for CI benchmarking, Threshold definition
**Anti-Patterns:** Benchmarking Without Warm-Up Rounds, Reporting Mean Without Percentiles, Benchmarking on Development Hardware, Single-Request Benchmarks (wrk -c1), P-Hacking Benchmark Results
**Related Topics:** Tool Selection by Layer, CI Integration and Baseline Comparison, Coordinated Omission, Benchmarking Concepts

