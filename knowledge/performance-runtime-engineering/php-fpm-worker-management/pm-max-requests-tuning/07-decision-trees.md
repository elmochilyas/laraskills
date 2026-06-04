# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** pm.max_requests Tuning
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | pm.max_requests value | Configuration | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: pm.max_requests Value

---

## Decision Context

Controls how many requests a worker handles before being killed. Balances memory drift vs warm worker benefit.

---

## Decision Criteria

* **performance** — high value avoids OpCache/JIT warmup
* **operations** — low value bounds memory drift
* **maintainability** — find sweet spot via monitoring

---

## Decision Tree

What is memory drift per request?
↓
**<10KB/request** — Set high (5000-10000). Drift is minimal.
**10-50KB** — Moderate (1000-2000). Acceptable drift.
**>50KB** — Low (500). Must recycle frequently.

---

What is OpCache status after worker start?
↓
**Warm** → High max_requests (5000). No warmup penalty.
**Cold (new worker)** → Medium (1000). Warmup costs <10 requests.

---

Is this a leaky app (drift doesn't plateau)?
↓
**YES** — Low max_requests (500). Frequent recycling bounds leak.
**NO** — Higher is fine.

---

## Recommended Default

**Default:** pm.max_requests = 1000. Tune up if drift is low, down if drift is high.
**Reason:** 1000 is a safe balance for most PHP applications.

---

## Risks Of Wrong Choice

* Too low: excessive recycling, CPU waste on warmup
* Too high: unbounded memory drift, OOM

---

## Related Skills

* pm.max_requests Tuning
