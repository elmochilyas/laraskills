# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** Slow Log Configuration and Analysis
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | slowlog threshold and configuration | Operations | Monitor |

---

# Architecture-Level Decision Trees

---

## Decision: Slow Log Configuration

---

## Decision Context

slowlog logs PHP stack traces for requests exceeding request_slowlog_timeout. Essential for identifying performance bottlenecks.

---

## Decision Criteria

* **performance** — identifies slow endpoints and functions
* **operations** — must be balanced to avoid log spam
* **security** — stack traces may contain sensitive info

---

## Decision Tree

What is p95 response time?
↓
**<200ms** — Set slowlog threshold at 500ms. Catches real outliers.
**200-1000ms** — Set at 2x p95.
**>1000ms** — Set at p95. Slow app needs more aggressive detection.

---

Is the slowlog generating too much data?
↓
**YES** — Raise threshold. Essential: catch true outliers, not normal slow.
**NO** — Keep threshold.

---

Are stack traces being reviewed?
↓
**YES** — Set and maintain slowlog path. Review weekly.
**NO** — Enable anyway. Data is useful when investigating issues.

---

Are slowlog paths secured?
↓
**YES** — Good. Ensure web server user can write.
**NO** — Set appropriate permissions.

---

## Recommended Default

**Default:** request_slowlog_timeout = 5s, slowlog = /var/log/php-fpm/slow.log. Review weekly.
**Reason:** 5s catches problematic requests without noise.

---

## Risks Of Wrong Choice

* No slowlog: performance issues invisible
* Too low: massive logs, no signal
* Slowlog publicly accessible: information disclosure

---

## Related Skills

* Slow Log Configuration and Analysis
