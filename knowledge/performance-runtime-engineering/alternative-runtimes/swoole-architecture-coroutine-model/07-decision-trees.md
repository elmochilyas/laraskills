# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** Swoole Architecture and Coroutine Model
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Swoole adoption for coroutine support | Architecture | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: Swoole for Coroutine Support

---

## Decision Context

Swoole provides true coroutines (cooperative multitasking within a single process). Enables concurrent I/O without multiple processes. Different from RoadRunner/FrankenPHP sync model.

---

## Decision Criteria

* **performance** — coroutines enable concurrent I/O with low overhead
* **architectural** — coroutines require non-blocking I/O throughout call stack
* **maintainability** — steep learning curve for coroutine programming

---

## Decision Tree

Is concurrent I/O (simultaneous DB/API calls) beneficial?
↓
**YES** — Swoole coroutines shine. Single process handles many concurrent operations.
**NO** — Synchronous model (RoadRunner/FrankenPHP) is simpler.

---

Are there blocking PHP functions in the hot path?
↓
**YES** — Swoole coroutines block on blocking calls. Need Swoole-coroutine-compatible clients.
**NO** — Coroutine model works well.

---

Is the team experienced with coroutine programming?
↓
**YES** — Full Swoole benefit.
**NO** — Consider Octane with Swoole driver first. Abstraction layer reduces coroutine exposure.

---

Is compatibility with Laravel packages important?
↓
**YES** — Use Octane with Swoole driver. Handles coroutine integration.
**NO (custom app)** — Direct Swoole usage.

---

## Recommended Default

**Default:** Octane with Swoole driver for Laravel + coroutines. Direct Swoole for custom apps.
**Reason:** Octane abstracts Swoole complexity while providing coroutine benefits.

---

## Risks Of Wrong Choice

* Direct Swoole without coroutine understanding: race conditions, deadlocks
* Blocking calls in coroutines: serializes concurrent operations, negating benefit

---

## Related Skills

* Swoole Architecture and Coroutine Model
