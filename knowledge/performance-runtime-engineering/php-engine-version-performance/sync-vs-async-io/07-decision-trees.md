# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP Engine Performance
**Knowledge Unit:** Synchronous vs Asynchronous I/O
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Synchronous vs asynchronous I/O model | Architecture | Architect |
| 2 | Whether to use io_uring | Technology | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: Synchronous vs Asynchronous I/O Model

---

## Decision Context

Choosing between synchronous blocking I/O (PHP-FPM) and asynchronous non-blocking I/O (Swoole, ReactPHP) based on workload I/O profile.

---

## Decision Criteria

* **performance** — async benefit proportional to I/O wait time
* **architectural** — async requires event loop or coroutine runtime
* **maintainability** — async programming is more complex to debug
* **security** — shared state in async runtimes requires careful management

---

## Decision Tree

What is the total I/O wait time as percentage of request wall time?
↓
**<20%** → Stay synchronous (FPM); async benefit is minimal
**20-50%** → Async provides moderate benefit (15-40% throughput gain)
**>50%** → Async provides significant benefit (2-5x throughput gain)

---

What is the average latency of individual I/O operations?
↓
**<1ms** → Stay synchronous; async overhead (coroutine scheduling) > benefit
**1-50ms** → Evaluate async; RoadRunner or FrankenPHP
**>50ms** → Swoole (coroutine auto-hooking) provides maximum benefit

---

Is the workload CPU-bound or I/O-bound?
↓
**CPU-bound** → Stay synchronous; async provides no CPU benefit
**I/O-bound** → Proceed with async evaluation

---

Does the team have async programming expertise?
↓
**YES** → Swoole (full coroutine model) or RoadRunner (goroutine scheduler)
**NO** → FrankenPHP (simpler thread model) or stay synchronous

---

## Rationale

Async benefit is proportional to I/O wait time. With sub-1ms I/O, coroutine overhead can make async slower than synchronous. With 50ms+ I/O, async provides 2-5x throughput improvement.

---

## Recommended Default

**Default:** Stay synchronous (FPM) unless I/O wait exceeds 20% of wall time and individual operations exceed 10ms.
**Reason:** Synchronous is simpler, universally compatible, and proven. Async is justified only when I/O wait is significant.

---

## Risks Of Wrong Choice

* Async for CPU-bound: no benefit, added complexity
* Async for fast I/O: slower than synchronous FPM
* Blocking calls inside coroutines: defeats async purpose

---

## Related Rules

* Match Concurrency Model to Workload I/O Profile
* Never Use Async Runtimes for CPU-Bound Workloads
* Never Call Blocking Functions Inside Coroutines

---

## Related Skills

* Determine Whether Synchronous or Asynchronous I/O Fits a Workload
