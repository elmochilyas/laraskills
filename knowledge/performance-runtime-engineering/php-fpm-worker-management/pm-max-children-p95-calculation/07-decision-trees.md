# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** pm.max_children p95 Calculation
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | pm.max_children value based on p95 concurrency | Configuration | Calculate |

---

# Architecture-Level Decision Trees

---

## Decision: max_children Based on p95 Concurrency

---

## Decision Context

pm.max_children should cover p95 concurrent requests + safety margin. Under = queueing/502s. Over = wasted RAM.

---

## Decision Criteria

* **performance** — insufficient workers cause queuing
* **operations** — monitor active connections to find p95 concurrency
* **cost** — overallocating wastes memory

---

## Decision Tree

What is p95 concurrent request count (from load balancer or logs)?
↓
**<10** — min_children = p95 × 1.5. Small margin.
**10-100** — max_children = p95 × 1.3.
**>100** — max_children = p95 × 1.2. Large scale allows tighter margin.

---

What is p95 request duration?
↓
**<200ms** — Lower margin needed. Workers return to pool quickly.
**>500ms** — Higher margin. Slow requests hold workers longer.

---

Is there a hard latency SLO?
↓
**YES** — More margin. Queuing adds latency.
**NO** — Tighter margin acceptable; slight queuing is tolerable.

---

## Recommended Default

**Default:** max_children = p95_concurrent × 1.3. Monitor queue length and adjust.
**Reason:** 30% headroom absorbs normal traffic variation without excess waste.

---

## Risks Of Wrong Choice

* Too low: queuing adds latency, eventually 502s
* Too high: idle workers waste memory

---

## Related Skills

* pm.max_children p95 Calculation
