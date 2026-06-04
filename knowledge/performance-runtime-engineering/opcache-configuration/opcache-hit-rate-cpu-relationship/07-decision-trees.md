# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Hit Rate and CPU Relationship
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether high CPU is caused by low OpCache hit rate | Diagnosis | Troubleshoot |
| 2 | Action threshold based on hit rate | Performance | Respond |

---

# Architecture-Level Decision Trees

---

## Decision: Is Low OpCache Hit Rate Causing High CPU?

---

## Decision Context

Every 1% decrease in OpCache hit rate increases CPU usage by 0.5-1% due to recompilation. Diagnosing whether unexplained high CPU is caused by OpCache under-provisioning.

---

## Decision Criteria

* **performance** — recompilation is CPU-intensive (60-80% of uncached request time)
* **architectural** — low hit rate indicates undersized configuration
* **maintainability** — monitoring hit rate prevents silent degradation

---

## Decision Tree

What is current OpCache hit rate?
↓
**>99%** → OpCache is not the cause of high CPU. Look elsewhere.
**95-99%** → Moderate impact. Investigate sizing.
**<95%** → Likely significant contributor to high CPU. Immediate sizing review needed.

---

Is cache_full true?
↓
**YES** → max_accelerated_files too low. Increase by 50%.
**NO** → Likely memory_consumption too low.

---

What is free memory percentage?
↓
**<20%** → Increase memory_consumption by 50%.
**>20%** → Check max_accelerated_files and wasted_memory.

---

Does CPU usage decrease after OpCache reset or PHP-FPM restart?
↓
**YES** → Confirms OpCache configuration as the cause of high CPU
**NO** → High CPU has other root causes

---

## Recommended Default

**Default:** Target >99% hit rate. Monitor CPU correlation with hit rate changes.
**Reason:** Every percentage point drop in hit rate measurably increases CPU usage.

---

## Risks Of Wrong Choice

* Ignoring <95% hit rate: significant wasted CPU, poor throughput
* Chasing 100% hit rate unnecessarily: 99%+ is sufficient; 99.9% provides negligible benefit over 99%

---

## Related Rules

* Monitor OpCache Hit Rate
* Alert on Hit Rate <99%

---

## Related Skills

* OpCache Monitoring and Hit Rate Analysis
