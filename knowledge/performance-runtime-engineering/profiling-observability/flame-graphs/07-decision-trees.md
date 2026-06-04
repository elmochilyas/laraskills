# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Profiling and Observability
**Knowledge Unit:** Flame Graphs
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | When to use flame graphs | Performance | Analyze |

---

# Architecture-Level Decision Trees

---

## Decision: Flame Graph Usage

---

## Decision Context

Flame graphs visualize CPU consumption by stack frame. Used after profiling to identify hot spots. Not a replacement for profiling, but a visualization of profiling data.

---

## Decision Criteria

* **performance** — flame graphs make hot spots visually obvious
* **operations** — must have profiling data to generate
* **usability** — intuitive once understood

---

## Decision Tree

Is profiling data already collected?
↓
**YES** — Generate flame graph from it.
**NO** — Profile first. Flame graph is visualization, not profiling.

---

Is the goal to identify the hot function?
↓
**YES** — Flame graph. Hot functions appear as wide bars at the top.
**NO** — Looking for call patterns (N+1, recursion) → Callgraph.

---

Is comparison between versions needed?
↓
**YES** — Generate diff flame graph. Red = more CPU in new version.
**NO** — Single flame graph.

---

## Recommended Default

**Default:** Generate flame graph from profiling data. Sort by exclusive time to find hot leaf functions.
**Reason:** Flame graphs visualize bottlenecks that tables hide.

---

## Risks Of Wrong Choice

* Flame graph without profiling: not possible
* Interpreting wide bottom bars as hot: top bars are the actual executors

---

## Related Skills

* Flame Graphs
