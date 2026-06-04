# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Purpose and Mechanics
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether to enable OpCache in production | Configuration | Configure |
| 2 | OpCache vs alternative caching strategies | Architecture | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: Whether to Enable OpCache in Production

---

## Decision Context

OpCache eliminates re-compilation of PHP files on every request, providing 2-4x throughput improvement. It is the single highest-ROI PHP optimization.

---

## Decision Criteria

* **performance** — 2-4x throughput with zero code changes
* **architectural** — required for JIT and preloading
* **maintainability** — set-and-forget after initial tuning

---

## Decision Tree

Is OpCache already enabled?
↓
**NO** → Enable immediately. This is the single highest-ROI PHP optimization.
**YES** → Verify proper sizing.

---

What is the current OpCache hit rate?
↓
**<95%** → Critical under-provisioning. Increase memory_consumption and max_accelerated_files.
**95-99%** → Investigate. Check cache_full flag, increase capacity.
**>99%** → OpCache is well-sized.

---

Is validate_timestamps=0 configured?
↓
**NO** → Set validate_timestamps=0 to eliminate stat() syscalls (1-3% CPU savings).
**YES** → Configuration is production-hardened.

---

Is this a development or production environment?
↓
**Production** → Always enable OpCache. Configure for maximum performance.
**Development** → Enable with validate_timestamps=1 and revalidate_freq=0 for immediate code updates.

---

## Rationale

OpCache provides 2-4x throughput gain with zero code changes. 10-15% of production deployments still have it disabled. It is also required for JIT and preloading, which provide additional benefits.

---

## Recommended Default

**Default:** Enable OpCache in all production environments with validate_timestamps=0.
**Reason:** Highest-ROI optimization. Zero code changes. Enables JIT and preloading.

---

## Risks Of Wrong Choice

* Disabled in production: 50-75% lower throughput than possible
* validate_timestamps=1 in production: 1-3% CPU wasted on stat() syscalls
* Undersized memory: cache eviction, hit rate drops, CPU spikes

---

## Related Rules

* Always Enable OpCache in Production
* Set validate_timestamps=0 in Production
* Size Memory for Your Application

---

## Related Skills

* OpCache Configuration and Sizing

---

---

## Decision: OpCache Sizing - memory_consumption and max_accelerated_files

---

## Decision Context

Setting OpCache memory and file capacity to prevent cache eviction and maintain >99% hit rate.

---

## Decision Criteria

* **performance** — undersized cache causes recompilation, CPU spikes
* **architectural** — must balance with JIT buffer and application memory
* **maintainability** — monitor and adjust based on opcache_get_status()

---

## Decision Tree

How many PHP files does the project have (including vendor)?
↓
**<5000 files** → memory_consumption=128MB, max_accelerated_files=10000
**5000-15000 files** → memory_consumption=256MB, max_accelerated_files=20000
**15000-30000 files** → memory_consumption=512MB, max_accelerated_files=40000
**>30000 files** → memory_consumption=512MB+, max_accelerated_files=100000

---

What is the cache_full indicator showing?
↓
**true** → Increase max_accelerated_files by 50%. Full reset required.
**false** → Current capacity is adequate.

---

What is free memory percentage after warm-up?
↓
**<20% free** → Increase memory_consumption by 50%. Restart PHP-FPM.
**>20% free** → Memory sizing is adequate.

---

What framework is used?
↓
**Laravel/Symfony** → Start at 256MB memory, 32MB interned strings, 20000 files
**WordPress** → Start at 128MB memory, 16MB interned strings, 10000 files
**Magento** → Start at 512MB memory, 64MB interned strings, 50000 files
**Custom/small** → Count files, set 1.5x headroom

---

## Rationale

Default settings (128MB, 10000 files) are too small for modern frameworks. Undersized OpCache causes cache eviction, forcing recompilation and CPU spikes. Always monitor opcache_get_status() after initial sizing.

---

## Recommended Default

**Default:** 256MB memory, 20000 files, 32MB interned strings for Laravel/Symfony.
**Reason:** Sufficient for most framework applications with 20% headroom.

---

## Risks Of Wrong Choice

* Too small memory: eviction, recompilation, hit rate <90%
* Too few files: cache_full=true, files never cached
* Not monitoring: silent performance degradation over time

---

## Related Rules

* Size memory_consumption for Your Application
* Count Files Including Vendor
* Monitor cache_full Indicator

---

## Related Skills

* OpCache Memory Sizing
* Max Accelerated Files Calculation
