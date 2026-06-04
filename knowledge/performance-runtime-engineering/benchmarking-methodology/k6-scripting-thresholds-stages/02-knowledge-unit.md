# Metadata

Domain: Performance & Runtime Engineering
Subdomain: Performance Benchmarking & Methodology
Knowledge Unit: k6 Scripting — Stages, Thresholds, Checks, Custom Metrics
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

k6 is a JavaScript-based load testing tool. Scripts define **stages** (ramp-up/down patterns), **thresholds** (pass/fail conditions for CI), **checks** (assertions per request), and **custom metrics** (Trend, Counter, Rate, Gauge). k6 excels at user-journey simulation — multi-step scenarios with think times and variable paths.

---

# Core Concepts

- **Stages**: `stages: [{ duration: '2m', target: 100 }, { duration: '5m', target: 100 }, { duration: '2m', target: 0 }]` — ramp up to 100 VUs, hold, ramp down.
- **Thresholds**: `thresholds: { http_req_duration: ['p(95)<500', 'p(99)<1500'], http_req_failed: ['rate<0.01'] }` — fail CI if p95 > 500ms or error rate > 1%.
- **Checks**: `check(res, { 'status is 200': (r) => r.status === 200 })` — per-request assertions. Executed regardless of threshold criteria.
- **Custom metrics**: `const myTrend = new Trend('response_size'); myTrend.add(res.body.length);` — track any measurement as a custom metric.
- **Scenarios**: Mix multiple user types (browsing, checkout, admin) in a single test. Each scenario has independent VUs, stages, and thresholds.

---

# Patterns

**CI integration**: `k6 run script.js --out csv=results.csv --summary-export=summary.json`. Parse JSON in CI to compare against baseline. Fail build if thresholds are violated.

---

# Common Mistakes

**k6 with no think times**: Real users pause between actions. Without `sleep()`, your test generates unrealistic load. Always add `sleep(thinkTime)` between requests.

---

# Performance Considerations

- Coordinated omission: the most common benchmarking error; include queuing time in latency measurements
- Warm-up: 1000-5000 requests required for JIT/OpCache stabilization before recording measurements
- Minimum 1000 samples per scenario for statistical significance; use 99.9th percentile for latency targets
- Profiling tools (Xdebug, Blackfire) add 10-200% overhead; use sampling profilers for production
- wrk2 for accurate latency distribution, k6 for complex scenarios, JMeter for enterprise testing

---

# Related Knowledge Units

Tool Selection by Layer | CI Integration and Baseline Comparison | Coordinated Omission

---

## Mental Models

**Thermometer model**: Benchmarking tools are thermometers â€” different tools measure different temperatures. wrk measures peak throughput (thermometer in fire). k6 measures user journey latency (thermometer in living room). Coordinated omission is like measuring coffee temperature only between sips â€” you miss the cooling trend.

---

## Internal Mechanics

Most HTTP benchmarking tools operate at the socket level using epoll/kqueue for async I/O. wrk uses a fixed number of threads (controlled by -t) each managing multiple connections via an event loop. Lua scripting hooks into equest(), esponse(), and done() callbacks within each thread's state. wrk2 adds a constant-rate timer mechanism that spaces requests according to a Poisson process. k6 uses Go's goroutine model with JavaScript execution via Goja (pure Go JS runtime). The internal scheduler maintains a virtual clock for stages, and metrics are collected via stats.MinMax aggregators that feed into HDR Histogram for percentile calculation.

---

## Patterns

**Iterative benchmarking protocol**: 1) Establish baseline (single user, no load), 2) Warm-up (1000 requests, discard first 100), 3) Measure at increasing concurrency levels, 4) Record throughput and latency at each level, 5) Identify saturation point (where p99 latency doubles), 6) Repeat 3x and report median.

---

## Architectural Decisions

- **Closed-loop vs Open-loop**: Closed-loop tools (wrk, ab, hey) are simpler but systematically underestimate tail latency under load due to coordinated omission. Open-loop tools (wrk2, k6) are more complex but produce accurate latency distributions. Use closed-loop for quick throughput estimates; use open-loop for production-relevant latency data.
- **Synthetic vs Realistic benchmarks**: Synthetic benchmarks (single endpoint, fixed payload) are repeatable and useful for regression detection. Realistic benchmarks (user journey, variable think times) predict production behavior. Use both: synthetic in CI, realistic for capacity planning.

---

## Tradeoffs

| Tradeoff | Benefit | Cost |
|----------|---------|------|
| wrk/wrk2 | Low overhead, high throughput | Limited scripting, HTTP/1.1 only |
| k6 | Realistic scenarios, HTTP/2 | Higher overhead, JavaScript learning curve |
| Closed-loop | Simple setup, good for throughput | Systematic latency underestimation |
| Open-loop | Accurate latency under load | More complex configuration |

---

## Production Considerations

- **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).
- **Warm-up**: Minimum 1000 requests or 30 seconds of warm-up before recording measurements. Discard warm-up data.
- **Multiple runs**: Run each benchmark at least 3 times and report median. Report variance â€” high variance indicates measurement problems.

---

## Failure Modes

- **Coordinated omission invalidates results**: Closed-loop tool reports falsely low latency. Symptom: Benchmarks show 50ms p99 in test, 500ms p99 in production. Mitigation: Use open-loop tools (wrk2, k6) for accurate latency.
- **Warm-up bias**: First 100 requests are 10x slower than steady state. Symptom: Benchmark includes cold cache data. Mitigation: Always warm up before recording, discard warm-up data.
- **Sample size too small**: Fewer than 1000 samples per measurement point. Symptom: High variance between runs, non-reproducible results. Mitigation: Run longer, target 10000+ samples per data point.

---

## Ecosystem Usage

- **TechEmpower benchmarks**: The most comprehensive PHP framework benchmark. PHP (Raw + Laravel + Symfony) competes in multiple tiers. Useful for relative comparison, not absolute performance prediction.
- **PHPBench**: Framework-level benchmark for PHP itself. Used to measure PHP engine version improvements. JIT benchmarks show 61-95% improvement over opcode-only execution.
- **Community benchmarks**: Laravel News, Symfony Blog, and PHP.Watch publish version-specific benchmarks. Useful for upgrade decision-making but verify against your workload.

---

## Research Notes

- Coordinated omission research (Gil Tene, 2013): Demonstrates that closed-loop tools systematically underestimate tail latency by 30-60%. Open-loop methodology is now standard in professional benchmarking.
- HDR Histogram (Mike Barker, Gil Tene): Provides efficient percentile calculation with configurable precision. Widely adopted in modern benchmarking tools (k6, wrk2).
- Current research: AI-driven benchmark analysis for automatic bottleneck identification. Early tools (2024+) use profiler data to predict benchmark results.
