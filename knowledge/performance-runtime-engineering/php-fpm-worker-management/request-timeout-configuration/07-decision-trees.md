# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** Request Timeout Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | request_terminate_timeout value | Configuration | Configure |
| 2 | request_slowlog_timeout value | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: request_terminate_timeout

---

## Decision Context

request_terminate_timeout kills a worker if a request exceeds N seconds. Prevents stuck workers from consuming pool capacity.

---

## Decision Criteria

* **performance** — protects pool from hung requests
* **architectural** — slow operations should be queued, not timed out in web workers
* **operations** — timeout too short kills valid slow requests

---

## Decision Tree

Is there a legitimate reason for requests >30 seconds?
↓
**YES** — Set timeout high enough (60-300s) or move to queue.
**NO** — Standard timeout (30s).

---

Are slow requests causing worker pool exhaustion?
↓
**YES** — Lower timeout or move slow operations to queue.
**NO** — Current timeout is adequate.

---

Is request_slowlog_timeout set for diagnostics?
↓
**YES** — Set to 2-5s. Logs slow requests for analysis without killing them.
**NO** — Set it. Default: 5s, slowlog path configured.

---

## Recommended Default

**Default:** request_terminate_timeout = 30s for web, 300s for API with large uploads. request_slowlog_timeout = 5s.
**Reason:** 30s catches stuck workers without killing valid requests.

---

## Risks Of Wrong Choice

* No timeout: stuck worker holds pool capacity indefinitely
* Too short: valid file uploads/imports killed mid-operation

---

## Related Skills

* Request Timeout Configuration
