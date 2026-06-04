# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Profiling and Observability
**Knowledge Unit:** Flame Graph Generation and Interpretation
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Flame graph generation method | Performance | Analyze |

---

# Architecture-Level Decision Trees

---

## Decision: Flame Graph Generation

---

## Decision Context

Flame graphs visualize CPU usage by stack frame. X axis = frequency, Y axis = call stack depth. Generated from profiling output using Brendan Gregg's scripts.

---

## Decision Criteria

* **performance** — flame graphs identify hot functions
* **operations** — generation requires specific tooling
* **usability** — interpreted correctly guides optimization

---

## Decision Tree

Which profiling tool produced the data?
↓
**Xdebug** → Use xdebug_to_flamegraph or QCacheGrind export.
**SPX** → Built-in flame graph visualization.
**Tideways/Blackfire** → Cloud UI provides flame graphs.
**eBPF** → Brendan Gregg FlameGraph scripts (stackcollapse + flamegraph.pl).

---

What is the profiling focus?
↓
**CPU** — Normal flame graph. Width = CPU time.
**Memory** — Memory flame graph (allocation sites).
**Off-CPU** — Shows blocked time (I/O, locks).

---

Is the flame graph being compared between two versions?
↓
**YES** — Generate diff flame graph. Red = more CPU, blue = less.
**NO** — Single flame graph is sufficient.

---

## Recommended Default

**Default:** Use SPX or Tideways built-in flame graphs. For Xdebug, convert via xdebug_to_flamegraph.
**Reason:** Automated tools are simpler than manual flamegraph.pl usage.

---

## Risks Of Wrong Choice

* Interpreting inclusive time as exclusive: overestimating leaf function impact
* Single flame graph without diff: missing regressions

---

## Related Skills

* Flame Graph Generation and Interpretation
