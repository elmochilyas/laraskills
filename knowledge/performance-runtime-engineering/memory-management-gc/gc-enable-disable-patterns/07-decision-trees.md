# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** GC Enable/Disable Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether to disable GC for specific operations | Performance | Optimize |
| 2 | Re-enable pattern after GC-disable | Implementation | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: Disable GC During Hot Paths

---

## Decision Context

Disabling GC during a hot loop prevents cycle collection from running, reducing CPU overhead. Must re-enable after and explicitly collect.

---

## Decision Criteria

* **performance** — GC disable eliminates collection CPU during critical section
* **architectural** — temporary GC disable is safe only if cycles are limited
* **maintainability** — must be paired with gc_enable and gc_collect_cycles

---

## Decision Tree

Is this code path CPU-bound with GC in the flame graph (>5%)?
↓
**NO** — Don't disable GC. Not beneficial.
**YES** → Evaluate below.

---

Is this a short, bounded operation (not continuous)?
↓
**YES** — Pattern: gc_disable() → hot work → gc_enable() → gc_collect_cycles().
**NO** — Don't disable. Continuous disable risks unbounded root buffer growth.

---

Is the operation creating circular references?
↓
**YES** — Disabling GC means these cycles won't be collected. Explicit gc_collect_cycles() after.
**NO** — Disabling GC is safer; only reference-counting handles cleanup.

---

## Recommended Default

**Default:** Don't disable GC. Only use gc_disable()/gc_enable() pattern when profiling confirms GC >5% CPU.
**Reason:** GC is safety net; disabling adds risk for minimal gain in most cases.

---

## Risks Of Wrong Choice

* Disabling and not re-enabling: GC stays off, memory grows unbounded
* Disabling without explicit collection: circular references leak

---

## Related Skills

* GC Enable/Disable Patterns
