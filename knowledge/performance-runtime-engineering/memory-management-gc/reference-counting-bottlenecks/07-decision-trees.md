# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Reference Counting Bottlenecks
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether refcount operations are a bottleneck | Performance | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: Are Refcount Operations a Bottleneck?

---

## Decision Context

Each variable assignment, function call, and array modification triggers refcount inc/dec. In hot loops, this adds measurable overhead.

---

## Decision Criteria

* **performance** — refcount operations add CPU cycles per operation
* **architectural** — immutable patterns reduce refcount churn
* **maintainability** — optimization only when refcounts appear in flame graphs

---

## Decision Tree

Does profiling show zval refcount operations in the top functions?
↓
**NO** — Not a bottleneck. Don't optimize.
**YES** → Evaluate:

---

Is the code in a hot loop (iterating 10k+ times)?
↓
**YES** — Consider:
  - Using SplFixedArray instead of plain array (no copy-on-write overhead)
  - Using readonly properties (no write barriers)
  - Reducing function call overhead in loops (inline or use direct access)
**NO** — Refcount overhead is negligible outside hot paths.

---

Can the data be passed by reference instead of value?
↓
**YES** — Use &$var to avoid copy-on-write. Risk: can introduce side effects.
**NO (immutability preferred)** — Accept refcount overhead for safety.

---

## Recommended Default

**Default:** Don't optimize refcount operations unless they appear in flame graphs.
**Reason:** Refcount ops are ~nanoseconds each; only hot loops make them meaningful.

---

## Risks Of Wrong Choice

* Over-optimizing: fragile code for negligible gain
* Ignoring hot loops: missed 1-3% optimization

---

## Related Skills

* Reference Counting Bottlenecks
