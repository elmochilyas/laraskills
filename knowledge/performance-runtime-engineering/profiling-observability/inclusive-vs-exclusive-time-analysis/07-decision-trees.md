# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Profiling and Observability
**Knowledge Unit:** Inclusive vs Exclusive Time Analysis
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Inclusive vs exclusive time for optimization | Performance | Analyze |

---

# Architecture-Level Decision Trees

---

## Decision: Inclusive vs Exclusive Time

---

## Decision Context

Inclusive time = function + all callees. Exclusive time = function only (minus callees). Inclusive identifies hot call chains; exclusive identifies hot leaf functions.

---

## Decision Criteria

* **performance** — inclusive finds where time is spent; exclusive finds what is slow
* **operations** — both metrics needed for complete analysis
* **maintainability** — focusing on exclusive time is more actionable

---

## Decision Tree

What is the profiling goal?
↓
**Find slow function** → Sort by exclusive time. Shows CPU-consuming leaf functions.
**Find slow call path** → Sort by inclusive time. Shows expensive call chains.

---

Is the hot function in the application code or library/vendor?
↓
**Application** — Optimize directly.
**Library/vendor** — Upgrade, find alternative, or reduce calls.

---

Is the high inclusive time caused by many calls or slow call?
↓
**Many calls (wide in flame graph)** — Reduce call count (caching, batching).
**Slow call (tall stack)** — Optimize the leaf function.

---

## Recommended Default

**Default:** Sort by exclusive time to find hot leaf functions. Use inclusive to trace the call path.
**Reason:** Exclusive time is directly actionable; inclusive provides context.

---

## Risks Of Wrong Choice

* Optimizing inclusive-only: may optimize framework overhead, not real bottleneck
* Exclusive-only in deep framework: misses expensive call chains in vendor code

---

## Related Skills

* Inclusive vs Exclusive Time Analysis
