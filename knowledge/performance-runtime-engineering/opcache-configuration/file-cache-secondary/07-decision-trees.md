# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** File Cache as Secondary Cache
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | File cache usage as secondary cache | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: File Cache as Secondary Cache

---

## Decision Context

opcache.file_cache stores compiled opcodes on disk as a secondary cache. Used when shared memory is full or on cache restart. Reduces cold-start latency.

---

## Decision Criteria

* **performance** — disk cache is slower than memory but faster than recompilation
* **architectural** — persists across restarts
* **operations** — consumes disk space

---

## Decision Tree

Is this a containerized environment with frequent restarts?
↓
**YES** — File cache provides significant value by reducing cold-start latency.
**NO** — Benefit is minimal with stable servers.

---

Is disk space available for file cache?
↓
**YES** — Enable. File cache typically 200-500MB.
**NO** — Cannot enable on disk-constrained systems.

---

Is the file cache directory on persistent storage?
↓
**YES** — Persists across restarts. Maximum benefit.
**NO (ephemeral)** — Still beneficial within container lifetime.

---

Is the file cache directory secure?
↓
**YES** — Outside web root.
**NO** — Move or restrict access.

---

## Recommended Default

**Default:** Enable opcache.file_cache for containerized deployments. Disable for stable bare metal.
**Reason:** Containers benefit from persistence; stable servers don't need it.

---

## Risks Of Wrong Choice

* No file cache in containers: slow restart
* File cache with no disk space monitor: silent failures

---

## Related Skills

* File Cache as Secondary Cache
