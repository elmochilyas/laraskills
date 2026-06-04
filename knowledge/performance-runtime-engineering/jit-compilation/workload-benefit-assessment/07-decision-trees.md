# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** JIT Workload Benefit Assessment
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether JIT will benefit a specific workload | Performance | Evaluate |
| 2 | How to measure JIT impact before/after | Testing | Measure |

---

# Architecture-Level Decision Trees

---

## Decision: JIT Workload Benefit Assessment

---

## Decision Context

Determining if JIT provides meaningful throughput improvement for a specific application or endpoint.

---

## Decision Criteria

* **performance** — JIT benefit is proportional to CPU-bound time
* **architectural** — measuring requires sampling profiler (not Xdebug)
* **maintainability** — assessment should include background jobs, not just web

---

## Decision Tree

What is the CPU-bound proportion of request time?
↓
**<15%** → JIT benefit minimal (0-2%); enable but don't invest tuning effort
**15-30%** → Moderate JIT benefit (5-20%); enable and benchmark
**>30%** → Significant JIT benefit (20-95%); enable, tune, and monitor

---

What type of workload is being assessed?
↓
**Web API endpoints** → Typically I/O-bound; JIT benefit 0-5%
**Cron/queue/batch processing** → Often CPU-bound; JIT benefit 20-80%
**Report generation, data export** → CPU-bound; JIT benefit 30-95%
**Image/video processing** → CPU-bound; JIT benefit 40-80%

---

Has the assessment included background jobs, not just web traffic?
↓
**YES** → Comprehensive assessment complete
**NO** → Include background jobs; they benefit more from JIT than web requests

---

Is a sampling profiler being used (not Xdebug)?
↓
**YES** → Measurement is accurate
**NO (using Xdebug)** → Switch to sampling profiler; Xdebug's 50-200% overhead distorts CPU time measurement

---

## Rationale

JIT benefit is workload-dependent. The break-even point is ~15% CPU-bound proportion. Always measure your specific workload — published benchmarks may not apply. Background jobs typically benefit more than web requests.

---

## Recommended Default

**Default:** Enable JIT universally. For workloads with <15% CPU proportion, don't invest in tuning.
**Reason:** JIT is harmless on I/O-bound paths; background jobs benefit significantly.

---

## Risks Of Wrong Choice

* Disabling JIT because web requests don't benefit: missed gains in background jobs
* Tuning JIT for I/O-bound workload: wasted effort
* Using Xdebug for assessment: distorted timing, inaccurate conclusion

---

## Related Rules

* Match JIT Investment to Workload Boundedness
* Include Background Jobs in Assessment

---

## Related Skills

* Assess Whether JIT Native Code Compilation Benefits a Given Code Path
