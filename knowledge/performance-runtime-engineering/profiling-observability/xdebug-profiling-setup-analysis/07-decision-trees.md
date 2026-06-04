# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Profiling and Observability
**Knowledge Unit:** Xdebug Profiling Setup and Analysis
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Xdebug profiling usage | Debug | Profile |
| 2 | Xdebug in production vs development | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: Xdebug Profiling

---

## Decision Context

Xdebug generates detailed profiling data (cachegrind format) with function-level call counts and timing. High overhead (2-10x) makes it suitable for development/staging only.

---

## Decision Criteria

* **performance** — 2-10x overhead; never in production
* **operations** — generates large profile files
* **usability** — integrates with QCacheGrind, PhpStorm

---

## Decision Tree

Is this production?
↓
**YES** — Don't use Xdebug. Use SPX, Tideways, or Blackfire with lower overhead.
**NO (dev/staging)** — Xdebug is appropriate.

---

Is the goal to profile a specific endpoint?
↓
**YES** — Enable Xdebug with trigger (XDEBUG_PROFILE). Profile on demand.
**NO** — Enable for all requests, but manage storage.

---

Is disk space sufficient for cachegrind files?
↓
**YES** — Full profiling.
**NO** — Use trigger-based profiling for selective analysis.

---

Are you analyzing with desktop tools?
↓
**YES** — QCacheGrind, KCacheGrind, or PhpStorm. Cachegrind format is standard.
**NO** — Xdebug also supports Webgrind for web-based analysis.

---

## Recommended Default

**Default:** Enable Xdebug profiling with trigger in staging. Never in production.
**Reason:** Xdebug provides best-in-class detail but at too high overhead for production.

---

## Risks Of Wrong Choice

* Xdebug in production: 2-10x latency, OOM risk
* No profiling: guessing at bottlenecks

---

## Related Skills

* Xdebug Profiling Setup and Analysis
