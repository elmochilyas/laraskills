# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** pm.min_spare_servers Tuning
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | pm.min_spare_servers value | Configuration | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: min_spare_servers Value

---

## Decision Context

In dynamic mode, FPM spawns workers up to min_spare_servers idle. Too low: traffic spike stalls waiting for new process. Too high: idle workers waste memory.

---

## Decision Criteria

* **performance** — too few idle causes spawn latency
* **operations** — too many idle wastes resources
* **cost** — idle workers consume memory

---

## Decision Tree

What is the traffic pattern?
↓
**Steady** → min_spare_servers = 10-20% of max_children. Enough to absorb normal variation.
**Bursty/erratic** → min_spare_servers = 30-50% of max_children. Buffer against spike.

---

What is worker startup time?
↓
**<100ms** — Lower idle count fine. Spawn is fast.
**>500ms** — More idle workers needed. Spawn latency impacts response times.

---

Is memory a constraint?
↓
**YES** — Lower min_spare_servers. Idle workers waste memory.
**NO** — Higher idle count for safety.

---

## Recommended Default

**Default:** min_spare_servers = max_children × 0.15, max_spare_servers = max_children × 0.5.
**Reason:** 15% idle buffer handles normal variation; 50% cap prevents over-spawning.

---

## Risks Of Wrong Choice

* Too low: burst traffic hits spawn latency
* Too high: idle workers waste memory

---

## Related Skills

* pm.min_spare_servers Tuning
