# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** GC CPU Overhead
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether GC CPU overhead is excessive | Performance | Evaluate |
| 2 | GC disable vs GC threshold tuning | Performance | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: Is GC Overhead Excessive?

---

## Decision Context

GC consumes CPU when the cycle collector scans root buffers. In apps with many circular references, this can reach 5-15% of CPU.

---

## Decision Criteria

* **performance** — every GC cycle scans up to 10000 roots
* **architectural** — persistent runtimes accumulate more roots over time
* **maintainability** — disabling GC is risky; tuning is safer

---

## Decision Tree

Is GC appearing in profiling flame graphs (>5% execution time)?
↓
**NO** — GC CPU overhead is acceptable. No action needed.
**YES** → Evaluate below.

---

Does the application have known circular reference patterns?
↓
**YES** — Fix circular references first (use WeakReference). This reduces root buffer size.
**NO** — GC may be scanning unintentional references.

---

Is this a persistent runtime (Octane)?
↓
**YES** — Consider periodic gc_collect_cycles() during idle periods to reduce peak scan size.
**NO (FPM)** — GC runs per-request; overhead is proportional to request complexity.

---

Can GC be disabled entirely (gc_disable)?
↓
**YES (only if you know what you're doing)** — Disable only if profiling confirms GC >10% CPU and there are no circular reference leaks. Must be paired with max_requests recycling.
**NO** — Keep GC enabled. Tune threshold instead.

---

## Recommended Default

**Default:** Keep GC enabled. Fix circular references via WeakReference instead of disabling GC.
**Reason:** GC provides safety. Disabling risks unbounded memory growth.

---

## Risks Of Wrong Choice

* Disabling GC: memory leaks accumulate until OOM
* Ignoring GC overhead: wasted CPU on unnecessary scanning

---

## Related Skills

* GC CPU Overhead
