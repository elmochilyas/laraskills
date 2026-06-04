# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Driver Selection and Comparison
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Octane driver selection | Architecture | Select |

---

# Architecture-Level Decision Trees

---

## Decision: Octane Driver Selection

---

## Decision Context

Octane supports RoadRunner, Swoole, FrankenPHP. Each has different state management, concurrency model, and ecosystem.

---

## Decision Criteria

* **performance** — Swoole fastest; RoadRunner/FrankenPHP similar
* **operations** — FrankenPHP simplest; RoadRunner most documented
* **compatibility** — RoadRunner best

---

## Decision Tree

What is the team's operational preference?
↓
**One binary** → FrankenPHP. Caddy + embedded SAPI.
**Proven ecosystem** → RoadRunner. Most community examples.
**Coroutine performance** → Swoole. True async concurrent I/O.

---

Is PHP 8.2+ required?
↓
**YES** — All drivers work.
**NO (PHP 8.0/8.1)** — FrankenPHP may not support older PHP. RoadRunner/Swoole safe.

---

Is there an existing nginx config?
↓
**YES** — RoadRunner works behind nginx easily. FrankenPHP includes Caddy (replaces nginx).
**NO** — FrankenPHP's built-in Caddy simplifies deployment.

---

## Recommended Default

**Default:** RoadRunner for production (proven, best compatibility). FrankenPHP for new projects (simplest).
**Reason:** RoadRunner is battle-tested; FrankenPHP is simplest for greenfield.

---

## Risks Of Wrong Choice

* FrankenPHP as early adopter: limited community support
* Swoole without coroutine understanding: complex debugging

---

## Related Skills

* Driver Selection and Comparison
