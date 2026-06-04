# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Deployment and Cache Invalidation
**Knowledge Unit:** Zero-Downtime Deployment with OpCache
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Zero-downtime deployment strategy | Operations | Deploy |

---

# Architecture-Level Decision Trees

---

## Decision: Zero-Downtime Strategy

---

## Decision Context

Zero-downtime means no dropped requests during deployment. Requires graceful worker restart, OpCache warmup, and load balancer management.

---

## Decision Criteria

* **performance** — must maintain SLO during deployment
* **operations** — zero-downtime adds deployment complexity
* **cost** — blue-green requires double capacity

---

## Decision Tree

Is the application behind a load balancer?
↓
**YES** — Zero-downtime is achievable. Remove from LB, update, warm, re-add.
**NO** — Brief downtime during restart is difficult to avoid.

---

What restart method?
↓
**FPM** — Graceful reload (SIGUSR2). Old workers finish, new start.
**Octane** — Graceful restart via $server->restartWorkers(). Or reload LB + kill.

---

Is OpCache warmup built into deployment?
↓
**YES** — Run warmup requests before returning to LB.
**NO** — First requests after restart hit cold OpCache (high latency).

---

Are database migrations backwards-compatible?
↓
**YES** — Old and new code can run simultaneously during switchover.
**NO** — Requires careful sequencing (migrate → deploy → cleanup).

---

## Recommended Default

**Default:** Load balancer deregistration → graceful restart → warmup → re-registration.
**Reason:** Ensures zero-downtime with warm caches.

---

## Risks Of Wrong Choice

* No LB management: requests hit server during restart
* No warmup: high latency spike after restart

---

## Related Skills

* Zero-Downtime Deployment with OpCache
