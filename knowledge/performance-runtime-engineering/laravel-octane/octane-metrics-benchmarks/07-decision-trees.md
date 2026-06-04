# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Octane Metrics and Benchmarks
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Octane performance benchmark methodology | Performance | Measure |

---

# Architecture-Level Decision Trees

---

## Decision: Benchmarking Octane vs FPM

---

## Decision Context

Must compare Octane vs FPM with identical configuration except runtime. Measure throughput (req/s) and response times (p50, p95, p99).

---

## Decision Criteria

* **performance** — throughput gain is primary metric
* **operations** — benchmark must be fair and reproducible
* **maintainability** — continuous benchmarking detects regression

---

## Decision Tree

Is the benchmark comparing Octane vs FPM fairly?
↓
**YES** — Same server, same app code, same workload, same hardware.
**NO** — Results are invalid.

---

Is the workload representative of production?
↓
**YES** — Use real production traffic patterns.
**NO** — Benchmark results may not predict production performance.

---

Is the warmup period sufficient?
↓
**YES** — Run 1000+ requests before measuring to stabilize OpCache/JIT.
**NO** — Cold measurements misrepresent steady-state performance.

---

Are both configurations optimized?
↓
**YES** — FPM and Octane both tuned for their runtime.
**NO** — Unfair to compare unoptimized vs optimized.

---

## Recommended Default

**Default:** Benchmark with wrk2 for 60s after 10s warmup. Measure p50, p95, p99 latency and req/s.
**Reason:** Standardized methodology produces comparable results.

---

## Risks Of Wrong Choice

* Cold benchmark results: overstates Octane gain
* Non-representative workload: doesn't predict production behavior

---

## Related Skills

* Octane Metrics and Benchmarks
