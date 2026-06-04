# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Retry & Failure Handling
**Knowledge Unit:** K017 — tries, maxExceptions, retryUntil
**Generated:** 2026-06-03

---

# Decision Inventory

* Fixed tries vs retryUntil for Retry Limit
* maxExceptions Setting Strategy

---

# Architecture-Level Decision Trees

---

## Fixed tries vs retryUntil for Retry Limit

---

### Decision Context

Whether to use a fixed `$tries` count or a time-based `retryUntil()` for limiting job retries.

---

### Decision Criteria

* Time sensitivity of the job
* External dependency recovery window
* Job criticality

---

### Decision Tree

Job depends on a time-sensitive condition (API token expiry, promotion end)?
YES → Use retryUntil() — retry until the deadline, then fail permanently
NO → Job should retry a fixed number of times regardless of time?
    YES → Use $tries — simple, predictable retry count
NO → Default?
    YES → Use $tries with 3 attempts — covers most transient failures

---

### Rationale

`$tries` limits retries by count — the job fails after N total attempts. `retryUntil()` limits retries by time — the job retries until the specified timestamp, then fails. Use `retryUntil()` when the job has a natural deadline.

---

### Recommended Default

**Default:** Use `$tries = 3` for most jobs; use `retryUntil()` for time-sensitive jobs with a natural deadline
**Reason:** 3 attempts covers most transient failures. Time-sensitive jobs need the deadline-based approach to avoid retrying after the window closes.

---

### Risks Of Wrong Choice

- $tries too low: transient failure exhausts attempts before recovery
- $tries too high: long failure cycle, worker time wasted on doomed job
- retryUntil() without time margin: job fails on last attempt as deadline passes

---

### Related Rules

- match-array-length-to-tries-minus-one
- investigate-before-retrying

---

### Related Skills

- Configure Retry Limits and Policies

---

## maxExceptions Setting Strategy

---

### Decision Context

Whether to set `maxExceptions` to limit retries based on exception count separately from `$tries`.

---

### Decision Criteria

* Exception vs timeout failure ratio
* Need to fail early on repeated exceptions
* Job idempotency

---

### Decision Tree

Job may timeout (slow API) but should not fail on timeout alone?
YES → Set maxExceptions higher than $tries — timeouts don't count as exceptions
NO → Job should fail early on consistent exceptions?
    YES → Set maxExceptions <= $tries — N exceptions = immediate failure
NO → All failures treated equally?
    YES → Don't set maxExceptions — $tries alone is sufficient

---

### Rationale

`maxExceptions` is separate from `$tries`. A job can exhaust `maxExceptions` and fail even if `$tries` is not used up. This allows failing early on exception-heavy failures while still retrying on timeouts.

---

### Recommended Default

**Default:** Don't set `maxExceptions` unless you need different handling for exceptions vs timeouts
**Reason:** `$tries` alone handles the common case. `maxExceptions` is an advanced tuning parameter for specific failure patterns.

---

### Risks Of Wrong Choice

- maxExceptions too low: job fails before exhausting tries on timeout-susceptible jobs
- No maxExceptions: exception-heavy job keeps retrying until $tries exhausted
- maxExceptions > $tries with all exceptions: effective tries = maxExceptions

---

### Related Rules

- fail-is-terminal

---

### Related Skills

- Configure Retry Limits and Policies
