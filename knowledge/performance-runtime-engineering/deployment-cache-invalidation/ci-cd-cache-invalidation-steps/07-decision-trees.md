# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Deployment and Cache Invalidation
**Knowledge Unit:** CI/CD Cache Invalidation Steps
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Cache invalidation in CI/CD pipeline | Operations | CI/CD |

---

# Architecture-Level Decision Trees

---

## Decision: CI/CD Cache Invalidation

---

## Decision Context

CI/CD pipeline must include cache invalidation steps: OpCache reset, preload regeneration, Laravel cache rebuild, and warmup. Missing steps cause stale-cache errors.

---

## Decision Criteria

* **performance** — incomplete invalidation causes errors
* **operations** — all invalidation steps must be automated
* **maintainability** — pipeline must handle different deployment types

---

## Decision Tree

Does the build step include cache compilation?
↓
**YES** — config:cache, route:cache, event:cache, view:cache in build.
**NO** — Add these steps. Reduces per-worker work.

---

Does the deploy step include OpCache reset?
↓
**YES** — `php artisan optimize` or opcache_reset().
**NO** — Add. Without it, old opcodes are served.

---

Does the deploy step include preload regeneration?
↓
**YES** — Preload script regenerated.
**NO** — Add. Old preloaded classes cause errors.

---

Does warmup follow deployment?
↓
**YES** — Automated warmup requests after deploy.
**NO** — Add. Warms OpCache and preload.

---

Is the pipeline idempotent (safe to run multiple times)?
↓
**YES** — Re-running doesn't cause errors.
**NO** — Ensure idempotency.

---

## Recommended Default

**Default:** CI/CD pipeline: build (caches) → deploy (restart + optimize) → warmup (endpoint requests).
**Reason:** Complete lifecycle prevents stale-cache errors.

---

## Risks Of Wrong Choice

* Missing OpCache reset: fatal errors on changed classes
* Missing warmup: first-request latency spikes

---

## Related Skills

* CI/CD Cache Invalidation Steps
