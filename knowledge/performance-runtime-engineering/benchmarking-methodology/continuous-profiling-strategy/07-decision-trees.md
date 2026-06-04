# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** Continuous Profiling Strategy
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Continuous profiling adoption | Operations | Monitor |

---

# Architecture-Level Decision Trees

---

## Decision: Continuous Profiling

---

## Decision Context

Continuous profiling (Blackfire, Tideways, Pyroscope) profiles production or staging continuously. Detects CPU/memory changes over time. Complements benchmarking.

---

## Decision Criteria

* **performance** — profiling overhead must be acceptable
* **operations** — continuous data enables trend analysis
* **cost** — commercial tools have licensing cost

---

## Decision Tree

Is there a budget for commercial profiling tools?
↓
**YES** → Blackfire or Tideways. Full-featured.
**NO** → SPX (staging) or Xdebug (dev). Open source, limited continuous capability.

---

Is production profiling needed?
↓
**YES** — Choose low-overhead tool. Tideways (always-on), Blackfire (triggered).
**NO (staging only)** — SPX or Xdebug are sufficient.

---

Is the focus CPU or memory profiling?
↓
**CPU** — All tools support.
**Memory** — Blackfire and Tideways have memory profiling. SPX limited.

---

Is trend analysis over time needed?
↓
**YES** — Tideways (built-in) or Blackfire + custom storage.
**NO** — Ad-hoc profiling (SPX, Xdebug) for specific investigations.

---

## Recommended Default

**Default:** Tideways for production continuous profiling (low overhead). SPX for staging ad-hoc profiling (free).
**Reason:** Continuous profiling provides early detection; ad-hoc is for specific investigations.

---

## Risks Of Wrong Choice

* Xdebug in production: too high overhead
* No continuous profiling: regressions invisible until benchmark runs

---

## Related Skills

* Continuous Profiling Strategy
