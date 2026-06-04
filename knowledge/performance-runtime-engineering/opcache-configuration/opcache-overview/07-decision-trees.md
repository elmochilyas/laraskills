# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Overview — Purpose, Architecture, Lifecycle, Throughput Impact
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | OpCache production configuration baseline | Configuration | Configure |
| 2 | Whether OpCache is causing performance issues | Diagnosis | Troubleshoot |

---

# Architecture-Level Decision Trees

---

## Decision: OpCache Production Configuration Baseline

---

## Decision Context

Establishing the baseline OpCache configuration for a production PHP deployment.

---

## Decision Criteria

* **performance** — defaults undersized for modern frameworks
* **architectural** — OpCache is prerequisite for JIT and preloading
* **maintainability** — configuration must be paired with deployment automation

---

## Decision Tree

Is OpCache enabled?
↓
**NO** → Enable immediately. 2-4x throughput gain with zero code changes.
**YES** → Verify settings.

---

What is the application type?
↓
**Laravel/Symfony** → memory_consumption=256, interned_strings=32, max_files=20000
**WordPress** → memory_consumption=128, interned_strings=16, max_files=10000
**Magento** → memory_consumption=512, interned_strings=64, max_files=50000
**Unknown** → Count PHP files, size accordingly

---

Is validate_timestamps=0?
↓
**NO** → Set to 0. Implement opcache_reset() in deployment pipeline.
**YES** → Verify deployment automation works.

---

Is the hit rate >99% after warm-up?
↓
**YES** → Configuration is optimal
**NO** → Increase memory_consumption or max_accelerated_files

---

## Recommended Default

**Default:** See framework-specific sizing above. Always validate_timestamps=0 in production.
**Reason:** Default settings are for small apps; modern frameworks require tuned values.

---

## Risks Of Wrong Choice

* Default 128MB for Laravel: cache eviction, CPU spikes, <90% hit rate
* validate_timestamps=1: 1-3% CPU wasted on stat()
* No deployment automation: stale code after deploy

---

## Related Rules

* Enable OpCache First, Tune Later
* Set validate_timestamps=0 in Production
* Size for Your Application
* Reset OpCache After Every Deployment

---

## Related Skills

* OpCache Overview
