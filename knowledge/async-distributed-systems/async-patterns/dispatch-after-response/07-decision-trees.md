# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Async Patterns
**Knowledge Unit:** dispatch-after-response
**Generated:** 2026-06-03

---

# Decision Inventory

* dispatchAfterResponse vs Queue Job for Post-Response Processing

---

# Architecture-Level Decision Trees

---

## dispatchAfterResponse vs Queue Job for Post-Response Processing

---

### Decision Context

Whether to use `dispatchAfterResponse()` or dispatch a queue job for work that should not block the response.

---

### Decision Criteria

* Execution time
* Reliability requirements
* Worker process vs HTTP process execution
* Load shedding capability

---

### Decision Tree

Work is fast (< 10 seconds) and doesn't need retry?
YES → Use dispatchAfterResponse() — runs in HTTP process after response
NO → Work must survive process crash or be retried?
    YES → Use queue job — persisted, retried, worker-processed
NO → Worker capacity needs to be managed separately?
    YES → Use queue job — worker scaling independent of web servers
NO → Default?
    YES → Use queue job for reliability; dispatchAfterResponse for best-effort

---

### Rationale

`dispatchAfterResponse()` runs the job synchronously in the HTTP process after the response is sent — no worker needed, but the job doesn't survive a process crash. Queue jobs are dispatched to a worker, providing persistence and retry guarantees.

---

### Recommended Default

**Default:** Use queue jobs for reliable async processing; `dispatchAfterResponse()` only for non-critical, fast, best-effort work
**Reason:** Queue jobs provide persistence, retry, and isolation from the HTTP process. `dispatchAfterResponse()` is simpler but less reliable.

---

### Risks Of Wrong Choice

- dispatchAfterResponse for slow work: delays response to next request (same process)
- dispatchAfterResponse for critical work: lost on process crash
- Queue job for trivial work: unnecessary worker capacity consumption
- dispatchAfterResponse without monitoring: no visibility into failures

---

### Related Rules

- set-after-commit-at-connection-level

---

### Related Skills

- Configure Async Patterns and Transactional Safety
