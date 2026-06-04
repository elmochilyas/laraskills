# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Cyclic GC Algorithm
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Understanding when cyclic GC runs | Performance | Understand |
| 2 | Mitigating cyclic GC impact | Performance | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: When Cyclic GC Runs

---

## Decision Context

PHP's cyclic GC triggers when the root buffer (10k entries) fills with suspected cycles. It marks, scans, and collects cycles. This is CPU-intensive but avoids OOM from circular references.

---

## Decision Criteria

* **performance** — GC scan is O(n) over the root buffer
* **architectural** — circular reference patterns determine GC frequency
* **maintainability** — fewer cycles = less GC work

---

## Decision Tree

Does the application create circular references (ORM entities, trees, graphs)?
↓
**NO** — Cyclic GC rarely runs. No action needed.
**YES** — Cycles are added to root buffer on unset. When buffer hits 10k, GC runs.

---

Is GC execution visible in profiling (<5% CPU)?
↓
**NO** — GC impact is acceptable.
**YES** (>5%) — Reduce circular references or raise gc_threshold.

---

Can circular references be eliminated?
↓
**YES** — Use WeakReference or unidirectional relationships. Fix the root cause.
**NO** — Raise gc_threshold to reduce GC frequency.

---

## Recommended Default

**Default:** Let cyclic GC run automatically. Only tune if profiling shows >5% CPU in GC.
**Reason:** Cyclic GC is essential for avoiding memory leaks from circular references.

---

## Risks Of Wrong Choice

* Disabling GC entirely: unbounded memory growth from circular references
* Raising threshold too high: delayed collection, peak memory increase

---

## Related Skills

* Cyclic GC Algorithm
