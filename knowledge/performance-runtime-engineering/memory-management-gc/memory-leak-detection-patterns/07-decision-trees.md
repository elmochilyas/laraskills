# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Memory Leak Detection Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether RSS growth indicates a memory leak | Diagnosis | Detect |
| 2 | How to fix identified memory leaks | Debug | Resolve |

---

# Architecture-Level Decision Trees

---

## Decision: Is RSS Growth a Memory Leak?

---

## Decision Context

In persistent runtimes, worker RSS that grows over time may indicate a memory leak. Distinguishing between normal allocation patterns and actual leaks.

---

## Decision Criteria

* **performance** — leaks cause OOM over time
* **architectural** — FPM hides leaks via per-request cleanup; persistent runtimes expose them
* **maintainability** — leak detection requires monitoring over process lifetime

---

## Decision Tree

What runtime is in use?
↓
**PHP-FPM** — RSS growth reset per request via pm.max_requests. Monitor pre/post request delta.
**Octane/Swoole/FrankenPHP** — RSS accumulates across requests. Trend matters.

---

Does RSS grow continuously (never plateaus)?
↓
**YES** — Likely a memory leak. Profile heap growth.
**NO (plateaus at stable level)** — Normal allocation. No leak.

---

Is the growth reproducible across worker restarts?
↓
**YES** — Consistent leak pattern. Proceed to identify source.
**NO** — May be environmental or request-specific.

---

Can the growth be linked to specific endpoints or patterns?
↓
**YES** — Profile those endpoints specifically for memory allocation.
**NO** — Set max_requests for worker recycling as mitigation.

---

## Recommended Default

**Default:** Monitor RSS hourly in persistent runtimes. Set max_requests=5000 for recycling.
**Reason:** Prevention is easier than detection; recycling bounds the impact of any leak.

---

## Risks Of Wrong Choice

* Ignoring growth: OOM crash after hours of operation
* False positive: investigating normal allocation patterns wastes time

---

## Related Rules

* Monitor RSS in Persistent Runtimes
* Set max_requests for Recycling

---

## Related Skills

* Memory Leak Detection Patterns
