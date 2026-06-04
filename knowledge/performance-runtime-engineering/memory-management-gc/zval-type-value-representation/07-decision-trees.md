# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Zval Type and Value Representation
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Value type selection for memory efficiency | Implementation | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: Type Selection for Hot Paths

---

## Decision Context

PHP zvals are 16-32 byte C structs (type, value, refcount, gc_info). Type choice affects memory and CPU: integers/booleans are stored inline; strings require separate allocation; objects have indirection.

---

## Decision Criteria

* **performance** — inline types (int, bool, float, null) are fastest
* **architectural** — type affects memory layout
* **maintainability** — type selection rarely matters outside hot paths

---

## Decision Tree

Is this in a hot path (100k+ iterations)?
↓
**NO** — Any type is fine. Use what's semantically appropriate.
**YES** → Consider type impact.

---

Can the data be represented as scalar (int/bool/float) instead of object?
↓
**YES** — Prefer scalar. No allocation overhead for object structs.
**NO** — Object is necessary.

---

Is the string small and frequently compared?
↓
**YES** — Consider interned strings (best), or enum instead of string.
**NO** — Standard string handling is fine.

---

## Recommended Default

**Default:** Use PHP's native types for semantic correctness. Only optimize type selection if profiling shows type-related overhead.
**Reason:** PHP handles type dispatch efficiently; micro-optimization rarely matters.

---

## Risks Of Wrong Choice

* Replacing objects with arrays for "speed": worse cache locality and readability
* Over-optimizing: code complexity with negligible gain

---

## Related Skills

* Zval Type and Value Representation
