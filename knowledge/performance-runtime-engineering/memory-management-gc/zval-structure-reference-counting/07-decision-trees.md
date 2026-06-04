# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Zval Structure and Reference Counting
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether to optimize reference counting | Performance | Optimize |
| 2 | Copy-on-write vs explicit copy strategy | Implementation | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: Optimizing Reference Counting

---

## Decision Context

PHP uses reference counting for memory management. Each variable assignment and function call increments/decrements refcounts. Excessive refcount operations add CPU overhead.

---

## Decision Criteria

* **performance** — refcount operations add CPU cycles per variable access
* **architectural** — immutable approaches reduce refcount churn
* **maintainability** — micro-optimization; only for hot paths

---

## Decision Tree

Is this code path CPU-bound and in profiling flame graphs?
↓
**NO** → Don't optimize reference counting; benefit is negligible
**YES** → Consider immutable approaches

---

Can immutable value objects be used instead of mutable ones?
↓
**YES** → Use readonly properties. Reduces refcount operations by eliminating write barriers.
**NO** → Standard reference counting applies; optimize elsewhere.

---

Is the bottleneck in array operations (merge, push, shift)?
↓
**YES** → Consider SplFixedArray or immutable collections to reduce copy-on-write overhead
**NO** — Standard zval handling is fine

---

## Recommended Default

**Default:** Don't optimize reference counting unless it appears in profiling flame graphs.
**Reason:** Refcount operations are fast (~nanoseconds); only meaningful on hot CPU-bound paths.

---

## Risks Of Wrong Choice

* Premature optimization: wasted effort on non-bottlenecks
* Ignoring refcounts in hot loops: missed optimization on tight CPU-bound code

---

## Related Skills

* Zval Structure and Reference Counting
