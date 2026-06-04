# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Worker Configuration by Driver
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Worker count by driver | Configuration | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: Worker Count by Driver

---

## Decision Context

RoadRunner: CLI workers in separate processes. Swoole: coroutine-based workers in same process. FrankenPHP: PHP workers in Caddy threads. Worker count affects concurrency.

---

## Decision Criteria

* **performance** — more workers = higher concurrency
* **architectural** — memory budget determines max workers
* **operations** — driver-specific configuration

---

## Decision Tree

What driver?
↓
**RoadRunner** → Workers = separate processes. Static count in .rr.yaml. Count = CPU_cores × 2 (IO-bound) or CPU_cores (CPU-bound).
**Swoole** → Workers = swoole server workers. Can also use coroutines within workers. Workers = CPU_cores typically.
**FrankenPHP** → Workers = nb_workers in Caddyfile. Count = CPU_cores × 2 (IO-bound).

---

What is the memory budget per worker?
↓
Measure with memory_get_peak_usage(true) in a representative request. Multiply by worker count.

---

Does total estimated RSS fit in available RAM - 30% reserve?
↓
**YES** — Configuration is safe.
**NO** — Reduce worker count.

---

Is this an IO-bound or CPU-bound app?
↓
**IO-bound** — More workers (2-4x cores). Overlaps wait time.
**CPU-bound** — Workers = cores. More causes contention.

---

## Recommended Default

**Default:** RoadRunner: workers = CPU_cores × 2. Swoole: workers = CPU_cores. FrankenPHP: nb_workers = CPU_cores × 2.
**Reason:** Default for IO-bound typical Laravel apps.

---

## Risks Of Wrong Choice

* Too many workers on CPU-bound app: context switching overhead
* Too few on IO-bound app: underutilized CPU

---

## Related Skills

* Worker Configuration by Driver
