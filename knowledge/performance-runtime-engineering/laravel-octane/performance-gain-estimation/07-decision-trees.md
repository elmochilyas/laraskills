# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Performance Gain Estimation
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Estimating Octane throughput gain | Architecture | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: Estimating Gain

---

## Decision Context

Octane eliminates per-request bootstrap. Gain = 1 / (1 - bootstrap_fraction). If bootstrap is 30% of request time, max theoretical gain ≈ 1/(1-0.3) = 1.43x.

---

## Decision Criteria

* **performance** — gain depends on bootstrap percentage
* **architectural** — actual gain lower than theoretical (some per-request overhead remains)
* **business** — gain must justify migration cost

---

## Decision Tree

What is bootstrap time as % of total request time (profiled)?
↓
**<10%** → 1.1x gain. Not worth Octane migration.
**10-30%** → 1.1-1.4x gain. Worthwhile if throughput matters.
**>30%** → 1.4-2x gain. Strong candidate.

---

Is the application CPU-bound or IO-bound?
↓
**CPU-bound** — Higher gain. Elimination of bootstrap adds more CPU for request processing.
**IO-bound** — Lower gain. Bootstrap elimination helps, but IO wait remains bottleneck.

---

What is current throughput goal?
↓
**<2x current** — Octane may achieve this.
**>3x current** — Octane alone unlikely. Need concurrency optimization too.

---

## Recommended Default

**Default:** Expect 1.3-1.8x throughput gain for typical Laravel apps.
**Reason:** Most Laravel apps have 20-40% bootstrap overhead.

---

## Risks Of Wrong Choice

* Expecting 5x gain: unrealistic for most apps
* Not profiling bootstrap first: deploying Octane may not address actual bottleneck

---

## Related Skills

* Performance Gain Estimation
