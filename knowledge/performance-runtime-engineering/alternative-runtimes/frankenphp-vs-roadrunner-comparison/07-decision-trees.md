# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** FrankenPHP vs RoadRunner Comparison
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | FrankenPHP vs RoadRunner | Architecture | Select |

---

# Architecture-Level Decision Trees

---

## Decision: FrankenPHP vs RoadRunner

---

## Decision Context

Both are memory-resident PHP runtimes. FrankenPHP embeds PHP in Caddy. RoadRunner uses a Go daemon communicating with PHP workers via Goridge.

---

## Decision Criteria

* **performance** — similar base throughput gain
* **operations** — FrankenPHP single binary; RoadRunner requires Go binary + PHP workers
* **maintainability** — FrankenPHP newer; RoadRunner more mature

---

## Decision Tree

Is single-binary deployment a priority?
↓
**YES** → FrankenPHP. Caddy + PHP in one binary.
**NO** → RoadRunner. More flexible architecture.

---

Is the team familiar with Go?
↓
**YES** → RoadRunner. Custom middleware possible.
**NO** → FrankenPHP or Octane. Less Go exposure needed.

---

Is ecosystem maturity important?
↓
**YES** → RoadRunner. Longer track record, more community packages.
**NO** → FrankenPHP. Rapidly improving, modern architecture.

---

Is there an existing reverse proxy (nginx)?
↓
**YES** → RoadRunner works behind nginx easily.
**NO** → FrankenPHP (built-in Caddy) is simpler.

---

## Recommended Default

**Default:** FrankenPHP for new projects wanting simplified deployment. RoadRunner for existing deployments needing flexibility.
**Reason:** FrankenPHP is simpler; RoadRunner is more proven.

---

## Risks Of Wrong Choice

* FrankenPHP if you need nginx-specific features: not needed (Caddy replaces)
* RoadRunner without Go knowledge: harder to debug and extend

---

## Related Skills

* FrankenPHP vs RoadRunner Comparison
