# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Retry & Failure Handling
**Knowledge Unit:** failed-method-cleanup
**Generated:** 2026-06-03

---

# Decision Inventory

* failed() method vs try/catch for Error Handling

---

# Architecture-Level Decision Trees

---

## failed() method vs try/catch for Error Handling

---

### Decision Context

Whether to implement cleanup/recovery in the job's `failed()` method or use try/catch within `handle()`.

---

### Decision Criteria

* Timing of cleanup (after all retries vs after each attempt)
* Need to access the exception
* Need to perform cleanup on every attempt vs only on final failure

---

### Decision Tree

Cleanup should run only after ALL retries are exhausted?
YES → Use failed() method — runs once on permanent failure
NO → Cleanup should run after EVERY attempt (including non-fatal)?
    YES → Use try/catch in handle() — runs on each exception
NO → Need to perform different actions based on exception type?
    YES → Use try/catch in handle() — type-specific handling
NO → Need to dispatch DLQ or notify on failure?
    YES → Use failed() method — clean separation of concerns

---

### Rationale

`failed()` runs once when all retries are exhausted — ideal for final cleanup, notifications, and DLQ dispatch. try/catch runs on every exception — useful for per-attempt logging, resource cleanup, or early exit decisions.

---

### Recommended Default

**Default:** Use `failed()` for final cleanup (resource release, notifications, DLQ); try/catch for per-attempt handling
**Reason:** Clean separation of per-attempt vs post-retry logic. `failed()` is the standard hook for permanent failure actions.

---

### Risks Of Wrong Choice

- failed() for per-attempt cleanup: only runs once, resources leak across retries
- try/catch for final cleanup: runs on every exception, not just final failure
- No failed() implementation: permanent failures have no notification or cleanup

---

### Related Rules

- fail-is-terminal

---

### Related Skills

- Set Up Queue Failure Handling and Retries
