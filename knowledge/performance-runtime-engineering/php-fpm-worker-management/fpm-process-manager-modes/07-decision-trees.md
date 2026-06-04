# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** FPM Process Manager Modes
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | pm = static vs dynamic vs ondemand | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: Process Manager Mode

---

## Decision Context

static: fixed worker count. dynamic: min/max with idle management. ondemand: spawn on request, kill after idle.

---

## Decision Criteria

* **performance** — static is fastest (no spawn/kill overhead)
* **operations** — dynamic adapts to load
* **cost** — ondemand saves memory at low traffic

---

## Decision Tree

What is traffic pattern?
↓
**Steady** → static. Fixed count, zero overhead.
**Bursty with predictable base** → dynamic. Scales between min/max.
**Intermittent/low traffic** → ondemand. Zero idle workers saves memory.

---

Is latency critical (first request latency)?
↓
**YES** → static. No spawn latency. Ondemand adds 1-2s for first request.
**NO** → dynamic or ondemand.

---

What is the memory per worker?
↓
**<30MB** — Any mode works.
**>60MB** — Ondemand saves memory at low traffic. Static requires careful sizing.

---

## Recommended Default

**Default:** dynamic with pm.max_children = safe maximum, pm.min_spare_servers = ~10% of max.
**Reason:** Balances memory efficiency with responsiveness.

---

## Risks Of Wrong Choice

* static with too many: wastes memory
* ondemand under steady load: constant spawn/kill overhead

---

## Related Skills

* FPM Process Manager Modes
