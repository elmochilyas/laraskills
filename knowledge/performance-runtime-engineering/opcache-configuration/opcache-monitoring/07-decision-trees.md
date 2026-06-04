# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Monitoring
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | OpCache monitoring metrics | Operations | Monitor |
| 2 | Alert thresholds | Operations | Alert |

---

# Architecture-Level Decision Trees

---

## Decision: OpCache Monitoring

---

## Decision Context

OpCache status provides metrics: hit_rate, memory_used, cached_keys, cache_full. Monitoring these prevents silent performance degradation.

---

## Decision Criteria

* **performance** — hit rate <99% indicates configuration problems
* **operations** — monitoring enables proactive tuning
* **maintainability** — automated alerts prevent manual checks

---

## Decision Tree

What is the current hit rate?
↓
**>99%** — Healthy. No action needed.
**95-99%** — Monitor. May need tuning.
**<95%** — Action needed. Increase memory_consumption or max_accelerated_files.

---

Is cache_full true?
↓
**YES** — max_accelerated_files too low or memory too low. Increase.
**NO** — Cache has headroom.

---

What % of memory is used?
↓
**<80%** — Sufficient.
**80-95%** — Monitor. Plan increase.
**>95%** — Increase memory_consumption.

---

What % of cached keys are stale (wasted memory)?
↓
**>10%** — Fragmentation. Consider opcache.revalidate_frequency tuning or pool increase.

---

Is OpCache status being logged?
↓
**YES** — Regular snapshots enable trend analysis.
**NO** — Start logging. Critical for post-deployment verification.

---

## Recommended Default

**Default:** Monitor hit_rate, memory_usage%, cache_full. Alert on hit_rate <99%, memory >80%, cache_full=true.
**Reason:** These metrics directly indicate configuration adequacy.

---

## Risks Of Wrong Choice

* No monitoring: silent performance degradation
* Only checking after deployment: misses gradual memory growth

---

## Related Skills

* OpCache Monitoring
