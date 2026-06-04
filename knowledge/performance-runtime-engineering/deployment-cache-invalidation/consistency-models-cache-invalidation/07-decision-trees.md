# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Deployment and Cache Invalidation
**Knowledge Unit:** Consistency Models and Cache Invalidation
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Cache consistency model selection | Architecture | Design |

---

# Architecture-Level Decision Trees

---

## Decision: Cache Consistency Model

---

## Decision Context

Caches can be eventually consistent (TTL-based) or strongly consistent (immediate invalidation). Eventual consistency is simpler but may serve stale data.

---

## Decision Criteria

* **performance** — strong consistency adds overhead for invalidation
* **architectural** — eventual consistency may serve stale data within TTL
* **operations** — strong consistency requires invalidation infrastructure

---

## Decision Tree

Is stale data acceptable for the cached data type?
↓
**YES (infrequent updates, no correctness impact)** → Eventual consistency. TTL-based expiry. Simpler.
**NO (correctness-critical)** → Strong consistency. Invalidate on write.

---

What is the acceptable staleness window?
↓
**<1s** — Near-strong consistency. Use pub/sub invalidation.
**1-60s** — Short TTL. Most user-facing caches.
**>60s** — Long TTL. Acceptable for reference data.

---

Is the cache shared across instances?
↓
**YES** — Distributed invalidation (Redis pub/sub, shared version key).
**NO** — Local cache. Invalidation is simpler.

---

## Recommended Default

**Default:** Eventual consistency with short TTL (30-60s) for most caches. Strong consistency for correctness-critical data.
**Reason:** Balances simplicity with staleness acceptable for most use cases.

---

## Risks Of Wrong Choice

* Eventual consistency for critical data: stale data causes errors
* Strong consistency for all caches: unnecessary complexity, overhead

---

## Related Skills

* Consistency Models and Cache Invalidation
