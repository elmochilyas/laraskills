# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** max_accelerated_files
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | max_accelerated_files value | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: max_accelerated_files

---

## Decision Context

max_accelerated_files sets the number of PHP files OpCache can cache. Too low = files evicted, recompilation. Too high = wasted hash table memory.

---

## Decision Criteria

* **performance** — insufficient = cache misses
* **architectural** — count PHP files in codebase
* **operations** — monitor cached file count

---

## Decision Tree

How many PHP files total (app + vendor)?
↓
Count with: `find . -name '*.php' | wc -l`
Set max_accelerated_files = file_count × 1.2 (buffer).

---

What is the current cached file count?
↓
**<80% of max** — Sufficient.
**>80%** — Increase by 50%.
**At max** — Increase immediately. Files are being evicted.

---

Is reuse_freq set?
↓
**YES (default 2)** — Only files accessed at least twice are cached.
**NO** — Ensure files meet frequency threshold.

---

What is the hash table bucket option?
↓
Use recommended preset values (1254, 2255, 5205, 1235) for max_accelerated_files.
These match hash table to value for optimal performance.

---

## Recommended Default

**Default:** max_accelerated_files = 8000 for most apps (~10000-15000 PHP files).
**Reason:** Accommodates typical Laravel vendor + app code.

---

## Risks Of Wrong Choice

* Too low: files evicted, recompiled, low hit rate
* Too high: wasted hash table memory, minimal impact

---

## Related Skills

* max_accelerated_files
