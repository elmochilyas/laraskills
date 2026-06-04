# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Deployment and Cache Invalidation
**Knowledge Unit:** Multi-Instance Cache Coordination
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Coordinating cache invalidation across instances | Operations | Deploy |

---

# Architecture-Level Decision Trees

---

## Decision: Multi-Instance Coordination

---

## Decision Context

With multiple app servers/containers, cache invalidation must be coordinated. Strategies: sequential restart, shared cache with version key, time-based expiry.

---

## Decision Criteria

* **performance** — coordinated invalidation prevents mixed versions
* **operations** — sequential restart avoids thundering herd
* **maintainability** — simplest strategy that prevents mixed-code serving

---

## Decision Tree

Is the deployment parallel (all servers at once)?
↓
**YES** — Use shared cache version key. Invalidate old key, all servers detect.
**NO (rolling)** — Sequential restart per server. Shared cache remains valid.

---

Do all servers share OpCache or Laravel cache?
↓
**YES (shared)** — Need version key or tag-based invalidation. All servers see change.
**NO (local-only)** — Sequential per-server restart is sufficient.

---

Is atomicity of code version important?
↓
**YES** — Blue-green. Complete environment swap.
**NO** — Rolling restart with shared cache.

---

Is there a distributed state store (Redis)?
↓
**YES** — Use cache version key. Redis pub/sub for invalidation broadcast.
**NO** — Local caches only. Sequential restart.

---

## Recommended Default

**Default:** Rolling restart with sequential per-server OpCache reset. If shared cache, use version key.
**Reason:** Simplest approach for local caches; version key coordinates shared caches.

---

## Risks Of Wrong Choice

* Parallel restart + shared cache: version mismatch between server and cache
* No coordination: stale cache entries after deployment

---

## Related Skills

* Multi-Instance Cache Coordination
