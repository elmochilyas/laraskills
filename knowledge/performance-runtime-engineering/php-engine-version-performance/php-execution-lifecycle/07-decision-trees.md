# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP Engine Performance
**Knowledge Unit:** PHP Execution Lifecycle
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Which lifecycle phase to optimize | Optimization Targeting | Optimize |
| 2 | OpCache vs JIT vs preloading investment | Tool Selection | Configure |
| 3 | Cold vs warm measurement methodology | Testing | Measure |

---

# Architecture-Level Decision Trees

---

## Decision: Which Lifecycle Phase to Optimize

---

## Decision Context

The PHP execution lifecycle has four phases: lexing, parsing, compilation, execution. Each requires different optimization. Identify which phase is the bottleneck.

---

## Decision Criteria

* **performance** — each phase has different optimization ROI
* **architectural** — OpCache addresses compilation, JIT addresses execution
* **maintainability** — some optimizations (preloading) require code changes

---

## Decision Tree

Is OpCache enabled in production?
↓
**NO** → Enable OpCache immediately (2-4x gain, highest ROI)
**YES** → Continue to next check

---

What is the OpCache hit rate?
↓
**<99%** → Size OpCache memory and max_accelerated_files
**>99%** → Compilation is optimized; check execution phase

---

Is the request slow during cold start (first request after deploy)?
↓
**YES** → Preloading reduces cold-start autoloading latency
**NO** → Check JIT for execution-phase optimization

---

Is the bottleneck CPU-bound computation?
↓
**YES** → Enable and tune JIT (61-95% gain for CPU-bound)
**NO** → Bottleneck is in I/O or application logic — not lifecycle phases

---

## Rationale

Optimization must target the correct phase. OpCache eliminates re-compilation (phases 1-3). Preloading reduces bootstrap. JIT accelerates execution (phase 4). Applying JIT when compilation is the bottleneck yields no improvement.

---

## Recommended Default

**Default:** Enable OpCache first, then profile to determine if preloading or JIT is needed.
**Reason:** OpCache provides the highest ROI with zero code changes.

---

## Risks Of Wrong Choice

* Tuning JIT on a compilation-bound system: zero improvement
* Disabling OpCache in production: 2-4x throughput loss
* Ignoring cold-start performance: bad user experience after deployments

---

## Related Rules

* Always Enable OpCache in Production
* Design Benchmarks for Both Cold and Warm States
* Use Typed Properties to Reduce Opcode Count

---

## Related Skills

* Profile and Optimize Each Phase of the PHP Execution Lifecycle

---

---

## Decision: Cold vs Warm Benchmark Measurement

---

## Decision Context

Whether to measure cold-cache (post-deployment) or warm-cache (steady-state) performance — and how to interpret each.

---

## Decision Criteria

* **performance** — cold includes compilation cost, warm does not
* **architectural** — deployment pipeline needs to account for cold-start latency
* **maintainability** — measuring both requires longer test cycles

---

## Decision Tree

What is the purpose of the measurement?
↓
**User-facing latency SLO validation** → Measure warm (steady-state) for typical user experience
**Deployment impact assessment** → Measure cold first, then warm
**Capacity planning** → Measure warm only (steady-state determines ceiling)

---

Are you comparing two PHP versions or configurations?
↓
**YES** → Warm up fully (30s+) before each measurement to isolate version differences
**NO** → Single environment assessment; measure both cold and warm

---

Does the deployment pipeline include preloading?
↓
**YES** → Cold-start gap is smaller; measure both but expect reduced delta
**NO** → Cold-start will be significantly slower; plan for post-deploy warm-up period

---

## Rationale

Cold requests include compilation time that warm requests skip. Reporting only warm results hides deployment-time latency impact. Both are valid depending on the question asked.

---

## Recommended Default

**Default:** Measure and report both cold and warm states when benchmarking for optimization.
**Reason:** Provides complete picture of deployment impact and steady-state performance.

---

## Risks Of Wrong Choice

* Measuring only warm: underestimates deployment-time latency
* Measuring only cold: overestimates steady-state latency, incorrect capacity plans

---

## Related Rules

* Design Benchmarks for Both Cold and Warm States
* Warm Up Before Measuring

---

## Related Skills

* Profile and Optimize Each Phase of the PHP Execution Lifecycle
