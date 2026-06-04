# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** GC Collect Cycles Strategic
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | When to call gc_collect_cycles() manually | Performance | Optimize |
| 2 | GC disable/enable strategy for hot paths | Performance | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: Manual gc_collect_cycles() Invocation

---

## Decision Context

PHP's garbage collector runs automatically when root buffer fills. Manual gc_collect_cycles() can trigger collection at strategic points, trading CPU time for reduced peak memory.

---

## Decision Criteria

* **performance** — collection CPU cost vs memory pressure
* **architectural** — persistent runtimes need more careful GC management
* **maintainability** — manual GC is rarely needed

---

## Decision Tree

Is the application memory-constrained (approaching memory_limit)?
↓
**NO** — Don't call gc_collect_cycles() manually. Let automatic GC handle it.
**YES** → Consider strategic manual collection.

---

Is this a long-running process (Octane, queue worker)?
↓
**YES** — Monitor memory growth. If unbounded despite GC cycling, consider manual collection after large operations.
**NO (FPM)** — Automatic GC via pm.max_requests handles memory; manual collection rarely needed.

---

Is there a known circular reference pattern in the code?
↓
**YES** — Consider gc_collect_cycles() after the operation that creates cycles.
**NO** — Manual collection likely unnecessary.

---

## Recommended Default

**Default:** Let PHP's automatic GC handle collection. Only use gc_collect_cycles() when profiling confirms memory pressure.
**Reason:** Automatic GC is well-tuned for typical workloads; manual invocation adds CPU overhead.

---

## Risks Of Wrong Choice

* Calling gc_collect_cycles() on every request: unnecessary CPU overhead
* Never collecting: unbounded memory growth in persistent runtimes

---

## Related Rules

* Let Automatic GC Handle Typical Workloads
* Monitor Memory Growth in Persistent Runtimes

---

## Related Skills

* GC Collect Cycles Strategic
