# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Octane Performance Tuning
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Octane-specific performance tuning | Performance | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: Octane Performance Tuning

---

## Decision Context

Beyond worker count, Octane tuning includes provider optimization, route caching, event caching, and state management. All impact throughput.

---

## Decision Criteria

* **performance** — each optimization reduces per-request work
* **architectural** — some optimizations are Octane-specific
* **maintainability** — caching adds deployment steps

---

## Decision Tree

Are all cacheable optimizations enabled?
↓
**YES** — config:cache, route:cache, event:cache, view:cache.
**NO** — Enable first. These reduce per-request work significantly.

---

Are service providers optimized (deferred, merged)?
↓
**YES** — Providers boot once; optimization reduces startup time.
**NO** — Optimize providers.

---

Is memory drift monitored?
↓
**YES** — Set max_requests to bound drift if growing.
**NO** — Monitor memory to set optimal max_requests.

---

Is the deployment pipeline optimized for Octane?
↓
**YES** — Workers receive warm cache on deployment.
**NO** — Ensure cache is built before workers start.

---

## Recommended Default

**Default:** Enable config/route/event/view cache. Optimize providers. Set max_requests=1000-5000.
**Reason:** These optimizations are low-effort with high impact on Octane performance.

---

## Risks Of Wrong Choice

* Not caching config/events: each worker resolves fresh
* Too high max_requests for leaky app: memory drift

---

## Related Skills

* Octane Performance Tuning
