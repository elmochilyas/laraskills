# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Octane with FrankenPHP Server
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Running Octane with FrankenPHP driver | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: Octane + FrankenPHP

---

## Decision Context

Octane with FrankenPHP driver embeds Octane in Caddy. Single binary deployment with automatic HTTPS. Great for containerized deployments.

---

## Decision Criteria

* **performance** — similar to other drivers
* **operations** — simplest deployment (single binary)
* **maturity** — newer than RoadRunner driver

---

## Decision Tree

Is simplified deployment the top priority?
↓
**YES** — FrankenPHP + Octane. Single Docker image with Caddy + PHP.
**NO** — RoadRunner has more community support.

---

Is Docker the deployment target?
↓
**YES** — FrankenPHP Docker image handles everything. Entrypoint is Caddy.
**NO** — Need to download FrankenPHP binary.

---

Are health checks needed?
↓
**YES** — Caddy provides health endpoint. Configure in Caddyfile.
**NO** — Standard Caddyfile.

---

Is this a new or existing project?
↓
**New** → FrankenPHP is great. No legacy concerns.
**Existing** → Test compatibility first. RoadRunner may be safer.

---

## Recommended Default

**Default:** FrankenPHP for new projects wanting single-binary simplicity.
**Reason:** Compelling for greenfield projects; existing projects may prefer RoadRunner's maturity.

---

## Risks Of Wrong Choice

* Early adopter issues: smaller community for troubleshooting
* Caddyfile learning curve if team uses nginx exclusively

---

## Related Skills

* Octane with FrankenPHP Server
