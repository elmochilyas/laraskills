# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Blacklist
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Files to blacklist from OpCache | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: OpCache Blacklist

---

## Decision Context

opcache.blacklist excludes specific files from OpCache. Useful for rarely-used files, large generated files, or files that change frequently.

---

## Decision Criteria

* **performance** — blacklisting reduces OpCache memory pressure
* **architectural** — rarely-used files waste cached slots
* **maintainability** — blacklist must be kept updated

---

## Decision Tree

Are there rarely-used files that take significant OpCache memory?
↓
**YES** — Blacklist them. Frees memory for frequently-used files.
**NO** — Blacklist is unnecessary.

---

Are there large generated or temporary PHP files?
↓
**YES** — Blacklist generated files. They occupy cache slots despite infrequent use.
**NO** — No need.

---

Are certain files changed frequently (outside deployments)?
↓
**YES** — Blacklist + validate_timestamps for those files. Avoids stale cache.
**NO** — Standard caching.

---

## Recommended Default

**Default:** Don't configure blacklist unless profiling shows OpCache memory pressure from infrequently-used files.
**Reason:** Blacklist adds maintenance burden; only beneficial when memory is constrained.

---

## Risks Of Wrong Choice

* Blacklisting common files: increases CPU from recompilation
* Not blacklisting seldom-used large files: wastes cache memory

---

## Related Skills

* OpCache Blacklist
