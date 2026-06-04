# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Generators and Yield
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Generator vs array for large datasets | Implementation | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: Generator vs Array

---

## Decision Context

Generators produce values on-the-fly without allocating a full collection. For large datasets, this saves significant memory. For small datasets, overhead of generator function call may exceed array allocation.

---

## Decision Criteria

* **performance** — zero memory for collection vs full allocation
* **architectural** — generators are forward-only, no random access
* **maintainability** — generators add indirection

---

## Decision Tree

Is the dataset large (>1000 elements) and >=2x memory of one element?
↓
**NO** — Start with array. Generators add overhead for small collections.
**YES** → Consider generator.

---

Is random access or multiple passes needed?
↓
**YES** — Use array or SplFixedArray. Generators are single-pass.
**NO** — Generator is ideal.

---

Is this a query result or data source that can be streamed?
↓
**YES** — Generator over cursor. Zero memory for collection.
**NO** — Must materialize.

---

Is the entire result needed for sorting/grouping?
↓
**YES** — Must collect to array. Generator won't help.
**NO** — Generator works.

---

## Recommended Default

**Default:** Use generator for sequential processing of large datasets. Use array when random access or multiple passes needed.
**Reason:** Generator memory savings are dramatic at scale; no benefit for small collections.

---

## Risks Of Wrong Choice

* Generator when random access needed: can't seek
* Array for 100k+ sequential items: hundreds of MB unnecessary

---

## Related Skills

* Generators and Yield
