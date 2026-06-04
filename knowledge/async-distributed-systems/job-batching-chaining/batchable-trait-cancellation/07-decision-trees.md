# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Job Batching & Chaining
**Knowledge Unit:** K010 — Batchable Trait and Cancellation
**Generated:** 2026-06-03

---

# Decision Inventory

* Batch Cancellation Strategy
* Batch Job State Checking

---

# Architecture-Level Decision Trees

---

## Batch Cancellation Strategy

---

### Decision Context

Whether to allow batch cancellation from within individual batch jobs.

---

### Decision Criteria

* Business requirement for early termination
* Job independence within batch
* Rollback mechanism availability

---

### Decision Tree

Need ability to cancel remaining jobs when one fails?
YES → Use batch cancellation via $this->batch()->cancel()
NO → allowFailures() is sufficient for independent jobs?
    YES → Use allowFailures() instead
NO → Need coordinator job to decide cancellation?
    YES → Use batch check in each job + coordinator pattern

---

### Rationale

The `Batchable` trait gives jobs access to their batch instance. Calling `$batch->cancel()` cancels remaining unprocessed jobs. This is useful when a job determines that continuing the batch is meaningless.

---

### Recommended Default

**Default:** Use `allowFailures()` for independent jobs; use `cancel()` when a job determines further processing is pointless
**Reason:** `allowFailures()` lets remaining jobs complete independently. `cancel()` actively stops the batch — use it when continuing is harmful.

---

### Risks Of Wrong Choice

- Canceling independent jobs: unnecessary termination of valid jobs
- Not canceling when needed: remaining jobs process invalid/incomplete state
- Cancel without cleanup: completed jobs are not rolled back

---

### Related Rules

- keep-batch-sizes-under-10000

---

### Related Skills

- Implement Job Batching and Chaining

---

## Batch Job State Checking

---

### Decision Context

Whether batch jobs should check batch state (cancelled/finished) at the start of `handle()`.

---

### Decision Criteria

* Batch job execution overhead
* Need for early exit
* State staleness tolerance

---

### Decision Tree

Batch may be cancelled after job is dispatched but before execution?
YES → Check batch state at start of handle() via $this->batch()->cancelled()
NO → Job is fast (<1 second) — state change unlikely during execution?
    YES → State check optional — overhead not justified
NO → Job does expensive work that should be skipped if cancelled?
    YES → Always check batch state first

---

### Rationale

Jobs in a batch are dispatched at batch creation but may wait in the queue. The batch could be cancelled externally (via Horizon or API) while jobs are queued. Checking state at the start of `handle()` allows early exit.

---

### Recommended Default

**Default:** Check `$this->batch()->cancelled()` at the start of `handle()` for expensive or long-running batch jobs
**Reason:** Prevents wasted work on cancelled batches. Cheap check (~1 cache read) vs potentially expensive job execution.

---

### Risks Of Wrong Choice

- Not checking state: job runs even though batch was cancelled — wasted resources
- Checking state for trivial jobs: unnecessary overhead for sub-second jobs
- Stale state: batch was cancelled after check but before processing — race condition

---

### Related Rules

- keep-batch-sizes-under-10000

---

### Related Skills

- Implement Job Batching and Chaining
