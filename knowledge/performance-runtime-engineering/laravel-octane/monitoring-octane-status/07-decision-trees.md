# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Monitoring Octane Status
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Octane metrics to monitor | Operations | Monitor |
| 2 | Alert thresholds | Operations | Alert |

---

# Architecture-Level Decision Trees

---

## Decision: Octane Metrics to Monitor

---

## Decision Context

Octane provides status endpoint (via driver) showing worker count, request count, memory. Must monitor worker health to detect leaks.

---

## Decision Criteria

* **performance** — worker memory growth indicates leaks
* **operations** — status page enables proactive intervention
* **security** — status page must be restricted

---

## Decision Tree

Is worker memory growing over worker lifetime?
↓
**YES** — Memory leak. Set max_requests for recycling, then fix leak.
**NO** — Workers are stable.

---

Are workers being recycled frequently outside max_requests?
↓
**YES** — Investigate. May indicate crashes or OOM.
**NO** — Normal operation.

---

Is the status endpoint publicly accessible?
↓
**YES** — Restrict via firewall or authentication.
**NO** — Safe.

---

What is the request rate per worker?
↓
Monitor: total_requests / elapsed_time. Sudden drop indicates problems.

---

## Recommended Default

**Default:** Monitor worker memory growth and request rate. Alert on memory growth >1MB per 100 requests.
**Reason:** Memory growth is leading indicator of leaks.

---

## Risks Of Wrong Choice

* No worker memory monitoring: leaks invisible until crash
* Public status page: information disclosure

---

## Related Skills

* Monitoring Octane Status
