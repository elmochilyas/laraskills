# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** should-be-unique-jobs
**Generated:** 2026-06-03

---

# Decision Inventory

* Unique Job Enforcement Strategy
* Unique Job Lock Expiry Setting

---

# Architecture-Level Decision Trees

---

## Unique Job Enforcement Strategy

---

### Decision Context

Whether to use `ShouldBeUnique` to prevent duplicate jobs from being queued.

---

### Decision Criteria

* Duplicate job tolerance
* Job idempotency
* Lock storage backend (Redis required)
* Lock timeout requirements

---

### Decision Tree

Duplicate job execution would cause data corruption or duplicate side effects?
YES → Job is idempotent (safe to run multiple times)?
    YES → ShouldBeUnique not needed — idempotency handles it
    NO → Use ShouldBeUnique
NO → Duplicate jobs just waste resources?
    YES → Use ShouldBeUnique (optimization, not correctness)
NO → Jobs must run exactly once per unique key?
    YES → Use ShouldBeUnique with explicit uniqueId()

---

### Rationale

`ShouldBeUnique` uses a Redis lock to prevent duplicate jobs with the same unique key from being queued. It's for preventing duplicate processing, not for rate limiting. For rate limiting, use `WithoutOverlapping` middleware.

---

### Recommended Default

**Default:** Use `ShouldBeUnique` when duplicate job execution is not idempotent and would cause incorrect behavior
**Reason:** Prevents duplicate processing for non-idempotent operations. Idempotent jobs can skip this and rely on idempotency for safety.

---

### Risks Of Wrong Choice

- Using ShouldBeUnique without Redis: lock driver not supported — jobs still duplicate
- Lock timeout too short: lock expires, duplicate slips through
- Lock timeout too long: legitimate different-job blocked by stale lock
- Using for rate limiting: ShouldBeUnique prevents ALL duplicates — use WithoutOverlapping for rate control

---

### Related Rules

- use-should-be-unique-for-non-idempotent-jobs

---

### Related Skills

- Implement Job Middleware
- Configure Unique Jobs

---

## Unique Job Lock Expiry Setting

---

### Decision Context

Setting the lock expiry time for `ShouldBeUnique` jobs.

---

### Decision Criteria

* Expected job execution time
* Job queue wait time
* Acceptable duplicate window

---

### Decision Tree

Job executes quickly (<1 minute)?
YES → Lock expiry = 60 seconds (default sufficient)
NO → Job may wait in queue before processing?
    YES → Lock expiry = max retry_after * tries + buffer
NO → Job takes >1 hour?
    YES → Set explicit lock expiry via uniqueFor()

---

### Rationale

The lock prevents duplicates from DISPATCH, not execution. If the lock expires before the job processes, another duplicate can be dispatched. Set lock expiry long enough to cover queue wait time + execution time.

---

### Recommended Default

**Default:** Let the default lock expiry handle it (typically 60s); extend via `uniqueFor()` if jobs wait in queue
**Reason:** Most unique jobs execute quickly after dispatch. For queued jobs with backlog, extend the lock to prevent early-arriving duplicates.

---

### Risks Of Wrong Choice

- Lock expires before processing: duplicate dispatched while first job waits in queue
- Lock too long: legitimate different-job blocked after processing completes
- Forgetting uniqueFor for long-queue jobs: lock expires, duplicate dispatched

---

### Related Rules

- use-should-be-unique-for-non-idempotent-jobs

---

### Related Skills

- Implement Job Middleware
- Configure Unique Jobs
