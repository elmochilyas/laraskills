# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Deployment and Cache Invalidation
**Knowledge Unit:** Blue-Green Deployment with OpCache
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Blue-green deployment with OpCache | Operations | Deploy |

---

# Architecture-Level Decision Trees

---

## Decision: Blue-Green Strategy with OpCache

---

## Decision Context

Blue-green deployment: two environments (blue = live, green = staging). Switch traffic after green is warm. OpCache/preload must be warmed before traffic hits green.

---

## Decision Criteria

* **performance** — green must be fully warm before receiving traffic
* **operations** — zero-downtime if switch is atomic
* **cost** — double infrastructure during deployment

---

## Decision Tree

Is there enough capacity for blue + green simultaneously?
↓
**YES** — Blue-green is viable.
**NO** — Rolling deployment instead.

---

Is the green environment warmed before switching?
↓
**YES** — Run warmup requests against green to populate OpCache/preload.
**NO** — Cold workers will serve first requests, high latency.

---

Is OpCache/preload part of the warmup?
↓
**YES** — Include requests for all key endpoints in warmup.
**NO** — OpCache will populate on first traffic; latency spike.

---

Is the switch atomic (load balancer level)?
↓
**YES** — Instant cutover. No request splitting.
**NO** — Gradual shift may serve mixed code versions.

---

## Recommended Default

**Default:** Blue-green deployment with warmup phase. Warm OpCache with key endpoint requests before traffic switch.
**Reason:** Ensures zero-downtime with warm caches.

---

## Risks Of Wrong Choice

* No warmup before switch: high latency on first requests
* Not atomic switch: mixed old/new code served

---

## Related Skills

* Blue-Green Deployment with OpCache
