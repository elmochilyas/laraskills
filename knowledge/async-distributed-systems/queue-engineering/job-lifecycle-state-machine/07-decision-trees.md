# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** K073 — Job Lifecycle State Machine
**Generated:** 2026-06-03

---

# Decision Inventory

* Release vs Fail Decision
* delete() vs release() Conflict Resolution
* maxExceptions vs $tries Boundary

---

# Architecture-Level Decision Trees

---

## Release vs Fail Decision

---

### Decision Context

When a job throws an exception during `handle()`, whether to release it for retry or fail it permanently. The choice determines retry behavior, queue pressure, and data consistency.

---

### Decision Criteria

* Exception type (transient vs permanent)
* Remaining retry attempts
* Downstream service status
* Recoverability of the error

---

### Decision Tree

Exception is transient (network timeout, 503, lock timeout)?
YES → Attempts < $tries?
    YES → Release with appropriate backoff
    NO → Fail permanently → failed_jobs
NO → Exception is permanent (ValidationException, ModelNotFoundException)?
    YES → Fail immediately → failed_jobs
NO → Unknown exception type?
    YES → Attempts < $tries - 1?
        YES → Release with backoff
        NO → Fail → failed_jobs

---

### Rationale

Transient exceptions should trigger release with backoff to allow recovery. Permanent exceptions should fail immediately to avoid wasting retry attempts. The attempt counter and exception type together determine the optimal path.

---

### Recommended Default

**Default:** Classify exceptions into transient/permanent; release transient with exponential backoff, fail permanent immediately
**Reason:** Maximizes recovery chances for transient failures while avoiding wasted retries for permanent ones.

---

### Risks Of Wrong Choice

- Releasing permanent failures: all retries consumed, delayed failure detection
- Failing transient errors: missed recovery opportunity, unnecessary manual retry
- Release without delay: tight retry loop floods queue, CPU 100%

---

### Related Rules

- release-should-always-have-delay
- fail-is-terminal

---

### Related Skills

- Set Up Queue Failure Handling and Retries
- Configure Backoff Strategies

---

## delete() vs release() Conflict Resolution

---

### Decision Context

Whether to call `delete()` or `release()` in error handlers. Calling both creates race conditions where one operation wins over the other.

---

### Decision Criteria

* Intended outcome (retry vs remove)
* Error handler architecture
* Framework expectations

---

### Decision Tree

Job should be retried?
YES → Call release() with delay — do NOT call delete()
NO → Job should be removed permanently?
    YES → Call delete() — do NOT call release()
NO → Unsure?
    YES → Call neither — let framework default behavior handle it

---

### Rationale

`delete()` and `release()` conflict — `delete()` removes the job, `release()` re-queues it. If both are called, the last one wins. Framework behavior depends on whether the job threw an exception (released) or completed (deleted).

---

### Recommended Default

**Default:** Call neither `delete()` nor `release()` directly — let the framework handle it based on exception presence
**Reason:** The Worker class has well-defined default behavior: exception → release, success → delete. Custom calls should only override when specific behavior is needed.

---

### Risks Of Wrong Choice

- Calling both delete() and release(): unpredictable outcome, job may be lost or double-processed
- delete() after release(): retry skipped, job silently removed
- release() after delete(): phantom job re-queued after deletion

---

### Related Rules

- release-should-always-have-delay
- fail-is-terminal

---

### Related Skills

- Set Up Queue Failure Handling and Retries

---

## maxExceptions vs $tries Boundary

---

### Decision Context

Setting the boundary between `$tries` (total attempts) and `maxExceptions` (exception attempts before forced failure).

---

### Decision Criteria

* Exception vs timeout failure ratio
* Job tolerance for exceptions vs timeouts
* Failure granularity requirements

---

### Decision Tree

Job expected to timeout occasionally (slow API)?
YES → Set maxExceptions higher than $tries (timeout is primary signal)
NO → Job should tolerate only limited exceptions?
    YES → Set maxExceptions <= $tries — fail early after N exceptions
NO → Default behavior sufficient?
    YES → Set $tries only, use default maxExceptions behavior

---

### Rationale

`maxExceptions` limits how many times the job can throw exceptions across all attempts — once exceeded, the job fails immediately regardless of remaining `$tries`. This is useful for jobs that should fail quickly when something is consistently wrong, but should retry on timeouts.

---

### Recommended Default

**Default:** Let `$tries` be the primary limit; set `maxExceptions` explicitly only when different exception vs timeout behavior is needed
**Reason:** Simpler configuration. maxExceptions is an advanced tuning parameter for specific failure patterns.

---

### Risks Of Wrong Choice

- maxExceptions too low with timeout-susceptible jobs: job fails before exhausting retries
- No maxExceptions with exception-prone code: job potentially retries more than intended

---

### Related Rules

- fail-is-terminal

---

### Related Skills

- Set Up Queue Failure Handling and Retries
- Configure Retry Limits and Policies
