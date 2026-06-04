# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Error Handling
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Error handling for OpCache failures | Operations | Handle |

---

# Architecture-Level Decision Trees

---

## Decision: OpCache Error Handling

---

## Decision Context

OpCache failures (memory full, file cache write errors, binary compatibility) can cause errors or silently fall back. Proper handling prevents silent failures.

---

## Decision Criteria

* **performance** — silent fallback may reduce performance
* **operations** — errors must be logged
* **security** — error details should not leak

---

## Decision Tree

Is OpCache status being monitored?
↓
**YES** — Log warnings when memory >80% or cache full.
**NO** — Start monitoring. Failures are silent otherwise.

---

Are OpCache errors logged?
↓
**YES** — Check for opcache errors in PHP error log.
**NO** — Enable opcache.error_log or check FPM error log.

---

Is the file cache directory writable?
↓
**YES** — No issue.
**NO** — File cache disabled silently. Log will show warning.

---

Is OpCache binary compatibility checked?
↓
**YES** — Same PHP version across deployment ensures compatibility.
**NO** — Binary incompatible code causes segfaults.

---

## Recommended Default

**Default:** Monitor OpCache status and errors. Log all OpCache warnings. Check logs after deployment.
**Reason:** OpCache failures are silent; active monitoring is essential.

---

## Risks Of Wrong Choice

* No monitoring: OpCache full or failed silently, performance degraded
* No error log check: file cache write errors go unnoticed

---

## Related Skills

* OpCache Error Handling
