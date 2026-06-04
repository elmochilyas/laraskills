# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** WeakReference API Usage
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | WeakReference for cache entries | Implementation | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: WeakReference for Caching

---

## Decision Context

WeakReference allows cached objects to be garbage collected when memory is needed. Useful for large, regenerable objects that should not prevent memory reclamation.

---

## Decision Criteria

* **performance** — auto-eviction reduces manual cache management
* **architectural** — WeakReference does not prevent GC
* **maintainability** — WeakReference can cause unexpected null returns

---

## Decision Tree

Is the cache value large and regenerable?
↓
**YES** — WeakReference is appropriate. Object freed when memory pressure triggers GC.
**NO** — Use strong reference cache (e.g., array or Map).

---

Does the value need to survive until explicitly evicted?
↓
**YES** — Use strong references (e.g., TTL-based cache).
**NO** — WeakReference auto-eviction is fine.

---

Are null returns from WeakReference handled gracefully?
↓
**YES** — Implement fallback (regenerate value) when WeakReference returns null.
**NO** — WeakReference will cause errors. Use strong references.

---

## Recommended Default

**Default:** Use WeakReference for large, regenerable cache values where auto-eviction is acceptable.
**Reason:** Enables automatic memory reclamation without manual cache invalidation.

---

## Risks Of Wrong Choice

* WeakReference for required values: null returns cause errors
* Strong references for large caches: memory pressure, potential OOM

---

## Related Skills

* WeakReference API Usage
