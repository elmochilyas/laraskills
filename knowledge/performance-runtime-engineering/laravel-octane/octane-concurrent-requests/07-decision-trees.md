# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Octane Concurrent Requests
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Using Octane concurrent task execution | Implementation | Use |
| 2 | When to use concurrent vs sequential | Implementation | Design |

---

# Architecture-Level Decision Trees

---

## Decision: Concurrent Request Execution

---

## Decision Context

Octane provides `Concurrent` facade for parallel task execution within a single request. Uses Swoole coroutines or PHP 8.1+ fibers to run tasks concurrently.

---

## Decision Criteria

* **performance** — concurrent execution reduces total request time
* **architectural** — tasks must be independent
* **maintainability** — adds complexity

---

## Decision Tree

Are there multiple independent operations in the request (DB calls, API calls)?
↓
**YES** — Consider concurrent execution.
**NO** — Sequential is simpler.

---

Do the operations share any state or dependencies?
↓
**NO** — Safe to parallelize.
**YES** — Must be sequential. Concurrent shared state causes race conditions.

---

Is the time saved worth the complexity?
↓
Calculate: total_sequential - max(operation_times). If savings > 100ms, concurrent is worthwhile.
**<50ms savings** — Sequential is fine.

---

Is Swoole driver used (true concurrency)?
↓
**YES** — Concurrent provides real parallelism.
**NO (RoadRunner/FrankenPHP)** — Concurrent provides concurrency, but PHP's single-thread model means non-blocking I/O only for network calls.

---

## Recommended Default

**Default:** Use concurrent execution for 2+ independent slow operations (API calls, DB queries) that each take >50ms.
**Reason:** Meaningful time savings with manageable complexity.

---

## Risks Of Wrong Choice

* Concurrent with shared state: race conditions
* Overhead > benefit: managing concurrent code for 10ms savings

---

## Related Skills

* Octane Concurrent Requests
