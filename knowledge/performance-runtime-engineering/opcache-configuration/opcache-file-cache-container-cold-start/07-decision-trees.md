# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache File Cache and Container Cold Start
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Enable opcache.file_cache | Configuration | Configure |
| 2 | File cache strategy for containers | Architecture | Design |

---

# Architecture-Level Decision Trees

---

## Decision: Enable opcache.file_cache

---

## Decision Context

file_cache stores serialized opcodes on disk as secondary cache, avoiding recompilation after PHP-FPM restart. Reduces cold-start latency by 50-70% in containers.

---

## Decision Criteria

* **performance** — 50-70% cold-start reduction
* **architectural** — requires writable disk; not available on read-only filesystems
* **security** — cache dir must not be publicly accessible

---

## Decision Tree

Is this containerized?
↓
**YES** → Enable file_cache. Container restarts trigger full recompilation without it.
**NO** → Evaluate if PHP-FPM restarts are frequent enough to justify.

---

Is there a persistent writable volume?
↓
**YES** → Use dedicated path; persists across restarts.
**NO (ephemeral only)** → Still beneficial during container lifetime; resets on restart.

---

Is the cache directory publicly accessible?
↓
**YES** → Move outside web root or restrict access.
**NO** → Safe to enable.

---

## Recommended Default

**Default:** Enable with dedicated directory for containers.
**Reason:** 50-70% cold-start reduction with minimal overhead.

---

## Risks Of Wrong Choice

* No file_cache in containers: every restart forces full recompilation
* Public cache dir: compiled opcodes exposed

---

## Related Skills

* OpCache File Cache and Container Cold Start
