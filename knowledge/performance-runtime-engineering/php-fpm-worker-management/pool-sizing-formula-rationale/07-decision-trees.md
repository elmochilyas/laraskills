# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** Pool Sizing Formula and Rationale
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Pool sizing formula | Architecture | Plan |

---

# Architecture-Level Decision Trees

---

## Decision: Pool Sizing Formula

---

## Decision Context

max_children = (Total_RAM - OS_reserve) / avg_worker_RSS. OS_reserve = 1-2GB or 30% of total.

---

## Decision Criteria

* **performance** — formula ensures no swapping
* **architectural** — accounts for worker RSS variation
* **operations** — formula is a starting point; monitor and adjust

---

## Decision Tree

What is total RAM?
↓
**<4GB** — OS_reserve = 1GB. Minimal headroom.
**4-16GB** — OS_reserve = 2GB. Standard.
**>16GB** — OS_reserve = 20%. Large servers have more absolute overhead.

---

What is average worker RSS from monitoring?
↓
Measure pm.status page for active workers, divide by 0.7 (vs peak). Use peak RSS for ceiling.

---

Is there MySQL/Nginx/Redis on same server?
↓
**YES** — Subtract their max RSS from available RAM too.
**NO** — Formula assumes only OS + PHP-FPM.

---

## Recommended Default

**Default:** max_children = floor((Total_RAM - 2048) / avg_worker_RSS).
**Reason:** 2GB OS reserve accommodates typical co-hosted services.

---

## Risks Of Wrong Choice

* Too aggressive: OOM when services peak simultaneously
* Too conservative: insufficient workers, queuing

---

## Related Skills

* Pool Sizing Formula and Rationale
