# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** Metrics Definition and Interpretation
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Metrics selection for benchmarks | Performance | Measure |
| 2 | Interpreting benchmark results | Performance | Analyze |

---

# Architecture-Level Decision Trees

---

## Decision: Metrics Selection

---

## Decision Context

Key metrics: throughput (req/s), latency (p50, p95, p99), error rate, resource usage (CPU, RAM). Metrics selection depends on the performance question.

---

## Decision Criteria

* **performance** — tail latency (p99) reflects real user experience
* **operations** — throughput is capacity metric
* **business** — error rate determines availability

---

## Decision Tree

What is the question being answered?
↓
**How fast is the app?** → Latency: p50, p95, p99.
**How much can it handle?** → Throughput: max req/s before errors.
**Is it stable?** → Variance over time: latency over test duration.

---

Is latency or throughput the constraint?
↓
**Latency** — Focus on p95/p99. Goal: reduce tail.
**Throughput** — Focus on req/s at acceptable latency.
**Both** — Measure latency-throughput curve.

---

Are you comparing before/after?
↓
**YES** — Same metrics, same tool, same conditions.
**NO** — Describe methodology for reproducibility.

---

## Recommended Default

**Default:** Report p50, p95, p99 latency at target throughput level.
**Reason:** Tail latency reflects real user experience.

---

## Risks Of Wrong Choice

* Only reporting average: misses tail latency problems
* Only throughput: misses latency degradation under load

---

## Related Skills

* Metrics Definition and Interpretation
