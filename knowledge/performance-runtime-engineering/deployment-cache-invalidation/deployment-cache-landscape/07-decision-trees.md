# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Deployment and Cache Invalidation
**Knowledge Unit:** Deployment Cache Landscape
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Understanding which caches need invalidation on deployment | Architecture | Design |

---

# Architecture-Level Decision Trees

---

## Decision: Cache Invalidation on Deployment

---

## Decision Context

On deployment: OpCache (opcodes stale), preloading (class list stale), config/route/view cache (regenerated), Laravel cache (some keys local, some shared). Each must be handled.

---

## Decision Criteria

* **performance** — stale caches cause errors or serve old content
* **operations** — invalidation must be atomic with deployment
* **maintainability** — automated invalidation prevents manual errors

---

## Decision Tree

Does the deployment change PHP code?
↓
**YES** — Must invalidate OpCache. Opcode is stale.
**NO** — Only asset changes. Skip OpCache.

---

Does the deployment change class definitions (new/removed classes)?
↓
**YES** — Regenerate preload script and restart workers.
**NO** — Preload may be valid.

---

Does the deployment change config, routes, views?
↓
**YES** — Regenerate via artisan config:cache, route:cache, view:cache.
**NO** — Cache is valid.

---

Does the deployment change application cache keys?
↓
**YES** — Clear relevant cache tags or keys.
**NO** — Cache is valid.

---

## Recommended Default

**Default:** On deployment: opcache_reset() + preload regeneration + artisan optimize:clear + artisan optimize.
**Reason:** Comprehensive invalidation ensures no stale caches serve old code.

---

## Risks Of Wrong Choice

* Missing OpCache reset: fatal errors for changed classes
* Missing preload regeneration: preloaded old class definitions

---

## Related Skills

* Deployment Cache Landscape
