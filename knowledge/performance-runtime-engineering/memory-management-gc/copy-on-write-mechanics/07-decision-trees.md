# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Copy-on-Write Mechanics
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether COW separation is a performance concern | Performance | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: Is COW Separation a Bottleneck?

---

## Decision Context

PHP shares memory for identical zvals until one is modified. COW separation copies the zval on first write. In hot paths with frequent array modifications, this adds measurable overhead.

---

## Decision Criteria

* **performance** — COW copy overhead for large arrays
* **architectural** — immutable patterns avoid COW entirely
* **maintainability** — rarely needs optimization

---

## Decision Tree

Does the hot path modify large (>10k element) arrays that were passed from another scope?
↓
**NO** — COW overhead is negligible.
**YES** — Consider:

---

Can the array be created locally (avoids sharing, no COW needed)?
↓
**YES** — Create locally. No COW because the array is never shared.
**NO** — Use SplFixedArray (no COW overhead) or pass-by-reference.

---

Is the array modified many times in a loop?
↓
**YES** — Each modification triggers COW separation. Consider:
  - Using SplFixedArray (no COW for element writes)
  - Accumulating in local collection and returning at end
**NO** — Single modification is fine.

---

## Recommended Default

**Default:** Don't optimize for COW. Only investigate if profiling shows zval_copy_ctor in top CPU consumers.
**Reason:** COW is highly optimized in PHP 8.x; only large arrays in hot paths need attention.

---

## Risks Of Wrong Choice

* Over-optimizing: SplFixedArray for small arrays adds complexity with no benefit
* Ignoring COW in hot loops: unnecessary copies in tight code

---

## Related Skills

* Copy-on-Write Mechanics
