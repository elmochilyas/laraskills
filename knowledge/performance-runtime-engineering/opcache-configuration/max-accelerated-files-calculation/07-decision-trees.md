# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** Max Accelerated Files Calculation
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | max_accelerated_files value | Configuration | Size |
| 2 | When to increase max_accelerated_files | Configuration | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: max_accelerated_files Value

---

## Decision Context

Setting the maximum number of PHP files OpCache can cache. Must include vendor files. Value is rounded up to the nearest prime number.

---

## Decision Criteria

* **performance** — below file count causes cache_full=true, files never cached
* **architectural** — too-large values waste hash table memory
* **maintainability** — count files once, set 1.5x headroom

---

## Decision Tree

How many total PHP files exist (including vendor)?
↓
**<3000 files** → 10000 (rounded to 10007)
**3000-8000 files** → 10000 (sufficient for WordPress)
**5000-15000 files** → 20000 (Laravel base)
**15000-30000 files** → 40000 (Laravel + packages)
**>30000 files** → 100000 (monorepos, Magento)

---

Is cache_full=true in opcache_get_status()?
↓
**YES** → Increase max_accelerated_files by 50%
**NO** → Current setting is adequate

---

Does the project use Composer with many packages?
↓
**YES** → Include vendor count; vendor files consume OpCache slots
**NO** → Only count application files

---

## Recommended Default

**Default:** 20000 for Laravel/Symfony; 10000 for WordPress.
**Reason:** Provides headroom for typical framework sizes. Monitor cache_full.

---

## Risks Of Wrong Choice

* Too low: files never cached, forced recompilation
* Not counting vendor: severe undercounting for framework apps

---

## Related Rules

* Count All PHP Files Including Vendor
* Set to 1.5x Total File Count
* Monitor cache_full

---

## Related Skills

* Max Accelerated Files Calculation
