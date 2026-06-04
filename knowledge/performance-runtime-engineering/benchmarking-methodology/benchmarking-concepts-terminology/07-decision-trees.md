# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** Benchmarking Concepts and Terminology
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Benchmarking methodology selection | Performance | Plan |

---

# Architecture-Level Decision Trees

---

## Decision: Benchmarking Methodology

---

## Decision Context

Benchmarking must define metrics (latency, throughput, error rate), methodology (warmup, sample size, duration), and tool selection. Poor methodology produces misleading results.

---

## Decision Criteria

* **performance** — accurate measurement requires methodology rigor
* **operations** — benchmark must be repeatable
* **maintainability** — CI integration requires automated benchmarking

---

## Decision Tree

Is the benchmark comparing two configurations (A/B test)?
↓
**YES** — Use same hardware, same tool, same duration, same warmup.
**NO** — Absolute measurements are less actionable.

---

Is warmup sufficient?
↓
**YES** — Run 1000+ requests or 10s before measuring.
**NO** — Cold results overstate improvement.

---

Is sample size sufficient (p99 accuracy)?
↓
**YES** — At least 10000 samples for p99 confidence.
**NO** — Results may not be statistically significant.

---

Are you measuring coordinated omission?
↓
**YES** — Use wrk2 (constant rate) instead of wrk (open loop).
**NO** — Results may underestimate tail latency.

---

## Recommended Default

**Default:** wrk2 with constant rate, 60s test, 10s warmup, measure p50/p95/p99 latency.
**Reason:** Standardized methodology produces comparable, reliable results.

---

## Risks Of Wrong Choice

* No warmup: overestimates impact
* Too short duration: misses GC pauses, variance
* Open-loop benchmark (wrk): coordinated omission hides tail latency

---

## Related Skills

* Benchmarking Concepts and Terminology
