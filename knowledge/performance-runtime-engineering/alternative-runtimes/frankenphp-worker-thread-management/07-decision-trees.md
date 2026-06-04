# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** FrankenPHP Worker/Thread Management
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Worker count for FrankenPHP | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: Worker Count

---

## Decision Context

FrankenPHP runs PHP workers as Caddy threads. Each worker handles one request at a time. nb_workers determines concurrency.

---

## Decision Criteria

* **performance** — more workers = higher concurrency but more memory
* **architectural** — workers share Caddy process memory
* **operations** — must fit within container/process memory limit

---

## Decision Tree

What is CPU core count?
↓
**1-2 cores** — nb_workers = 2-4
**4-8 cores** — nb_workers = 4-8
**>8 cores** — nb_workers = 8-16

---

Is the app CPU-bound or IO-bound?
↓
**CPU-bound** — nb_workers = CPU cores. More causes context switching.
**IO-bound** — nb_workers = cores × 2-4. Overlaps wait time.

---

What is per-worker peak memory?
↓
Multiply by nb_workers. Ensure total < container/process memory limit (minus Caddy overhead).

---

Is there existing FPM pm.max_children data?
↓
**YES** — Use similar count as starting point. Tune from there.
**NO** — Start at CPU_cores × 2.

---

## Recommended Default

**Default:** nb_workers = CPU_cores × 2 for IO-bound apps (most Laravel apps). Cap at total memory budget.
**Reason:** 2x cores overlaps IO waits without excessive context switching.

---

## Risks Of Wrong Choice

* Too many: high memory, context switching overhead
* Too few: underutilized CPU, queuing

---

## Related Skills

* FrankenPHP Worker/Thread Management
