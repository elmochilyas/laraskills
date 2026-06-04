# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** Methodology: Warmup and Sample Size
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Warmup duration and sample size | Performance | Plan |

---

# Architecture-Level Decision Trees

---

## Decision: Warmup and Sample Size

---

## Decision Context

OpCache and JIT need warmup to reach steady state. JIT warmup requires function execution before profiling compilation. Sample size must be sufficient for statistical confidence.

---

## Decision Criteria

* **performance** — cold vs warm results differ significantly
* **operations** — benchmark duration must balance accuracy vs time
* **statistics** — more samples = narrower confidence intervals

---

## Decision Tree

Is JIT enabled?
↓
**YES** — Warmup 5000+ requests or 30s. JIT profiling compilation needs execution.
**NO** — Warmup 1000+ requests or 10s. OpCache needs first-pass.

---

What is the target metric?
↓
**p50** → 1000+ samples sufficient.
**p95** → 5000+ samples.
**p99** → 10000+ samples for stable measurement.

---

Is the benchmark automated (CI)?
↓
**YES** — Balance warmup time with pipeline duration. 60s total (warmup + test).
**NO** — Longer duration for more accurate results.

---

## Recommended Default

**Default:** 10s warmup + 30s measurement. 10000+ requests for p99 accuracy.
**Reason:** Standard duration balances accuracy with time cost.

---

## Risks Of Wrong Choice

* No warmup: 20-50% error in throughput measurement
* Too few samples: p99 varies wildly between runs
* Too short duration: misses GC pauses

---

## Related Skills

* Methodology: Warmup and Sample Size
