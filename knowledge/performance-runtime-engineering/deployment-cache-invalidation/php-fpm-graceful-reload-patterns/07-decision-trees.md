# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Deployment and Cache Invalidation
**Knowledge Unit:** PHP-FPM Graceful Reload Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Graceful reload method for PHP-FPM | Operations | Deploy |

---

# Architecture-Level Decision Trees

---

## Decision: FPM Graceful Reload

---

## Decision Context

SIGUSR2 to PHP-FPM master starts new workers with new config, old workers finish current requests then exit. Zero-downtime when done correctly.

---

## Decision Criteria

* **performance** — new workers have cold OpCache until warmup
* **operations** — graceful reload must allow old workers to finish
* **security** — signal must be sent with proper permissions

---

## Decision Tree

Is there a PHP configuration change (php.ini, pool config)?
↓
**YES** — Graceful reload required. SIGUSR2 to PHP-FPM master.
**NO** — opcache_reset() alone may suffice.

---

Are there long-running requests (>30s)?
↓
**YES** — Set pm.process_idle_timeout to retire old workers after they finish.
**NO** — Standard graceful reload.

---

Is the deployment automated?
↓
**YES** — Include kill -USR2 in deployment script.
**NO** — Manual reload risks forgotten step.

---

Is there a load balancer in front?
↓
**YES** — Remove server from LB before restart, add back after warmup.
**NO** — Brief latency spike on restart (cold OpCache).

---

## Recommended Default

**Default:** Graceful reload via SIGUSR2. Remove from LB, restart, warm up, add back.
**Reason:** Zero-downtime with graceful connection drain.

---

## Risks Of Wrong Choice

* SIGTERM instead of SIGUSR2: kills workers immediately, drops requests
* No warmup before returning to LB: first requests hit cold OpCache

---

## Related Skills

* PHP-FPM Graceful Reload Patterns
