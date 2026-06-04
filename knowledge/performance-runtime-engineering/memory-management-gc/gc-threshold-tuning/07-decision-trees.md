# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** GC Threshold Tuning
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | GC threshold value adjustment | Performance | Tune |
| 2 | Whether to disable GC in specific scenarios | Performance | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: GC Threshold Adjustment

---

## Decision Context

gc_threshold (default 10001) controls when PHP's cycle collector triggers. Lower values = more frequent collections (higher CPU, lower peak memory).

---

## Decision Criteria

* **performance** — collection CPU cost vs peak memory reduction
* **architectural** — memory-constrained apps benefit from lower thresholds
* **maintainability** — default is optimal for most workloads

---

## Decision Tree

Is the application hitting memory_limit frequently?
↓
**NO** — Keep default threshold (10001). No tuning needed.
**YES** — Lower threshold (5000-8000) for more frequent collections.

---

Is this a CPU-bound application where GC overhead is measurable?
↓
**YES** — Raise threshold (20000-50000) for less frequent collection.
**NO** — Default threshold is fine.

---

Is this a persistent runtime (Octane)?
↓
**YES** — Consider raising threshold. More cycles build up between collections, but collection is more efficient when it runs.
**NO (FPM)** — Default is fine; collections happen per-request.

---

## Recommended Default

**Default:** Keep default gc_threshold=10001 for most applications.
**Reason:** PHP's default threshold is well-calibrated for typical web workloads.

---

## Risks Of Wrong Choice

* Too low: excessive GC CPU overhead
* Too high: peak memory increases, potential OOM

---

## Related Skills

* GC Threshold Tuning
