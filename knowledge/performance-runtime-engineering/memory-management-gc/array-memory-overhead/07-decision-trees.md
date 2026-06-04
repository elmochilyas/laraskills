# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Array Memory Overhead
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Array type selection for memory-sensitive code | Implementation | Implement |
| 2 | SplFixedArray vs plain array | Implementation | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: Array Type for Memory Efficiency

---

## Decision Context

PHP arrays are hash maps with ~50-100% memory overhead over flat arrays. SplFixedArray uses contiguous C arrays with ~10% overhead.

---

## Decision Criteria

* **performance** — less memory = better cache locality
* **architectural** — SplFixedArray lacks associative keys
* **maintainability** — plain arrays are more flexible

---

## Decision Tree

Is the array very large (>10k elements)?
↓
**YES** — Consider SplFixedArray. Memory savings are significant at scale.
**NO** — Plain array overhead is negligible.

---

Are associative keys needed?
↓
**YES** — Use plain array. SplFixedArray only supports integer indices.
**NO** — SplFixedArray works.

---

Does the array need dynamic resizing (push/pop)?
↓
**YES** — Plain array is easier. SplFixedArray requires manual allocation.
**NO** — SplFixedArray is ideal.

---

Is this a hot path where memory bandwidth is a bottleneck?
↓
**YES** — Use SplFixedArray. Contiguous memory improves cache locality and iteration speed.
**NO** — Plain array is fine.

---

## Recommended Default

**Default:** Plain arrays for general use. SplFixedArray for large (>10k), indexed-only, fixed-size datasets.
**Reason:** Plain arrays offer flexibility; SplFixedArray only benefits at scale.

---

## Risks Of Wrong Choice

* SplFixedArray for small arrays: no benefit, less flexible API
* Plain arrays for 100k+ element collections: 100+ MB memory overhead

---

## Related Skills

* Array Memory Overhead
