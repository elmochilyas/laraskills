# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Efficient Data Structures
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Data structure selection for memory-sensitive code | Implementation | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: Data Structure Selection

---

## Decision Context

PHP array (hash map) overhead is ~50-100%. SplFixedArray (contiguous C array) has ~10% overhead. Generators avoid materializing full collections. Choice depends on access pattern and size.

---

## Decision Criteria

* **performance** — less memory = better cache locality
* **architectural** — access pattern determines best structure
* **maintainability** — simplest structure that meets requirements

---

## Decision Tree

Is the collection large (>10k elements)?
↓
**NO** — Standard array. Overhead is negligible.
**YES** → Evaluate below.

---

Are associative keys needed?
↓
**YES** — Hash map (array). SplFixedArray and generators don't support string keys.
**NO** → Check access pattern.

---

Is random access (by index) needed?
↓
**YES** — SplFixedArray (memory-efficient, fast index access).
**NO** — Generator (sequential iteration, near-zero memory for active element).

---

Does the collection need dynamic sizing (push/pop)?
↓
**YES** — Standard array or SplFixedArray with manual management.
**NO** — SplFixedArray preferred for fixed-size indexed collections.

---

## Recommended Default

**Default:** Standard arrays for general use. SplFixedArray for large indexed sets. Generators for sequential processing of large datasets.
**Reason:** Match data structure to access pattern for best memory efficiency.

---

## Risks Of Wrong Choice

* Array for 100k+ elements: 50-100MB overhead
* SplFixedArray for associative data: doesn't work
* Generator for random access: can't rewind

---

## Related Skills

* Efficient Data Structures
