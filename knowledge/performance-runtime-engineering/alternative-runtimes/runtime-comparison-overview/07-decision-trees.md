# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** Runtime Comparison Overview
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Runtime comparison for specific use case | Architecture | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: Runtime Comparison

---

## Decision Context

Octane (abstraction over RoadRunner/Swoole/FrankenPHP), Swoole (native C extension, coroutines), RoadRunner (Go daemon + Goridge relay), FrankenPHP (Caddy + embedded SAPI).

---

## Decision Criteria

* **performance** — all provide similar base gain (2-5x over FPM)
* **architectural** — state model differs
* **operations** — deployment complexity

---

## Decision Tree

Is pure PHP ecosystem desirable (no binary dependency)?
↓
**YES** — FrankenPHP (single binary, includes Caddy). Easiest deployment.
**NO** — RoadRunner (Go binary) or Swoole (C extension).

---

Is coroutine support needed?
↓
**YES** — Swoole/OpenSwoole. True coroutine support.
**YES but Laravel** — Octane doesn't expose coroutines natively.
**NO** — RoadRunner/FrankenPHP synchronous.

---

What is performance gain required?
↓
**2-3x** → Any runtime. All provide similar base improvement.
**3-5x** → Swoole with concurrent I/O (async DB calls).
**No gain needed** → Stay on FPM. Lower complexity.

---

## Recommended Default

**Default:** Octane for Laravel users; RoadRunner or FrankenPHP for others.
**Reason:** Octane abstracts rumtime differences; direct runtimes offer more control.

---

## Risks Of Wrong Choice

* FrankenPHP without Caddy integration knowledge: deployment confusion
* Swoole without testing: compatibility issues

---

## Related Skills

* Runtime Comparison Overview
