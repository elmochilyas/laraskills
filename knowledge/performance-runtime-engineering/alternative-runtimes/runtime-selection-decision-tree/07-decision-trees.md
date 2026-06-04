# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** Runtime Selection Decision Tree
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Selecting between Laravel Octane, Swoole, RoadRunner, FrankenPHP | Architecture | Select |
| 2 | When to adopt an alternative runtime | Architecture | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: Runtime Selection

---

## Decision Context

Alternative runtimes (Octane/Swoole/RoadRunner/FrankenPHP) keep PHP memory-resident across requests, eliminating bootstrap overhead. Selection depends on ecoystem fit, feature requirements, and operational complexity.

---

## Decision Criteria

* **performance** — 30-60% throughput gain vs FPM
* **architectural** — must manage persistent state
* **operations** — different deployment and monitoring requirements
* **maintainability** — package compatibility varies

---

## Decision Tree

Is the app a Laravel framework app?
↓
**YES** → Use Laravel Octane. Native integration, easiest migration.
**NO (Symfony, custom)** → Evaluate Swoole or RoadRunner directly.

---

What is the primary goal?
↓
**Higher throughput** → All runtimes provide similar gains. Choose by ecosystem fit.
**WebSocket/async** → Swoole (native async). RoadRunner (Goridge tunnel).
**Simplest ops** → FrankenPHP (single binary, Caddy integration) or Octane with RoadRunner.

---

Is package compatibility a concern?
↓
**YES (many custom packages)** → Octane with RoadRunner driver. Best Laravel compatibility.
**YES (globals used)** → RoadRunner or FrankenPHP (per-request global scope). Swoole/Octane have stricter state requirements.
**NO** → Any runtime works.

---

Is the team experienced with PHP-FPM only?
↓
**YES** → Start with Octane (lowest migration friction). Consider later migration to RoadRunner or FrankenPHP.
**NO** — Team can handle more complex setups.

---

What is the deployment environment?
↓
**Docker/K8s** → RoadRunner or FrankenPHP (health checks, graceful shutdown). FrankenPHP provides single-binary deployment.
**Bare metal** → Octane with RoadRunner or Swoole.
**Shared hosting** → Not suitable. Stay on FPM.

---

## Recommended Default

**Default:** Laravel Octane with RoadRunner driver for Laravel apps. Best balance of performance, compatibility, and community support.
**Reason:** Native Laravel integration with minimal migration effort.

---

## Risks Of Wrong Choice

* Swoole with incompatible packages: crashes or silent state corruption
* FrankenPHP early adopter: smaller community, fewer examples
* Alternative runtime without state audit: persistent state bugs

---

## Related Rules

* Profile Before Adopting Alternative Runtime
* Audit Application State Before Migration
* Verify Package Compatibility

---

## Related Skills

* Runtime Selection Decision Tree
* Octane Installation and Configuration
* State Management and Leak Prevention
