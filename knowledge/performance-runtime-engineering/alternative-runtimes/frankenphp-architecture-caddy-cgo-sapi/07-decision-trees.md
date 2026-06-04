# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** FrankenPHP Architecture (Caddy + CGO + SAPI)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | FrankenPHP adoption | Architecture | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: Adopt FrankenPHP

---

## Decision Context

FrankenPHP embeds PHP via CGO into Caddy, providing a single binary webserver. Each worker runs in a Caddy thread with automatic HTTPS and graceful reloads.

---

## Decision Criteria

* **performance** — single binary eliminates nginx/FPM process overhead
* **operations** — simplified deployment
* **maintainability** — early-stage ecosystem

---

## Decision Tree

Is simplified deployment (single binary) a priority?
↓
**YES** — FrankenPHP excels. Deploy one binary + app code.
**NO** — Other runtimes offer more flexibility.

---

Is automatic HTTPS via Caddy useful?
↓
**YES** — Built-in. No separate nginx/Certbot.
**NO** — Already have reverse proxy setup.

---

Is the team comfortable with Caddyfile syntax?
↓
**YES** — Low friction.
**NO** — Learning curve. Consider Octane with RoadRunner instead.

---

Does the app use globals or static state?
↓
**YES** — FrankenPHP runs workers in Caddy threads. Each worker has isolated state.
**NO** — Octane provides better state management tooling.

---

## Recommended Default

**Default:** Evaluate FrankenPHP for new projects or deployments wanting single-binary simplicity.
**Reason:** Compelling for greenfield projects; mature projects benefit from Octane's ecosystem.

---

## Risks Of Wrong Choice

* Early adoption: smaller community, fewer troubleshooting resources
* CGO dependency: larger binary, potential build issues

---

## Related Skills

* FrankenPHP Architecture
