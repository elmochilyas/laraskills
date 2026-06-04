# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Cycle Collection
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Understanding cycle collection triggers | Design | Understand |

---

# Architecture-Level Decision Trees

---

## Decision: Cycle Collection Strategy

---

## Decision Context

Cycle collection handles circular references that reference counting cannot free. Collection runs when root buffer reaches 10k suspected cycles.

---

## Decision Criteria

* **performance** — collection is O(n) over root buffer
* **architectural** — prevents memory leaks from cycles
* **maintainability** — automatic; no manual intervention needed

---

## Decision Tree

Does the application create circular references?
↓
**NO** — Cycle collection rarely runs. No action.
**YES** — Collection runs when 10k suspected cycles accumulated.

---

Is cycle collection overhead visible in profiling?
↓
**NO** — No action needed.
**YES** — Reduce circular references or increase gc_threshold.

---

Is this a persistent runtime?
↓
**YES** — Cycles accumulate across requests. Monitor root buffer growth.
**NO (FPM)** — Cycles cleaned per-request by request termination.

---

## Recommended Default

**Default:** Let automatic cycle collection handle cleanup. Tune only if profiling shows >5% overhead.
**Reason:** Cycle collection is essential but well-optimized for typical workloads.

---

## Risks Of Wrong Choice

* Disabling cycle collection: circular references never freed
* Not monitoring in persistent runtimes: cumulative growth

---

## Related Skills

* Cycle Collection
