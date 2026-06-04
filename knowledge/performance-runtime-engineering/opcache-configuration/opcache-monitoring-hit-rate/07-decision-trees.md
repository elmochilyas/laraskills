# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Monitoring and Hit Rate Analysis
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether OpCache is under-provisioned | Monitoring | Diagnose |
| 2 | What action to take based on monitoring data | Operations | Respond |

---

# Architecture-Level Decision Trees

---

## Decision: Is OpCache Under-Provisioned?

---

## Decision Context

Monitoring opcache_get_status() metrics to detect and diagnose cache under-provisioning before users notice performance degradation.

---

## Decision Criteria

* **performance** — every 1% hit rate drop increases CPU usage 0.5-1%
* **architectural** — cache_full flag never auto-clears; requires reset
* **maintainability** — continuous monitoring prevents silent degradation

---

## Decision Tree

What is the current OpCache hit rate?
↓
**>99%** → OpCache is healthy; no action needed
**95-99%** → Investigate; potential under-provisioning developing
**<95%** → Critical under-provisioning. Immediate action needed.

---

Is cache_full true?
↓
**YES** → max_accelerated_files is too low. Increase by 50%. Requires reset or restart.
**NO** → File capacity is adequate.

---

What is the free memory percentage?
↓
**>20% free** → Memory sizing is adequate
**<20% free** → memory_consumption may be too low. Increase by 50%.

---

What is the wasted memory percentage?
↓
**<5%** → Normal fragmentation
**>5%** → Fragmentation accumulating. Consider periodic reset or restart.

---

## Rationale

Three critical metrics: hit rate (>99%), cache_full (false), wasted_memory (<5%). A hit rate of 95% means 5% of requests trigger compilation — on a busy server, thousands of compilations per second.

---

## Recommended Default

**Default:** Monitor hit rate, cache_full, and free memory via opcache_get_status() in production dashboard.
**Reason:** Early detection prevents silent performance degradation.

---

## Risks Of Wrong Choice

* Not monitoring: degradation detected only by user complaints
* Ignoring cache_full: files never cached; all requests compile
* Only checking during incidents: no baseline for normal behavior

---

## Related Rules

* Monitor OpCache Hit Rate in Production Dashboards
* Alert on cache_full=true
* Reset If wasted_memory >5%

---

## Related Skills

* OpCache Monitoring and Hit Rate Analysis
