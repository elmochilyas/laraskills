# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** By-Reference Implications
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Pass-by-reference vs pass-by-value | Implementation | Implement |
| 2 | Return-by-reference patterns | Implementation | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: Pass-by-Reference vs Pass-by-Value

---

## Decision Context

PHP uses copy-on-write: arrays/objects passed by value share memory until modified. By-reference forces shared mutation, which can introduce side effects.

---

## Decision Criteria

* **performance** — COW means value-passing is cheap until write; references avoid copy on write but enable mutation
* **architectural** — references create tight coupling
* **maintainability** — value semantics are safer; references introduce hidden dependencies

---

## Decision Tree

Is the function expected to modify the argument?
↓
**YES** → Pass-by-reference (or make it explicit with & in signature).
**NO** → Pass-by-value. COW means sharing is free until modification.

---

Is this a very large array (>100k elements) being passed deep in a call chain?
↓
**YES** — Reference avoids deep copy at each level. But consider if refactoring is better.
**NO** — Value semantics are fine.

---

Is the function called in a hot loop (100k+/sec)?
↓
**YES** — Profile. Reference might save COW copies if the array is modified.
**NO** — Use value semantics for safety.

---

## Recommended Default

**Default:** Pass-by-value for everything unless profiling shows COW overhead is a bottleneck.
**Reason:** Value semantics are safer; PHP's COW makes them efficient.

---

## Risks Of Wrong Choice

* By-reference where not needed: hidden mutation, hard-to-track bugs
* By-value for huge arrays in deep call chains: memory overhead from copies

---

## Related Skills

* By-Reference Implications
