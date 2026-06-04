# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** String Memory Usage
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | String construction for memory efficiency | Implementation | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: Memory-Efficient String Building

---

## Decision Context

PHP strings are allocated separately from the zval. Repeated concatenation (`.=`) creates new allocation each iteration. implode() with array collects all parts then allocates once.

---

## Decision Criteria

* **performance** — concat in loop = O(n²) allocations
* **architectural** — large strings can dominate memory
* **maintainability** — readability vs memory efficiency

---

## Decision Tree

Is the string built in a loop (>500 iterations)?
↓
**YES** — Use array + implode(). .= creates new string each iteration.
**NO** — Any method is fine.

---

Is the final string very large (>100KB)?
↓
**YES** — Consider streaming output instead of building in memory.
**NO** — Normal handling.

---

Are many similar strings compared repeatedly?
↓
**YES** — Use interned strings or string interning via hash table.
**NO** — Standard string handling.

---

## Recommended Default

**Default:** Collect parts in array, implode() once after loop. For large output, stream instead of building string.
**Reason:** Avoids O(n²) allocation in loops.

---

## Risks Of Wrong Choice

* .= in loop: 50+ intermediate allocations for 500 iterations
* Building huge strings in memory: memory_limit exceeded

---

## Related Skills

* String Memory Usage
