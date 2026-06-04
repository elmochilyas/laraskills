# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** JIT Mode Comparison
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Which JIT mode to use for production | Configuration | Configure |
| 2 | When to use aggressive JIT modes (1235) | Performance | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: Production JIT Mode Selection

---

## Decision Context

Choosing among 1254 (tracing), 1255 (tracing+default), 1205 (function), 1235 (max), and 0 (disabled).

---

## Decision Criteria

* **performance** — higher modes compile more aggressively but with more overhead
* **architectural** — mode affects compilation strategy and memory layout
* **maintainability** — 1254 is safest; aggressive modes need monitoring

---

## Decision Tree

What is the primary workload type?
↓
**General web application (mixed)** → 1254 (tracing, reduced optimizations) — safest starting point
**CPU-bound batch processing** → 1235 (tracing, all optimizations) — maximum throughput
**Function-heavy (ORM, service layer)** → 1205 (function JIT) — compiles entire functions
**I/O-only, memory-constrained** → 0 (disabled) — no JIT buffer overhead

---

Has the workload been profiled as CPU-bound?
↓
**YES (>50% execution time)** → Consider 1235 for maximum gain
**NO (<30% execution time)** → 1254 is sufficient; 1235 adds overhead without benefit

---

Is latency variance a concern (user-facing SLOs)?
↓
**YES** → Avoid 1235; compilation pauses cause latency spikes. Use 1254.
**NO (batch/background)** → 1235 is safe; latency variance doesn't matter

---

## Rationale

1254 provides the best balance of performance and safety for general workloads. 1235 is only justified for CPU-bound batch processing where compilation overhead is amortized over long runs.

---

## Recommended Default

**Default:** opcache.jit=1254 (tracing JIT, reduced optimizations).
**Reason:** Safest production starting point with minimal compilation overhead and good performance.

---

## Risks Of Wrong Choice

* 1235 in latency-sensitive environments: compilation pauses cause spikes
* Function JIT for template-heavy apps: lower throughput than tracing
* Disabled when CPU-bound work exists: missed optimization opportunity

---

## Related Rules

* Start with 1254
* Use 1235 Only for CPU-Bound Batch Processing

---

## Related Skills

* JIT Configuration for Production
