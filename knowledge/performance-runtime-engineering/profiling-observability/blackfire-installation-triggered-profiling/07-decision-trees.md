# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Profiling and Observability
**Knowledge Unit:** Blackfire Installation and Triggered Profiling
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Blackfire adoption for profiling | Operations | Select |

---

# Architecture-Level Decision Trees

---

## Decision: Blackfire Adoption

---

## Decision Context

Blackfire provides low-overhead profiling for production with triggered profiling, performance comparisons, and recommendations. Commercial tool with subscription.

---

## Decision Criteria

* **performance** — low overhead (~3-5%) suitable for production
* **operations** — cloud-based analysis, CI integration
* **cost** — commercial license required

---

## Decision Tree

Is there budget for commercial profiling?
↓
**YES** → Blackfire is the most comprehensive option. Production-safe.
**NO** → SPX (free) or Tideways (free tier).

---

Is production profiling needed?
↓
**YES** — Blackfire's low overhead enables on-demand production profiling.
**NO (staging only)** — SPX or Xdebug suffice.

---

Is CI profiling integration needed?
↓
**YES** — Blackfire has native CI integration with build comparisons.
**NO** — Ad-hoc profiling.

---

Are detailed performance recommendations needed?
↓
**YES** — Blackfire provides automated recommendations for bottlenecks.
**NO** — Manual analysis is fine.

---

## Recommended Default

**Default:** Blackfire for production profiling (budget permitting). SPX for free alt.
**Reason:** Blackfire provides the most complete profiling experience with production safety.

---

## Risks Of Wrong Choice

* Blackfire without budget: unexpected cost
* No production profiling: performance issues invisible under real load

---

## Related Skills

* Blackfire Installation and Triggered Profiling
