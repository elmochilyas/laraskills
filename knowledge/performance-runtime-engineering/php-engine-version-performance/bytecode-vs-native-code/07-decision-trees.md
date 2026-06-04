# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP Engine Performance
**Knowledge Unit:** Bytecode vs Native Code
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | OpCache vs JIT investment priority | Performance | Optimize |
| 2 | Whether JIT native code compilation is worth the RAM | Performance | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: OpCache vs JIT Investment Priority

---

## Decision Context

Both OpCache (bytecode caching) and JIT (native code compilation) improve PHP performance but target different phases and have different ROI.

---

## Decision Criteria

* **performance** — OpCache provides 2-4x gain; JIT provides 0-95% depending on workload
* **architectural** — complementary layers, not alternatives
* **maintainability** — OpCache is set-and-forget; JIT may require tuning

---

## Decision Tree

Is OpCache already enabled and properly sized?
↓
**NO** → Enable OpCache first (2-4x gain, zero code changes, highest ROI)
**YES** → Proceed to evaluate JIT

---

What is the OpCache hit rate?
↓
**<99%** → Tune OpCache memory and max files first; JIT can wait
**>99%** → OpCache is optimal; evaluate JIT for additional gain

---

Is the workload CPU-bound or I/O-bound?
↓
**CPU-bound (>50% execution time)** → JIT provides significant gain (61-95%)
**I/O-bound** → JIT provides minimal gain (0-5%); keep default JIT but don't tune

---

## Rationale

OpCache provides 2-4x throughput by eliminating re-compilation — the single highest-ROI change. JIT eliminates VM dispatch for hot code paths but only helps CPU-bound workloads. Both should be enabled, but OpCache optimization comes first.

---

## Recommended Default

**Default:** Enable and tune OpCache first. Enable JIT with default settings (128MB buffer).
**Reason:** OpCache is universally beneficial; JIT is workload-dependent but harmless by default.

---

## Risks Of Wrong Choice

* Investing in JIT before OpCache: missing 2-4x foundational gain
* Disabling OpCache in production: 2-4x throughput loss
* Not sizing JIT buffer for CPU-bound workloads: JIT thrashing

---

## Related Rules

* Enable OpCache Before Evaluating JIT
* Match JIT Investment to Workload Boundedness
* Treat OpCache and JIT as Complementary, Not Alternative

---

## Related Skills

* Assess Whether JIT Native Code Compilation Benefits a Given Code Path
