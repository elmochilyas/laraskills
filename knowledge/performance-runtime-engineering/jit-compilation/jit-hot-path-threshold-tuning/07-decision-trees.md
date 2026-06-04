# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** JIT Hot Path Threshold Tuning
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | jit_hot_loop and jit_hot_func threshold values | Configuration | Tune |
| 2 | Default vs lowered thresholds per runtime | Performance | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: Hot Path Threshold Values

---

## Decision Context

Adjusting jit_hot_loop (default 64) and jit_hot_func (default 100) to balance compilation speed vs warm-up time.

---

## Decision Criteria

* **performance** — lower thresholds = faster warm-up, more buffer pressure
* **architectural** — short-lived workers need different thresholds than long-lived
* **maintainability** — default thresholds work for most cases

---

## Decision Tree

What is the worker lifetime?
↓
**Short-lived (FPM, pm.max_requests < 500)** → Lower thresholds (loop=16, func=50) to accelerate warm-up before worker recycles
**Long-running (Octane, Swoole, 1000s of requests)** → Default thresholds (64/100) are fine; warm-up is once per worker

---

Is the workload loop-heavy or function-call-heavy?
↓
**Loop-heavy (templating, data processing)** → Lower jit_hot_loop (16), keep jit_hot_func (100)
**Function-call-heavy (ORM, domain logic)** → Lower jit_hot_func (50), keep jit_hot_loop (64)
**Mixed** → Keep defaults (64/100)

---

Is buffer utilization already high (>80%)?
↓
**YES** → Raise thresholds to reduce number of compiled functions; don't lower them
**NO (<50%)** → Lowering thresholds is safe; there's buffer space for more compiled code

---

## Rationale

Default thresholds work for most applications. Lower thresholds accelerate warm-up but increase buffer pressure. In long-running processes, warm-up is a one-time cost, so defaults are fine. In FPM with short worker lifetimes, lower thresholds help.

---

## Recommended Default

**Default:** jit_hot_loop=64, jit_hot_func=100.
**Reason:** Balanced for most workloads without excessive memory pressure.

---

## Risks Of Wrong Choice

* Too low thresholds: excessive compilation, buffer thrashing
* Too high thresholds: hot code never compiled, missed JIT benefit
* Not adjusting for short-lived workers: JIT never reaches steady state

---

## Related Rules

* Start with Default Thresholds
* Lower Thresholds for High-Turnover Workers

---

## Related Skills

* JIT Hot Path Threshold Tuning
