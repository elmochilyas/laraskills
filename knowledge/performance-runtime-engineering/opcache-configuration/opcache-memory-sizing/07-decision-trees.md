# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Memory Sizing — memory_consumption, interned_strings_buffer
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | OpCache memory_consumption value | Configuration | Size |
| 2 | interned_strings_buffer value | Configuration | Size |

---

# Architecture-Level Decision Trees

---

## Decision: memory_consumption Value

---

## Decision Context

Setting the shared memory pool for cached opcodes. Undersizing causes eviction and recompilation. Oversizing wastes RAM.

---

## Decision Criteria

* **performance** — free memory <20% causes eviction
* **architectural** — pre-allocated at startup, never released
* **maintainability** — monitor opcache_get_status()['memory_usage']

---

## Decision Tree

What is the application type?
↓
**Laravel/Symfony** → 256MB (20K files x 10KB = 200MB + 20% headroom)
**WordPress** → 128MB
**Magento** → 512MB
**Custom/unknown** → 128MB start, monitor, adjust

---

What does monitoring show after warm-up?
↓
**Free memory >20%** → Correctly sized
**Free memory <20%** → Increase by 50% and restart PHP-FPM
**cache_full=true** → Increase both memory and max_accelerated_files

---

Is opcache.file_cache enabled?
↓
**YES** → File cache reduces memory pressure slightly; maintain same sizing
**NO** → Standard sizing applies

---

## Recommended Default

**Default:** 256MB for framework applications; 128MB for smaller apps.
**Reason:** Balances memory usage with eviction prevention for most workloads.

---

## Risks Of Wrong Choice

* 128MB for Laravel: cache eviction, CPU spikes, hit rate <90%
* Unmonitored sizing: gradual performance degradation

---

## Related Rules

* Start at 256MB for Laravel/Symfony
* Monitor Memory Usage After Warm-Up

---

## Related Skills

* OpCache Memory Sizing
