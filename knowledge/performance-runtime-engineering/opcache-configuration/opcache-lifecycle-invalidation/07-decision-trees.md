# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Lifecycle and Invalidation
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Cache invalidation method after deployment | Operations | Deploy |
| 2 | opcache_reset() vs PHP-FPM reload for specific scenarios | Operations | Deploy |

---

# Architecture-Level Decision Trees

---

## Decision: Cache Invalidation Method After Deployment

---

## Decision Context

After code deployment, OpCache must be invalidated. Choice between opcache_reset(), PHP-FPM graceful reload, or file-specific invalidation.

---

## Decision Criteria

* **performance** — opcache_reset() is instant (<1ms); recompilation cost is deferred
* **architectural** — preloading changes require restart, not reset
* **maintainability** — must be automated in deployment pipeline

---

## Decision Tree

Did the preloading script change?
↓
**YES** → Must use PHP-FPM graceful reload or restart. opcache_reset() does NOT clear preloaded classes.
**NO** → opcache_reset() is sufficient for standard code changes.

---

Does the deployment include new PHP files?
↓
**YES** → opcache_reset() needed to cache new files
**NO** → opcache_invalidate() for specific changed files (rare)

---

Is opcache.file_cache enabled?
↓
**YES** → Both memory and file cache must be invalidated. File cache requires directory deletion.
**NO** → Memory-only invalidation via opcache_reset() or PHP-FPM restart.

---

Is there a warm-up mechanism after reset?
↓
**YES** → Proceed with reset; warm first request (e.g., curl to health endpoint)
**NO** → First real request will be slow (2-5s). Add warm-up before accepting traffic.

---

## Rationale

opcache_reset() clears the memory cache instantly. PHP-FPM graceful reload is needed when preloading changes. Warm-up prevents the first-request latency spike after reset.

---

## Recommended Default

**Default:** opcache_reset() via deployment script for code changes; PHP-FPM graceful reload for preloading changes.
**Reason:** Fastest invalidation with minimal disruption.

---

## Risks Of Wrong Choice

* opcache_reset() without warm-up: 2-5s latency spike on first request
* Not restarting for preloading changes: mixed old/new class definitions
* No automation: code changes never take effect with validate_timestamps=0

---

## Related Rules

* Always Warm Cache After opcache_reset()
* Use PHP-FPM Restart for Preloading Changes
* Include opcache_reset() in Deployment Scripts

---

## Related Skills

* OpCache Lifecycle and Invalidation
