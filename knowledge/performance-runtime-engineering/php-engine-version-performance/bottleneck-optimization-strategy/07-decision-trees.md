# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP Engine Performance
**Knowledge Unit:** Bottleneck Optimization Strategy
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Which optimization to apply for a given bottleneck | Performance | Diagnose |
| 2 | Bottleneck classification from symptoms | Performance | Diagnose |

---

# Architecture-Level Decision Trees

---

## Decision: Bottleneck Classification and Optimization Selection

---

## Decision Context

Before any optimization, classify the bottleneck as CPU-bound, I/O-bound, memory-bound, or framework-bound. Each type requires a different optimization lever.

---

## Decision Criteria

* **performance** — wrong optimization yields zero or negative results
* **architectural** — some optimizations require significant refactoring
* **maintainability** — match optimization complexity to bottleneck impact

---

## Decision Tree

What is CPU utilization during peak traffic?
↓
**>80%** → Potentially CPU-bound; profile execution time distribution
**<50%** → Potentially I/O-bound; check p50 vs p95 latency gap

---

What is the p50 vs p95 latency gap?
↓
**Wide gap (p95 >> p50)** → I/O variability; likely I/O-bound
**Narrow gap** → Consistent latency; likely CPU-bound or framework-bound

---

What does profiling show as the largest time consumer?
↓
**Computation, loops, algorithms (>50% execution)** → CPU-bound → Enable JIT, optimize algorithms
**Database queries, API calls (>40% wall time)** → I/O-bound → Optimize queries, add caching, consider async
**Framework bootstrap (>30% wall time)** → Framework-bound → OpCache, preloading, Octane
**RSS grows across requests** → Memory-bound → GC tuning, max_requests, leak detection

---

After optimization, does the bottleneck shift?
↓
**YES** → Re-profile and apply next optimization in priority order
**NO** → Bottleneck is resolved

---

## Rationale

Each bottleneck type requires a different lever. JIT helps CPU-bound (61-95% gain) but not I/O-bound (0-5%). Octane eliminates bootstrap but not computation. Applying the wrong optimization wastes effort and produces no improvement.

---

## Recommended Default

**Default:** Always profile before optimizing. Apply the optimization that matches the classified bottleneck type.
**Reason:** Intuition about bottlenecks is wrong more often than right. Data-driven optimization is the only reliable approach.

---

## Risks Of Wrong Choice

* JIT for I/O-bound: 0-5% gain, wasted 128MB+ RAM
* Octane for CPU-bound: marginal gain with added complexity
* OpCache tuning when bottleneck is I/O: no improvement on actual bottleneck

---

## Related Rules

* Diagnose Before Optimizing
* Do Not Expect JIT Gains for I/O-Bound Workloads
* Prefer Octane Only When Bootstrap Dominates

---

## Related Skills

* Execute a Bottleneck-Driven Optimization Cycle
