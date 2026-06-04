# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** Architecture Model Differences
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Runtime architecture model selection | Architecture | Design |

---

# Architecture-Level Decision Trees

---

## Decision: Runtime Architecture Model

---

## Decision Context

Different runtime architectures: FPM (process-per-request), Swoole (event loop + coroutines), RoadRunner (Goridge relay), FrankenPHP (Caddy + embedded SAPI), Octane (abstraction layer).

---

## Decision Criteria

* **performance** — process model vs event loop vs goroutine relay
* **architectural** — memory persistence model
* **operations** — deployment complexity

---

## Decision Tree

Is request isolation critical (no state audit performed)?
↓
**YES** — FPM or FrankenPHP with worker-per-request semantics.
**NO** — Any runtime works after state audit.

---

Is async I/O needed (WebSocket, concurrent HTTP calls)?
↓
**YES** — Swoole (native coroutines) or OpenSwoole. True async.
**NO** — Octane/RoadRunner/FrankenPHP synchronous model is sufficient.

---

Is zero-downtime deployment critical?
↓
**YES** — FrankenPHP (Caddy graceful reload) or RoadRunner (hot reload).
**NO** — All runtimes support graceful restart.

---

What is the team's PHP version requirement?
↓
**PHP 8.1+** → Octane supports all drivers.
**PHP 8.0+** → Swoole works.
**PHP 8.2+** → FrankenPHP requires PHP 8.2+ (typically).

---

## Recommended Default

**Default:** Octane with RoadRunner or FrankenPHP. Avoids vendor lock-in and provides native Laravel integration.
**Reason:** Most flexible architecture with broadest compatible ecosystem.

---

## Risks Of Wrong Choice

* Swoole without understanding coroutines: race conditions
* FrankenPHP without testing: edge cases in embedded mode

---

## Related Skills

* Architecture Model Differences
