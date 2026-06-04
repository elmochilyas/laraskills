# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** CPU vs IO-Bound Worker Ratios
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Worker count based on CPU vs IO profile | Configuration | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: Worker Count by Workload Type

---

## Decision Context

CPU-bound workers run at full CPU until done. IO-bound workers spend time waiting for DB/external calls. IO-bound allows more workers per CPU core.

---

## Decision Criteria

* **performance** — CPU-bound workers compete for CPU; IO-bound workers overlap
* **architectural** — workload type determines optimal pm.max_children
* **maintainability** — profile to determine boundness

---

## Decision Tree

What is the request profile (from profiling)?
↓
**CPU-bound (>50% time in PHP execution)** — Workers ≈ number of CPU cores. Adding more causes context switching.
**IO-bound (>50% time waiting for DB/API)** — Workers can be 2-5x CPU cores. They wait, not compete.

---

What is average request time and CPU utilization?
↓
If CPU < 70% and request times acceptable → Can add more workers.
If CPU > 90% and slow → Already CPU-bound. Workers = cores is max.

---

Can slow queries be optimized?
↓
**YES** — Reducing IO wait allows fewer workers. Optimize first, then size.
**NO** — Accept IO-bound nature. Use more workers to overlap waits.

---

## Recommended Default

**Default:** pm.max_children = CPU_cores × 2 for typical Laravel (IO-bound by DB queries).
**Reason:** Most Laravel apps are IO-bound; 2x cores overlaps IO waits.

---

## Risks Of Wrong Choice

* CPU-bound assumption with too many workers: thrashing
* IO-bound assumption with CPU-heavy app: contention

---

## Related Skills

* CPU vs IO-Bound Worker Ratios
