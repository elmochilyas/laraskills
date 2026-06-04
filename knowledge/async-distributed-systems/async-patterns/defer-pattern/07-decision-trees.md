# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Async Patterns
**Knowledge Unit:** defer-pattern
**Generated:** 2026-06-03

---

# Decision Inventory

* Defer vs Queue Job for Response-Neutral Work

---

# Architecture-Level Decision Trees

---

## Defer vs Queue Job for Response-Neutral Work

---

### Decision Context

Whether to use the `defer()` function (runs after response) or dispatch a queue job for work that doesn't need to block the HTTP response.

---

### Decision Criteria

* Execution time of deferred work
* Reliability requirements
* Retry requirements on failure
* Need to process outside of request context

---

### Decision Tree

Work takes < 10 seconds and failure is acceptable?
YES → Use defer() — runs after response, no queue infrastructure needed
NO → Work takes > 10 seconds or must be reliable?
    YES → Use queue job — retry on failure, survives process crash
NO → Work must survive server crash during execution?
    YES → Use queue job — persisted to backend storage
NO → Work is async but must run in the same process?
    YES → Use defer() — same process, after response

---

### Rationale

`defer()` registers work to run after the HTTP response is sent, in the same process. It's non-blocking for the user but not persisted — if the process crashes after response but before deferred work completes, the work is lost. Queue jobs are persisted and retried.

---

### Recommended Default

**Default:** Use `defer()` for non-critical post-response work (logging, cache warming) that can be lost on crash; queue jobs for critical work that must complete
**Reason:** `defer()` is simpler and faster for best-effort work. Queue jobs provide persistence and retry guarantees.

---

### Risks Of Wrong Choice

- defer() for critical work: lost on process crash
- Queue job for trivial post-response work: unnecessary overhead and infrastructure
- defer() for long-running work: blocks the process, delays response to next request
- defer() without understanding execution context: deferred code runs in same process

---

### Related Rules

- set-after-commit-at-connection-level

---

### Related Skills

- Configure Async Patterns and Transactional Safety
