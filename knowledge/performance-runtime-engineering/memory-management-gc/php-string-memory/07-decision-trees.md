# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** PHP String Memory
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | String concatenation vs implode vs sprintf | Implementation | Implement |
| 2 | Handling large strings in memory | Implementation | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: String Construction Method

---

## Decision Context

String operations vary in memory efficiency. Repeated concatenation creates multiple intermediate strings. implode() with array parts is more memory-efficient.

---

## Decision Criteria

* **performance** — memory allocation overhead per string operation
* **architectural** — large strings can dominate memory
* **maintainability** — code readability vs performance

---

## Decision Tree

Are you building a large string (10KB+)?
↓
**NO** — Any method is fine. Readability should guide choice.
**YES** — Use implode() or sprintf, not repeated .= concatenation.

---

Is this in a loop (500+ iterations)?
↓
**YES** — Collect parts in array, implode() once. Avoid .= inside loop (O(n²) at high iteration counts).
**NO** — Method doesn't matter.

---

Is memory_limit a concern?
↓
**YES** — Stream output directly. Don't build large strings in memory.
**NO** — Normal handling.

---

## Recommended Default

**Default:** Use sprintf() or single concatenation for readability. Use implode() for multi-segment strings.
**Reason:** Avoids multiple intermediate string allocations.

---

## Risks Of Wrong Choice

* .= in loop building 100KB string: 50+ intermediate allocations
* Streaming when not needed: unnecessary complexity

---

## Related Skills

* PHP String Memory
