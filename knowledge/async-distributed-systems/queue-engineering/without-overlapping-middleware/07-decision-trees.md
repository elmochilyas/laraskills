# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** without-overlapping-middleware
**Generated:** 2026-06-03

---

# Decision Inventory

* WithoutOverlapping vs ShouldBeUnique for Mutual Exclusion
* WithoutOverlapping Lock Expiry

---

# Architecture-Level Decision Trees

---

## WithoutOverlapping vs ShouldBeUnique for Mutual Exclusion

---

### Decision Context

Whether to use `WithoutOverlapping` middleware (prevents concurrent execution) or `ShouldBeUnique` (prevents duplicate dispatch).

---

### Decision Criteria

* Timing of duplicate prevention (dispatch-time vs execution-time)
* Whether duplicates can be dispatched but not run concurrently
* Lock release timing

---

### Decision Tree

Need to prevent concurrent execution (same job running at same time)?
YES → Use WithoutOverlapping middleware
NO → Need to prevent duplicate dispatch entirely?
    YES → Use ShouldBeUnique
NO → Both needed (can't dispatch duplicate, can't run concurrently)?
    YES → Use both — ShouldBeUnique for dispatch, WithoutOverlapping for execution

---

### Rationale

`WithoutOverlapping` acquires a lock when the job STARTS processing and releases it when done. It prevents the same job from running on multiple workers simultaneously. `ShouldBeUnique` prevents a job from being dispatched at all while a lock exists.

---

### Recommended Default

**Default:** Use `WithoutOverlapping` when the concern is concurrent execution; `ShouldBeUnique` when the concern is duplicate dispatch
**Reason:** Different concerns require different tools. WithoutOverlapping allows queuing but prevents concurrency; ShouldBeUnique prevents queuing entirely.

---

### Risks Of Wrong Choice

- ShouldBeUnique for concurrency: lock expires, two jobs run simultaneously
- WithoutOverlapping for duplicate prevention: jobs still queue up (they just don't run simultaneously)
- No lock expiry on WithoutOverlapping: stuck job permanently blocks others

---

### Related Rules

- use-without-overlapping-for-concurrency-control

---

### Related Skills

- Implement Job Middleware
- Configure Unique Jobs

---

## WithoutOverlapping Lock Expiry

---

### Decision Context

Setting the lock expiry time for `WithoutOverlapping` middleware.

---

### Decision Criteria

* Maximum expected job execution time
* Acceptable overlap window
* Job failure recovery

---

### Decision Tree

Job has known max execution time?
YES → Set lock expiry = max execution time + 10s buffer
NO → Job may hang or timeout?
    YES → Set lock expiry = retry_after (lock auto-releases on timeout)
NO → Default?
    YES → Use releaseAfter(60) for most jobs

---

### Rationale

The lock must be held for the entire job execution. If the lock expires while the job is still running, another instance of the same job can start — defeating the purpose of WithoutOverlapping.

---

### Recommended Default

**Default:** `$this->middleware()->withoutOverlapping()->releaseAfter(60)`
**Reason:** 60 seconds covers most jobs. Adjust upward for longer-running jobs to prevent premature lock release.

---

### Risks Of Wrong Choice

- Lock expires before job completes: concurrent execution not prevented
- Lock too long: if job crashes without releasing lock, blocked for the entire duration
- No releaseAfter set: uses default — may be too short for your jobs

---

### Related Rules

- use-without-overlapping-for-concurrency-control

---

### Related Skills

- Implement Job Middleware
