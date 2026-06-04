# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** Capacity Planning and Safety Margins
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Worker count safety margin calculation | Architecture | Plan |
| 2 | Over-provisioning vs under-provisioning | Architecture | Plan |

---

# Architecture-Level Decision Trees

---

## Decision: Safety Margin for Worker Count

---

## Decision Context

Total RSS = pm.max_children × per-worker memory. Must leave headroom for OS, PHP-FPM master, MySQL, Nginx, and burst traffic.

---

## Decision Criteria

* **performance** — over-provisioning causes swapping/OOM; under-provisioning causes 502s
* **architectural** — RSS per worker varies by endpoint
* **operations** — safety margin prevents cascading failure

---

## Decision Tree

What is available RAM?
↓
**<2GB** — Conservative margin: max 60% of RAM for workers
**2-8GB** — Standard margin: max 70%
**>8GB** — Aggressive margin: max 80%

---

What is peak per-worker RSS (from monitoring)?
↓
**<30MB** — Can run many workers; low risk
**30-60MB** — Standard risk
**>60MB** — Fewer workers or investigate memory optimization

---

Is the traffic pattern bursty or steady?
↓
**Bursty** — Lower worker count with queue. Let queuing handle bursts.
**Steady** — Higher worker count. Match to average load.

---

Is there swap configured?
↓
**YES** — Keep workers well below RAM. Swapping kills PHP performance.
**NO** — Slightly higher margin because OOM is immediate.

---

## Recommended Default

**Default:** pm.max_children = floor(available_RAM × 0.7 / avg_worker_RSS).
**Reason:** 30% headroom protects OS and absorbs traffic spikes.

---

## Risks Of Wrong Choice

* Over-provisioned: OOM kills workers, cascading failures
* Under-provisioned: 502s under load, wasted capacity

---

## Related Skills

* Capacity Planning and Safety Margins
