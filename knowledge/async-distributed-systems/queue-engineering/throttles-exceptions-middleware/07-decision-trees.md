# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** throttles-exceptions-middleware
**Generated:** 2026-06-03

---

# Decision Inventory

* throttlesExceptions vs Manual Release Strategy

---

# Architecture-Level Decision Trees

---

## throttlesExceptions vs Manual Release Strategy

---

### Decision Context

Whether to use the `throttlesExceptions` middleware or manually release jobs with backoff on exception.

---

### Decision Criteria

* Exception frequency threshold
* Need to control exceptions per time window
* Simplicity vs granularity trade-off

---

### Decision Tree

Job should fail permanently after N exceptions in a time window?
YES → Use throttlesExceptions middleware (declarative, built-in)
NO → Need simple retry with backoff?
    YES → Use $backoff property (simpler)
NO → Need dynamic backoff based on exception type?
    YES → Manual release() in catch block (most flexible)

---

### Rationale

`throttlesExceptions` allows the job to fail after a configurable number of exceptions within a time window. This is useful for jobs calling flaky APIs — a few failures are OK but consistent failures should abort early.

---

### Recommended Default

**Default:** Use `$backoff` array for simple progressive delays; use `throttlesExceptions` when early failure after repeated exceptions is desired
**Reason:** `$backoff` is simpler for standard progressive delays. `throttlesExceptions` adds time-window-based exception counting.

---

### Risks Of Wrong Choice

- No throttling on flaky API: all retries consumed quickly, long delay before permanent failure
- throttlesExceptions not releasing: job retries immediately without backoff
- Manual release error: incorrect retry timing, tight loops

---

### Related Rules

- use-rate-limited-for-external-api-calls
- match-array-length-to-tries-minus-one

---

### Related Skills

- Implement Job Middleware
- Set Up Queue Failure Handling and Retries
