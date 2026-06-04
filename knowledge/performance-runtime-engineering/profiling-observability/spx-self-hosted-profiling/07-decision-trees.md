# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Profiling and Observability
**Knowledge Unit:** SPX Self-Hosted Profiling
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | SPX adoption as free profiling alternative | Operations | Select |

---

# Architecture-Level Decision Trees

---

## Decision: SPX Profiling

---

## Decision Context

SPX is a free, open-source PHP profiler with low overhead. Works via browser toolbar or CLI. Suitable for development and staging.

---

## Decision Criteria

* **performance** — moderate overhead, okay for staging
* **cost** — free and open source
* **usability** — browser toolbar provides visual profile

---

## Decision Tree

Is there budget for commercial profiling tools?
↓
**YES** — Blackfire or Tideways offer more features.
**NO** → SPX is the best free option.

---

Is production profiling needed?
↓
**YES** — SPX overhead may be too high. Consider Tideways free tier.
**NO (dev/staging)** — SPX is excellent. Easy to install and use.

---

Is a visual interface needed?
↓
**YES** — SPX provides built-in browser toolbar with waterfall and flame graph.
**NO** — CLI profiling with SPX also works.

---

Is CI integration needed?
↓
**YES** — SPX supports CLI mode for script profiling. Less integrated than Blackfire.
**NO** — Manual profiling is fine.

---

## Recommended Default

**Default:** SPX for development profiling (free, built-in UI). Tideways for production (free tier).
**Reason:** SPX provides excellent visual profiling at no cost.

---

## Risks Of Wrong Choice

* SPX in production without testing overhead: may impact latency
* No profiling tool at all: guessing at bottlenecks

---

## Related Skills

* SPX Self-Hosted Profiling
