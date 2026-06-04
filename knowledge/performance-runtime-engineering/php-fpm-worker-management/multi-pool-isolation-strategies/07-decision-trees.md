# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** Multi-Pool Isolation Strategies
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Single vs multiple FPM pools | Architecture | Design |

---

# Architecture-Level Decision Trees

---

## Decision: Multiple FPM Pools

---

## Decision Context

Multiple FPM pools isolate different applications or prioritize request types. Each pool has independent process management.

---

## Decision Criteria

* **performance** — isolation prevents one app starving another
* **architectural** — each pool has dedicated workers
* **operations** — more pools = more management overhead

---

## Decision Tree

Are there multiple applications on one server?
↓
**YES** — Separate pools per app. Prevents one app's memory usage from starving another.
**NO** → Single pool usually sufficient.

---

Are there different request types (API + web + admin) with different profiles?
↓
**YES** — Consider separate pools with different pm settings. API: static, Web: dynamic, Admin: ondemand.
**NO** — Single pool is simpler.

---

Is there a noisy neighbor (high-traffic endpoint that consumes all workers)?
↓
**YES** — Separate pool for that endpoint. Prevents taking down other routes.
**NO** — Single pool is fine.

---

Is the server resource-constrained?
↓
**YES** — Single pool more efficient. Multiple pools waste idle worker capacity.
**NO** — Multiple pools for isolation.

---

## Recommended Default

**Default:** Single pool for single-application servers. Multiple pools per application or priority tier.
**Reason:** Single pool is simpler; multiple pools add overhead.

---

## Risks Of Wrong Choice

* Single pool with noisy neighbor: one endpoint can exhaust all workers
* Multiple pools on small server: idle workers in each pool waste memory

---

## Related Skills

* Multi-Pool Isolation Strategies
