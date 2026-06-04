# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** FPM Status Page Monitoring
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Which FPM status metrics to monitor | Operations | Monitor |
| 2 | Alert thresholds for pool saturation | Operations | Alert |

---

# Architecture-Level Decision Trees

---

## Decision: FPM Status Metrics to Monitor

---

## Decision Context

FPM status page (pm.status_path) provides active/idle/total processes, requests/sec, queue. Monitoring reveals pool saturation.

---

## Decision Criteria

* **performance** — active = total implies pool is saturated
* **operations** — queueing indicates insufficient workers
* **security** — status page must be restricted

---

## Decision Tree

Is active processes = max_children?
↓
**YES** — Pool is saturated. Request queue grows. Increase max_children or optimize request time.
**NO** — Pool has headroom.

---

Is there a non-zero listen queue?
↓
**YES** — Requests are queued. Increase max_children. Target: queue always 0.
**NO** — No queuing.

---

What is max reachable processes (max_active)?
↓
**Close to max_children** — Increase max_children by 20% for safety margin.
**Well below** — Current sizing is adequate.

---

Is the status page publicly accessible?
↓
**YES** — Restrict with firewall or authentication. Exposes pool internals.
**NO** — Safe.

---

## Recommended Default

**Default:** Monitor active/max_children ratio. Alert when >80% for >5 minutes. Alert on non-zero listen queue.
**Reason:** Saturation and queuing are leading indicators of capacity issues.

---

## Risks Of Wrong Choice

* Not monitoring queue: capacity issues invisible until 502s
* Public status page: information disclosure

---

## Related Skills

* FPM Status Page Monitoring
