# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** RoadRunner Architecture (Goridge)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | RoadRunner as runtime for non-Laravel apps | Architecture | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: RoadRunner Adoption

---

## Decision Context

RoadRunner runs a Go daemon that communicates with PHP workers via Goridge (socket/protocol). Handles HTTP, jobs, gRPC, metrics.

---

## Decision Criteria

* **performance** — Go daemon handles network efficiently; PHP workers only process requests
* **architectural** — Goridge relay adds minimal overhead
* **operations** — two processes (RoadRunner + PHP workers) to manage

---

## Decision Tree

Is this a non-Laravel app (Symfony, custom)?
↓
**YES** — RoadRunner is an excellent choice. Works with any PHP framework.
**NO (Laravel)** — Octane with RoadRunner driver is simpler.

---

Are multiple protocol handlers needed (HTTP + jobs + gRPC)?
↓
**YES** — RoadRunner excels. Single daemon handles all protocols.
**NO** — FrankenPHP or Octane may be simpler.

---

Is there existing Go expertise on the team?
↓
**YES** — Full benefit of RoadRunner customization.
**NO** — Octane abstracts complexity. RoadRunner may add learning curve.

---

Is zero-downtime deployment important?
↓
**YES** — RoadRunner supports hot reload. Graceful worker replacement.
**NO** — Standard restart is fine.

---

## Recommended Default

**Default:** RoadRunner for non-Laravel apps wanting memory-resident performance.
**Reason:** Framework-agnostic, mature, well-documented.

---

## Risks Of Wrong Choice

* Goridge overhead: negligible (<1%) but measurable at extreme throughput
* Two-process model: adds deployment complexity vs single-binary FrankenPHP

---

## Related Skills

* RoadRunner Architecture (Goridge)
