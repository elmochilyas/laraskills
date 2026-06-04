# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Memory Limit Sizing
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | memory_limit value for FPM workers | Configuration | Configure |
| 2 | Per-process vs total RSS budget | Architecture | Design |

---

# Architecture-Level Decision Trees

---

## Decision: memory_limit Value

---

## Decision Context

memory_limit per request must accommodate peak usage while ensuring total RSS across all workers fits within available RAM.

---

## Decision Criteria

* **performance** — OOM kills happen when limit is too low; swap/paging when total exceeds RAM
* **architectural** — memory_limit * pm.max_children must fit in RAM
* **maintainability** — limit too high allows runaway scripts

---

## Decision Tree

What is the peak per-request memory usage (from monitoring)?
↓
**<64MB** → memory_limit=128M (safe margin)
**64-128MB** → memory_limit=256M
**128-256MB** → memory_limit=512M
**>256MB** → Investigate excessive memory usage; consider deferring heavy operations to queues.

---

What is total available RAM and pm.max_children?
↓
**memory_limit * max_children > available RAM** → Reduce max_children or lower memory_limit.
**memory_limit * max_children < available RAM * 0.7** → OK. Leave 30% headroom for OS and other processes.

---

Is the application running in a persistent runtime?
↓
**YES** — memory_limit applies per-coroutine in Octane. Set higher ceiling for cumulative state, but rely on max_requests for recycling.
**NO (FPM)** — memory_limit is the main protection against runaway growth.

---

## Recommended Default

**Default:** memory_limit=128M for typical Laravel apps. 256M if handling large uploads or heavy data processing.
**Reason:** Balances protection against runaway scripts with sufficient headroom for peak usage.

---

## Risks Of Wrong Choice

* Too low: valid requests fail with fatal error
* Too high: single request can exhaust total RSS, starving other workers

---

## Related Skills

* Memory Limit Sizing
