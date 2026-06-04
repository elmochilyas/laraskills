# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Deployment and Cache Invalidation
**Knowledge Unit:** Rollback Planning and Version Mismatch
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Rollback strategy for PHP deployments | Operations | Plan |

---

# Architecture-Level Decision Trees

---

## Decision: Rollback Strategy

---

## Decision Context

Rollback must revert code and caches atomically. Version mismatch between code and cache causes errors. Rollback plan must cover application, OpCache, preload, Laravel caches.

---

## Decision Criteria

* **performance** — rollback must be fast (<5 min)
* **operations** — cached data compatible with rolled-back code
* **maintainability** — automated rollback reduces panic decisions

---

## Decision Tree

Is the database schema changed in the deployment?
↓
**YES (backwards-incompatible)** — Rollback is difficult. Must restore DB or use migration reversal.
**NO (forwards-compatible)** — Rollback is safe.

---

Are cached values compatible with old code?
↓
**YES (same structure)** — Reset cache on rollback to be safe.
**NO (changed structure)** — Must clear cache completely on rollback.

---

Is the rollback automated?
↓
**YES** — Script reverts code, clears all caches, restarts workers.
**NO** — Document manual rollback steps clearly.

---

What is the rollback trigger?
↓
**Error rate > threshold** → Auto-rollback.
**Manual decision** → Deployment monitor alerts, team decides.

---

## Recommended Default

**Default:** Forwards-compatible database migrations. Automated rollback script that reverts code, clears caches, and restarts workers.
**Reason:** Fast, safe rollback depends on compatible migrations and automated steps.

---

## Risks Of Wrong Choice

* Backwards-incompatible migration without reverse: cannot rollback without data loss
* No cache clear on rollback: new cache values cause errors with old code

---

## Related Skills

* Rollback Planning and Version Mismatch
