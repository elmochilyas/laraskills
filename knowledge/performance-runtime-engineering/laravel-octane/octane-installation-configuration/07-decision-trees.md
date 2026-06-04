# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Octane Installation and Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Octane server driver selection | Configuration | Install |
| 2 | Configuration options | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: Octane Server Driver

---

## Decision Context

Octane supports RoadRunner, Swoole, FrankenPHP. Selection affects performance, compatibility, and operations.

---

## Decision Criteria

* **performance** — all similar; Swoole slightly faster for CPU-bound
* **operations** — RoadRunner most mature; FrankenPHP simplest
* **compatibility** — RoadRunner has broadest package compatibility

---

## Decision Tree

Is package compatibility the top priority?
↓
**YES** → RoadRunner driver. Best package compatibility.
**NO** → Evaluate by feature needs.

---

Is the deployment Docker/K8s?
↓
**YES** → FrankenPHP (single binary) or RoadRunner (health checks).
**NO** → Any driver works.

---

Are coroutines needed for concurrent I/O?
↓
**YES** → Swoole driver. Octane exposes concurrent tasks via Concurrent.
**NO** → RoadRunner or FrankenPHP.

---

Is simplified operations preferred?
↓
**YES** → FrankenPHP (single binary with Caddy).
**NO** → RoadRunner (proven, community support).

---

## Recommended Default

**Default:** Octane + RoadRunner for most deployments. FrankenPHP for simplified ops.
**Reason:** RoadRunner has widest compatibility; FrankenPHP is simplest to deploy.

---

## Risks Of Wrong Choice

* Swoole driver with incompatible package: crashes
* No driver compatibility check before deployment: production issues

---

## Related Skills

* Octane Installation and Configuration
