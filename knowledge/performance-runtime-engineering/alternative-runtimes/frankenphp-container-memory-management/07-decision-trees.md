# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** FrankenPHP Container Memory Management
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Container memory limits for FrankenPHP | Operations | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: Container Memory Limits for FrankenPHP

---

## Decision Context

FrankenPHP runs PHP workers within Caddy process. Memory limit must account for Caddy + PHP worker RSS.

---

## Decision Criteria

* **performance** — under-limit causes OOM kills
* **operations** — container memory limits must exceed worker RSS × worker count
* **security** — memory limit protects against DoS

---

## Decision Tree

How many workers (nb_workers)?
↓
**1** — Low memory. Container limit = worker_RSS + 50MB (Caddy).
**4** — Standard. Limit = worker_RSS × 4 + 100MB.
**8+** — High. Ensure container has proportional RAM.

---

What is per-worker peak RSS?
↓
Measure with `memory_get_peak_usage(true)` in a worker. Multiply by nb_workers.

---

Does the container have hard memory limits (K8s resource limits)?
↓
**YES** — Set php memory_limit < container_limit / nb_workers. Leave overhead for Caddy.
**NO (bare Docker)** — Memory_limit is primary protection.

---

Is there a swap limit?
↓
**YES** — Low. Container OOM is immediate.
**NO** — Swapping degrades performance silently.

---

## Recommended Default

**Default:** Container memory = (peak_worker_RSS × nb_workers) + 100MB Caddy overhead + 20% safety.
**Reason:** Ensures workers + Caddy fit without OOM.

---

## Risks Of Wrong Choice

* Container limit too low: OOM kill of entire FrankenPHP process
* Per-worker memory_limit too high: one worker can exhaust container budget

---

## Related Skills

* FrankenPHP Container Memory Management
