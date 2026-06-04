# Metadata

Domain: Performance & Runtime Engineering
Subdomain: Performance Benchmarking & Methodology
Knowledge Unit: wrk/wrk2 Usage and Lua Scripting — Thread/Connection Tuning, HDR Histograms
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

wrk (`wrk -t12 -c400 -d30s http://target`) fires requests using multiple threads and connections. wrk2 adds `--rate` for constant-RPS mode, eliminating coordinated omission. Lua scripting enables custom request generation (headers, body, authentication tokens, CSRF tokens). Output includes latency percentiles, throughput, and error counts.

---

# Core Concepts

- **wrk basic**: `wrk -t4 -c100 -d30s http://localhost:8080` — 4 threads, 100 connections, 30 seconds. Threads handle connection management; connections maintain keep-alive for throughput.
- **wrk2 constant rate**: `wrk2 -t4 -c100 -d30s -R 1000 http://localhost:8080` — targets 1000 RPS. If the server cannot handle 1000 RPS, wrk2 accurately reports the failing latency distribution (not hiding failures like closed-loop tools).
- **Lua scripting**: `wrk -s script.lua http://localhost:8080`. Scripts define `request()`, `response()`, `setup()`, `done()` functions. Useful for: authentication tokens, different request bodies per thread, response validation, custom latency buckets.
- **HDR histogram**: wrk outputs latency distribution as an HDR histogram file (`--latency` flag). Import into HdrHistogram tools for precise percentile analysis.

---

# Patterns

**Benchmark progression**: 1) wrk2 low rate to establish baseline latency, 2) Increase rate until latency increases 2x (saturation point), 3) wrk (closed-loop) for max throughput, 4) Compare p50/p95 at each rate.

---

# Common Mistakes

**Using wrk (closed-loop) for latency measurement**: wrk stops sending new requests when the server is slow, underestimating tail latency. Always use wrk2 (`--rate`) for latency benchmarks.

---

# Performance Considerations

- Coordinated omission: the most common benchmarking error; include queuing time in latency measurements
- Warm-up: 1000-5000 requests required for JIT/OpCache stabilization before recording measurements
- Minimum 1000 samples per scenario for statistical significance; use 99.9th percentile for latency targets
- Profiling tools (Xdebug, Blackfire) add 10-200% overhead; use sampling profilers for production
- wrk2 for accurate latency distribution, k6 for complex scenarios, JMeter for enterprise testing

---

# Related Knowledge Units

Tool Selection by Layer | Coordinated Omission | HDR Histogram Analysis

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
