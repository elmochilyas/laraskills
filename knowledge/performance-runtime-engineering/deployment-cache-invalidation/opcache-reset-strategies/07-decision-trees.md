# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Deployment and Cache Invalidation
**Knowledge Unit:** OpCache Reset Strategies
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | opcache_reset() timing and method | Operations | Deploy |

---

# Architecture-Level Decision Trees

---

## Decision: OpCache Reset Method

---

## Decision Context

opcache_reset() clears all cached opcodes. Must be called after every PHP code deployment. Methods: artisan command, PHP function, web endpoint, or validate_timestamps.

---

## Decision Criteria

* **performance** — reset forces full recompilation; cold workers
* **operations** — reset must be atomic with deployment
* **security** — reset endpoint must be protected

---

## Decision Tree

Is this a load-balanced deployment?
↓
**YES** — Reset per server sequentially. Avoids thundering herd.
**NO** — Single server reset.

---

Is artisan available post-deployment?
↓
**YES** — `php artisan optimize` triggers opcache_reset() implicitly.
**NO** — Use opcache_reset() web endpoint (protected) or script.

---

Is validate_timestamps enabled?
↓
**YES** — OpCache checks file mtime. No reset needed for file changes, but slower.
**NO** — Must call opcache_reset() after deployment.

---

What is the reset method?
↓
**artisan** — Cleanest. Handles opcache + preload + Laravel caches.
**Web endpoint** — Convenient but requires auth.
**Script** — Manual or CI script executing opcache_reset() via PHP CLI.

---

## Recommended Default

**Default:** `php artisan optimize` post-deployment. Handles OpCache, preload, and Laravel caches atomically.
**Reason:** Single command invalidates all caches correctly.

---

## Risks Of Wrong Choice

* No reset after deployment: old opcodes served, fatal errors
* Simultaneous reset on all load-balanced servers: all workers cold, latency spike

---

## Related Skills

* OpCache Reset Strategies
