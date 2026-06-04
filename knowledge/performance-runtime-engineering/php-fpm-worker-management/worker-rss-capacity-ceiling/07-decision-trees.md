# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** Worker RSS Capacity Ceiling
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Worker RSS ceiling determination | Operations | Plan |

---

# Architecture-Level Decision Trees

---

## Decision: Worker RSS Ceiling

---

## Decision Context

Each PHP-FPM worker consumes RSS. The ceiling = max workers that fit in RAM. Total RSS must be below available RAM - OS/services reserve.

---

## Decision Criteria

* **performance** — exceeding RAM causes swapping/OOM
* **operations** — peak worker count × peak RSS determines ceiling
* **cost** — RSS per worker depends on application

---

## Decision Tree

What is peak per-worker RSS (from monitoring)?
↓
Measure: `ps --no-headers -o rss -C php-fpm` during peak load. Use p95 value.

---

What is maximum concurrent worker count?
↓
pm.max_children or observed peak from status page.

---

Does total RSS (peak_RSS × max_workers) exceed available RAM - reserve?
↓
**YES** — Must reduce. Options:
  - Reduce max_children
  - Optimize per-worker memory
  - Increase RAM
**NO** — Within ceiling. Safe.

---

Is there headroom for burst (+20%)?
↓
**YES** — Ceiling is adequate.
**NO** — Reduce max_children to create burst headroom.

---

## Recommended Default

**Default:** Ceiling = (RAM - 2GB reserve) / peak_worker_RSS. Use 80% of this for production max_children.
**Reason:** 20% headroom absorbs burst traffic.

---

## Risks Of Wrong Choice

* Exceeding ceiling: OOM kills
* Too conservative: insufficient capacity

---

## Related Skills

* Worker RSS Capacity Ceiling
