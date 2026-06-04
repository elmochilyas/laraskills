# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Array Memory Usage
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Reducing array memory overhead | Implementation | Optimize |

---

# Architecture-Level Decision Trees

---

## Decision: Reducing Array Memory

---

## Decision Context

PHP arrays are ordered hash maps with significant overhead per element (bucket structure + hash table entry). Large arrays consume 2-4x the data size.

---

## Decision Criteria

* **performance** — large arrays dominate memory
* **architectural** — alternative structures reduce overhead
* **maintainability** — optimization only for large collections

---

## Decision Tree

Is the array >10k elements?
↓
**NO** — Array overhead is negligible. No optimization needed.
**YES** → Evaluate alternatives.

---

Is random access by integer index sufficient?
↓
**YES** — Use SplFixedArray. 50-80% memory reduction.
**NO** — Need associative keys; array is required.

---

Can data be stored as packed scalar values?
↓
**YES** — Consider pack() for binary data or storing in DB/file instead.
**NO** — Array is appropriate.

---

## Recommended Default

**Default:** Standard arrays for most uses. SplFixedArray for large integer-indexed collections.
**Reason:** Memory savings only matter at scale.

---

## Risks Of Wrong Choice

* SplFixedArray for small arrays: complexity with no benefit
* Array for 100k+ elements: hundreds of MB overhead

---

## Related Skills

* Array Memory Usage
