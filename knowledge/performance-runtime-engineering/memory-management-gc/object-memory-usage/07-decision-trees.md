# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Object Memory Usage
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Object vs array for data transport | Implementation | Design |
| 2 | readonly properties for memory efficiency | Implementation | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: Object vs Array for Data

---

## Decision Context

Objects have ~32-64 bytes overhead per instance plus property values. Arrays have ~56 bytes per bucket plus values. For DTOs, objects with readonly properties can be more memory-efficient.

---

## Decision Criteria

* **performance** — object overhead per instance
* **architectural** — typed properties enable JIT optimizations
* **maintainability** — objects provide structure; arrays are flexible

---

## Decision Tree

Is this a DTO/value object with fixed properties?
↓
**YES** — Use readonly class. Lower memory than array + JIT-friendly.
**NO** — Dynamic structure needs array.

---

Are there >10k instances in memory simultaneously?
↓
**YES** — Use readonly typed properties. Reduces per-instance overhead and enables JIT optimizations.
**NO** — Standard classes are fine.

---

Is the object mutated frequently?
↓
**YES** — Object is fine. COW applies per property, not whole object.
**NO** — readonly properties provide both memory and safety benefits.

---

## Recommended Default

**Default:** Use readonly DTOs for data transport with fixed schemas. Arrays for dynamic data.
**Reason:** Readonly objects are more memory-efficient and JIT-friendly than arrays.

---

## Risks Of Wrong Choice

* Arrays for fixed DTOs: more memory, no type safety
* Objects with dynamic properties: overhead without benefit

---

## Related Skills

* Object Memory Usage
