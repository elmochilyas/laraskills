# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Circular Reference Formation
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | How to handle circular references | Architecture | Design |
| 2 | Weak references vs explicit break | Implementation | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: Handling Circular References

---

## Decision Context

Circular references (parent→child→parent) prevent reference counting from freeing memory. PHP's cycle collector handles them but adds CPU overhead.

---

## Decision Criteria

* **performance** — cycle collector runs when root buffer fills (10000 roots)
* **architectural** — weak references prevent cycles without explicit cleanup
* **maintainability** — explicit cycle breaking is more predictable

---

## Decision Tree

Does the code create circular references (common in ORMs, trees, graphs)?
↓
**NO** — No action needed; standard reference counting is sufficient.
**YES** — Choose strategy below.

---

Can the relationship be modeled without cycles?
↓
**YES** — Use unidirectional relationships. Explicitly break the cycle.
**NO** — Use WeakReference (PHP 7.4+) for one side of the cycle.

---

Is this in a hot loop (executed 1000+ times per request)?
↓
**YES** — WeakReference preferred to avoid cycle collector overhead.
**NO** — Explicit null assignment after use is simpler.

---

Is the application running in a persistent runtime (Octane)?
↓
**YES** — Cycles accumulate across requests. Use WeakReference or explicit cleanup.
**NO (FPM)** — Cycle collector runs naturally; less of a concern.

---

## Recommended Default

**Default:** Use unidirectional relationships and WeakReference to prevent cycles.
**Reason:** Avoids cycle collector overhead and ensures deterministic cleanup.

---

## Risks Of Wrong Choice

* Ignored cycles: memory not freed until root buffer full, delayed collection
* WeakReference misuse: dangling references to collected objects

---

## Related Skills

* Circular Reference Formation
* WeakReference API Usage
