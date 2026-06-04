# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** CI Integration and Baseline Comparison
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | CI benchmark integration approach | Operations | CI/CD |

---

# Architecture-Level Decision Trees

---

## Decision: CI Benchmark Integration

---

## Decision Context

CI benchmarks compare performance against baseline. Must account for environment variability, statistical noise, and infrastructure changes.

---

## Decision Criteria

* **operations** — automated detection of performance regression
* **performance** — baseline comparison requires stable environment
* **maintainability** — CI benchmarks must be reliable (low false positives)

---

## Decision Tree

Is the CI environment stable (dedicated runner, same specs)?
↓
**YES** — Baseline comparison is viable.
**NO (shared runner)** — Too much noise. Compare within same run (before/after in same test session).

---

What is the acceptable regression threshold?
↓
**<5%** — Very sensitive. May have false positives.
**5-10%** — Standard. Good balance.
**>10%** — Loose. Misses meaningful regressions.

---

Is the benchmark result compared to previous commit or fixed baseline?
↓
**Previous commit** — Detects each commit's impact.
**Fixed baseline** — Detects cumulative drift.

---

Are outliers handled?
↓
**YES** — Run 3+ iterations, use median.
**NO** — Single run may be outlier.

---

## Recommended Default

**Default:** k6 in CI with thresholds. Compare to previous commit. 5% regression threshold. 3-run median.
**Reason:** Automated regression detection with manageable false positive rate.

---

## Risks Of Wrong Choice

* Shared runner with baseline comparison: noisy results
* No threshold: builds pass despite regression

---

## Related Skills

* CI Integration and Baseline Comparison
