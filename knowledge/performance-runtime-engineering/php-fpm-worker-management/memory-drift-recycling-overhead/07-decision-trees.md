# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** Memory Drift and Recycling Overhead
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | pm.max_requests recycling threshold | Configuration | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: pm.max_requests Value

---

## Decision Context

Workers accumulate memory over time (drift). pm.max_requests kills a worker after N requests, forcing a fresh process. Tradeoff: lower = more recycling overhead; higher = more drift.

---

## Decision Criteria

* **performance** — recycling kills warm worker (OpCache/JIT benefit lost)
* **architectural** — FPM hides most leaks via recycling
* **operations** — drift monitoring determines optimal value

---

## Decision Tree

Is memory drift per 100 requests measurable (>1MB/100 requests)?
↓
**NO** — Set pm.max_requests high (5000-10000). Low drift means recycling is avoidable.
**YES** — Set lower (500-1000) to bound leak impact.

---

What is the cost of recycling?
↓
**High (OpCache cold, JIT warmup)** — Higher max_requests. Accept some drift to avoid cold-start penalty.
**Low** — Lower max_requests for tighter memory control.

---

Is this a containerized environment?
↓
**YES** — Container restart also recycles. Align max_requests with container lifetime.
**NO** — max_requests is primary recycling mechanism.

---

## Recommended Default

**Default:** pm.max_requests = 1000 for most apps. 500 for leaky apps, 5000 for stable apps.
**Reason:** 1000 balances drift control with recycling overhead for typical PHP apps.

---

## Risks Of Wrong Choice

* Too low: constant recycling, high CPU from OpCache/JIT warmup
* Too high: unbounded memory drift, OOM

---

## Related Skills

* Memory Drift and Recycling Overhead
